import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LocationService } from './location.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { GetDriverLocationDto } from './dto/get-driver-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Location')
@Controller('location')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('update')
  @Roles(UserRole.DRIVER)
  @ApiOperation({
    summary: 'Mettre à jour la localisation du chauffeur',
    description: 'Met à jour la position GPS du chauffeur en temps réel',
  })
  @ApiResponse({
    status: 201,
    description: 'Localisation mise à jour avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Localisation mise à jour' },
        location: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            driverId: { type: 'number', example: 1 },
            latitude: { type: 'number', example: 48.8566 },
            longitude: { type: 'number', example: 2.3522 },
            accuracy: { type: 'number', example: 10 },
            speed: { type: 'number', example: 5.5 },
            heading: { type: 'number', example: 180 },
            altitude: { type: 'number', example: 100 },
            address: { type: 'string', example: '123 Rue de la Paix, Paris' },
            timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Données de localisation invalides',
  })
  @ApiResponse({
    status: 404,
    description: 'Chauffeur non trouvé',
  })
  async updateLocation(
    @CurrentUser() user: any,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    const location = await this.locationService.updateLocation(
      user.driver.id,
      updateLocationDto,
    );

    return {
      success: true,
      message: 'Localisation mise à jour avec succès',
      location,
    };
  }

  @Get('driver/:driverId')
  @ApiOperation({
    summary: 'Obtenir la localisation actuelle d\'un chauffeur',
    description: 'Récupère la position GPS actuelle d\'un chauffeur spécifique',
  })
  @ApiParam({
    name: 'driverId',
    description: 'ID du chauffeur',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Localisation du chauffeur',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        location: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            driverId: { type: 'number', example: 1 },
            latitude: { type: 'number', example: 48.8566 },
            longitude: { type: 'number', example: 2.3522 },
            accuracy: { type: 'number', example: 10 },
            speed: { type: 'number', example: 5.5 },
            heading: { type: 'number', example: 180 },
            altitude: { type: 'number', example: 100 },
            address: { type: 'string', example: '123 Rue de la Paix, Paris' },
            timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Localisation non trouvée',
  })
  async getDriverLocation(@Param('driverId', ParseIntPipe) driverId: number) {
    const location = await this.locationService.getDriverLocation(driverId);

    return {
      success: true,
      location,
    };
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Trouver les chauffeurs à proximité',
    description: 'Recherche les chauffeurs disponibles dans un rayon donné',
  })
  @ApiQuery({
    name: 'latitude',
    description: 'Latitude du point de référence',
    example: 48.8566,
    required: true,
  })
  @ApiQuery({
    name: 'longitude',
    description: 'Longitude du point de référence',
    example: 2.3522,
    required: true,
  })
  @ApiQuery({
    name: 'radius',
    description: 'Rayon de recherche en kilomètres',
    example: 5,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Nombre maximum de chauffeurs à retourner',
    example: 10,
    required: false,
  })
  @ApiQuery({
    name: 'available',
    description: 'Filtrer uniquement les chauffeurs disponibles',
    example: true,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des chauffeurs à proximité',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        drivers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              driverId: { type: 'number', example: 1 },
              driverName: { type: 'string', example: 'Jean Dupont' },
              latitude: { type: 'number', example: 48.8566 },
              longitude: { type: 'number', example: 2.3522 },
              distance: { type: 'number', example: 1.5 },
              isAvailable: { type: 'boolean', example: true },
              lastUpdate: { type: 'string', example: '2024-01-15T10:30:00Z' },
              vehicle: {
                type: 'object',
                properties: {
                  model: { type: 'string', example: 'Peugeot 308' },
                  color: { type: 'string', example: 'Blanc' },
                  plateNumber: { type: 'string', example: 'AB-123-CD' },
                },
              },
            },
          },
        },
        count: { type: 'number', example: 5 },
      },
    },
  })
  async getNearbyDrivers(@Query() query: GetDriverLocationDto) {
    const drivers = await this.locationService.getNearbyDrivers(query);

    return {
      success: true,
      drivers,
      count: drivers.length,
    };
  }

  @Get('history/:driverId')
  @ApiOperation({
    summary: 'Obtenir l\'historique des localisations d\'un chauffeur',
    description: 'Récupère l\'historique des positions GPS d\'un chauffeur',
  })
  @ApiParam({
    name: 'driverId',
    description: 'ID du chauffeur',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Nombre maximum d\'entrées à retourner',
    example: 50,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Historique des localisations',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        history: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              driverId: { type: 'number', example: 1 },
              latitude: { type: 'number', example: 48.8566 },
              longitude: { type: 'number', example: 2.3522 },
              timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
            },
          },
        },
      },
    },
  })
  async getLocationHistory(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Query('limit') limit?: number,
  ) {
    const history = await this.locationService.getLocationHistory(
      driverId,
      limit,
    );

    return {
      success: true,
      history,
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Obtenir les statistiques de localisation',
    description: 'Récupère les statistiques globales sur les localisations',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques de localisation',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        stats: {
          type: 'object',
          properties: {
            totalDrivers: { type: 'number', example: 100 },
            activeDrivers: { type: 'number', example: 25 },
            averageUpdateFrequency: { type: 'number', example: 2.5 },
          },
        },
      },
    },
  })
  async getLocationStats() {
    const stats = await this.locationService.getLocationStats();

    return {
      success: true,
      stats,
    };
  }
}
