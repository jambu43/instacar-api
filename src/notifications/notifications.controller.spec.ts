import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const mockNotificationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findUnread: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    remove: jest.fn(),
    getUnreadCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [
        {
          id: 1,
          userId: 1,
          title: 'Test Notification',
          message: 'Test message',
          type: 'SYSTEM_MESSAGE',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      mockNotificationsService.findAll.mockResolvedValue(mockNotifications);

      const result = await controller.findAll(1);

      expect(mockNotificationsService.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockNotifications);
    });
  });
});
