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
import { RidesService } from './rides.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { AcceptRideDto } from './dto/accept-ride.dto';
import { UpdateRideStatusDto } from './dto/update-ride-status.dto';

@ApiTags('rides')
@Controller('rides')
export class RidesController {
  constructor(private ridesService: RidesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle course' })
  @ApiResponse({
    status: 201,
    description: 'Course créée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        ride: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            status: { type: 'string' },
            pickupAddress: { type: 'string' },
            dropoffAddress: { type: 'string' },
            distance: { type: 'number' },
            duration: { type: 'number' },
            price: { type: 'number' },
            requestedAt: { type: 'string' },
            passenger: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                phone: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Passager non trouvé',
  })
  @ApiResponse({
    status: 409,
    description: 'Course en cours déjà existante',
  })
  async createRide(@Body() createRideDto: CreateRideDto) {
    return await this.ridesService.createRide(createRideDto);
  }

  @Get('available')
  @ApiOperation({
    summary: 'Récupérer les courses disponibles pour les chauffeurs',
  })
  @ApiResponse({
    status: 200,
    description: 'Courses disponibles récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        rides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              status: { type: 'string' },
              pickupAddress: { type: 'string' },
              dropoffAddress: { type: 'string' },
              distance: { type: 'number' },
              duration: { type: 'number' },
              price: { type: 'number' },
              requestedAt: { type: 'string' },
              passenger: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  async getAvailableRides() {
    return await this.ridesService.getAvailableRides();
  }

  @Post(':rideId/accept')
  @ApiOperation({ summary: 'Accepter une course (chauffeur)' })
  @ApiParam({
    name: 'rideId',
    description: 'ID de la course à accepter',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Course acceptée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        ride: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            status: { type: 'string' },
            pickupAddress: { type: 'string' },
            dropoffAddress: { type: 'string' },
            distance: { type: 'number' },
            duration: { type: 'number' },
            price: { type: 'number' },
            requestedAt: { type: 'string' },
            acceptedAt: { type: 'string' },
            passenger: { type: 'object' },
            driver: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Course ou chauffeur non trouvé',
  })
  @ApiResponse({
    status: 409,
    description: 'Course déjà acceptée ou chauffeur non disponible',
  })
  async acceptRide(
    @Param('rideId', ParseIntPipe) rideId: number,
    @Body() acceptRideDto: AcceptRideDto,
  ) {
    return await this.ridesService.acceptRide(rideId, acceptRideDto);
  }

  @Put(':rideId/status')
  @ApiOperation({ summary: "Mettre à jour le statut d'une course" })
  @ApiParam({
    name: 'rideId',
    description: 'ID de la course',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Statut mis à jour avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        ride: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            status: { type: 'string' },
            pickupAddress: { type: 'string' },
            dropoffAddress: { type: 'string' },
            distance: { type: 'number' },
            duration: { type: 'number' },
            price: { type: 'number' },
            requestedAt: { type: 'string' },
            acceptedAt: { type: 'string' },
            startedAt: { type: 'string' },
            completedAt: { type: 'string' },
            cancelledAt: { type: 'string' },
            cancelReason: { type: 'string' },
            passenger: { type: 'object' },
            driver: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Course non trouvée',
  })
  @ApiResponse({
    status: 400,
    description: 'Transition de statut invalide',
  })
  async updateRideStatus(
    @Param('rideId', ParseIntPipe) rideId: number,
    @Body() updateRideStatusDto: UpdateRideStatusDto,
  ) {
    return await this.ridesService.updateRideStatus(
      rideId,
      updateRideStatusDto,
    );
  }

  @Get(':rideId')
  @ApiOperation({ summary: 'Récupérer une course par ID' })
  @ApiParam({
    name: 'rideId',
    description: 'ID de la course',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Course récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        ride: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            status: { type: 'string' },
            pickupLat: { type: 'number' },
            pickupLng: { type: 'number' },
            pickupAddress: { type: 'string' },
            dropoffLat: { type: 'number' },
            dropoffLng: { type: 'number' },
            dropoffAddress: { type: 'string' },
            distance: { type: 'number' },
            duration: { type: 'number' },
            price: { type: 'number' },
            requestedAt: { type: 'string' },
            acceptedAt: { type: 'string' },
            startedAt: { type: 'string' },
            completedAt: { type: 'string' },
            cancelledAt: { type: 'string' },
            cancelReason: { type: 'string' },
            passenger: { type: 'object' },
            driver: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Course non trouvée',
  })
  async getRideById(@Param('rideId', ParseIntPipe) rideId: number) {
    return await this.ridesService.getRideById(rideId);
  }

  @Get('passenger/:passengerId')
  @ApiOperation({ summary: "Récupérer les courses d'un passager" })
  @ApiParam({
    name: 'passengerId',
    description: 'ID du passager',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Courses récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        rides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              status: { type: 'string' },
              pickupAddress: { type: 'string' },
              dropoffAddress: { type: 'string' },
              distance: { type: 'number' },
              duration: { type: 'number' },
              price: { type: 'number' },
              requestedAt: { type: 'string' },
              acceptedAt: { type: 'string' },
              startedAt: { type: 'string' },
              completedAt: { type: 'string' },
              cancelledAt: { type: 'string' },
              driver: { type: 'object' },
            },
          },
        },
      },
    },
  })
  async getRidesByPassenger(
    @Param('passengerId', ParseIntPipe) passengerId: number,
  ) {
    return await this.ridesService.getRidesByPassenger(passengerId);
  }

  @Get('driver/:driverId')
  @ApiOperation({ summary: "Récupérer les courses d'un chauffeur" })
  @ApiParam({
    name: 'driverId',
    description: 'ID du chauffeur',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Courses récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        rides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              status: { type: 'string' },
              pickupAddress: { type: 'string' },
              dropoffAddress: { type: 'string' },
              distance: { type: 'number' },
              duration: { type: 'number' },
              price: { type: 'number' },
              requestedAt: { type: 'string' },
              acceptedAt: { type: 'string' },
              startedAt: { type: 'string' },
              completedAt: { type: 'string' },
              cancelledAt: { type: 'string' },
              passenger: { type: 'object' },
            },
          },
        },
      },
    },
  })
  async getRidesByDriver(@Param('driverId', ParseIntPipe) driverId: number) {
    return await this.ridesService.getRidesByDriver(driverId);
  }
}
