import { IsString, IsEmail, IsNumber, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID del rol del usuario (ej: 1=Admin, 2=Staff)', example: 2 })
  idRole: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(150)
  @ApiProperty({ description: 'Nombre completo del usuario', example: 'Juan Pérez' })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ description: 'Correo electrónico del usuario', example: 'usuario@ejemplo.com' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @ApiProperty({ description: 'Nombre de usuario para login', example: 'juan.perez' })
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @ApiProperty({ description: 'Contraseña (mínimo 6 caracteres)', example: 'P@ssw0rd' })
  password: string;
}
