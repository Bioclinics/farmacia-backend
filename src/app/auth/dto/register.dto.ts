import { IsString, IsEmail, IsNumber, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsNumber()
  @IsNotEmpty()
  idRole: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(150)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
