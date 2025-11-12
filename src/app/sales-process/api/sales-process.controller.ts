import { Controller, Post, Body, UsePipes, ValidationPipe, HttpCode } from '@nestjs/common';
import { SalesProcessService } from '../services/sales-process.service';
import { CreateSaleProcessDto } from '../dto/input/create-sale-process.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Sales Process')
@Controller('sales-process')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class SalesProcessController {
  constructor(private readonly salesProcessService: SalesProcessService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear un proceso de venta (venta + salidas)' })
  @ApiResponse({ status: 201, description: 'Venta creada correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiBody({ type: CreateSaleProcessDto })
  async create(@Body() dto: CreateSaleProcessDto) {
    const result = await this.salesProcessService.create(dto);
    return result;
  }
}
