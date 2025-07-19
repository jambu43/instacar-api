import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

describe('LocationController', () => {
  let controller: LocationController;

  const mockLocationService = {
    updateLocation: jest.fn(),
    getDriverLocation: jest.fn(),
    getNearbyDrivers: jest.fn(),
    getLocationHistory: jest.fn(),
    getLocationStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [
        {
          provide: LocationService,
          useValue: mockLocationService,
        },
      ],
    }).compile();

    controller = module.get<LocationController>(LocationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateLocation', () => {
    it('should update driver location', async () => {
      const mockUser = {
        driver: {
          id: 1,
        },
      };

      const updateLocationDto = {
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: 10,
        speed: 5.5,
        heading: 180,
        altitude: 100,
        address: '123 Rue de la Paix, Paris',
      };

      const mockLocation = {
        id: 1,
        driverId: 1,
        ...updateLocationDto,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLocationService.updateLocation.mockResolvedValue(mockLocation);

      const result = await controller.updateLocation(
        mockUser,
        updateLocationDto,
      );

      expect(mockLocationService.updateLocation).toHaveBeenCalledWith(
        1,
        updateLocationDto,
      );
      expect(result).toEqual({
        success: true,
        message: 'Localisation mise à jour avec succès',
        location: mockLocation,
      });
    });
  });
});
