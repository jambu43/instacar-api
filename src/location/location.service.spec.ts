import { Test, TestingModule } from '@nestjs/testing';
import { LocationService } from './location.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('LocationService', () => {
  let service: LocationService;
  let prismaService: PrismaService;
  let eventEmitter: EventEmitter2;

  const mockPrismaService = {
    driver: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    location: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    locationHistory: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
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

    service = module.get<LocationService>(LocationService);
    prismaService = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateLocation', () => {
    const mockDriver = {
      id: 1,
      user: { name: 'Test Driver' },
    };

    const mockLocationData = {
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
      latitude: 48.8566,
      longitude: 2.3522,
      accuracy: 10,
      speed: 5.5,
      heading: 180,
      altitude: 100,
      address: '123 Rue de la Paix, Paris',
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update location successfully', async () => {
      mockPrismaService.driver.findUnique.mockResolvedValue(mockDriver);
      mockPrismaService.location.upsert.mockResolvedValue(mockLocation);

      const result = await service.updateLocation(1, mockLocationData);

      expect(mockPrismaService.driver.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { user: true },
      });

      expect(mockPrismaService.location.upsert).toHaveBeenCalledWith({
        where: { driverId: 1 },
        update: {
          latitude: mockLocationData.latitude,
          longitude: mockLocationData.longitude,
          accuracy: mockLocationData.accuracy,
          speed: mockLocationData.speed,
          heading: mockLocationData.heading,
          altitude: mockLocationData.altitude,
          address: mockLocationData.address,
          timestamp: expect.any(Date),
        },
        create: {
          driverId: 1,
          latitude: mockLocationData.latitude,
          longitude: mockLocationData.longitude,
          accuracy: mockLocationData.accuracy,
          speed: mockLocationData.speed,
          heading: mockLocationData.heading,
          altitude: mockLocationData.altitude,
          address: mockLocationData.address,
          timestamp: expect.any(Date),
        },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('location.updated', {
        driverId: 1,
        location: {
          latitude: mockLocation.latitude,
          longitude: mockLocation.longitude,
          timestamp: mockLocation.timestamp,
        },
      });

      expect(result).toEqual(mockLocation);
    });

    it('should throw error if driver not found', async () => {
      mockPrismaService.driver.findUnique.mockResolvedValue(null);

      await expect(service.updateLocation(999, mockLocationData)).rejects.toThrow(
        'Chauffeur non trouvé',
      );
    });
  });

  describe('getDriverLocation', () => {
    const mockLocation = {
      id: 1,
      driverId: 1,
      latitude: 48.8566,
      longitude: 2.3522,
      accuracy: 10,
      speed: 5.5,
      heading: 180,
      altitude: 100,
      address: '123 Rue de la Paix, Paris',
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return driver location', async () => {
      mockPrismaService.location.findUnique.mockResolvedValue(mockLocation);

      const result = await service.getDriverLocation(1);

      expect(mockPrismaService.location.findUnique).toHaveBeenCalledWith({
        where: { driverId: 1 },
      });

      expect(result).toEqual(mockLocation);
    });

    it('should throw error if location not found', async () => {
      mockPrismaService.location.findUnique.mockResolvedValue(null);

      await expect(service.getDriverLocation(999)).rejects.toThrow(
        'Localisation non trouvée',
      );
    });
  });

  describe('getNearbyDrivers', () => {
    const mockLocations = [
      {
        id: 1,
        driverId: 1,
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: 10,
        speed: 5.5,
        heading: 180,
        altitude: 100,
        address: '123 Rue de la Paix, Paris',
        timestamp: new Date(),
        driver: {
          isAvailable: true,
          isRegistrationComplete: true,
          user: { name: 'Driver 1' },
          vehicle: {
            model: 'Peugeot 308',
            color: 'Blanc',
            plateNumber: 'AB-123-CD',
          },
        },
      },
    ];

    it('should return nearby drivers', async () => {
      mockPrismaService.location.findMany.mockResolvedValue(mockLocations);

      const query = {
        latitude: 48.8566,
        longitude: 2.3522,
        radius: 5,
        limit: 10,
        available: true,
      };

      const result = await service.getNearbyDrivers(query);

      expect(mockPrismaService.location.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          latitude: expect.objectContaining({
            gte: expect.any(Number),
            lte: expect.any(Number),
          }),
          longitude: expect.objectContaining({
            gte: expect.any(Number),
            lte: expect.any(Number),
          }),
          driver: {
            isAvailable: true,
            isRegistrationComplete: true,
          },
        }),
        include: {
          driver: {
            include: {
              user: true,
              vehicle: true,
            },
          },
        },
        take: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('driverId', 1);
      expect(result[0]).toHaveProperty('driverName', 'Driver 1');
      expect(result[0]).toHaveProperty('distance');
    });

    it('should throw error if latitude and longitude are missing', async () => {
      const query = {
        radius: 5,
        limit: 10,
        available: true,
      };

      await expect(service.getNearbyDrivers(query)).rejects.toThrow(
        'Latitude et longitude requises pour la recherche',
      );
    });
  });

  describe('getLocationHistory', () => {
    const mockHistory = [
      {
        id: 1,
        driverId: 1,
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: 10,
        speed: 5.5,
        heading: 180,
        altitude: 100,
        address: '123 Rue de la Paix, Paris',
        timestamp: new Date(),
      },
    ];

    it('should return location history', async () => {
      mockPrismaService.locationHistory.findMany.mockResolvedValue(mockHistory);

      const result = await service.getLocationHistory(1, 50);

      expect(mockPrismaService.locationHistory.findMany).toHaveBeenCalledWith({
        where: { driverId: 1 },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });

      expect(result).toEqual(mockHistory);
    });
  });

  describe('getLocationStats', () => {
    it('should return location statistics', async () => {
      mockPrismaService.driver.count
        .mockResolvedValueOnce(100) // totalDrivers
        .mockResolvedValueOnce(25); // activeDrivers
      mockPrismaService.locationHistory.count.mockResolvedValue(250);

      const result = await service.getLocationStats();

      expect(result).toEqual({
        totalDrivers: 100,
        activeDrivers: 25,
        averageUpdateFrequency: 2.5,
      });
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance correctly', () => {
      const lat1 = 48.8566;
      const lon1 = 2.3522;
      const lat2 = 48.8584;
      const lon2 = 2.2945;

      const distance = service['calculateDistance'](lat1, lon1, lat2, lon2);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(10); // Distance entre deux points à Paris
    });
  });
});
