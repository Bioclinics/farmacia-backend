import { Controller, Post, Body, Req } from '@nestjs/common';
import { Roles } from 'src/common/utils/roles.decorator';
import { RolesEnum } from 'src/shared/enums/roles.enum';
import { Public } from 'src/common/utils/public.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiCreatedResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RegisterResponseDto } from '../dto/register-response.dto';
import { AuditLogsService } from 'src/modules/audit_logs/services/audit_logs.service';
import { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private auditLogsService: AuditLogsService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso, devuelve token JWT y datos del usuario' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const result = await this.authService.login(loginDto);
    await this.auditLogsService.record({
      actorId: result.user.id,
      action: 'Login',
      tableName: 'auth',
      recordId: result.user.id,
      description: `Inicio de sesión de ${result.user.username}`,
      newData: { userId: result.user.id, username: result.user.username },
      request: req,
    });
    return result;
  }

  // Register is admin-only now (protected). Keep it non-public.
  @Post('register')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ description: 'Usuario registrado exitosamente, devuelve token JWT', type: RegisterResponseDto })
  @ApiResponse({ status: 400, description: 'Error en validación de datos' })
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    const result = await this.authService.register(registerDto);
    const actorId = (req as any).user?.id;
    if (actorId) {
      await this.auditLogsService.record({
        actorId,
        action: 'Crear usuario',
        tableName: 'users',
        recordId: result.user.id,
        description: `Registro de usuario ${result.user.username}`,
        newData: { id: result.user.id, username: result.user.username, email: result.user.email, idRole: result.user.idRole },
        request: req,
      });
    }
    return result;
  }
}
