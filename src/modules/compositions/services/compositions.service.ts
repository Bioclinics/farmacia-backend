import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Composition } from '../entities/composition.entity';
import { CreateCompositionDto } from '../dto/create-composition.dto';
import { UpdateCompositionDto } from '../dto/update-composition.dto';

@Injectable()
export class CompositionsService {
  constructor(
    @InjectRepository(Composition)
    private readonly repository: Repository<Composition>,
  ) {}

  async findAll(search?: string, page = 1, limit = 10): Promise<{ data: Composition[]; total: number }> {
    const query = this.repository.createQueryBuilder('composition');
    
    if (search) {
      query.where('composition.name ILike :search', { search: `%${search}%` });
    }

    const total = await query.getCount();
    const data = await query
      .orderBy('composition.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async findOne(id: number): Promise<Composition> {
    const composition = await this.repository.findOne({ where: { id_composition: id } });
    if (!composition) {
      throw new NotFoundException(`Composition with id ${id} not found`);
    }
    return composition;
  }

  async create(dto: CreateCompositionDto): Promise<Composition> {
    const existing = await this.repository.findOne({
      where: { name: ILike(dto.name.trim()) },
    });

    if (existing) {
      throw new ConflictException('A composition with this name already exists');
    }

    const composition = this.repository.create({
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
    });

    return this.repository.save(composition);
  }

  async update(id: number, dto: UpdateCompositionDto): Promise<Composition> {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.repository.findOne({
        where: { name: ILike(dto.name.trim()) },
      });

      if (existing && existing.id_composition !== id) {
        throw new ConflictException('A composition with this name already exists');
      }
    }

    await this.repository.update({ id_composition: id }, {
      name: dto.name?.trim(),
      description: dto.description?.trim() || null,
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const composition = await this.findOne(id);
    await this.repository.remove(composition);
  }

  async getProductsByComposition(compositionId: number): Promise<any[]> {
    const composition = await this.repository.findOne({
      where: { id_composition: compositionId },
    });

    if (!composition) {
      throw new NotFoundException(`Composition with id ${compositionId} not found`);
    }

      // TODO: Implement product query from product_compositions table
      return [];
  }

  async searchProducts(term: string): Promise<any[]> {
    // TODO: Implement product search
    return [];
  }

  async getReportProducts(params?: any): Promise<{ data: any[]; pagination: any }> {
    // TODO: Implement report products
    return { data: [], pagination: { page: 1, limit: 10, total: 0 } };
  }

  async getReportSales(params?: any): Promise<{ data: any[]; pagination: any }> {
    // TODO: Implement report sales
    return { data: [], pagination: { page: 1, limit: 10, total: 0 } };
  }

  async getReportCombined(params?: any): Promise<{ data: any[]; pagination: any }> {
    // TODO: Implement report combined
    return { data: [], pagination: { page: 1, limit: 10, total: 0 } };
  }
}
