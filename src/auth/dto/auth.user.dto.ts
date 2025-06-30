import { IsEmail, IsIn, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Instructor, Student } from '@prisma/client';

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

// Authenticated user types
export type AuthenticatedInstructor = Omit<Instructor, 'password'>;
export type AuthenticatedStudent = Omit<Student, 'password'>;
export type AuthenticatedUser = AuthenticatedInstructor | AuthenticatedStudent;
