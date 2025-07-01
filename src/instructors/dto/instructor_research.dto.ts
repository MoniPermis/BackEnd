import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum ResearchType {
  NAME = 'name',
  ADRESS = 'address',
}

export class InstructorResearchDto {
  @IsNotEmpty()
  @IsEnum(ResearchType)
  type: ResearchType;

  @IsNotEmpty()
  @IsNumberString()
  latitude: string;

  @IsNotEmpty()
  @IsNumberString()
  longitude: string;

  @IsNotEmpty()
  @IsNumberString()
  dist_max: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumberString()
  price?: number;

  @IsOptional()
  @IsEnum(Gender)
  gender?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
