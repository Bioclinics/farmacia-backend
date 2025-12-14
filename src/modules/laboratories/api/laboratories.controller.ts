import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Query, Put, UseGuards, Req } from '@nestjs/common';
import { Roles } from 'src/common/utils/roles.decorator';
import { RolesGuard } from 'src/common/utils/roles.guard';
import { RolesEnum } from 'src/shared/enums/roles.enum';
import { LaboratoriesService } from '../services/laboratories.service';
import { CreateLaboratoryDto } from '../dto/inputs/create-laboratory.dto';
import { UpdateLaboratoryDto } from '../dto/inputs/update-laboratory.dto';
import { Response } from 'express';
import { CreatedRes, OkRes, SwaggerBadRequestCommon, SwaggerNotFoundCommon } from 'src/common/utils';
import { AuditLogsService } from 'src/modules/audit_logs/services/audit_logs.service';
import { Request } from 'express';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiProperty } from '@nestjs/swagger';
import { FindAllLaboratoryParamsDto } from '../dto/inputs/find-all-laboratory-params.dto';
import { CommonResponseDto } from 'src/shared/dto/common-response.dto';
import { FindAlllaboratoriesResponseDto } from '../dto/outputs/find-all-laboratories-response.dto';
import { FindOnelaboratoryResponse } from '../dto/outputs/find-one-laboratory-response.dto';

@Controller('laboratories')
@UseGuards(RolesGuard)
export class LaboratoriesController {
	constructor(
		private readonly laboratoriesService: LaboratoriesService,
		private readonly auditLogsService: AuditLogsService,
	) { }

	@Post()
	@Roles(RolesEnum.ADMIN)
	@ApiOperation({
		summary: 'Api para crear un laboratorio',
	})
	@ApiCreatedResponse({
		description: 'Respuesta en caso de crear el laboratorio exitosamente',
		type: CommonResponseDto
	})
	@ApiBadRequestResponse(SwaggerBadRequestCommon())
		async create(@Body() data: CreateLaboratoryDto,@Res() res: Response, @Req() req: Request) {
			const laboratory = await this.laboratoriesService.create(data);
			const actorId = (req as any).user?.id;
			if (actorId) {
				await this.auditLogsService.record({
					actorId,
					action: 'Crear laboratorio',
					tableName: 'laboratories',
					recordId: (laboratory as any).id_laboratory ?? (laboratory as any).id,
					description: `Creó el laboratorio ${(laboratory as any).name ?? ''}`,
					newData: { id: (laboratory as any).id_laboratory ?? (laboratory as any).id, name: (laboratory as any).name },
					request: req,
				});
			}
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
	@Roles(RolesEnum.ADMIN)
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
		async update(@Param('idLaboratory') idLaboratory: number, @Body() data: UpdateLaboratoryDto,@Res() res: Response, @Req() req: Request) {
			const before = await this.laboratoriesService.findOne(idLaboratory);
			const laboratory = await this.laboratoriesService.update(idLaboratory,data);
			const actorId = (req as any).user?.id;
			if (actorId) {
				await this.auditLogsService.record({
					actorId,
					action: 'Editar laboratorio',
					tableName: 'laboratories',
					recordId: (laboratory as any).id_laboratory ?? (laboratory as any).id,
					description: `Actualizó el laboratorio ${(laboratory as any).name ?? ''}`,
					oldData: { id: (before as any).id_laboratory ?? (before as any).id, name: (before as any).name },
					newData: { id: (laboratory as any).id_laboratory ?? (laboratory as any).id, name: (laboratory as any).name },
					request: req,
				});
			}
			return OkRes(res,{
				message: 'Se actualizo el laboratorio'
			});
	}

	@Delete(':idLaboratory')
	@Roles(RolesEnum.ADMIN)
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
		async remove(@Param('idLaboratory') idLaboratory: number,@Res() res: Response, @Req() req: Request) {
			const before = await this.laboratoriesService.findOne(idLaboratory);
			const response = await this.laboratoriesService.remove(idLaboratory);
			const actorId = (req as any).user?.id;
			if (actorId) {
				await this.auditLogsService.record({
					actorId,
					action: 'Eliminar laboratorio',
					tableName: 'laboratories',
					recordId: (before as any).id_laboratory ?? (before as any).id,
					description: `Eliminó el laboratorio ${(before as any).name ?? ''}`,
					oldData: { id: (before as any).id_laboratory ?? (before as any).id, name: (before as any).name },
					request: req,
				});
			}
			return OkRes(res,{
				message: 'Laboratorio eliminado'
			})
	}
}
