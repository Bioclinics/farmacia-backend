import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { Roles } from 'src/common/utils/roles.decorator';
import { RolesGuard } from 'src/common/utils/roles.guard';
import { RolesEnum } from 'src/shared/enums/roles.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { AuditLogsService } from 'src/modules/audit_logs/services/audit_logs.service';
import { Request } from 'express';

@ApiTags('Users')
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private sanitizeUserForLog(user: User): Record<string, unknown> {
    if (!user) return {};
    const { password, ...rest } = user;
    return {
      ...rest,
      role: user.role
        ? {
            id: user.role.id,
            name: user.role.name,
          }
        : undefined,
    };
  }

  @Post()
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente', type: User })
  async create(@Body() createUserDto: CreateUserDto, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    const user = await this.usersService.create(createUserDto);
    if (actorId) {
      await this.auditLogsService.record({
        actorId,
        action: 'Crear usuario',
        tableName: 'users',
        recordId: user.id,
        description: `Creó el usuario ${user.username}`,
        newData: this.sanitizeUserForLog(user),
        request: req,
      });
    }
    return user;
  }

  @Get()
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios', type: [User] })
  async findAll(@Query('name') name?: string, @Query('isActive') isActive?: string) {
    const filters: any = {}
    if (name) filters.name = name
    if (typeof isActive !== 'undefined') filters.isActive = isActive === 'true'
    return await this.usersService.findAll(filters);
  }

  @Get(':id')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: User })
  async findOne(@Param('id') id: string) {
    return await this.usersService.findOne(+id);
  }

  @Patch(':id')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado', type: User })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    const existing = await this.usersService.findOne(+id);
    const updated = await this.usersService.update(+id, updateUserDto);
    if (actorId) {
      const changedFields = this.resolveChangedFields(existing, updated, updateUserDto);
      const action = this.resolveUserUpdateAction(changedFields);
      await this.auditLogsService.record({
        actorId,
        action,
        tableName: 'users',
        recordId: updated.id,
        description: `Actualizó el usuario ${updated.username}`,
        oldData: this.sanitizeUserForLog(existing),
        newData: this.sanitizeUserForLog(updated),
        request: req,
      });
    }
    return updated;
  }

  @Delete(':id')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Eliminar (marcar como eliminado) un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    const existing = await this.usersService.findOne(+id);
    const result = await this.usersService.remove(+id);
    if (actorId) {
      await this.auditLogsService.record({
        actorId,
        action: 'Eliminar usuario',
        tableName: 'users',
        recordId: existing.id,
        description: `Marcó como eliminado al usuario ${existing.username}`,
        oldData: this.sanitizeUserForLog(existing),
        newData: this.sanitizeUserForLog(result),
        request: req,
      });
    }
    return result;
  }

  @Patch(':id/activate')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Activar un usuario' })
  async activate(@Param('id') id: string, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    const before = await this.usersService.findOne(+id);
    const updated = await this.usersService.setActive(+id, true);
    if (actorId) {
      await this.auditLogsService.record({
        actorId,
        action: 'Activar usuario',
        tableName: 'users',
        recordId: updated.id,
        description: `Activó al usuario ${updated.username}`,
        oldData: this.sanitizeUserForLog(before),
        newData: this.sanitizeUserForLog(updated),
        request: req,
      });
    }
    return updated;
  }

  @Patch(':id/deactivate')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Desactivar un usuario' })
  async deactivate(@Param('id') id: string, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    const before = await this.usersService.findOne(+id);
    const updated = await this.usersService.setActive(+id, false);
    if (actorId) {
      await this.auditLogsService.record({
        actorId,
        action: 'Bloquear usuario',
        tableName: 'users',
        recordId: updated.id,
        description: `Desactivó al usuario ${updated.username}`,
        oldData: this.sanitizeUserForLog(before),
        newData: this.sanitizeUserForLog(updated),
        request: req,
      });
    }
    return updated;
  }

  private resolveChangedFields(previous: User, updated: User, dto: UpdateUserDto): string[] {
    const changes: string[] = [];
    if (typeof dto.name !== 'undefined' && dto.name !== previous.name) changes.push('name');
    if (typeof dto.email !== 'undefined' && dto.email !== previous.email) changes.push('email');
    if (typeof dto.username !== 'undefined' && dto.username !== previous.username) changes.push('username');
    if (typeof dto.idRole !== 'undefined' && dto.idRole !== previous.idRole) changes.push('role');
    if (typeof dto.password !== 'undefined') changes.push('password');
    if (typeof dto.isActive !== 'undefined' && dto.isActive !== previous.isActive) changes.push('isActive');
    return changes;
  }

  private resolveUserUpdateAction(changes: string[]): string {
    if (!changes.length) return 'Editar usuario';
    if (changes.length === 1) {
      if (changes[0] === 'role') return 'Cambiar rol';
      if (changes[0] === 'password') return 'Cambio de contraseña';
    }
    if (changes.includes('password')) return 'Cambio de contraseña';
    return 'Editar usuario';
  }
}
