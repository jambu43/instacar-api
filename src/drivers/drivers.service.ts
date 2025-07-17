import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { RegisterVehicleDto } from './dto/register-vehicle.dto';
import { RegisterDriverDto } from './dto/register-driver.dto';

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
          'Un véhicule avec cette plaque d\'immatriculation existe déjà',
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

      this.logger.log(`Véhicule enregistré avec succès: ${vehicle.plateNumber}`);

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
      this.logger.error(`Erreur lors de l'enregistrement du véhicule: ${error.message}`);
      throw error;
    }
  }

  async registerDriver(vehicleId: number, registerDriverDto: RegisterDriverDto) {
    try {
      this.logger.log(`Tentative d'enregistrement du chauffeur pour le véhicule ${vehicleId}`);
      
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
        this.logger.error(`Numéro de téléphone déjà utilisé: ${registerDriverDto.phone}`);
        throw new ConflictException(
          `Un chauffeur avec le numéro de téléphone ${registerDriverDto.phone} existe déjà`,
        );
      }

      // Vérifier si le numéro de permis existe déjà
      const existingDriverByLicense = await this.prisma.driver.findUnique({
        where: { licenseNumber: registerDriverDto.licenseNumber },
      });

      if (existingDriverByLicense) {
        this.logger.error(`Numéro de permis déjà utilisé: ${registerDriverDto.licenseNumber}`);
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
      this.logger.error(`Erreur lors de l'enregistrement du chauffeur: ${error.message}`);
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
      this.logger.error(`Erreur lors de la récupération du statut: ${error.message}`);
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
      this.logger.error(`Erreur lors de la récupération des chauffeurs: ${error.message}`);
      throw error;
    }
  }
} 