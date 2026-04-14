import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { UsersService } from 'src/modules/users/users.service';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async register(registerDto: RegisterDto): Promise<{ user: User; access_token: string }> {
    const user = await this.usersService.create(registerDto);
    const access_token = this.jwtService.sign(
      { id: user.id, username: user.username, idRole: Number(user.idRole) },
      { expiresIn: '24h' },
    );

    return { user: this.sanitizeUser(user) as User, access_token };
  }

  async login(loginDto: LoginDto): Promise<{ user: User; access_token: string }> {
    const username = loginDto.username.trim();
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const access_token = this.jwtService.sign(
      { id: user.id, username: user.username, idRole: Number(user.idRole) },
      { expiresIn: '24h' },
    );

    return { user: this.sanitizeUser(user) as User, access_token };
  }

  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
