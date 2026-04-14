import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) {}

  private extractUserIdFromLog(log: AuditLog): number | null {
    const direct = Number(log.id_user ?? 0)
    if (Number.isFinite(direct) && direct > 0) return direct

    const newData = (log.newData ?? {}) as Record<string, any>
    const candidates = [
      newData.userId,
      newData.idUser,
      newData.id_user,
      newData.user?.id,
      newData.user?.idUser,
      newData.user?.id_user,
      log.recordId,
    ]

    for (const candidate of candidates) {
      const parsed = Number(candidate ?? 0)
      if (Number.isFinite(parsed) && parsed > 0) return parsed
    }

    return null
  }

  private extractUsernameFromLog(log: AuditLog): string | null {
    const newData = (log.newData ?? {}) as Record<string, any>
    const username =
      newData.username ??
      newData.userName ??
      newData.user?.username ??
      newData.user?.userName ??
      null

    return typeof username === 'string' && username.trim() ? username.trim() : null
  }

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

    const userIds = Array.from(
      new Set(
        data
          .map((log) => this.extractUserIdFromLog(log))
          .filter((value): value is number => typeof value === 'number' && value > 0),
      ),
    )

    let usersById = new Map<number, { id: number; name: string; username: string; roleId: number; roleName: string }>()

    if (userIds.length > 0) {
      const usersRows = await this.dataSource.query(
        `SELECT
            u.id_user AS id,
            u.name,
            u.username,
            u.id_role AS "roleId",
            COALESCE(r.name, 'Sin rol') AS "roleName"
         FROM users u
         LEFT JOIN roles r ON r.id_role = u.id_role
         WHERE u.id_user = ANY($1::int[])`,
        [userIds],
      )

      usersById = new Map(
        usersRows.map((row: any) => [
          Number(row.id),
          {
            id: Number(row.id),
            name: row.name,
            username: row.username,
            roleId: Number(row.roleId ?? 0),
            roleName: row.roleName,
          },
        ]),
      )
    }

    const mapped = data.map((log) => {
      const fallbackUserId = this.extractUserIdFromLog(log)
      const userFromLookup = fallbackUserId ? usersById.get(fallbackUserId) : undefined

      const user = userFromLookup
        ? {
            id: userFromLookup.id,
            name: userFromLookup.name,
            username: userFromLookup.username,
            roleId: userFromLookup.roleId,
            roleName: userFromLookup.roleName,
          }
        : log.user
          ? {
              id: Number(log.user.id),
              name: log.user.name,
              username: log.user.username,
              roleId: Number(log.user.role?.id ?? log.user.idRole ?? 0),
              roleName: log.user.role?.name ?? 'Sin rol',
            }
          : (() => {
              const username = this.extractUsernameFromLog(log)
              if (!username) return null
              return {
                id: fallbackUserId ?? 0,
                name: username,
                username,
                roleId: 0,
                roleName: 'Sin rol',
              }
            })()

      return {
        id: log.id,
        createdAt: log.created_at,
        action: log.action,
        tableName: log.tableName ?? '',
        recordId: log.recordId,
        description: log.description,
        ipAddress: log.ipAddress,
        user,
      }
    })

    return { data: mapped, pagination: { page, limit, total } };
  }

  async findOne(id: number): Promise<any> {
    const log = await this.repository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!log) {
      throw new NotFoundException(`Audit log with id ${id} not found`);
    }

    const fallbackUserId = this.extractUserIdFromLog(log)
    let userLookup: any = null

    if (fallbackUserId) {
      const rows = await this.dataSource.query(
        `SELECT
            u.id_user AS id,
            u.name,
            u.username,
            u.id_role AS "roleId",
            COALESCE(r.name, 'Sin rol') AS "roleName"
         FROM users u
         LEFT JOIN roles r ON r.id_role = u.id_role
         WHERE u.id_user = $1
         LIMIT 1`,
        [fallbackUserId],
      )
      userLookup = rows[0] ?? null
    }

    const detailUser = userLookup
      ? {
          id: Number(userLookup.id),
          name: userLookup.name,
          username: userLookup.username,
          roleId: Number(userLookup.roleId ?? 0),
          roleName: userLookup.roleName,
        }
      : log.user
        ? {
            id: log.user.id,
            name: log.user.name,
            username: log.user.username,
            roleId: log.user.role?.id ?? log.user.idRole,
            roleName: log.user.role?.name ?? 'User',
          }
        : (() => {
            const username = this.extractUsernameFromLog(log)
            if (!username) return null
            return {
              id: fallbackUserId ?? 0,
              name: username,
              username,
              roleId: 0,
              roleName: 'Sin rol',
            }
          })()

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
        user: detailUser,
      },
    };
  }

  async create(data: Partial<AuditLog>): Promise<AuditLog> {
    const log = this.repository.create(data);
    return this.repository.save(log);
  }
}
