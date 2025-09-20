import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLaboratoryDto } from '../dto/inputs/create-laboratory.dto';
import { UpdateLaboratoryDto } from '../dto/inputs/update-laboratory.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Laboratory } from '../entities/laboratory.entity';
import { ILike, Repository } from 'typeorm';
import { FindAllLaboratoryParamsDto } from '../dto/inputs/find-all-laboratory-params.dto';
import { OptionsFindOne } from 'src/common/utils';
import { OptionsFindOneLaboratory } from '../dto/inputs/options-find-one-laboratory.dto';

@Injectable()
export class LaboratoriesService {
	constructor(
		@InjectRepository(Laboratory)
		private readonly laboratoryRepository: Repository<Laboratory>
	) { }

	async create(data: CreateLaboratoryDto) {
		const laboratory = new Laboratory();
		laboratory.name = data.name;
		return await this.laboratoryRepository.save(laboratory);
	}

	async findAll(params: FindAllLaboratoryParamsDto) {
		const laboratories = await this.laboratoryRepository.find({
			where: {
				isDeleted: false,
				isActive: params.isActive,
				...(params.name.length > 0 ? {
					name: ILike(`%${params.name}%`)
				} : {})
			},
			select: {
				id: true,
				name: true,
				isActive: true
			}
		});
		return laboratories;
	}

	async findOne(
		idLaboratory: number,
		options?: OptionsFindOneLaboratory
	) {
		const finalOptions = new OptionsFindOneLaboratory();
		if (options) {
			Object.assign(finalOptions, options);
		}
		const laboratory = await this.laboratoryRepository.findOne({
			where: {
				...(finalOptions.onlyActive ? {
					isActive: true
				} : {}),
				isDeleted: false,
				id: idLaboratory,
			},
		});
		if (laboratory == null && finalOptions.throwException) {
			throw new NotFoundException({
				message: `No existe el laboratorio con id = ${idLaboratory}`,
			});
		}
		return laboratory;
	}

	async update(idLaboratory: number, data: UpdateLaboratoryDto): Promise<Laboratory> {
		const laboratory = await this.findOne(idLaboratory, {
			onlyActive: false
		});
		let c = 0;
		if (data.name && data.name.trim().length > 0) {
			laboratory!.name = data.name!.trim();
			c += 1
		}
		if (c == 0) {
			return laboratory!;
		}
		return await this.laboratoryRepository.save(laboratory!);
	}

	async remove(idLaboratory: number) {
		const laboratory = await this.findOne(idLaboratory,{
			onlyActive: false
		})
		laboratory!.isDeleted = true
		return await this.laboratoryRepository.save(laboratory!);
	}
}
