import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class UpdateUnavailabilityDto {
  @IsNotEmpty()
  @IsDateString()
  startDateTime: string;

  @IsNotEmpty()
  @IsDateString()
  endDateTime: string;

  @IsNotEmpty()
  @IsString()
  reason: string;
}