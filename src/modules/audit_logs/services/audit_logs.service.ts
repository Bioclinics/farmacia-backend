import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AuditLog } from '../entities/audit_log.entity';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { AuditLogFiltersDto } from '../dto/audit-log-filters.dto';
import { RolesEnum, RolesNames } from 'src/shared/enums/roles.enum';
import { Request } from 'express';

interface AuditLogListItem {
  id: number;
  createdAt: string;
  action: string;
  tableName: string;
  recordId: number | null;
  description: string | null;
  ipAddress: string | null;
  user: {
    id: number;
    name: string;
    username: string;
    roleId: number;
    roleName: string;
  } | null;
}

interface AuditLogDetail extends AuditLogListItem {
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
}

interface RecordAuditLogInput {
  actorId: number;
  action: string;
  tableName: string;
  recordId?: number | null;
  description?: string | null;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  request?: Request;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async record(options: RecordAuditLogInput): Promise<AuditLog> {
    if (!options.actorId) {
      throw new Error('actorId is required to record an audit log');
    }

    const payload: CreateAuditLogDto = {
      idUser: options.actorId,
      action: options.action,
      tableName: options.tableName,
      recordId: options.recordId ?? undefined,
      description: options.description ?? undefined,
      oldData: options.oldData ? this.toSerializable(options.oldData) : undefined,
      newData: options.newData ? this.toSerializable(options.newData) : undefined,
      ipAddress: this.resolveIp(options.request),
    };

    try {
      return await this.create(payload);
    } catch (error) {
      this.logger.error(`Error recording audit log for action ${options.action}`, error as Error);
      throw error;
    }
  }

  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      idUser: dto.idUser,
      action: dto.action,
      tableName: dto.tableName,
      recordId: dto.recordId ?? null,
      description: dto.description ?? null,
      oldData: dto.oldData ?? null,
      newData: dto.newData ?? null,
      ipAddress: dto.ipAddress ?? null,
    });
    return await this.auditLogRepository.save(auditLog);
  }

  async findAll(filters: AuditLogFiltersDto): Promise<{
    data: AuditLogListItem[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 25;
    const skip = (page - 1) * limit;

    const query = this.applyFilters(
      this.auditLogRepository
        .createQueryBuilder('log')
        .leftJoinAndSelect('log.user', 'user'),
      filters,
    )
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [logs, total] = await query.getManyAndCount().catch((error) => {
      console.error('AuditLogsService.findAll error', error);
      throw error;
    });

    return {
      data: logs.map((log) => this.mapToListItem(log)),
      pagination: { page, limit, total },
    };
  }

  async findOne(id: number): Promise<AuditLogDetail> {
    const log = await this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .leftJoinAndSelect('user.role', 'role')
      .where('log.id = :id', { id })
      .getOne();

    if (!log) {
      throw new NotFoundException(`Log de auditoría #${id} no encontrado`);
    }

    const base = this.mapToListItem(log);
    return {
      ...base,
      oldData: (log.oldData as Record<string, unknown> | null) ?? null,
      newData: (log.newData as Record<string, unknown> | null) ?? null,
    };
  }

  private applyFilters(
    query: SelectQueryBuilder<AuditLog>,
    filters: AuditLogFiltersDto,
  ): SelectQueryBuilder<AuditLog> {
    if (filters.startDate) {
      query.andWhere('log.createdAt >= :startDate', {
        startDate: this.normalizeDate(filters.startDate, false),
      });
    }

    if (filters.endDate) {
      query.andWhere('log.createdAt <= :endDate', {
        endDate: this.normalizeDate(filters.endDate, true),
      });
    }

    if (filters.userId) {
      query.andWhere('log.id_user = :userId', { userId: filters.userId });
    }

    if (filters.roleId) {
      query.andWhere('user.idRole = :roleId', { roleId: filters.roleId });
    }

    if (filters.action) {
      query.andWhere('LOWER(log.action) = LOWER(:action)', { action: filters.action });
    }

    if (filters.tableName) {
      query.andWhere('LOWER(log.table_name) = LOWER(:tableName)', { tableName: filters.tableName });
    }

    if (filters.recordId) {
      query.andWhere('log.record_id = :recordId', { recordId: filters.recordId });
    }

    return query;
  }

  private normalizeDate(raw: string, endOfDay: boolean): string {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return raw;
    }
    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date.toISOString();
  }

  private mapToListItem(log: AuditLog): AuditLogListItem {
    const createdAtValue = log.createdAt instanceof Date ? log.createdAt.toISOString() : String(log.createdAt);
    const user = log.user;
    const roleId = user?.idRole;
    let roleName = 'Sin rol';
    if (user?.role?.name) {
      roleName = user.role.name;
    } else if (typeof roleId === 'number') {
      roleName = RolesNames[roleId as RolesEnum] ?? 'Sin rol';
    }

    return {
      id: log.id,
      createdAt: createdAtValue,
      action: log.action,
      tableName: log.tableName,
      recordId: typeof log.recordId === 'number' ? log.recordId : null,
      description: log.description ?? null,
      ipAddress: log.ipAddress ?? null,
      user: user
        ? {
            id: user.id,
            name: user.name,
            username: user.username,
            roleId: user.idRole,
            roleName,
          }
        : null,
    };
  }

  private resolveIp(request?: Request): string | undefined {
    if (!request) return undefined;
    const header = (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
    return header || request.ip || request.connection?.remoteAddress || undefined;
  }

  private toSerializable<T extends Record<string, any>>(data: T): Record<string, unknown> {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch {
      const clone: Record<string, unknown> = {};
      Object.keys(data || {}).forEach((key) => {
        const value = (data as any)[key];
        if (value === undefined) return;
        if (typeof value === 'object' && value !== null) {
          clone[key] = this.toSerializable(value as Record<string, any>);
        } else {
          clone[key] = value;
        }
      });
      return clone;
    }
  }
}
