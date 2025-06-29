import { IsEmail, IsIn, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UserJwTPayload {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsIn(['instructor', 'student'])
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
  @IsIn(['instructor', 'student'])
  userType: 'instructor' | 'student';
}
