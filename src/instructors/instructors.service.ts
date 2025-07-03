import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeletedInstructorDto } from './dto/create-instructor.dto';

@Injectable()
export class InstructorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getInstructorById(id: number) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: id },
    });
    if (!instructor) {
      throw new NotFoundException('Instructeur non trouvé');
    }
    return instructor;
  }

  async getAllInstructors() {
    return await this.prisma.instructor.findMany();
  }

  async createDeletedInstructor(
    deletedInstructorData: CreateDeletedInstructorDto,
  ) {
    const existingInstructor = await this.prisma.instructor.findUnique({
      where: { id: deletedInstructorData.originalInstructorId },
    });

    if (!existingInstructor) {
      throw new NotFoundException('Instructeur non trouvé');
    }

    return this.prisma.deletedInstructor.create({
      data: {
        originalInstructorId: existingInstructor.id,
        firstName: existingInstructor.firstName,
        lastName: existingInstructor.lastName,
        email: existingInstructor.email,
        siret: existingInstructor.siret,
        iban: existingInstructor.iban,
        deletedAt: new Date(),
      },
    });
  }
}
