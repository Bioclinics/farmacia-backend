import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { username: createUserDto.username },
    });

    if (existingUser) {
      throw new BadRequestException('El usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      where: { isDeleted: false },
      relations: ['role'],
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { username, isDeleted: false },
      relations: ['role'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.usersRepository.findOne({
        where: { username: updateUserDto.username },
      });
      if (existingUser) {
        throw new BadRequestException('El usuario ya existe');
      }
    }

    let passwordToUpdate: string | undefined = undefined;
    if (updateUserDto.password) {
      passwordToUpdate = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.usersRepository.save({
      ...user,
      ...updateUserDto,
      password: passwordToUpdate || user.password,
    });

    return updatedUser;
  }

  async remove(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isDeleted = true;
    return await this.usersRepository.save(user);
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
