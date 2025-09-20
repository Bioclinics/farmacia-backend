import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Query, Put } from '@nestjs/common';
import { LaboratoriesService } from '../services/laboratories.service';
import { CreateLaboratoryDto } from '../dto/inputs/create-laboratory.dto';
import { UpdateLaboratoryDto } from '../dto/inputs/update-laboratory.dto';
import { Response } from 'express';
import { CreatedRes, OkRes, SwaggerBadRequestCommon, SwaggerNotFoundCommon } from 'src/common/utils';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiProperty } from '@nestjs/swagger';
import { FindAllLaboratoryParamsDto } from '../dto/inputs/find-all-laboratory-params.dto';
import { CommonResponseDto } from 'src/shared/dto/common-response.dto';
import { FindAlllaboratoriesResponseDto } from '../dto/outputs/find-all-laboratories-response.dto';
import { FindOnelaboratoryResponse } from '../dto/outputs/find-one-laboratory-response.dto';

@Controller('laboratories')
export class LaboratoriesController {
	constructor(private readonly laboratoriesService: LaboratoriesService) { }

	@Post()
	@ApiOperation({
		summary: 'Api para crear un laboratorio',
	})
	@ApiCreatedResponse({
		description: 'Respuesta en caso de crear el laboratorio exitosamente',
		type: CommonResponseDto
	})
	@ApiBadRequestResponse(SwaggerBadRequestCommon())
	async create(@Body() data: CreateLaboratoryDto,@Res() res: Response) {
		const laboratory = await this.laboratoriesService.create(data);
		return CreatedRes(res,{
			message: 'Se creo el laboratorio'
		})
	}

	@Get()
	@ApiOperation({
		summary: 'Api para obtener los laboratorios'
	})
	@ApiOkResponse({
		description: 'Respuesta en caso de obtener los laboratorio exitosamente',
		type: FindAlllaboratoriesResponseDto
	})
	@ApiBadRequestResponse(SwaggerBadRequestCommon())
	async findAll(
		@Query() params: FindAllLaboratoryParamsDto,
		@Res() res: Response
	) {
		const laboratories = await this.laboratoriesService.findAll(params);
		return OkRes(res,{
			laboratories: laboratories
		});
	}

	@Get(':idLaboratory')
	@ApiOperation({
		summary: 'Api para obtener un laboratorio'
	})
	@ApiOkResponse({
		description: 'Respuesta en caso de obtener el laboratorio exitosamente',
		type: FindOnelaboratoryResponse
	})
	@ApiNotFoundResponse(SwaggerNotFoundCommon())
	@ApiBadRequestResponse(SwaggerBadRequestCommon())
	@ApiParam({
		name: 'idLaboratory',
		description: 'Id de laboratorio a obtener'
	})
	async findOne(@Param('idLaboratory') idLaboratory: number,@Res() res: Response) {
		const laboratory = await this.laboratoriesService.findOne(idLaboratory);
		return OkRes(res,{
			laboratory: laboratory
		});
	}

	@Put(':idLaboratory')
	@ApiOperation({
		summary: 'Api para actualizar el laboratorio',
	})
	@ApiOkResponse({
		description: 'Respuesta si se actualizo al laboratorio',
		type: CommonResponseDto
	})
	@ApiBadRequestResponse(SwaggerBadRequestCommon())
	@ApiNotFoundResponse(SwaggerNotFoundCommon())
	@ApiParam({
		name: 'idLaboratory',
		description: 'Id del laboratorio a actualizar'
	})
	async update(@Param('idLaboratory') idLaboratory: number, @Body() data: UpdateLaboratoryDto,@Res() res: Response) {
		const laboratory = await this.laboratoriesService.update(idLaboratory,data);
		return OkRes(res,{
			message: 'Se actualizo el laboratorio'
		});
	}

	@Delete(':idLaboratory')
	@ApiOperation({
		summary: 'Api para eliminar un laboratorio'
	})
	@ApiOkResponse({
		description: 'Respuesta en caso de eliminar el laboratorio',
		type: CommonResponseDto
	})
	@ApiNotFoundResponse(SwaggerNotFoundCommon())
	@ApiBadRequestResponse(SwaggerBadRequestCommon())
	@ApiParam({
		name: 'idLaboratory',
		description: 'Id del laboratorio a eliminar'
	})
	async remove(@Param('idLaboratory') idLaboratory: number,@Res() res: Response) {
		const response = await this.laboratoriesService.remove(idLaboratory);
		return OkRes(res,{
			message: 'Laboratorio eliminado'
		})
	}
}
