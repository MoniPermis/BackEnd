import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateUnavailabilityDto {
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
