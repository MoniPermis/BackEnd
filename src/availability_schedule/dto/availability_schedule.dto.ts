import {
  IsBoolean,
  IsDate,
  IsInt,
  IsMilitaryTime,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAvailabilityScheduleDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  instructorId: number;
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(6)
  @Type(() => Number)
  dayOfWeek: number;
  @IsNotEmpty()
  @IsString()
  @IsMilitaryTime()
  startTime: string;
  @IsNotEmpty()
  @IsString()
  @IsMilitaryTime()
  endTime: string;
  @IsNotEmpty()
  @IsBoolean()
  isRecurring: boolean;
  @IsNotEmpty()
  @IsDate()
  effectiveDate: Date;
  @IsOptional()
  @IsDate()
  expiryDate?: Date;
  @IsOptional()
  @IsString()
  note?: string;
}