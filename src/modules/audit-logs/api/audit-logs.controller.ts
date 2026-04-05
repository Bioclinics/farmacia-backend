import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditLogsService } from '../services/audit-logs.service';
import { AuditLog } from '../entities/audit-log.entity';
import { RolesGuard } from 'src/common/utils/roles.guard';
import { Roles } from 'src/common/utils/roles.decorator';
import { RolesEnum } from 'src/shared/enums/roles.enum';
@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(RolesGuard)
@Roles(RolesEnum.ADMIN)
export class AuditLogsController {
  constructor(private readonly service: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List all audit logs with filters' })
  @ApiResponse({ status: 200, description: 'List of audit logs' })
  async list(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: number,
    @Query('roleId') roleId?: number,
    @Query('action') action?: string,
    @Query('tableName') tableName?: string,
    @Query('recordId') recordId?: number,
  ) {
    return this.service.findAll({
      page,
      limit,
      startDate,
      endDate,
      userId,
      roleId,
      action,
      tableName,
      recordId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single audit log by ID' })
  @ApiResponse({ status: 200, description: 'Audit log details' })
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
