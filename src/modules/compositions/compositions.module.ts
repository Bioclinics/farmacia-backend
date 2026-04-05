import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompositionsController } from './api/compositions.controller';
import { CompositionsService } from './services/compositions.service';
import { Composition } from './entities/composition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Composition])],
  controllers: [CompositionsController],
  providers: [CompositionsService],
  exports: [CompositionsService],
})
export class CompositionsModule {}
