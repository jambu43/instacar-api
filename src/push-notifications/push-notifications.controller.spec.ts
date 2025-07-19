import { Test, TestingModule } from '@nestjs/testing';
import { PushNotificationsController } from './push-notifications.controller';
import { PushNotificationsService } from './push-notifications.service';
import { Platform } from '@prisma/client';

describe('PushNotificationsController', () => {
  let controller: PushNotificationsController;

  const mockPushNotificationsService = {
    registerToken: jest.fn(),
    sendNotification: jest.fn(),
    sendToUser: jest.fn(),
    sendToDrivers: jest.fn(),
    sendToNearbyDrivers: jest.fn(),
    updatePreferences: jest.fn(),
    unregisterToken: jest.fn(),
    getTokenStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushNotificationsController],
      providers: [
        {
          provide: PushNotificationsService,
          useValue: mockPushNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<PushNotificationsController>(
      PushNotificationsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerToken', () => {
    it('should register a push token', async () => {
      const registerTokenDto = {
        token: 'test-token-123',
        deviceId: 'device-123',
        platform: Platform.ANDROID,
      };

      const mockResult = {
        success: true,
        message: 'Token enregistré avec succès',
      };

      mockPushNotificationsService.registerToken.mockResolvedValue(mockResult);

      const mockUser = { id: 1 };
      const result = await controller.registerToken(mockUser, registerTokenDto);

      expect(mockPushNotificationsService.registerToken).toHaveBeenCalledWith(
        1,
        registerTokenDto,
      );
      expect(result).toEqual(mockResult);
    });
  });
});
