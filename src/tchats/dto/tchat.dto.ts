import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class tchatDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsNumber()
  instructorId: number;

  @IsNotEmpty()
  @IsNumber()
  studentId: number;
}
