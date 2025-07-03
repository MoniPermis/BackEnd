import { ConflictException, Injectable } from '@nestjs/common';
import {
  AuthenticatedUser,
  AuthUserDto,
  CreateInstructorDto,
  CreateStudentDto,
} from './dto';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { isInstructor, isStudent } from './guard/user-type.guard';
import { InstructorsService } from '../instructors/instructors.service';
import { CreateDeletedInstructorDto } from '../instructors/dto/create-instructor.dto';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwt: JwtService,
    private instructorService: InstructorsService,
  ) {}

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

  async login(authUser: AuthUserDto) {
    let user: { id: number; password: string; email: string } | null = null;

    if (authUser.userType === 'instructor') {
      const instructor = await this.prismaService.instructor.findUnique({
        where: { email: authUser.email },
        select: { id: true, password: true, email: true },
      });

      if (!instructor) {
        throw new ConflictException('Invalid credentials');
      }
      user = instructor;
    } else if (authUser.userType === 'student') {
      const student = await this.prismaService.student.findUnique({
        where: { email: authUser.email },
        select: { id: true, password: true, email: true },
      });

      if (!student) {
        throw new ConflictException('Invalid credentials');
      }
      user = student;
    } else {
      throw new ConflictException('Invalid user type');
    }

    const passwordMatches = await argon.verify(
      user.password,
      authUser.password,
    );
    if (!passwordMatches) {
      throw new ConflictException('Invalid credentials');
    }

    return this.signTokenAsync(user.id, authUser.email, authUser.userType);
  }

  async signTokenAsync(
    id: number,
    email: string,
    userType: 'instructor' | 'student',
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: id,
      email,
      userType,
    };

    const secret = process.env.JWT_SECRET;
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: secret,
    });

    return {
      access_token: token,
    };
  }

  async deleteUser(user: AuthenticatedUser) {
    if (isInstructor(user)) {
      const instructorToDelete: CreateDeletedInstructorDto = {
        originalInstructorId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        siret: user.siret,
        iban: user.iban,
      };
      const deletedInstructor =
        await this.instructorService.createDeletedInstructor(
          instructorToDelete,
        );
      await this.prismaService.purchaseOrder.updateMany({
        where: { instructorId: user.id },
        data: { instructorId: null, deletedInstructorId: deletedInstructor.id },
      });

      return this.prismaService.instructor.delete({
        where: { id: user.id },
      });
    } else if (isStudent(user)) {
      return this.prismaService.student.delete({
        where: { id: user.id },
      });
    } else {
      throw new ConflictException('Invalid user type');
    }
  }
}
