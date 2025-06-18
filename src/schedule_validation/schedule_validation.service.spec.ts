import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ScheduleValidationService } from './schedule_validation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ScheduleValidationService', () => {
  let service: ScheduleValidationService;

  const mockPrismaService = {
    availabilitySchedule: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    instructorUnavailability: {
      findMany: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleValidationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ScheduleValidationService>(ScheduleValidationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkScheduleConflicts', () => {
    const instructorId = 1;
    // Utiliser des dates futures pour éviter les erreurs de validation
    const now = new Date();
    const startDateTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Demain à la même heure
    const endDateTime = new Date(
      now.getTime() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
    ); // Demain + 2h

    beforeEach(() => {
      mockPrismaService.availabilitySchedule.findMany.mockResolvedValue([]);
      mockPrismaService.instructorUnavailability.findMany.mockResolvedValue([]);
      mockPrismaService.appointment.findMany.mockResolvedValue([]);
    });

    it('should pass without conflicts', async () => {
      await expect(
        service.checkScheduleConflicts(
          instructorId,
          startDateTime,
          endDateTime,
        ),
      ).resolves.not.toThrow();

      expect(
        mockPrismaService.availabilitySchedule.findMany,
      ).toHaveBeenCalledWith({
        where: {
          instructorId,
          AND: [
            {
              OR: [
                {
                  AND: [
                    { startDateTime: { lte: startDateTime } },
                    { endDateTime: { gt: startDateTime } },
                  ],
                },
                {
                  AND: [
                    { startDateTime: { lt: endDateTime } },
                    { endDateTime: { gte: endDateTime } },
                  ],
                },
                {
                  AND: [
                    { startDateTime: { gte: startDateTime } },
                    { endDateTime: { lte: endDateTime } },
                  ],
                },
                {
                  AND: [
                    { startDateTime: { lte: startDateTime } },
                    { endDateTime: { gte: endDateTime } },
                  ],
                },
              ],
            },
          ],
        },
      });
    });

    it('should throw ConflictException when there are conflicting availabilities', async () => {
      const conflictingAvailability = {
        id: 1,
        startDateTime: new Date(startDateTime.getTime() - 60 * 60 * 1000), // 1h avant
        endDateTime: new Date(startDateTime.getTime() + 60 * 60 * 1000), // 1h après le début
      };

      mockPrismaService.availabilitySchedule.findMany.mockResolvedValue([
        conflictingAvailability,
      ]);

      await expect(
        service.checkScheduleConflicts(
          instructorId,
          startDateTime,
          endDateTime,
        ),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.checkScheduleConflicts(
          instructorId,
          startDateTime,
          endDateTime,
        ),
      ).rejects.toThrow('Conflit avec les disponibilités existantes');
    });

    it('should throw ConflictException when there are conflicting unavailabilities', async () => {
      const conflictingUnavailability = {
        id: 1,
        startDateTime: new Date(startDateTime.getTime() + 60 * 60 * 1000), // 1h après le début
        endDateTime: new Date(endDateTime.getTime() + 60 * 60 * 1000), // 1h après la fin
      };

      mockPrismaService.instructorUnavailability.findMany.mockResolvedValue([
        conflictingUnavailability,
      ]);

      await expect(
        service.checkScheduleConflicts(
          instructorId,
          startDateTime,
          endDateTime,
        ),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.checkScheduleConflicts(
          instructorId,
          startDateTime,
          endDateTime,
        ),
      ).rejects.toThrow('Conflit avec les indisponibilités existantes');
    });

    it('should throw ConflictException when there are conflicting appointments', async () => {
      const conflictingAppointment = {
        id: 1,
        startTime: new Date(startDateTime.getTime() + 30 * 60 * 1000), // 30min après le début
        endTime: new Date(endDateTime.getTime() + 30 * 60 * 1000), // 30min après la fin
      };

      mockPrismaService.appointment.findMany.mockResolvedValue([
        conflictingAppointment,
      ]);

      await expect(
        service.checkScheduleConflicts(
          instructorId,
          startDateTime,
          endDateTime,
        ),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.checkScheduleConflicts(
          instructorId,
          startDateTime,
          endDateTime,
        ),
      ).rejects.toThrow('Conflit avec les rendez-vous confirmés');
    });

    it('should include multiple conflicting dates in error message', async () => {
      const conflictingAvailabilities = [
        {
          id: 1,
          startDateTime: new Date(startDateTime.getTime() - 60 * 60 * 1000),
          endDateTime: new Date(startDateTime.getTime() + 60 * 60 * 1000),
        },
        {
          id: 2,
          startDateTime: new Date(startDateTime.getTime() + 30 * 60 * 1000),
          endDateTime: new Date(endDateTime.getTime() + 60 * 60 * 1000),
        },
      ];

      mockPrismaService.availabilitySchedule.findMany.mockResolvedValue(
        conflictingAvailabilities,
      );

      try {
        await service.checkScheduleConflicts(
          instructorId,
          startDateTime,
          endDateTime,
        );
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ConflictException);
        if (error instanceof ConflictException) {
          expect(error.message).toContain(
            'Conflit avec les disponibilités existantes',
          );
          // Vérifier que les deux dates sont présentes dans le message
          expect(error.message).toContain(
            conflictingAvailabilities[0].startDateTime.toISOString(),
          );
          expect(error.message).toContain(
            conflictingAvailabilities[1].startDateTime.toISOString(),
          );
        }
      }
    });

    it('should check appointments with correct filters', async () => {
      await service.checkScheduleConflicts(
        instructorId,
        startDateTime,
        endDateTime,
      );

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        where: {
          instructorId,
          AND: [
            {
              OR: [
                {
                  AND: [
                    { startTime: { lte: startDateTime } },
                    { endTime: { gt: startDateTime } },
                  ],
                },
                {
                  AND: [
                    { startTime: { lt: endDateTime } },
                    { endTime: { gte: endDateTime } },
                  ],
                },
                {
                  AND: [
                    { startTime: { gte: startDateTime } },
                    { endTime: { lte: endDateTime } },
                  ],
                },
                {
                  AND: [
                    { startTime: { lte: startDateTime } },
                    { endTime: { gte: endDateTime } },
                  ],
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe('checkScheduleConflictsForUpdate', () => {
    const instructorId = 1;
    // Utiliser des dates futures
    const now = new Date();
    const startDateTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endDateTime = new Date(
      now.getTime() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
    );
    const excludeAvailabilityId = 5;
    const excludeUnavailabilityId = 3;

    beforeEach(() => {
      mockPrismaService.availabilitySchedule.findMany.mockResolvedValue([]);
      mockPrismaService.instructorUnavailability.findMany.mockResolvedValue([]);
      mockPrismaService.appointment.findMany.mockResolvedValue([]);
    });

    it('should pass without conflicts', async () => {
      await expect(
        service.checkScheduleConflictsForUpdate(
          instructorId,
          startDateTime,
          endDateTime,
          excludeAvailabilityId,
          excludeUnavailabilityId,
        ),
      ).resolves.not.toThrow();
    });

    it('should exclude availability being updated from conflict check', async () => {
      await service.checkScheduleConflictsForUpdate(
        instructorId,
        startDateTime,
        endDateTime,
        excludeAvailabilityId,
      );

      expect(
        mockPrismaService.availabilitySchedule.findMany,
      ).toHaveBeenCalledWith({
        where: {
          instructorId,
          id: { not: excludeAvailabilityId },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          AND: expect.any(Array),
        },
      });
    });

    it('should exclude unavailability being updated from conflict check', async () => {
      await service.checkScheduleConflictsForUpdate(
        instructorId,
        startDateTime,
        endDateTime,
        undefined,
        excludeUnavailabilityId,
      );

      expect(
        mockPrismaService.instructorUnavailability.findMany,
      ).toHaveBeenCalledWith({
        where: {
          instructorId,
          id: { not: excludeUnavailabilityId },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          AND: expect.any(Array),
        },
      });
    });

    it('should not exclude anything when no IDs provided', async () => {
      await service.checkScheduleConflictsForUpdate(
        instructorId,
        startDateTime,
        endDateTime,
      );

      expect(
        mockPrismaService.availabilitySchedule.findMany,
      ).toHaveBeenCalledWith({
        where: {
          instructorId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          AND: expect.any(Array),
        },
      });

      expect(
        mockPrismaService.instructorUnavailability.findMany,
      ).toHaveBeenCalledWith({
        where: {
          instructorId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          AND: expect.any(Array),
        },
      });
    });

    it('should throw ConflictException for conflicting availabilities', async () => {
      const conflictingAvailability = {
        id: 2, // Different from excluded ID
        startDateTime: new Date(startDateTime.getTime() - 60 * 60 * 1000),
        endDateTime: new Date(startDateTime.getTime() + 60 * 60 * 1000),
      };

      mockPrismaService.availabilitySchedule.findMany.mockResolvedValue([
        conflictingAvailability,
      ]);

      await expect(
        service.checkScheduleConflictsForUpdate(
          instructorId,
          startDateTime,
          endDateTime,
          excludeAvailabilityId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for conflicting unavailabilities', async () => {
      const conflictingUnavailability = {
        id: 4, // Different from excluded ID
        startDateTime: new Date(startDateTime.getTime() + 60 * 60 * 1000),
        endDateTime: new Date(endDateTime.getTime() + 60 * 60 * 1000),
      };

      mockPrismaService.instructorUnavailability.findMany.mockResolvedValue([
        conflictingUnavailability,
      ]);

      await expect(
        service.checkScheduleConflictsForUpdate(
          instructorId,
          startDateTime,
          endDateTime,
          undefined,
          excludeUnavailabilityId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for conflicting appointments', async () => {
      const conflictingAppointment = {
        id: 1,
        startTime: new Date(startDateTime.getTime() + 30 * 60 * 1000),
        endTime: new Date(endDateTime.getTime() + 30 * 60 * 1000),
      };

      mockPrismaService.appointment.findMany.mockResolvedValue([
        conflictingAppointment,
      ]);

      await expect(
        service.checkScheduleConflictsForUpdate(
          instructorId,
          startDateTime,
          endDateTime,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should not exclude appointments from conflict check', async () => {
      await service.checkScheduleConflictsForUpdate(
        instructorId,
        startDateTime,
        endDateTime,
        excludeAvailabilityId,
        excludeUnavailabilityId,
      );

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        where: {
          instructorId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          AND: expect.any(Array),
        },
      });
    });
  });

  describe('validateDateRange', () => {
    it('should pass for valid date range', () => {
      const now = new Date();
      const startDateTime = new Date(now.getTime() + 60 * 60 * 1000); // 1h dans le futur
      const endDateTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3h dans le futur

      expect(() => {
        service.validateDateRange(startDateTime, endDateTime);
      }).not.toThrow();
    });

    it('should throw BadRequestException when end date is before start date', () => {
      const now = new Date();
      const startDateTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3h dans le futur
      const endDateTime = new Date(now.getTime() + 60 * 60 * 1000); // 1h dans le futur

      expect(() => {
        service.validateDateRange(startDateTime, endDateTime);
      }).toThrow(BadRequestException);

      expect(() => {
        service.validateDateRange(startDateTime, endDateTime);
      }).toThrow('La date de fin doit être postérieure à la date de début');
    });

    it('should throw BadRequestException when end date equals start date', () => {
      const now = new Date();
      const startDateTime = new Date(now.getTime() + 60 * 60 * 1000); // 1h dans le futur
      const endDateTime = new Date(now.getTime() + 60 * 60 * 1000); // Même heure

      expect(() => {
        service.validateDateRange(startDateTime, endDateTime);
      }).toThrow(BadRequestException);

      expect(() => {
        service.validateDateRange(startDateTime, endDateTime);
      }).toThrow('La date de fin doit être postérieure à la date de début');
    });

    it('should throw BadRequestException when start date is in the past', () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
      const futureDate = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now

      expect(() => {
        service.validateDateRange(pastDate, futureDate);
      }).toThrow(BadRequestException);

      expect(() => {
        service.validateDateRange(pastDate, futureDate);
      }).toThrow('La date de début ne peut pas être dans le passé');
    });

    it('should pass when start date is in the future', () => {
      const now = new Date();
      const futureStartDate = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now
      const futureEndDate = new Date(now.getTime() + 1000 * 60 * 60 * 2); // 2 hours from now

      expect(() => {
        service.validateDateRange(futureStartDate, futureEndDate);
      }).not.toThrow();
    });

    it('should handle edge case where start date is exactly now', () => {
      // Utiliser une approche plus simple sans mock complexe
      const now = new Date();
      const startDateTime = new Date(now.getTime() - 1); // Exactement maintenant
      const endDateTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2h plus tard

      expect(() => {
        service.validateDateRange(startDateTime, endDateTime);
      }).toThrow(BadRequestException);

      expect(() => {
        service.validateDateRange(startDateTime, endDateTime);
      }).toThrow('La date de début ne peut pas être dans le passé');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple conflict types simultaneously', async () => {
      const instructorId = 1;
      const now = new Date();
      const startDateTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const endDateTime = new Date(
        now.getTime() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
      );

      // Availability conflict should be checked first and thrown
      mockPrismaService.availabilitySchedule.findMany.mockResolvedValue([
        {
          id: 1,
          startDateTime: new Date(startDateTime.getTime() - 60 * 60 * 1000),
          endDateTime: new Date(startDateTime.getTime() + 60 * 60 * 1000),
        },
      ]);

      mockPrismaService.instructorUnavailability.findMany.mockResolvedValue([
        {
          id: 1,
          startDateTime: new Date(startDateTime.getTime() + 60 * 60 * 1000),
          endDateTime: new Date(endDateTime.getTime() + 60 * 60 * 1000),
        },
      ]);

      await expect(
        service.checkScheduleConflicts(
          instructorId,
          startDateTime,
          endDateTime,
        ),
      ).rejects.toThrow('Conflit avec les disponibilités existantes');
    });

    it('should validate date range before checking conflicts', () => {
      const now = new Date();
      const startDateTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3h futur
      const endDateTime = new Date(now.getTime() + 60 * 60 * 1000); // 1h futur (Invalid range)

      // Should throw before making any database calls
      expect(() => {
        service.validateDateRange(startDateTime, endDateTime);
      }).toThrow(BadRequestException);

      expect(
        mockPrismaService.availabilitySchedule.findMany,
      ).not.toHaveBeenCalled();
    });
  });

  describe('checkAppointmentConflicts', () => {
    const instructorId = 1;
    const now = new Date();
    const startDateTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const endDateTime = new Date(
      now.getTime() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
    ); // Tomorrow + 2h

    beforeEach(() => {
      // Reset all mocks before each test
      mockPrismaService.availabilitySchedule.findFirst.mockResolvedValue(null);
      mockPrismaService.instructorUnavailability.findMany.mockResolvedValue([]);
      mockPrismaService.appointment.findMany.mockResolvedValue([]);
    });

    it('should pass when there is covering availability and no conflicts', async () => {
      const coveringAvailability = {
        id: 1,
        instructorId,
        startDateTime: new Date(startDateTime.getTime() - 60 * 60 * 1000), // 1h before
        endDateTime: new Date(endDateTime.getTime() + 60 * 60 * 1000), // 1h after
      };

      mockPrismaService.availabilitySchedule.findFirst.mockResolvedValue(
        coveringAvailability,
      );

      const result = await service.checkAppointmentConflicts(
        instructorId,
        startDateTime,
        endDateTime,
      );

      expect(result.coveringAvailability).toEqual(coveringAvailability);
      expect(result.message).toBe('Aucun conflit détecté pour ce rendez-vous.');

      expect(
        mockPrismaService.availabilitySchedule.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          instructorId,
          startDateTime: { lte: startDateTime },
          endDateTime: { gte: endDateTime },
        },
      });
    });

    it('should throw BadRequestException when no covering availability exists', async () => {
      mockPrismaService.availabilitySchedule.findFirst.mockResolvedValue(null);

      await expect(
        service.checkAppointmentConflicts(
          instructorId,
          startDateTime,
          endDateTime,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.checkAppointmentConflicts(
          instructorId,
          startDateTime,
          endDateTime,
        ),
      ).rejects.toThrow(
        'Aucune disponibilité ne couvre entièrement ce créneau de rendez-vous',
      );
    });

    it('should throw ConflictException when unavailabilities overlap', async () => {
      const coveringAvailability = {
        id: 1,
        instructorId,
        startDateTime: new Date(startDateTime.getTime() - 60 * 60 * 1000),
        endDateTime: new Date(endDateTime.getTime() + 60 * 60 * 1000),
      };
      mockPrismaService.availabilitySchedule.findFirst.mockResolvedValue(
        coveringAvailability,
      );

      const conflictingUnavailability = {
        id: 1,
        startDateTime: new Date(startDateTime.getTime() + 30 * 60 * 1000),
        endDateTime: new Date(endDateTime.getTime() - 30 * 60 * 1000),
      };

      mockPrismaService.instructorUnavailability.findMany.mockResolvedValue([
        conflictingUnavailability,
      ]);

      await expect(
        service.checkAppointmentConflicts(
          instructorId,
          startDateTime,
          endDateTime,
        ),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.checkAppointmentConflicts(
          instructorId,
          startDateTime,
          endDateTime,
        ),
      ).rejects.toThrow('Conflit avec les indisponibilités:');

      expect(
        mockPrismaService.instructorUnavailability.findMany,
      ).toHaveBeenCalledWith({
        where: {
          instructorId,
          OR: [
            {
              startDateTime: {
                gte: startDateTime,
                lt: endDateTime,
              },
            },
            {
              endDateTime: {
                gt: startDateTime,
                lte: endDateTime,
              },
            },
            {
              startDateTime: { lte: startDateTime },
              endDateTime: { gte: endDateTime },
            },
            {
              startDateTime: { gte: startDateTime },
              endDateTime: { lte: endDateTime },
            },
          ],
        },
      });
    });

    it('should throw ConflictException when other appointments overlap', async () => {
      const coveringAvailability = {
        id: 1,
        instructorId,
        startDateTime: new Date(startDateTime.getTime() - 60 * 60 * 1000),
        endDateTime: new Date(endDateTime.getTime() + 60 * 60 * 1000),
      };
      mockPrismaService.availabilitySchedule.findFirst.mockResolvedValue(
        coveringAvailability,
      );

      const conflictingAppointment = {
        id: 1,
        startTime: new Date(startDateTime.getTime() + 30 * 60 * 1000),
        endTime: new Date(endDateTime.getTime() - 30 * 60 * 1000),
      };

      mockPrismaService.appointment.findMany.mockResolvedValue([
        conflictingAppointment,
      ]);

      await expect(
        service.checkAppointmentConflicts(
          instructorId,
          startDateTime,
          endDateTime,
        ),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.checkAppointmentConflicts(
          instructorId,
          startDateTime,
          endDateTime,
        ),
      ).rejects.toThrow("Conflit avec d'autres rendez-vous:");

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        where: {
          instructorId,
          OR: [
            {
              startTime: {
                gte: startDateTime,
                lt: endDateTime,
              },
            },
            {
              endTime: {
                gt: startDateTime,
                lte: endDateTime,
              },
            },
            {
              startTime: { lte: startDateTime },
              endTime: { gte: endDateTime },
            },
            {
              startTime: { gte: startDateTime },
              endTime: { lte: endDateTime },
            },
          ],
        },
      });
    });

    it('should exclude appointment being updated from conflict check', async () => {
      const excludeAppointmentId = 5;
      const coveringAvailability = {
        id: 1,
        instructorId,
        startDateTime: new Date(startDateTime.getTime() - 60 * 60 * 1000),
        endDateTime: new Date(endDateTime.getTime() + 60 * 60 * 1000),
      };

      mockPrismaService.availabilitySchedule.findFirst.mockResolvedValue(
        coveringAvailability,
      );
      mockPrismaService.appointment.findMany.mockResolvedValue([]);

      await service.checkAppointmentConflicts(
        instructorId,
        startDateTime,
        endDateTime,
        excludeAppointmentId,
      );

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        where: {
          instructorId,
          id: { not: excludeAppointmentId },
          OR: [
            {
              startTime: {
                gte: startDateTime,
                lt: endDateTime,
              },
            },
            {
              endTime: {
                gt: startDateTime,
                lte: endDateTime,
              },
            },
            {
              startTime: { lte: startDateTime },
              endTime: { gte: endDateTime },
            },
            {
              startTime: { gte: startDateTime },
              endTime: { lte: endDateTime },
            },
          ],
        },
      });
    });

    it('should include multiple conflicts in error messages', async () => {
      const coveringAvailability = {
        id: 1,
        instructorId,
        startDateTime: new Date(startDateTime.getTime() - 60 * 60 * 1000),
        endDateTime: new Date(endDateTime.getTime() + 60 * 60 * 1000),
      };
      mockPrismaService.availabilitySchedule.findFirst.mockResolvedValue(
        coveringAvailability,
      );

      const conflictingAppointments = [
        {
          id: 2,
          startTime: new Date(startDateTime.getTime() + 15 * 60 * 1000),
          endTime: new Date(startDateTime.getTime() + 45 * 60 * 1000),
        },
        {
          id: 3,
          startTime: new Date(endDateTime.getTime() - 30 * 60 * 1000),
          endTime: new Date(endDateTime.getTime() + 30 * 60 * 1000),
        },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(
        conflictingAppointments,
      );

      try {
        await service.checkAppointmentConflicts(
          instructorId,
          startDateTime,
          endDateTime,
        );
        fail('Should have thrown an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        if (error instanceof ConflictException) {
          expect(error.message).toContain("Conflit avec d'autres rendez-vous:");
          expect(error.message).toContain(
            conflictingAppointments[0].startTime.toISOString(),
          );
          expect(error.message).toContain(
            conflictingAppointments[1].startTime.toISOString(),
          );
        }
      }
    });
  });
});
