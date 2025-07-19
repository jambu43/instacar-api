import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  image?: string;
  badge?: number;
  sound?: string;
  priority?: 'high' | 'normal';
  ttl?: number;
  channelId?: string;
}

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async registerToken(
    userId: number,
    registerTokenDto: RegisterTokenDto,
  ): Promise<{ success: boolean; message: string }> {
    const { token, platform, deviceId } = registerTokenDto;

    // Vérifier si le token existe déjà
    const existingToken = await this.prisma.pushToken.findFirst({
      where: {
        OR: [
          { token },
          { deviceId: deviceId || null },
        ],
      },
    });

    if (existingToken) {
      // Mettre à jour le token existant
      await this.prisma.pushToken.update({
        where: { id: existingToken.id },
        data: {
          token,
          platform,
          deviceId,
          isActive: true,
          lastUsed: new Date(),
        },
      });

      this.logger.log(`Token mis à jour pour l'utilisateur ${userId}`);
    } else {
      // Créer un nouveau token
      await this.prisma.pushToken.create({
        data: {
          userId,
          token,
          platform,
          deviceId,
          isActive: true,
          lastUsed: new Date(),
        },
      });

      this.logger.log(`Nouveau token enregistré pour l'utilisateur ${userId}`);
    }

    return {
      success: true,
      message: 'Token enregistré avec succès',
    };
  }

  async sendNotification(
    sendNotificationDto: SendNotificationDto,
  ): Promise<{ success: boolean; message: string; sentCount: number }> {
    const {
      userIds,
      title,
      body,
      data,
      image,
      badge,
      sound,
      priority = 'normal',
      ttl = 3600,
      channelId,
    } = sendNotificationDto;

    let sentCount = 0;

    for (const userId of userIds) {
      try {
        const tokens = await this.prisma.pushToken.findMany({
          where: {
            userId,
            isActive: true,
          },
          include: {
            user: {
              include: {
                notificationPreferences: true,
              },
            },
          },
        });

        for (const tokenData of tokens) {
          // Vérifier les préférences de notification
          const preferences = tokenData.user.notificationPreferences;
          if (preferences && !preferences.enablePushNotifications) {
            continue;
          }

          const notificationData: PushNotificationData = {
            title,
            body,
            data,
            image,
            badge,
            sound,
            priority,
            ttl,
            channelId,
          };

          // Envoyer la notification (simulation pour l'instant)
          const success = await this.sendToDevice(
            tokenData.token,
            notificationData,
            tokenData.platform,
          );

          if (success) {
            sentCount++;
            this.logger.log(
              `Notification envoyée à l'utilisateur ${userId} via ${tokenData.platform}`,
            );
          }

          // Mettre à jour le timestamp d'utilisation
          await this.prisma.pushToken.update({
            where: { id: tokenData.id },
            data: { lastUsed: new Date() },
          });
        }
      } catch (error) {
        this.logger.error(
          `Erreur lors de l'envoi de notification à l'utilisateur ${userId}:`,
          error,
        );
      }
    }

    // Émettre un événement pour les WebSockets
    this.eventEmitter.emit('notification.sent', {
      userIds,
      title,
      body,
      sentCount,
    });

    return {
      success: true,
      message: `${sentCount} notifications envoyées avec succès`,
      sentCount,
    };
  }

  async sendToUser(
    userId: number,
    notificationData: PushNotificationData,
  ): Promise<boolean> {
    const tokens = await this.prisma.pushToken.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    let success = false;
    for (const token of tokens) {
      try {
        const result = await this.sendToDevice(
          token.token,
          notificationData,
          token.platform,
        );
        if (result) {
          success = true;
        }
      } catch (error) {
        this.logger.error(
          `Erreur lors de l'envoi à l'utilisateur ${userId}:`,
          error,
        );
      }
    }

    return success;
  }

  async sendToDrivers(
    driverIds: number[],
    notificationData: PushNotificationData,
  ): Promise<{ success: boolean; sentCount: number }> {
    let sentCount = 0;

    for (const driverId of driverIds) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
        include: {
          user: {
            include: {
              pushTokens: {
                where: { isActive: true },
              },
              notificationPreferences: true,
            },
          },
        },
      });

      if (!driver || !driver.user) continue;

      // Vérifier les préférences
      const preferences = driver.user.notificationPreferences;
      if (preferences && !preferences.enablePushNotifications) {
        continue;
      }

      for (const token of driver.user.pushTokens) {
        try {
          const success = await this.sendToDevice(
            token.token,
            notificationData,
            token.platform,
          );
          if (success) {
            sentCount++;
          }
        } catch (error) {
          this.logger.error(
            `Erreur lors de l'envoi au chauffeur ${driverId}:`,
            error,
          );
        }
      }
    }

    return {
      success: sentCount > 0,
      sentCount,
    };
  }

  async sendToNearbyDrivers(
    latitude: number,
    longitude: number,
    radius: number,
    notificationData: PushNotificationData,
  ): Promise<{ success: boolean; sentCount: number }> {
    // Calculer les bornes de la zone
    const latDelta = radius / 111.32;
    const lonDelta = radius / (111.32 * Math.cos(latitude * (Math.PI / 180)));

    const minLat = latitude - latDelta;
    const maxLat = latitude + latDelta;
    const minLon = longitude - lonDelta;
    const maxLon = longitude + lonDelta;

    // Trouver les chauffeurs dans la zone
    const drivers = await this.prisma.driver.findMany({
      where: {
        isAvailable: true,
        isRegistrationComplete: true,
        location: {
          latitude: { gte: minLat, lte: maxLat },
          longitude: { gte: minLon, lte: maxLon },
        },
      },
      include: {
        user: {
          include: {
            pushTokens: {
              where: { isActive: true },
            },
            notificationPreferences: true,
          },
        },
      },
    });

    let sentCount = 0;

    for (const driver of drivers) {
      // Vérifier les préférences
      const preferences = driver.user.notificationPreferences;
      if (preferences && !preferences.enablePushNotifications) {
        continue;
      }

      for (const token of driver.user.pushTokens) {
        try {
          const success = await this.sendToDevice(
            token.token,
            notificationData,
            token.platform,
          );
          if (success) {
            sentCount++;
          }
        } catch (error) {
          this.logger.error(
            `Erreur lors de l'envoi au chauffeur ${driver.id}:`,
            error,
          );
        }
      }
    }

    return {
      success: sentCount > 0,
      sentCount,
    };
  }

  async updatePreferences(
    userId: number,
    updatePreferencesDto: UpdatePreferencesDto,
  ): Promise<{ success: boolean; message: string }> {
    const {
      enablePushNotifications,
      enableRideNotifications,
      enablePromotionalNotifications,
      quietHoursStart,
      quietHoursEnd,
    } = updatePreferencesDto;

    await this.prisma.notificationPreferences.upsert({
      where: { userId },
      update: {
        enablePushNotifications,
        enableRideNotifications,
        enablePromotionalNotifications,
        quietHoursStart,
        quietHoursEnd,
      },
      create: {
        userId,
        enablePushNotifications,
        enableRideNotifications,
        enablePromotionalNotifications,
        quietHoursStart,
        quietHoursEnd,
      },
    });

    this.logger.log(`Préférences mises à jour pour l'utilisateur ${userId}`);

    return {
      success: true,
      message: 'Préférences mises à jour avec succès',
    };
  }

  async unregisterToken(token: string): Promise<{ success: boolean; message: string }> {
    await this.prisma.pushToken.updateMany({
      where: { token },
      data: { isActive: false },
    });

    this.logger.log(`Token désactivé: ${token}`);

    return {
      success: true,
      message: 'Token désactivé avec succès',
    };
  }

  async getTokenStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    tokensByPlatform: Record<string, number>;
  }> {
    const totalTokens = await this.prisma.pushToken.count();
    const activeTokens = await this.prisma.pushToken.count({
      where: { isActive: true },
    });

    const tokensByPlatform = await this.prisma.pushToken.groupBy({
      by: ['platform'],
      _count: { platform: true },
      where: { isActive: true },
    });

    const platformStats: Record<string, number> = {};
    tokensByPlatform.forEach((item) => {
      platformStats[item.platform] = item._count.platform;
    });

    return {
      totalTokens,
      activeTokens,
      tokensByPlatform: platformStats,
    };
  }

  private async sendToDevice(
    token: string,
    notificationData: PushNotificationData,
    platform: string,
  ): Promise<boolean> {
    // Simulation d'envoi de notification
    // En production, utilisez Firebase Cloud Messaging (FCM) ou Apple Push Notification Service (APNS)
    
    try {
      // Simuler un délai d'envoi
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Simuler un taux de succès de 95%
      const success = Math.random() > 0.05;

      if (success) {
        this.logger.debug(
          `Notification simulée envoyée à ${platform}: ${notificationData.title}`,
        );
      } else {
        this.logger.warn(`Échec simulé pour ${platform}: ${token}`);
      }

      return success;
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi à ${platform}:`, error);
      return false;
    }
  }
}
