import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { GetDriverLocationDto } from './dto/get-driver-location.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface LocationData {
  id: number;
  driverId: number;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  altitude?: number | null;
  address?: string | null;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverLocation {
  driverId: number;
  driverName: string;
  latitude: number;
  longitude: number;
  distance: number;
  isAvailable: boolean;
  lastUpdate: Date;
  vehicle?: {
    model: string;
    color: string;
    plateNumber: string;
  };
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async updateLocation(
    driverId: number,
    updateLocationDto: UpdateLocationDto,
  ): Promise<LocationData> {
    // Vérifier que le chauffeur existe
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true },
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    // Créer ou mettre à jour la localisation
    const location = await this.prisma.location.upsert({
      where: { driverId },
      update: {
        latitude: updateLocationDto.latitude,
        longitude: updateLocationDto.longitude,
        accuracy: updateLocationDto.accuracy,
        speed: updateLocationDto.speed,
        heading: updateLocationDto.heading,
        altitude: updateLocationDto.altitude,
        address: updateLocationDto.address,
        timestamp: updateLocationDto.timestamp
          ? new Date(updateLocationDto.timestamp)
          : new Date(),
      },
      create: {
        driverId,
        latitude: updateLocationDto.latitude,
        longitude: updateLocationDto.longitude,
        accuracy: updateLocationDto.accuracy,
        speed: updateLocationDto.speed,
        heading: updateLocationDto.heading,
        altitude: updateLocationDto.altitude,
        address: updateLocationDto.address,
        timestamp: updateLocationDto.timestamp
          ? new Date(updateLocationDto.timestamp)
          : new Date(),
      },
    });

    // Émettre un événement pour les WebSockets
    this.eventEmitter.emit('location.updated', {
      driverId,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
      },
    });

    this.logger.log(
      `Localisation mise à jour pour le chauffeur ${driverId}: ${location.latitude}, ${location.longitude}`,
    );

    return location;
  }

  async getDriverLocation(driverId: number): Promise<LocationData> {
    const location = await this.prisma.location.findUnique({
      where: { driverId },
    });

    if (!location) {
      throw new NotFoundException('Localisation non trouvée');
    }

    return location;
  }

  async getNearbyDrivers(
    query: GetDriverLocationDto,
  ): Promise<DriverLocation[]> {
    const { latitude, longitude, radius = 5, limit = 10, available = true } =
      query;

    if (!latitude || !longitude) {
      throw new Error('Latitude et longitude requises pour la recherche');
    }

    // Calculer les bornes de la zone de recherche
    const latDelta = radius / 111.32; // 1 degré ≈ 111.32 km
    const lonDelta = radius / (111.32 * Math.cos(latitude * (Math.PI / 180)));

    const minLat = latitude - latDelta;
    const maxLat = latitude + latDelta;
    const minLon = longitude - lonDelta;
    const maxLon = longitude + lonDelta;

    // Construire la requête de base
    const whereClause: any = {
      latitude: {
        gte: minLat,
        lte: maxLat,
      },
      longitude: {
        gte: minLon,
        lte: maxLon,
      },
    };

    // Ajouter le filtre de disponibilité si demandé
    if (available) {
      whereClause.driver = {
        isAvailable: true,
        isRegistrationComplete: true,
      };
    }

    // Récupérer les localisations
    const locations = await this.prisma.location.findMany({
      where: whereClause,
      include: {
        driver: {
          include: {
            user: true,
            vehicle: true,
          },
        },
      },
      take: limit,
    });

    // Calculer les distances et formater les résultats
    const driverLocations: DriverLocation[] = locations
      .map((location) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          location.latitude,
          location.longitude,
        );

        return {
          driverId: location.driverId,
          driverName: location.driver.user.name,
          latitude: location.latitude,
          longitude: location.longitude,
          distance: Math.round(distance * 1000) / 1000, // Arrondir à 3 décimales
          isAvailable: location.driver.isAvailable,
          lastUpdate: location.timestamp,
          vehicle: location.driver.vehicle
            ? {
                model: location.driver.vehicle.model,
                color: location.driver.vehicle.color,
                plateNumber: location.driver.vehicle.plateNumber,
              }
            : undefined,
        };
      })
      .filter((driver) => driver.distance <= radius) // Filtrer par rayon exact
      .sort((a, b) => a.distance - b.distance); // Trier par distance

    this.logger.log(
      `Trouvé ${driverLocations.length} chauffeurs dans un rayon de ${radius}km`,
    );

    return driverLocations;
  }

  async getLocationHistory(
    driverId: number,
    limit: number = 50,
  ): Promise<any[]> {
    const locations = await this.prisma.locationHistory.findMany({
      where: { driverId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return locations;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance en km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async getLocationStats(): Promise<{
    totalDrivers: number;
    activeDrivers: number;
    averageUpdateFrequency: number;
  }> {
    const totalDrivers = await this.prisma.driver.count({
      where: { isRegistrationComplete: true },
    });

    const activeDrivers = await this.prisma.driver.count({
      where: {
        isRegistrationComplete: true,
        isAvailable: true,
        location: {
          timestamp: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // 5 dernières minutes
          },
        },
      },
    });

    // Calculer la fréquence moyenne de mise à jour
    const recentUpdates = await this.prisma.locationHistory.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // 1 heure
        },
      },
    });

    const averageUpdateFrequency = totalDrivers > 0 ? recentUpdates / totalDrivers : 0;

    return {
      totalDrivers,
      activeDrivers,
      averageUpdateFrequency: Math.round(averageUpdateFrequency * 100) / 100,
    };
  }
}
