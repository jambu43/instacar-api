import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { RegisterVehicleDto } from './dto/register-vehicle.dto';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { SearchDriversDto } from './dto/search-drivers.dto';

@ApiTags('drivers')
@Controller('drivers')
export class DriversController {
  constructor(private driversService: DriversService) {}

  @Post('register-vehicle')
  @ApiOperation({ summary: "Enregistrement d'un véhicule (étape 1)" })
  @ApiResponse({
    status: 201,
    description: 'Véhicule enregistré avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        vehicle: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            city: { type: 'string' },
            vehicleType: { type: 'string' },
            brand: { type: 'string' },
            model: { type: 'string' },
            color: { type: 'string' },
            year: { type: 'number' },
            plateNumber: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Véhicule avec cette plaque d'immatriculation existe déjà",
  })
  async registerVehicle(@Body() registerVehicleDto: RegisterVehicleDto) {
    return await this.driversService.registerVehicle(registerVehicleDto);
  }

  @Post('register-driver/:vehicleId')
  @ApiOperation({ summary: "Enregistrement d'un chauffeur (étape 2)" })
  @ApiParam({
    name: 'vehicleId',
    description: 'ID du véhicule enregistré',
    type: 'number',
  })
  @ApiResponse({
    status: 201,
    description: 'Chauffeur enregistré avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        driver: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            fullName: { type: 'string' },
            phone: { type: 'string' },
            licenseNumber: { type: 'string' },
            profilePhoto: { type: 'string' },
            identityDocument: { type: 'string' },
            vehicle: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                brand: { type: 'string' },
                model: { type: 'string' },
                color: { type: 'string' },
                year: { type: 'number' },
                plateNumber: { type: 'string' },
                city: { type: 'string' },
                vehicleType: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Véhicule non trouvé',
  })
  @ApiResponse({
    status: 409,
    description: 'Chauffeur avec ce numéro de téléphone ou permis existe déjà',
  })
  async registerDriver(
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
    @Body() registerDriverDto: RegisterDriverDto,
  ) {
    return await this.driversService.registerDriver(
      vehicleId,
      registerDriverDto,
    );
  }

  @Get('status/:driverId')
  @ApiOperation({ summary: "Vérifier le statut d'inscription d'un chauffeur" })
  @ApiParam({
    name: 'driverId',
    description: 'ID du chauffeur',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Statut du chauffeur récupéré avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        isVehicleRegistered: { type: 'boolean' },
        isIdentityComplete: { type: 'boolean' },
        isRegistrationComplete: { type: 'boolean' },
        driver: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            fullName: { type: 'string' },
            phone: { type: 'string' },
            licenseNumber: { type: 'string' },
            profilePhoto: { type: 'string' },
            identityDocument: { type: 'string' },
            vehicle: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Chauffeur non trouvé',
  })
  async getDriverStatus(@Param('driverId', ParseIntPipe) driverId: number) {
    return await this.driversService.getDriverStatus(driverId);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les chauffeurs' })
  @ApiResponse({
    status: 200,
    description: 'Liste des chauffeurs récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        drivers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              fullName: { type: 'string' },
              phone: { type: 'string' },
              licenseNumber: { type: 'string' },
              profilePhoto: { type: 'string' },
              isAvailable: { type: 'boolean' },
              rating: { type: 'number' },
              totalRides: { type: 'number' },
              vehicle: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  brand: { type: 'string' },
                  model: { type: 'string' },
                  color: { type: 'string' },
                  plateNumber: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  async getAllDrivers() {
    return await this.driversService.getAllDrivers();
  }

  @Put('availability/:driverId')
  @ApiOperation({
    summary: "Mettre à jour le statut de disponibilité d'un chauffeur",
  })
  @ApiParam({
    name: 'driverId',
    description: 'ID du chauffeur',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Statut de disponibilité mis à jour avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        driver: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            fullName: { type: 'string' },
            isAvailable: { type: 'boolean' },
            currentLat: { type: 'number' },
            currentLng: { type: 'number' },
            lastLocationUpdate: { type: 'string' },
            vehicle: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                brand: { type: 'string' },
                model: { type: 'string' },
                color: { type: 'string' },
                plateNumber: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Chauffeur non trouvé',
  })
  @ApiResponse({
    status: 409,
    description: 'Inscription du chauffeur incomplète',
  })
  async updateAvailability(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    return await this.driversService.updateAvailability(
      driverId,
      updateAvailabilityDto,
    );
  }

  @Post('search')
  @ApiOperation({ summary: 'Rechercher des chauffeurs disponibles' })
  @ApiResponse({
    status: 200,
    description: 'Chauffeurs disponibles trouvés avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        searchLocation: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
            radius: { type: 'number' },
          },
        },
        drivers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              fullName: { type: 'string' },
              phone: { type: 'string' },
              profilePhoto: { type: 'string' },
              rating: { type: 'number' },
              totalRides: { type: 'number' },
              distance: { type: 'number' },
              currentLocation: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                  lastUpdate: { type: 'string' },
                },
              },
              vehicle: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  brand: { type: 'string' },
                  model: { type: 'string' },
                  color: { type: 'string' },
                  plateNumber: { type: 'string' },
                  vehicleType: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  async searchAvailableDrivers(@Body() searchDriversDto: SearchDriversDto) {
    return await this.driversService.searchAvailableDrivers(searchDriversDto);
  }
}
