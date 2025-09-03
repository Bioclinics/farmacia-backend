import { Module } from '@nestjs/common';
import { LaboratoriesService } from './services/laboratories.service';
import { LaboratoriesController } from './api/laboratories.controller';

@Module({
	controllers: [LaboratoriesController],
	providers: [LaboratoriesService],
})
export class LaboratoriesModule { }
