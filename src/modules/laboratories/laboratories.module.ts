import { Module } from '@nestjs/common';
import { LaboratoriesService } from './services/laboratories.service';
import { LaboratoriesController } from './api/laboratories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Laboratory } from './entities/laboratory.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([Laboratory])
	],
	controllers: [LaboratoriesController],
	providers: [LaboratoriesService],
})
export class LaboratoriesModule { }
