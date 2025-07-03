import {
  IsEmail,
  IsIBAN,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsString,
} from 'class-validator';

export class CreateDeletedInstructorDto {
  @IsNotEmpty()
  @IsNumber()
  originalInstructorId: number;
  @IsNotEmpty()
  @IsString()
  firstName: string;
  @IsNotEmpty()
  @IsString()
  lastName: string;
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @IsNumberString()
  siret: string;
  @IsNotEmpty()
  @IsIBAN()
  iban: string;
}
