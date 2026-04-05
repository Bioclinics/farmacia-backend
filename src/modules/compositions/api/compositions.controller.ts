import { Controller, Get, Post, Body, Put, Delete, Param, ParseIntPipe, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CompositionsService } from '../services/compositions.service';
import { CreateCompositionDto } from '../dto/create-composition.dto';
import { UpdateCompositionDto } from '../dto/update-composition.dto';
import { Composition } from '../entities/composition.entity';
import { RolesGuard } from 'src/common/utils/roles.guard';
import { Roles } from 'src/common/utils/roles.decorator';
import { RolesEnum } from 'src/shared/enums/roles.enum';
@ApiTags('compositions')
@Controller('compositions')
@UseGuards(RolesGuard)
export class CompositionsController {
  constructor(private readonly service: CompositionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all compositions' })
  @ApiResponse({ status: 200, description: 'List of compositions', type: [Composition] })
  async list(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
  ) {
    const { data, total } = await this.service.findAll(search, page, limit);
    return {
      data,
      pagination: { page, limit, total },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single composition by ID' })
  @ApiResponse({ status: 200, description: 'Composition details', type: Composition })
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Create a new composition' })
  @ApiResponse({ status: 201, description: 'Composition created', type: Composition })
  async create(@Body(ValidationPipe) dto: CreateCompositionDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Update a composition' })
  @ApiResponse({ status: 200, description: 'Composition updated', type: Composition })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: UpdateCompositionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Delete a composition' })
  @ApiResponse({ status: 200, description: 'Composition deleted' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { message: 'Composition deleted successfully' };
  }

  @Get('search/products')
  @ApiOperation({ summary: 'Search products by term' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchProducts(@Query('term') term: string) {
    return this.service.searchProducts(term);
  }

  @Get('reports/products')
  @ApiOperation({ summary: 'Get products report' })
  @ApiResponse({ status: 200, description: 'Products report' })
  async getReportProducts(@Query() params: any) {
    return this.service.getReportProducts(params);
  }

  @Get('reports/sales')
  @ApiOperation({ summary: 'Get sales report' })
  @ApiResponse({ status: 200, description: 'Sales report' })
  async getReportSales(@Query() params: any) {
    return this.service.getReportSales(params);
  }

  @Get('reports/combined-products')
  @ApiOperation({ summary: 'Get combined products report' })
  @ApiResponse({ status: 200, description: 'Combined report' })
  async getReportCombined(@Query() params: any) {
    return this.service.getReportCombined(params);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Get products in a composition' })
  @ApiResponse({ status: 200, description: 'List of products' })
  async getProducts(@Param('id', ParseIntPipe) id: number) {
    return this.service.getProductsByComposition(id);
  }
}
