import { Test, TestingModule } from '@nestjs/testing';
import { PushNotificationsService } from './push-notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Platform, NotificationType } from '@prisma/client';

describe('PushNotificationsService', () => {
  let service: PushNotificationsService;

  const mockPrismaService = {
    pushToken: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notificationPreferences: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushNotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<PushNotificationsService>(PushNotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerToken', () => {
    it('should register a push token', async () => {
      const registerTokenDto = {
        token: 'test-token-123',
        deviceId: 'device-123',
        platform: Platform.ANDROID,
      };

      mockPrismaService.pushToken.findFirst.mockResolvedValue(null);
      mockPrismaService.pushToken.create.mockResolvedValue({
        id: 1,
        userId: 1,
        ...registerTokenDto,
        isActive: true,
        lastUsed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.registerToken(1, registerTokenDto);

      expect(mockPrismaService.pushToken.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          ...registerTokenDto,
          isActive: true,
          lastUsed: expect.any(Date),
        },
      });
      expect(result).toEqual({
        success: true,
        message: 'Token enregistré avec succès',
      });
    });
  });

  describe('sendNotification', () => {
    it('should send a notification to users', async () => {
      const sendNotificationDto = {
        userIds: [1],
        title: 'Test Notification',
        body: 'This is a test notification',
        data: { key: 'value' },
        type: NotificationType.SYSTEM_MESSAGE,
      };

      const mockTokens = [
        {
          id: 1,
          token: 'token-1',
          platform: Platform.ANDROID,
          isActive: true,
          user: {
            notificationPreferences: {
              enablePushNotifications: true,
            },
          },
        },
      ];

      mockPrismaService.pushToken.findMany.mockResolvedValue(mockTokens);

      const result = await service.sendNotification(sendNotificationDto);

      expect(mockPrismaService.pushToken.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
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
      expect(result).toBeDefined();
    });
  });
});
