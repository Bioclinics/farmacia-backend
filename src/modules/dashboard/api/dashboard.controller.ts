import { Controller, Get, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { DashboardKpisQueryDto } from '../dto/dashboard-kpis.query';
import { DashboardAlertsQueryDto } from '../dto/dashboard-alerts.query';
import { DashboardTrendQueryDto } from '../dto/dashboard-trend.query';
import { DashboardTopProductsQueryDto } from '../dto/dashboard-top-products.query';
import { DashboardInventoryMovementsQueryDto } from '../dto/dashboard-inventory-movements.query';
import { RolesGuard } from 'src/common/utils/roles.guard';
import { Roles } from 'src/common/utils/roles.decorator';
import { RolesEnum } from 'src/shared/enums/roles.enum';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  @ApiOperation({ summary: 'Obtener indicadores clave del dashboard' })
  getKpis(@Query() query: DashboardKpisQueryDto) {
    return this.dashboardService.getKpis(query);
  }

  @Get('alerts')
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  @ApiOperation({ summary: 'Listar alertas de inventario críticas o de advertencia' })
  getAlerts(@Query() query: DashboardAlertsQueryDto) {
    return this.dashboardService.getInventoryAlerts(query);
  }

  @Get('sales-trend')
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  @ApiOperation({ summary: 'Obtener serie de ventas por día para el rango solicitado' })
  getSalesTrend(@Query() query: DashboardTrendQueryDto) {
    return this.dashboardService.getSalesTrend(query);
  }

  @Get('top-products')
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  @ApiOperation({ summary: 'Productos más vendidos en el rango indicado' })
  getTopProducts(@Query() query: DashboardTopProductsQueryDto) {
    return this.dashboardService.getTopProducts(query);
  }

  @Get('top-actives')
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  @ApiOperation({ summary: 'Principios activos más vendidos en el rango indicado' })
  getTopActives(@Query() query: DashboardTopProductsQueryDto) {
    return this.dashboardService.getTopActives(query);
  }

  @Get('inventory-movements')
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  @ApiOperation({ summary: 'Listado compacto de movimientos de inventario del día' })
  getInventoryMovements(@Query() query: DashboardInventoryMovementsQueryDto) {
    return this.dashboardService.getInventoryMovements(query);
  }
}
