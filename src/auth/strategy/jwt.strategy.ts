import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as process from 'node:process';
import { UserJwTPayload } from '../dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: UserJwTPayload) {
    if (payload.userType == 'instructor') {
      const instructor = await this.prisma.instructor.findUnique({
        where: {
          id: payload.id,
          email: payload.email,
        },
      });
      if (!instructor) {
        throw new NotFoundException('Instructor not found');
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...instructorWithoutPassword } = instructor;
      return instructorWithoutPassword;
    } else if (payload.userType == 'student') {
      const student = await this.prisma.student.findUnique({
        where: {
          id: payload.id,
          email: payload.email,
        },
      });
      if (!student) {
        throw new NotFoundException('Student not found');
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...studentWithoutPassword } = student;
      return studentWithoutPassword;
    } else {
      throw new NotFoundException('User type not recognized');
    }
  }
}
