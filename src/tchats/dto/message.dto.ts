import { IsEnum, IsNotEmpty } from 'class-validator';

export enum SenderType {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
}

export class messageDto {
  @IsNotEmpty()
  content: string;

  @IsNotEmpty()
  @IsEnum(SenderType)
  senderType: SenderType;
}
