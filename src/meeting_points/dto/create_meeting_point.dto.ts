import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMeetingPointDto {
  @IsNotEmpty()
  @IsNumber()
  instructorId: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsString()
  name: string;
}
