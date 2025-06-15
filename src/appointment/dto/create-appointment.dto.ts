import { IsString, IsDateString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsInt()
  studentId: number;

  @IsNotEmpty()
  @IsInt()
  instructorId: number;

  @IsNotEmpty()
  @IsInt()
  meetingPointId: number;

  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @IsNotEmpty()
  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  description?: string;
}