import { Injectable } from '@nestjs/common';
import { CreateLaboratoryDto } from '../dto/create-laboratory.dto';
import { UpdateLaboratoryDto } from '../dto/update-laboratory.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Laboratory } from '../entities/laboratory.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LaboratoriesService {
	constructor(
		@InjectRepository(Laboratory)
		private readonly laboratoryRepository: Repository<Laboratory>
	){}

	create(createLaboratoryDto: CreateLaboratoryDto) {
		return 'This action adds a new laboratory';
	}

	
	async findAll() {
		const laboratories = await this.laboratoryRepository.find();
		return laboratories;
	}

	findOne(id: number) {
		return `This action returns a #${id} laboratory`;
	}

	update(id: number, updateLaboratoryDto: UpdateLaboratoryDto) {
		return `This action updates a #${id} laboratory`;
	}

	remove(id: number) {
		return `This action removes a #${id} laboratory`;
	}
}
