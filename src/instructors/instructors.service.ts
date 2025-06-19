import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstructorResearchDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InstructorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getInstructorById(id: number) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: id },
      include: {
        availabilitySchedules: true,
        unavailabilities: true,
        meetingPoints: true,
      },
    });
    if (!instructor) {
      throw new NotFoundException('Instructeur non trouvé');
    }
    return instructor;
  }

  createFilteredInstructors(searchInfo: InstructorResearchDto) {
    const filter: Prisma.InstructorWhereInput[] = [];
    if (searchInfo.research.toLowerCase().includes('longitude')) {
      return [];
    }
    const searchName = searchInfo.research.trim().split(' ');
    if (searchName.length > 1) {
      filter.push({
        OR: [
          {
            AND: [
              { firstName: { startsWith: searchName[0], mode: 'insensitive' } },
              { lastName: { startsWith: searchName[1], mode: 'insensitive' } },
            ],
          },
          {
            AND: [
              { firstName: { startsWith: searchName[1], mode: 'insensitive' } },
              { lastName: { startsWith: searchName[0], mode: 'insensitive' } },
            ],
          },
        ],
      });
    } else {
      filter.push({
        OR: [
          {
            firstName: {
              startsWith: searchInfo.research.trim(),
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              startsWith: searchInfo.research.trim(),
              mode: 'insensitive',
            },
          },
        ],
      });
    }
    if (searchInfo.price) {
      const price = Number(searchInfo.price);
      filter.push({
        price: {
          amount: {
            lte: price,
          },
        },
      });
    }
    if (searchInfo.gender) {
      filter.push({
        gender: searchInfo.gender,
      });
    }
    if (searchInfo.date) {
      filter.push({});
    }
    return filter;
  }

  async getAllInstructors(searchInfo: InstructorResearchDto) {
    const filter = this.createFilteredInstructors(searchInfo);
    return await this.prisma.instructor.findMany({
      where: {
        AND: filter,
      },
      include: {
        price: true,
        availabilitySchedules: true,
        // unavailabilities: true,
        // meetingPoints: true,
      },
    });
  }
}
