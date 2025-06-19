import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export enum gender {
  MALE = 'male',
  FEMALE = 'female',
}

export class InstructorResearchDto {
  @IsNotEmpty()
  @IsString()
  research: string;

  @IsOptional()
  @IsNumberString()
  price?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(gender)
  gender?: string;
}
