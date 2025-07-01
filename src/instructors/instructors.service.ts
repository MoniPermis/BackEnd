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

  async createDistanceFilter(
    latitude: number,
    longitude: number,
    dist_max: number,
  ) {
    const nearbyMeetingPoints = await this.prisma.$queryRaw<
      Array<{ instructorId: number }>
    >`
      SELECT DISTINCT "instructorId"
      FROM "MeetingPoint"
      WHERE (
        6371 * acos(
          cos(radians(${latitude})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(latitude))
        )
      ) <= ${dist_max};
    `;
    const nearbyInstructorIds = nearbyMeetingPoints.map((r) => r.instructorId);

    return {
      id: { in: nearbyInstructorIds.length ? nearbyInstructorIds : [0] },
    };
  }

  createNameFilter(name: string) {
    const searchName = name.trim().split(' ');
    if (searchName.length > 1) {
      return {
        OR: [
          {
            AND: [
              {
                firstName: {
                  startsWith: searchName[0],
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                lastName: {
                  startsWith: searchName[1],
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          },
          {
            AND: [
              {
                firstName: {
                  startsWith: searchName[1],
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                lastName: {
                  startsWith: searchName[0],
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          },
        ],
      };
    } else {
      return {
        OR: [
          {
            firstName: {
              startsWith: searchName[0].trim(),
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            lastName: {
              startsWith: searchName[0].trim(),
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      };
    }
  }

  async createFilteredInstructors(searchInfo: InstructorResearchDto) {
    const filter: Prisma.InstructorWhereInput[] = [];
    if (searchInfo.latitude && searchInfo.longitude && searchInfo.dist_max) {
      filter.push(
        await this.createDistanceFilter(
          Number(searchInfo.latitude),
          Number(searchInfo.longitude),
          Number(searchInfo.dist_max),
        ),
      );
    }
    if (searchInfo.name) {
      filter.push(this.createNameFilter(searchInfo.name));
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
    return filter;
  }

  async getAllInstructors(searchInfo: InstructorResearchDto) {
    const filter: Prisma.InstructorWhereInput[] =
      await this.createFilteredInstructors(searchInfo);
    return await this.prisma.instructor.findMany({
      where: {
        AND: filter,
      },
      include: {
        price: true,
        appointments: true,
        availabilitySchedules: true,
        unavailabilities: true,
      },
    });
  }
}
