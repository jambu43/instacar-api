import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { AcceptRideDto } from './dto/accept-ride.dto';
import { UpdateRideStatusDto, RideStatus } from './dto/update-ride-status.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createRide(createRideDto: CreateRideDto) {
    try {
      this.logger.log(
        `Création d'une nouvelle course pour le passager ${createRideDto.passengerId}`,
      );

      // Vérifier si le passager existe
      const passenger = await this.prisma.user.findUnique({
        where: { id: createRideDto.passengerId },
      });

      if (!passenger) {
        throw new NotFoundException('Passager non trouvé');
      }

      // Vérifier si le passager a déjà une course en cours
      const activeRide = await this.prisma.ride.findFirst({
        where: {
          passengerId: createRideDto.passengerId,
          status: {
            in: [
              'REQUESTED',
              'SEARCHING',
              'ACCEPTED',
              'ARRIVING',
              'IN_PROGRESS',
            ],
          },
        },
      });

      if (activeRide) {
        throw new ConflictException('Vous avez déjà une course en cours');
      }

      // Calculer la distance si non fournie
      let distance = createRideDto.distance;
      if (!distance) {
        distance = this.calculateDistance(
          createRideDto.pickupLat,
          createRideDto.pickupLng,
          createRideDto.dropoffLat,
          createRideDto.dropoffLng,
        );
      }

      // Créer la course
      const ride = await this.prisma.ride.create({
        data: {
          passengerId: createRideDto.passengerId,
          pickupLat: createRideDto.pickupLat,
          pickupLng: createRideDto.pickupLng,
          pickupAddress: createRideDto.pickupAddress,
          dropoffLat: createRideDto.dropoffLat,
          dropoffLng: createRideDto.dropoffLng,
          dropoffAddress: createRideDto.dropoffAddress,
          distance: distance,
          duration: createRideDto.duration,
          price: createRideDto.price,
          status: 'REQUESTED',
        },
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      this.logger.log(`Course créée avec succès: ID ${ride.id}`);

      return {
        success: true,
        message: 'Course créée avec succès',
        ride: {
          id: ride.id,
          status: ride.status,
          pickupAddress: ride.pickupAddress,
          dropoffAddress: ride.dropoffAddress,
          distance: ride.distance,
          duration: ride.duration,
          price: ride.price,
          requestedAt: ride.requestedAt,
          passenger: ride.passenger,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création de la course: ${error.message}`,
      );
      throw error;
    }
  }

  async acceptRide(rideId: number, acceptRideDto: AcceptRideDto) {
    try {
      this.logger.log(
        `Tentative d'acceptation de la course ${rideId} par le chauffeur ${acceptRideDto.driverId}`,
      );

      // Vérifier si la course existe
      const ride = await this.prisma.ride.findUnique({
        where: { id: rideId },
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      if (!ride) {
        throw new NotFoundException('Course non trouvée');
      }

      // Vérifier le statut de la course
      if (ride.status !== 'REQUESTED' && ride.status !== 'SEARCHING') {
        throw new ConflictException(
          `La course ne peut pas être acceptée (statut: ${ride.status})`,
        );
      }

      // Vérifier si le chauffeur existe et est disponible
      const driver = await this.prisma.driver.findUnique({
        where: { id: acceptRideDto.driverId },
        include: {
          vehicle: true,
        },
      });

      if (!driver) {
        throw new NotFoundException('Chauffeur non trouvé');
      }

      if (!driver.isAvailable) {
        throw new ConflictException("Le chauffeur n'est pas disponible");
      }

      if (!driver.isRegistrationComplete) {
        throw new ConflictException(
          "L'inscription du chauffeur n'est pas complète",
        );
      }

      // Vérifier si le chauffeur a déjà une course en cours
      const activeDriverRide = await this.prisma.ride.findFirst({
        where: {
          driverId: acceptRideDto.driverId,
          status: {
            in: ['ACCEPTED', 'ARRIVING', 'IN_PROGRESS'],
          },
        },
      });

      if (activeDriverRide) {
        throw new ConflictException('Le chauffeur a déjà une course en cours');
      }

      // Mettre à jour la position du chauffeur si fournie
      if (acceptRideDto.currentLat && acceptRideDto.currentLng) {
        await this.prisma.driver.update({
          where: { id: acceptRideDto.driverId },
          data: {
            currentLat: acceptRideDto.currentLat,
            currentLng: acceptRideDto.currentLng,
            lastLocationUpdate: new Date(),
          },
        });
      }

      // Accepter la course
      const updatedRide = await this.prisma.ride.update({
        where: { id: rideId },
        data: {
          driverId: acceptRideDto.driverId,
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          driver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              profilePhoto: true,
              rating: true,
              vehicle: {
                select: {
                  id: true,
                  brand: true,
                  model: true,
                  color: true,
                  plateNumber: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(
        `Course ${rideId} acceptée par le chauffeur ${acceptRideDto.driverId}`,
      );

      return {
        success: true,
        message: 'Course acceptée avec succès',
        ride: {
          id: updatedRide.id,
          status: updatedRide.status,
          pickupAddress: updatedRide.pickupAddress,
          dropoffAddress: updatedRide.dropoffAddress,
          distance: updatedRide.distance,
          duration: updatedRide.duration,
          price: updatedRide.price,
          requestedAt: updatedRide.requestedAt,
          acceptedAt: updatedRide.acceptedAt,
          passenger: updatedRide.passenger,
          driver: updatedRide.driver,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'acceptation de la course: ${error.message}`,
      );
      throw error;
    }
  }

  async updateRideStatus(
    rideId: number,
    updateRideStatusDto: UpdateRideStatusDto,
  ) {
    try {
      this.logger.log(
        `Mise à jour du statut de la course ${rideId} vers ${updateRideStatusDto.status}`,
      );

      // Vérifier si la course existe
      const ride = await this.prisma.ride.findUnique({
        where: { id: rideId },
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          driver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
        },
      });

      if (!ride) {
        throw new NotFoundException('Course non trouvée');
      }

      // Validation des transitions de statut
      this.validateStatusTransition(ride.status, updateRideStatusDto.status);

      // Préparer les données de mise à jour
      const updateData: any = {
        status: updateRideStatusDto.status,
      };

      // Ajouter les timestamps appropriés
      switch (updateRideStatusDto.status) {
        case 'ARRIVING':
          updateData.startedAt = new Date();
          break;
        case 'IN_PROGRESS':
          updateData.startedAt = new Date();
          break;
        case 'COMPLETED':
          updateData.completedAt = new Date();
          break;
        case 'CANCELLED':
          updateData.cancelledAt = new Date();
          updateData.cancelReason = updateRideStatusDto.cancelReason;
          break;
      }

      // Mettre à jour la course
      const updatedRide = await this.prisma.ride.update({
        where: { id: rideId },
        data: updateData,
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          driver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              vehicle: {
                select: {
                  id: true,
                  brand: true,
                  model: true,
                  color: true,
                  plateNumber: true,
                },
              },
            },
          },
        },
      });

      // Si la course est terminée, mettre à jour les statistiques du chauffeur
      if (updateRideStatusDto.status === 'COMPLETED' && ride.driverId) {
        await this.updateDriverStats(ride.driverId);
      }

      this.logger.log(
        `Statut de la course ${rideId} mis à jour vers ${updateRideStatusDto.status}`,
      );

      return {
        success: true,
        message: `Statut de la course mis à jour vers ${updateRideStatusDto.status}`,
        ride: {
          id: updatedRide.id,
          status: updatedRide.status,
          pickupAddress: updatedRide.pickupAddress,
          dropoffAddress: updatedRide.dropoffAddress,
          distance: updatedRide.distance,
          duration: updatedRide.duration,
          price: updatedRide.price,
          requestedAt: updatedRide.requestedAt,
          acceptedAt: updatedRide.acceptedAt,
          startedAt: updatedRide.startedAt,
          completedAt: updatedRide.completedAt,
          cancelledAt: updatedRide.cancelledAt,
          cancelReason: updatedRide.cancelReason,
          passenger: updatedRide.passenger,
          driver: updatedRide.driver,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour du statut: ${error.message}`,
      );
      throw error;
    }
  }

  async getRideById(rideId: number) {
    try {
      const ride = await this.prisma.ride.findUnique({
        where: { id: rideId },
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
              phone: true,
              profilePhoto: true,
            },
          },
          driver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              profilePhoto: true,
              rating: true,
              vehicle: {
                select: {
                  id: true,
                  brand: true,
                  model: true,
                  color: true,
                  plateNumber: true,
                },
              },
            },
          },
        },
      });

      if (!ride) {
        throw new NotFoundException('Course non trouvée');
      }

      return {
        success: true,
        ride: {
          id: ride.id,
          status: ride.status,
          pickupLat: ride.pickupLat,
          pickupLng: ride.pickupLng,
          pickupAddress: ride.pickupAddress,
          dropoffLat: ride.dropoffLat,
          dropoffLng: ride.dropoffLng,
          dropoffAddress: ride.dropoffAddress,
          distance: ride.distance,
          duration: ride.duration,
          price: ride.price,
          requestedAt: ride.requestedAt,
          acceptedAt: ride.acceptedAt,
          startedAt: ride.startedAt,
          completedAt: ride.completedAt,
          cancelledAt: ride.cancelledAt,
          cancelReason: ride.cancelReason,
          passenger: ride.passenger,
          driver: ride.driver,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération de la course: ${error.message}`,
      );
      throw error;
    }
  }

  async getRidesByPassenger(passengerId: number) {
    try {
      const rides = await this.prisma.ride.findMany({
        where: { passengerId },
        include: {
          driver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              profilePhoto: true,
              rating: true,
              vehicle: {
                select: {
                  id: true,
                  brand: true,
                  model: true,
                  color: true,
                  plateNumber: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        rides: rides.map((ride) => ({
          id: ride.id,
          status: ride.status,
          pickupAddress: ride.pickupAddress,
          dropoffAddress: ride.dropoffAddress,
          distance: ride.distance,
          duration: ride.duration,
          price: ride.price,
          requestedAt: ride.requestedAt,
          acceptedAt: ride.acceptedAt,
          startedAt: ride.startedAt,
          completedAt: ride.completedAt,
          cancelledAt: ride.cancelledAt,
          driver: ride.driver,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des courses du passager: ${error.message}`,
      );
      throw error;
    }
  }

  async getRidesByDriver(driverId: number) {
    try {
      const rides = await this.prisma.ride.findMany({
        where: { driverId },
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
              phone: true,
              profilePhoto: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        rides: rides.map((ride) => ({
          id: ride.id,
          status: ride.status,
          pickupAddress: ride.pickupAddress,
          dropoffAddress: ride.dropoffAddress,
          distance: ride.distance,
          duration: ride.duration,
          price: ride.price,
          requestedAt: ride.requestedAt,
          acceptedAt: ride.acceptedAt,
          startedAt: ride.startedAt,
          completedAt: ride.completedAt,
          cancelledAt: ride.cancelledAt,
          passenger: ride.passenger,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des courses du chauffeur: ${error.message}`,
      );
      throw error;
    }
  }

  async getAvailableRides() {
    try {
      const rides = await this.prisma.ride.findMany({
        where: {
          status: {
            in: ['REQUESTED', 'SEARCHING'],
          },
        },
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { requestedAt: 'asc' },
      });

      return {
        success: true,
        rides: rides.map((ride) => ({
          id: ride.id,
          status: ride.status,
          pickupAddress: ride.pickupAddress,
          dropoffAddress: ride.dropoffAddress,
          distance: ride.distance,
          duration: ride.duration,
          price: ride.price,
          requestedAt: ride.requestedAt,
          passenger: ride.passenger,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des courses disponibles: ${error.message}`,
      );
      throw error;
    }
  }

  private validateStatusTransition(currentStatus: string, newStatus: string) {
    const validTransitions: { [key: string]: string[] } = {
      REQUESTED: ['SEARCHING', 'ACCEPTED', 'CANCELLED'],
      SEARCHING: ['ACCEPTED', 'CANCELLED'],
      ACCEPTED: ['ARRIVING', 'CANCELLED'],
      ARRIVING: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Transition de statut invalide: ${currentStatus} -> ${newStatus}`,
      );
    }
  }

  private async updateDriverStats(driverId: number) {
    try {
      // Compter le nombre total de courses
      const totalRides = await this.prisma.ride.count({
        where: {
          driverId,
          status: 'COMPLETED',
        },
      });

      // Calculer la note moyenne (à implémenter avec les reviews)
      const averageRating = 0; // TODO: Calculer avec les reviews

      // Mettre à jour les statistiques du chauffeur
      await this.prisma.driver.update({
        where: { id: driverId },
        data: {
          totalRides,
          rating: averageRating,
        },
      });

      this.logger.log(`Statistiques du chauffeur ${driverId} mises à jour`);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour des statistiques: ${error.message}`,
      );
    }
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100; // Arrondir à 2 décimales
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
