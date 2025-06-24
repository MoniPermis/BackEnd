import {
  IsBIC,
  IsEmail,
  IsIBAN,
  IsIn,
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumberString,
  IsInt,
} from 'class-validator';

export class CreateInstructorDto {
  @IsNotEmpty({ message: 'First name is required' })
  @IsString({ message: 'First name must be a string' })
  firstName: string;
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString({ message: 'Last name must be a string' })
  lastName: string;
  @IsNotEmpty({ message: 'Gender is required' })
  @IsString({ message: 'Gender must be a string' })
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  gender: string;
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  password: string;
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsMobilePhone()
  phoneNumber: string;
  @IsNotEmpty({ message: 'Address is required' })
  @IsString({ message: 'Address must be a string' })
  address: string;
  @IsNotEmpty({ message: 'Driver licence URL is required' })
  @IsString({ message: 'Driver licence URL must be a string' })
  driverLicenceUrl: string;
  @IsNotEmpty({ message: 'Registration certificate URL is required' })
  @IsString({ message: 'Registration certificate URL must be a string' })
  registrationCertificateUrl: string;
  @IsNotEmpty({ message: 'Insurance certificate URL is required' })
  @IsString({ message: 'Insurance certificate URL must be a string' })
  insuranceCertificateUrl: string;
  @IsNotEmpty({ message: 'Degree URL is required' })
  @IsString({ message: 'Degree URL must be a string' })
  degreeUrl: string;
  @IsNotEmpty({ message: 'Teaching authorization URL is required' })
  @IsString({ message: 'Teaching authorization URL must be a string' })
  teachingAuthorizationUrl: string;
  @IsOptional({ message: 'Profile picture URL is optional' })
  @IsString({ message: 'Profile picture URL must be a string' })
  profilePictureUrl?: string;
  @IsNotEmpty({ message: 'IBAN is required' })
  @IsIBAN({ message: 'IBAN must be a valid IBAN code' })
  iban: string;
  @IsNotEmpty({ message: 'BIC is required' })
  @IsBIC({ message: 'BIC must be a valid BIC code' })
  bic: string;
  @IsNotEmpty({ message: 'SIRET is required' })
  @IsNumberString()
  siret: string;
  @IsNotEmpty({ message: 'Amount is required' })
  @IsInt({ message: 'Amount must be a positive integer' })
  amount: number;
  @IsNotEmpty({ message: 'Currency is required' })
  @IsString({ message: 'Currency must be a string' })
  @IsIn(['EUR', 'USD', 'GBP', 'CAD', 'AUD'], {
    message: 'Currency must be one of the following: EUR, USD, GBP, CAD, AUD',
  })
  currency: string;
}
