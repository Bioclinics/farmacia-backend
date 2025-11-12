import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existing = await this.rolesRepository.findOne({ where: { name: createRoleDto.name } });
    if (existing) throw new BadRequestException('Role already exists');
    const role = this.rolesRepository.create(createRoleDto as Partial<Role>);
    return await this.rolesRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return await this.rolesRepository.find();
  }

  async findOne(id: number): Promise<Role> {
    const r = await this.rolesRepository.findOne({ where: { id } });
    if (!r) throw new NotFoundException(`Role ${id} not found`);
    return r;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    Object.assign(role, updateRoleDto);
    return await this.rolesRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    await this.rolesRepository.remove(role);
  }

  async findByName(name: string): Promise<Role | null> {
    return await this.rolesRepository.findOne({ where: { name } });
  }
}
