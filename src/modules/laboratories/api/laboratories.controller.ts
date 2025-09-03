import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import { LaboratoriesService } from '../services/laboratories.service';
import { CreateLaboratoryDto } from '../dto/create-laboratory.dto';
import { UpdateLaboratoryDto } from '../dto/update-laboratory.dto';
import { Response } from 'express';
import { OkRes } from 'src/common/utils';
import { ApiOperation } from '@nestjs/swagger';

@Controller('laboratories')
export class LaboratoriesController {
	constructor(private readonly laboratoriesService: LaboratoriesService) { }

	@Post()
	create(@Body() createLaboratoryDto: CreateLaboratoryDto) {
		return this.laboratoriesService.create(createLaboratoryDto);
	}

	@Get()
	@ApiOperation({
		summary: 'Api para obtener los laboratorios'
	})
	async findAll(@Res() res: Response) {
		const laboratories = await this.laboratoriesService.findAll();
		return OkRes(res,{
			laboratories: laboratories
		});
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.laboratoriesService.findOne(+id);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() updateLaboratoryDto: UpdateLaboratoryDto) {
		return this.laboratoriesService.update(+id, updateLaboratoryDto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.laboratoriesService.remove(+id);
	}
}
