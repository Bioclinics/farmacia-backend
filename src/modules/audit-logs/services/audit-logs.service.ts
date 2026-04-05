import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    userId?: number;
    roleId?: number;
    action?: string;
    tableName?: string;
    recordId?: number;
    } = {}): Promise<{ data: any[]; pagination: any }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.repository.createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.user', 'user')
      .leftJoinAndSelect('user.role', 'role')
      .orderBy('audit_log.created_at', 'DESC');

    // Apply filters
    if (params.startDate) {
      const startDate = new Date(params.startDate);
      query.andWhere('audit_log.created_at >= :startDate', { startDate });
    }

    if (params.endDate) {
      const endDate = new Date(params.endDate);
      query.andWhere('audit_log.created_at <= :endDate', { endDate });
    }

    if (params.userId) {
      query.andWhere('audit_log.id_user = :userId', { userId: params.userId });
    }

    if (params.roleId) {
      query.andWhere('role.id_role = :roleId', { roleId: params.roleId });
    }

    if (params.action) {
      query.andWhere('audit_log.action ILike :action', { action: `%${params.action}%` });
    }

    if (params.tableName) {
      query.andWhere('audit_log.table_name ILike :tableName', { tableName: `%${params.tableName}%` });
    }

    if (params.recordId) {
      query.andWhere('audit_log.record_id = :recordId', { recordId: params.recordId });
    }

    const total = await query.getCount();
    const data = await query.skip(skip).take(limit).getMany();

    return { data, pagination: { page, limit, total } };
  }

  async findOne(id: number): Promise<any> {
    const log = await this.repository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!log) {
      throw new NotFoundException(`Audit log with id ${id} not found`);
    }

    return {
      auditLog: {
        id: log.id,
        action: log.action,
        tableName: log.tableName,
        recordId: log.recordId,
        description: log.description,
        ipAddress: log.ipAddress,
        createdAt: log.created_at,
        oldData: log.oldData,
        newData: log.newData,
        user: log.user ? {
          id: log.user.id,
          name: log.user.name,
          username: log.user.username,
          roleId: log.user.role?.id ?? log.user.idRole,
          roleName: log.user.role?.name ?? 'User',
        } : null,
      },
    };
  }

  async create(data: Partial<AuditLog>): Promise<AuditLog> {
    const log = this.repository.create(data);
    return this.repository.save(log);
  }
}
