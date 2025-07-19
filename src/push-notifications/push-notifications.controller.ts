import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { PushNotificationsService } from './push-notifications.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('push-notifications')
@Controller('push-notifications')
@UseGuards(JwtAuthGuard)
export class PushNotificationsController {
  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Enregistrer un token de notification push' })
  @ApiResponse({ status: 201, description: 'Token enregistré avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  registerToken(
    @CurrentUser() user: any,
    @Body() registerTokenDto: RegisterTokenDto,
  ) {
    return this.pushNotificationsService.registerToken(
      user.id,
      registerTokenDto,
    );
  }

  @Post('unregister')
  @ApiOperation({ summary: 'Supprimer un token de notification push' })
  @ApiResponse({ status: 200, description: 'Token supprimé avec succès' })
  unregisterToken(
    @Body() data: { token: string },
  ) {
    return this.pushNotificationsService.unregisterToken(data.token);
  }

  @Post('send')
  @ApiOperation({ summary: 'Envoyer une notification push' })
  @ApiResponse({ status: 201, description: 'Notification envoyée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  sendNotification(@Body() sendNotificationDto: SendNotificationDto) {
    return this.pushNotificationsService.sendNotification(sendNotificationDto);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Mettre à jour les préférences de notification' })
  @ApiResponse({
    status: 200,
    description: 'Préférences mises à jour avec succès',
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  updatePreferences(
    @CurrentUser() user: any,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ) {
    return this.pushNotificationsService.updatePreferences(
      user.id,
      updatePreferencesDto,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtenir les statistiques des tokens push' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  getTokenStats() {
    return this.pushNotificationsService.getTokenStats();
  }

  @Post('send-to-user/:userId')
  @ApiOperation({ summary: 'Envoyer une notification à un utilisateur spécifique' })
  @ApiParam({ name: 'userId', description: "ID de l'utilisateur" })
  @ApiResponse({ status: 201, description: 'Notification envoyée avec succès' })
  sendToUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() notificationData: {
      title: string;
      body: string;
      data?: Record<string, any>;
      priority?: 'high' | 'normal';
    },
  ) {
    return this.pushNotificationsService.sendToUser(userId, notificationData);
  }

  @Post('send-to-drivers')
  @ApiOperation({ summary: 'Envoyer une notification à des chauffeurs spécifiques' })
  @ApiResponse({ status: 201, description: 'Notification envoyée avec succès' })
  sendToDrivers(
    @Body() data: {
      driverIds: number[];
      title: string;
      body: string;
      data?: Record<string, any>;
      priority?: 'high' | 'normal';
    },
  ) {
    return this.pushNotificationsService.sendToDrivers(
      data.driverIds,
      {
        title: data.title,
        body: data.body,
        data: data.data,
        priority: data.priority,
      },
    );
  }

  @Post('send-to-nearby-drivers')
  @ApiOperation({ summary: 'Envoyer une notification aux chauffeurs à proximité' })
  @ApiResponse({ status: 201, description: 'Notification envoyée avec succès' })
  sendToNearbyDrivers(
    @Body() data: {
      latitude: number;
      longitude: number;
      radius: number;
      title: string;
      body: string;
      data?: Record<string, any>;
      priority?: 'high' | 'normal';
    },
  ) {
    return this.pushNotificationsService.sendToNearbyDrivers(
      data.latitude,
      data.longitude,
      data.radius,
      {
        title: data.title,
        body: data.body,
        data: data.data,
        priority: data.priority,
      },
    );
  }
}
