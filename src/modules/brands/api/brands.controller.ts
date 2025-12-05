import { Controller, Get, Post, Body, Param, Delete, Put, Query, UseGuards, ParseIntPipe, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/utils/roles.decorator';
import { RolesGuard } from 'src/common/utils/roles.guard';
import { RolesEnum } from 'src/shared/enums/roles.enum';
import { BrandsService } from '../services/brands.service';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';

@ApiTags('Brands')
@Controller('brands')
@UseGuards(RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @ApiOperation({ summary: 'Listado de marcas' })
  @ApiQuery({ name: 'search', required: false, description: 'Filtra por nombre de marca' })
  @ApiResponse({ status: 200, description: 'Listado de marcas' })
  findAll(@Query('search') search?: string) {
    return this.brandsService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una marca por id' })
  @ApiParam({ name: 'id', description: 'ID de la marca' })
  @ApiResponse({ status: 200, description: 'Marca encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.findOne(id);
  }

  @Post()
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Crear una nueva marca' })
  @ApiBody({ type: CreateBrandDto })
  @ApiResponse({ status: 201, description: 'Marca creada' })
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  @Put(':id')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Actualizar una marca' })
  @ApiParam({ name: 'id', description: 'ID de la marca' })
  @ApiBody({ type: UpdateBrandDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Eliminar una marca' })
  @ApiParam({ name: 'id', description: 'ID de la marca' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.brandsService.remove(id);
    return { deleted: true };
  }
}
