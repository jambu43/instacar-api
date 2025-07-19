import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
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

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const notificationData = {
        userId: 1,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.SYSTEM_MESSAGE,
      };

      const mockNotification = {
        id: 1,
        ...notificationData,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: null,
        ride: null,
        driver: null,
      };

      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create(notificationData);

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: notificationData,
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
      expect(result).toEqual(mockNotification);
    });
  });

  describe('findAll', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [
        {
          id: 1,
          userId: 1,
          title: 'Test 1',
          message: 'Message 1',
          type: NotificationType.SYSTEM_MESSAGE,
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          ride: null,
          driver: null,
        },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(
        mockNotifications,
      );

      const result = await service.findAll(1);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
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
      expect(result).toEqual(mockNotifications);
    });
  });
});
