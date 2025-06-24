import { ConflictException, Injectable } from '@nestjs/common';
import { CreateInstructorDto, CreateStudentDto } from './dto';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class AuthService {
  constructor(private prismaService: PrismaService) {}

  async instructorSignup(instructor: CreateInstructorDto) {
    const existingInstructor = await this.prismaService.instructor.findFirst({
      where: {
        OR: [
          { email: instructor.email },
          { siret: instructor.siret },
          { iban: instructor.iban },
        ],
      },
    });

    if (existingInstructor) {
      if (existingInstructor.email === instructor.email) {
        throw new ConflictException(
          'An instructor with this email already exists',
        );
      }
      if (existingInstructor.siret === instructor.siret) {
        throw new ConflictException(
          'An instructor with this SIRET already exists',
        );
      }
      if (existingInstructor.iban === instructor.iban) {
        throw new ConflictException(
          'An instructor with this IBAN already exists',
        );
      }
    }

    const hashedPassword = await argon.hash(instructor.password);
    const hashedBic = await argon.hash(instructor.bic);

    let existingPrice = await this.prismaService.price.findFirst({
      where: {
        amount: instructor.amount,
        currency: instructor.currency,
      },
    });
    if (!existingPrice) {
      existingPrice = await this.prismaService.price.create({
        data: {
          amount: instructor.amount,
          currency: instructor.currency,
        },
      });
    }

    return this.prismaService.instructor.create({
      data: {
        priceId: existingPrice.id,
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        gender: instructor.gender,
        email: instructor.email,
        password: hashedPassword,
        phoneNumber: instructor.phoneNumber,
        address: instructor.address,
        driverLicenceUrl: instructor.driverLicenceUrl,
        registrationCertificateUrl: instructor.registrationCertificateUrl,
        insuranceCertificateUrl: instructor.insuranceCertificateUrl,
        degreeUrl: instructor.degreeUrl,
        teachingAuthorizationUrl: instructor.teachingAuthorizationUrl,
        profilePictureUrl: instructor.profilePictureUrl || null,
        iban: instructor.iban,
        bic: hashedBic,
        siret: instructor.siret,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async studentSignup(student: CreateStudentDto) {
    const existingStudent = await this.prismaService.student.findFirst({
      where: { email: student.email },
    });

    if (existingStudent) {
      throw new ConflictException('A student with this email already exists');
    }

    const hashedPassword = await argon.hash(student.password);

    return this.prismaService.student.create({
      data: {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        password: hashedPassword,
        phoneNumber: student.phoneNumber,
        profilePictureUrl: student.profilePictureUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}
