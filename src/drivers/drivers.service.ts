import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { RegisterVehicleDto } from './dto/register-vehicle.dto';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { SearchDriversDto } from './dto/search-drivers.dto';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async registerVehicle(registerVehicleDto: RegisterVehicleDto) {
    try {
      // Vérifier si la plaque d'immatriculation existe déjà
      const existingVehicle = await this.prisma.vehicle.findUnique({
        where: { plateNumber: registerVehicleDto.plateNumber },
      });

      if (existingVehicle) {
        throw new ConflictException(
          "Un véhicule avec cette plaque d'immatriculation existe déjà",
        );
      }

      // Créer le véhicule
      const vehicle = await this.prisma.vehicle.create({
        data: {
          city: registerVehicleDto.city,
          vehicleType: registerVehicleDto.vehicleType,
          brand: registerVehicleDto.brand,
          model: registerVehicleDto.model,
          color: registerVehicleDto.color,
          year: registerVehicleDto.year,
          plateNumber: registerVehicleDto.plateNumber,
          isRegistrationComplete: true,
        },
      });

      this.logger.log(
        `Véhicule enregistré avec succès: ${vehicle.plateNumber}`,
      );

      return {
        success: true,
        message: 'Véhicule enregistré avec succès',
        vehicle: {
          id: vehicle.id,
          city: vehicle.city,
          vehicleType: vehicle.vehicleType,
          brand: vehicle.brand,
          model: vehicle.model,
          color: vehicle.color,
          year: vehicle.year,
          plateNumber: vehicle.plateNumber,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'enregistrement du véhicule: ${error.message}`,
      );
      throw error;
    }
  }

  async registerDriver(
    vehicleId: number,
    registerDriverDto: RegisterDriverDto,
  ) {
    try {
      this.logger.log(
        `Tentative d'enregistrement du chauffeur pour le véhicule ${vehicleId}`,
      );

      // Vérifier si le véhicule existe
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        this.logger.error(`Véhicule non trouvé: ${vehicleId}`);
        throw new NotFoundException('Véhicule non trouvé');
      }

      this.logger.log(`Véhicule trouvé: ${vehicle.plateNumber}`);

      // Vérifier si le numéro de téléphone existe déjà
      const existingDriverByPhone = await this.prisma.driver.findUnique({
        where: { phone: registerDriverDto.phone },
      });

      if (existingDriverByPhone) {
        this.logger.error(
          `Numéro de téléphone déjà utilisé: ${registerDriverDto.phone}`,
        );
        throw new ConflictException(
          `Un chauffeur avec le numéro de téléphone ${registerDriverDto.phone} existe déjà`,
        );
      }

      // Vérifier si le numéro de permis existe déjà
      const existingDriverByLicense = await this.prisma.driver.findUnique({
        where: { licenseNumber: registerDriverDto.licenseNumber },
      });

      if (existingDriverByLicense) {
        this.logger.error(
          `Numéro de permis déjà utilisé: ${registerDriverDto.licenseNumber}`,
        );
        throw new ConflictException(
          `Un chauffeur avec le numéro de permis ${registerDriverDto.licenseNumber} existe déjà`,
        );
      }

      // Créer un utilisateur temporaire pour le chauffeur
      const user = await this.prisma.user.create({
        data: {
          email: `driver.${Date.now()}@instacar.com`, // Email temporaire
          name: registerDriverDto.fullName,
          phone: registerDriverDto.phone,
          gender: 'MALE', // Valeur par défaut
          role: 'DRIVER',
          isVerified: true, // Chauffeur vérifié par défaut
          isProfileComplete: true,
        },
      });

      // Traiter la photo de profil si fournie
      let profilePhotoUrl = registerDriverDto.profilePhoto;
      if (profilePhotoUrl) {
        const photoUrl = this.uploadService.getPhotoUrl(profilePhotoUrl);
        profilePhotoUrl = photoUrl || undefined;
      }

      // Traiter le document d'identité
      const identityDocumentUrl = this.uploadService.getPhotoUrl(
        registerDriverDto.identityDocument,
      );

      // Créer le chauffeur
      const driver = await this.prisma.driver.create({
        data: {
          userId: user.id,
          vehicleId: vehicleId,
          fullName: registerDriverDto.fullName,
          phone: registerDriverDto.phone,
          licenseNumber: registerDriverDto.licenseNumber,
          profilePhoto: profilePhotoUrl,
          identityDocument: identityDocumentUrl,
          isIdentityComplete: true,
          isRegistrationComplete: true,
        },
        include: {
          user: true,
          vehicle: true,
        },
      });

      this.logger.log(`Chauffeur enregistré avec succès: ${driver.fullName}`);

      return {
        success: true,
        message: 'Chauffeur enregistré avec succès',
        driver: {
          id: driver.id,
          fullName: driver.fullName,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          profilePhoto: driver.profilePhoto,
          identityDocument: driver.identityDocument,
          vehicle: {
            id: driver.vehicle.id,
            brand: driver.vehicle.brand,
            model: driver.vehicle.model,
            color: driver.vehicle.color,
            year: driver.vehicle.year,
            plateNumber: driver.vehicle.plateNumber,
            city: driver.vehicle.city,
            vehicleType: driver.vehicle.vehicleType,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'enregistrement du chauffeur: ${error.message}`,
      );
      throw error;
    }
  }

  async getDriverStatus(driverId: number) {
    try {
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
        include: {
          user: true,
          vehicle: true,
        },
      });

      if (!driver) {
        throw new NotFoundException('Chauffeur non trouvé');
      }

      return {
        success: true,
        isVehicleRegistered: driver.vehicle.isRegistrationComplete,
        isIdentityComplete: driver.isIdentityComplete,
        isRegistrationComplete: driver.isRegistrationComplete,
        driver: {
          id: driver.id,
          fullName: driver.fullName,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          profilePhoto: driver.profilePhoto,
          identityDocument: driver.identityDocument,
          vehicle: driver.vehicle,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération du statut: ${error.message}`,
      );
      throw error;
    }
  }

  async getAllDrivers() {
    try {
      const drivers = await this.prisma.driver.findMany({
        include: {
          user: true,
          vehicle: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        drivers: drivers.map((driver) => ({
          id: driver.id,
          fullName: driver.fullName,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          profilePhoto: driver.profilePhoto,
          isAvailable: driver.isAvailable,
          rating: driver.rating,
          totalRides: driver.totalRides,
          vehicle: {
            id: driver.vehicle.id,
            brand: driver.vehicle.brand,
            model: driver.vehicle.model,
            color: driver.vehicle.color,
            plateNumber: driver.vehicle.plateNumber,
          },
        })),
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des chauffeurs: ${error.message}`,
      );
      throw error;
    }
  }

  async updateAvailability(
    driverId: number,
    updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    try {
      this.logger.log(
        `Mise à jour de la disponibilité pour le chauffeur ${driverId}`,
      );

      // Vérifier si le chauffeur existe
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
        include: {
          vehicle: true,
        },
      });

      if (!driver) {
        this.logger.error(`Chauffeur non trouvé: ${driverId}`);
        throw new NotFoundException('Chauffeur non trouvé');
      }

      // Vérifier que l'inscription est complète
      if (!driver.isRegistrationComplete) {
        throw new ConflictException(
          "L'inscription du chauffeur doit être complète pour être disponible",
        );
      }

      // Mettre à jour la disponibilité et la localisation
      const updatedDriver = await this.prisma.driver.update({
        where: { id: driverId },
        data: {
          isAvailable: updateAvailabilityDto.isAvailable,
          currentLat: updateAvailabilityDto.currentLat,
          currentLng: updateAvailabilityDto.currentLng,
          lastLocationUpdate:
            updateAvailabilityDto.currentLat && updateAvailabilityDto.currentLng
              ? new Date()
              : undefined,
        },
        include: {
          vehicle: true,
        },
      });

      this.logger.log(
        `Disponibilité mise à jour pour ${updatedDriver.fullName}: ${updatedDriver.isAvailable ? 'En ligne' : 'Hors ligne'}`,
      );

      return {
        success: true,
        message: `Chauffeur ${updatedDriver.isAvailable ? 'mis en ligne' : 'mis hors ligne'} avec succès`,
        driver: {
          id: updatedDriver.id,
          fullName: updatedDriver.fullName,
          isAvailable: updatedDriver.isAvailable,
          currentLat: updatedDriver.currentLat,
          currentLng: updatedDriver.currentLng,
          lastLocationUpdate: updatedDriver.lastLocationUpdate,
          vehicle: {
            id: updatedDriver.vehicle.id,
            brand: updatedDriver.vehicle.brand,
            model: updatedDriver.vehicle.model,
            color: updatedDriver.vehicle.color,
            plateNumber: updatedDriver.vehicle.plateNumber,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour de la disponibilité: ${error.message}`,
      );
      throw error;
    }
  }

  async searchAvailableDrivers(searchDriversDto: SearchDriversDto) {
    try {
      this.logger.log(
        `Recherche de chauffeurs disponibles autour de (${searchDriversDto.lat}, ${searchDriversDto.lng}) dans un rayon de ${searchDriversDto.radius}km`,
      );

      // Construire la requête de base
      const whereClause: any = {
        isAvailable: true,
        isRegistrationComplete: true,
        currentLat: { not: null },
        currentLng: { not: null },
      };

      // Ajouter le filtre par type de véhicule si spécifié
      if (searchDriversDto.vehicleType) {
        whereClause.vehicle = {
          vehicleType: searchDriversDto.vehicleType,
        };
      }

      // Récupérer tous les chauffeurs disponibles
      const availableDrivers = await this.prisma.driver.findMany({
        where: whereClause,
        include: {
          vehicle: true,
        },
      });

      // Calculer la distance et filtrer par rayon
      const driversWithDistance = availableDrivers
        .map((driver) => {
          const distance = this.calculateDistance(
            searchDriversDto.lat,
            searchDriversDto.lng,
            driver.currentLat!,
            driver.currentLng!,
          );
          return {
            ...driver,
            distance,
          };
        })
        .filter((driver) => driver.distance <= searchDriversDto.radius!)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, searchDriversDto.limit);

      this.logger.log(
        `${driversWithDistance.length} chauffeurs trouvés dans le rayon de ${searchDriversDto.radius}km`,
      );

      return {
        success: true,
        message: `${driversWithDistance.length} chauffeur(s) disponible(s) trouvé(s)`,
        searchLocation: {
          lat: searchDriversDto.lat,
          lng: searchDriversDto.lng,
          radius: searchDriversDto.radius,
        },
        drivers: driversWithDistance.map((driver) => ({
          id: driver.id,
          fullName: driver.fullName,
          phone: driver.phone,
          profilePhoto: driver.profilePhoto,
          rating: driver.rating,
          totalRides: driver.totalRides,
          distance: Math.round(driver.distance * 100) / 100, // Arrondir à 2 décimales
          currentLocation: {
            lat: driver.currentLat,
            lng: driver.currentLng,
            lastUpdate: driver.lastLocationUpdate,
          },
          vehicle: {
            id: driver.vehicle.id,
            brand: driver.vehicle.brand,
            model: driver.vehicle.model,
            color: driver.vehicle.color,
            plateNumber: driver.vehicle.plateNumber,
            vehicleType: driver.vehicle.vehicleType,
          },
        })),
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la recherche de chauffeurs: ${error.message}`,
      );
      throw error;
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
    return R * c; // Distance en km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
