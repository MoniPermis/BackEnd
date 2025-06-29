import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UserJwTPayload {
  @IsNotEmpty()
  @IsNumber()
  id: number;
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  userType: 'instructor' | 'student';
}

export class AuthUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  userType: 'instructor' | 'student';
}
