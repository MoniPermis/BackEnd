import { Test, TestingModule } from '@nestjs/testing';
import { TchatsService } from './tchats.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TchatsService', () => {
  let service: TchatsService;

  const mockPrisma = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TchatsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TchatsService>(TchatsService);

    jest.clearAllMocks();
  });
});
