import { IsString, IsEmail, IsNumber, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsNumber()
  idRole: number;

  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(150)
  name: string;

  @IsEmail({}, { message: 'El email debe ser válido' })
  email: string;

  @IsString()
  @MinLength(3, { message: 'El usuario debe tener al menos 3 caracteres' })
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
