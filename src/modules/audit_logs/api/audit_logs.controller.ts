import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from 'src/common/utils/roles.decorator';
import { OkRes } from 'src/common/utils';
import { RolesEnum } from 'src/shared/enums/roles.enum';
import { AuditLogsService } from '../services/audit_logs.service';
import { AuditLogFiltersDto } from '../dto/audit-log-filters.dto';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@Roles(RolesEnum.ADMIN)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar logs de auditoría con filtros y paginación' })
  async findAll(@Query() filters: AuditLogFiltersDto, @Res() res: Response) {
    const result = await this.auditLogsService.findAll(filters);
    return OkRes(res, result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un log de auditoría' })
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const auditLog = await this.auditLogsService.findOne(Number(id));
    return OkRes(res, { auditLog });
  }
}
