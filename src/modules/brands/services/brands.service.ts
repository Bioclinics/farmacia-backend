import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly repo: Repository<Brand>,
  ) {}

  async findAll(search?: string): Promise<Brand[]> {
    const searchTerm = search?.trim();
    if (searchTerm) {
      return this.repo.find({
        where: { name: ILike(`%${searchTerm}%`) },
        order: { name: 'ASC' },
      });
    }
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Brand> {
    const brand = await this.repo.findOne({ where: { id_brand: id } });
    if (!brand) {
      throw new NotFoundException(`Marca con id ${id} no encontrada`);
    }
    return brand;
  }

  async create(dto: CreateBrandDto): Promise<Brand> {
    const name = dto.name.trim();
    const existing = await this.repo.findOne({ where: { name: ILike(name) } });
    if (existing) {
      throw new ConflictException('La marca ya existe');
    }
    const brand = this.repo.create({ name });
    return this.repo.save(brand);
  }

  async update(id: number, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findOne(id);
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      const existing = await this.repo.findOne({ where: { name: ILike(name) } });
      if (existing && existing.id_brand !== id) {
        throw new ConflictException('La marca ya existe');
      }
      brand.name = name;
    }
    return this.repo.save(brand);
  }

  async remove(id: number): Promise<void> {
    const brand = await this.findOne(id);
    await this.repo.remove(brand);
  }
}
