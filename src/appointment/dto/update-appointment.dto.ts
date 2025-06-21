import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsInt()
  meetingPointId?: number;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'NOTATION', 'COMPLETED'])
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
