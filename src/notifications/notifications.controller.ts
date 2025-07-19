import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle notification' })
  @ApiResponse({ status: 201, description: 'Notification créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: "Récupérer toutes les notifications d'un utilisateur",
  })
  @ApiParam({ name: 'userId', description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'Liste des notifications' })
  findAll(@Param('userId', ParseIntPipe) userId: number) {
    return this.notificationsService.findAll(userId);
  }

  @Get('user/:userId/unread')
  @ApiOperation({
    summary: "Récupérer les notifications non lues d'un utilisateur",
  })
  @ApiParam({ name: 'userId', description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'Liste des notifications non lues' })
  findUnread(@Param('userId', ParseIntPipe) userId: number) {
    return this.notificationsService.findUnread(userId);
  }

  @Get('user/:userId/count')
  @ApiOperation({
    summary: "Compter les notifications non lues d'un utilisateur",
  })
  @ApiParam({ name: 'userId', description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'Nombre de notifications non lues' })
  getUnreadCount(@Param('userId', ParseIntPipe) userId: number) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Get(':id/user/:userId')
  @ApiOperation({ summary: 'Récupérer une notification spécifique' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiParam({ name: 'userId', description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'Notification trouvée' })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.notificationsService.findOne(id, userId);
  }

  @Patch(':id/user/:userId')
  @ApiOperation({ summary: 'Mettre à jour une notification' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiParam({ name: 'userId', description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'Notification mise à jour' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, userId, updateNotificationDto);
  }

  @Patch(':id/user/:userId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiParam({ name: 'userId', description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'Notification marquée comme lue' })
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('user/:userId/read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  @ApiParam({ name: 'userId', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Toutes les notifications marquées comme lues',
  })
  markAllAsRead(@Param('userId', ParseIntPipe) userId: number) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id/user/:userId')
  @ApiOperation({ summary: 'Supprimer une notification' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiParam({ name: 'userId', description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'Notification supprimée' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.notificationsService.remove(id, userId);
  }
}
