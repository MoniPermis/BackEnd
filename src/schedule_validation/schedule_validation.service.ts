import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleValidationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Vérifie s'il y a des conflits de planning pour un moniteur
   */
  public async checkScheduleConflicts(
    instructorId: number,
    startDateTime: Date,
    endDateTime: Date,
  ) {
    // Vérifier les conflits avec les disponibilités existantes
    const conflictingAvailabilities =
      await this.prisma.availabilitySchedule.findMany({
        where: {
          instructorId,
          AND: [
            {
              OR: [
                // Nouveau créneau commence pendant un créneau existant
                {
                  AND: [
                    { startDateTime: { lte: startDateTime } },
                    { endDateTime: { gt: startDateTime } },
                  ],
                },
                // Nouveau créneau finit pendant un créneau existant
                {
                  AND: [
                    { startDateTime: { lt: endDateTime } },
                    { endDateTime: { gte: endDateTime } },
                  ],
                },
                // Nouveau créneau englobe un créneau existant
                {
                  AND: [
                    { startDateTime: { gte: startDateTime } },
                    { endDateTime: { lte: endDateTime } },
                  ],
                },
                // Créneau existant englobe le nouveau créneau
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

    // Vérifier les conflits avec les indisponibilités existantes
    const conflictingUnavailabilities =
      await this.prisma.instructorUnavailability.findMany({
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

    // Vérifier les conflits avec les rendez-vous confirmés
    const conflictingAppointments = await this.prisma.appointment.findMany({
      where: {
        instructorId,
        isAccepted: true,
        isValid: true,
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

    // Générer les messages d'erreur appropriés
    if (conflictingAvailabilities.length > 0) {
      const conflictDates = conflictingAvailabilities
        .map(
          (avail) =>
            `${avail.startDateTime.toISOString()} - ${avail.endDateTime.toISOString()}`,
        )
        .join(', ');

      throw new ConflictException(
        `Conflit avec les disponibilités existantes: ${conflictDates}`,
      );
    }

    if (conflictingUnavailabilities.length > 0) {
      const conflictDates = conflictingUnavailabilities
        .map(
          (unavail) =>
            `${unavail.startDateTime.toISOString()} - ${unavail.endDateTime.toISOString()}`,
        )
        .join(', ');

      throw new ConflictException(
        `Conflit avec les indisponibilités existantes: ${conflictDates}`,
      );
    }

    if (conflictingAppointments.length > 0) {
      const conflictDates = conflictingAppointments
        .map(
          (appt) =>
            `${appt.startTime.toISOString()} - ${appt.endTime.toISOString()}`,
        )
        .join(', ');

      throw new ConflictException(
        `Conflit avec les rendez-vous confirmés: ${conflictDates}`,
      );
    }
  }

  /**
   * Vérifie s'il y a des conflits de planning pour un moniteur, pour une mise à jour
   */
  public async checkScheduleConflictsForUpdate(
    instructorId: number,
    startDateTime: Date,
    endDateTime: Date,
    excludeAvailabilityId?: number, // ID de la disponibilité qu'on modifie
    excludeUnavailabilityId?: number, // ID de l'indisponibilité qu'on modifie
  ) {
    // Vérifier les conflits avec les disponibilités existantes
    // SAUF celle qu'on est en train de modifier
    const conflictingAvailabilities =
      await this.prisma.availabilitySchedule.findMany({
        where: {
          instructorId,
          ...(excludeAvailabilityId && {
            id: { not: excludeAvailabilityId },
          }),
          AND: [
            {
              OR: [
                // Nouveau créneau commence pendant un créneau existant
                {
                  AND: [
                    { startDateTime: { lte: startDateTime } },
                    { endDateTime: { gt: startDateTime } },
                  ],
                },
                // Nouveau créneau finit pendant un créneau existant
                {
                  AND: [
                    { startDateTime: { lt: endDateTime } },
                    { endDateTime: { gte: endDateTime } },
                  ],
                },
                // Nouveau créneau englobe un créneau existant
                {
                  AND: [
                    { startDateTime: { gte: startDateTime } },
                    { endDateTime: { lte: endDateTime } },
                  ],
                },
                // Créneau existant englobe le nouveau créneau
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

    // Vérifier les conflits avec les indisponibilités existantes
    // SAUF celle qu'on est en train de modifier
    const conflictingUnavailabilities =
      await this.prisma.instructorUnavailability.findMany({
        where: {
          instructorId,
          ...(excludeUnavailabilityId && {
            id: { not: excludeUnavailabilityId },
          }),
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

    // Vérifier les conflits avec les rendez-vous confirmés
    // (Pas d'exclusion ici, car on ne modifie pas les rendez-vous)
    const conflictingAppointments = await this.prisma.appointment.findMany({
      where: {
        instructorId,
        isAccepted: true,
        isValid: true,
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

    // Générer les messages d'erreur appropriés
    if (conflictingAvailabilities.length > 0) {
      const conflictDates = conflictingAvailabilities
        .map(
          (avail) =>
            `${avail.startDateTime.toISOString()} - ${avail.endDateTime.toISOString()}`,
        )
        .join(', ');

      throw new ConflictException(
        `Conflit avec les disponibilités existantes: ${conflictDates}`,
      );
    }

    if (conflictingUnavailabilities.length > 0) {
      const conflictDates = conflictingUnavailabilities
        .map(
          (unavail) =>
            `${unavail.startDateTime.toISOString()} - ${unavail.endDateTime.toISOString()}`,
        )
        .join(', ');

      throw new ConflictException(
        `Conflit avec les indisponibilités existantes: ${conflictDates}`,
      );
    }

    if (conflictingAppointments.length > 0) {
      const conflictDates = conflictingAppointments
        .map(
          (appt) =>
            `${appt.startTime.toISOString()} - ${appt.endTime.toISOString()}`,
        )
        .join(', ');

      throw new ConflictException(
        `Conflit avec les rendez-vous confirmés: ${conflictDates}`,
      );
    }
  }

  /**
   * Valide que la date de fin est après la date de début
   */
  public validateDateRange(startDateTime: Date, endDateTime: Date) {
    if (startDateTime >= endDateTime) {
      throw new BadRequestException(
        'La date de fin doit être postérieure à la date de début',
      );
    }

    // Vérifier que les dates ne sont pas dans le passé
    const now = new Date();
    if (startDateTime < now) {
      throw new BadRequestException(
        'La date de début ne peut pas être dans le passé',
      );
    }
  }
}
