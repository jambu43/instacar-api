import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationType } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: createNotificationDto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        ride: {
          select: {
            id: true,
            pickupAddress: true,
            dropoffAddress: true,
            status: true,
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

    // Émettre un événement pour les WebSockets
    this.eventEmitter.emit('notification.created', {
      userId: notification.userId,
      notification,
    });

    return notification;
  }

  async findAll(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      include: {
        ride: {
          select: {
            id: true,
            pickupAddress: true,
            dropoffAddress: true,
            status: true,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUnread(userId: number) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      include: {
        ride: {
          select: {
            id: true,
            pickupAddress: true,
            dropoffAddress: true,
            status: true,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    return this.prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        ride: {
          select: {
            id: true,
            pickupAddress: true,
            dropoffAddress: true,
            status: true,
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
  }

  async update(
    id: number,
    userId: number,
    updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        ...updateNotificationDto,
        ...(updateNotificationDto.isRead && { readAt: new Date() }),
      },
    });
  }

  async markAsRead(id: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async remove(id: number, userId: number) {
    return this.prisma.notification.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  // Méthodes utilitaires pour créer des notifications spécifiques
  async createRideRequestedNotification(passengerId: number, rideId: number) {
    return this.create({
      userId: passengerId,
      type: NotificationType.RIDE_REQUESTED,
      title: 'Course demandée',
      message:
        'Votre demande de course a été enregistrée. Nous recherchons un chauffeur...',
      rideId,
    });
  }

  async createRideAcceptedNotification(
    passengerId: number,
    driverId: number,
    rideId: number,
  ) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: { fullName: true },
    });

    if (!driver) {
      throw new Error('Chauffeur non trouvé');
    }

    return this.create({
      userId: passengerId,
      type: NotificationType.RIDE_ACCEPTED,
      title: 'Chauffeur trouvé !',
      message: `${driver.fullName} a accepté votre course. Il arrive dans quelques minutes.`,
      rideId,
      driverId,
    });
  }

  async createDriverArrivingNotification(
    passengerId: number,
    driverId: number,
    rideId: number,
  ) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: { fullName: true },
    });

    if (!driver) {
      throw new Error('Chauffeur non trouvé');
    }

    return this.create({
      userId: passengerId,
      type: NotificationType.DRIVER_ARRIVING,
      title: 'Chauffeur en route',
      message: `${driver.fullName} est en route vers votre point de prise en charge.`,
      rideId,
      driverId,
    });
  }

  async createRideStartedNotification(passengerId: number, rideId: number) {
    return this.create({
      userId: passengerId,
      type: NotificationType.RIDE_STARTED,
      title: 'Course commencée',
      message: 'Votre course a commencé. Bon voyage !',
      rideId,
    });
  }

  async createRideCompletedNotification(passengerId: number, rideId: number) {
    return this.create({
      userId: passengerId,
      type: NotificationType.RIDE_COMPLETED,
      title: 'Course terminée',
      message: "Votre course est terminée. N'oubliez pas de laisser un avis !",
      rideId,
    });
  }

  async createRideCancelledNotification(
    passengerId: number,
    rideId: number,
    reason?: string,
  ) {
    return this.create({
      userId: passengerId,
      type: NotificationType.RIDE_CANCELLED,
      title: 'Course annulée',
      message: reason || 'Votre course a été annulée.',
      rideId,
    });
  }
}
