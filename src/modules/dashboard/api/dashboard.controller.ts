import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  getKpis(@Query('date') date?: string) {
    return this.dashboardService.getKpis(date);
  }

  @Get('alerts')
  getAlerts(@Query('limit') limit?: string) {
    return this.dashboardService.getAlerts(Number(limit ?? 30));
  }

  @Get('sales-trend')
  getSalesTrend(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.dashboardService.getSalesTrend(startDate, endDate);
  }

  @Get('top-products')
  getTopProducts(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getTopProducts(startDate, endDate, Number(limit ?? 5));
  }

  @Get('inventory-movements')
  getInventoryMovements(@Query('date') date?: string, @Query('limit') limit?: string) {
    return this.dashboardService.getInventoryMovements(date, Number(limit ?? 15));
  }
}
