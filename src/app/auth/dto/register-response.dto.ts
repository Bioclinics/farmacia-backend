import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../modules/users/entities/user.entity';

export class RegisterResponseDto {
  @ApiProperty({ description: 'Usuario creado' })
  user: User;

  @ApiProperty({ description: 'Token de acceso JWT' })
  access_token: string;
}
