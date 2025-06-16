import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}
