import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

interface UserSocket {
  userId: number;
  userType: 'passenger' | 'driver';
  socket: Socket;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private connectedUsers: Map<string, UserSocket> = new Map();

  constructor(private eventEmitter: EventEmitter2) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialisé');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connecté: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté: ${client.id}`);

    // Supprimer l'utilisateur de la liste des utilisateurs connectés
    for (const [socketId, userSocket] of this.connectedUsers.entries()) {
      if (userSocket.socket.id === client.id) {
        this.connectedUsers.delete(socketId);
        this.logger.log(`Utilisateur ${userSocket.userId} déconnecté`);
        break;
      }
    }
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @MessageBody() data: { userId: number; userType: 'passenger' | 'driver' },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, userType } = data;

    // Stocker les informations de l'utilisateur
    this.connectedUsers.set(client.id, {
      userId,
      userType,
      socket: client,
    });

    // Rejoindre une room spécifique à l'utilisateur
    client.join(`user:${userId}`);

    // Rejoindre une room selon le type d'utilisateur
    if (userType === 'driver') {
      client.join('drivers');
    } else {
      client.join('passengers');
    }

    this.logger.log(`Utilisateur ${userId} (${userType}) authentifié`);

    return { success: true, message: 'Authentification réussie' };
  }

  @SubscribeMessage('join-ride')
  handleJoinRide(
    @MessageBody() data: { rideId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { rideId } = data;

    // Rejoindre la room de la course
    client.join(`ride:${rideId}`);

    this.logger.log(`Client ${client.id} a rejoint la course ${rideId}`);

    return { success: true, message: `Rejoint la course ${rideId}` };
  }

  @SubscribeMessage('leave-ride')
  handleLeaveRide(
    @MessageBody() data: { rideId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { rideId } = data;

    // Quitter la room de la course
    client.leave(`ride:${rideId}`);

    this.logger.log(`Client ${client.id} a quitté la course ${rideId}`);

    return { success: true, message: `Quitté la course ${rideId}` };
  }

  @SubscribeMessage('driver-location-update')
  handleDriverLocationUpdate(
    @MessageBody()
    data: {
      driverId: number;
      latitude: number;
      longitude: number;
      accuracy?: number;
      speed?: number;
      heading?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { driverId, latitude, longitude, accuracy, speed, heading } = data;

    // Émettre la mise à jour de localisation à tous les clients dans la room du chauffeur
    this.server.to(`driver:${driverId}`).emit('driver-location-updated', {
      driverId,
      location: {
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        timestamp: new Date(),
      },
    });

    this.logger.log(`Localisation mise à jour pour le chauffeur ${driverId}`);

    return { success: true, message: 'Localisation mise à jour' };
  }

  @SubscribeMessage('ride-status-update')
  handleRideStatusUpdate(
    @MessageBody()
    data: {
      rideId: number;
      status: string;
      driverId?: number;
      estimatedArrival?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { rideId, status, driverId, estimatedArrival } = data;

    // Émettre la mise à jour de statut à tous les clients dans la room de la course
    this.server.to(`ride:${rideId}`).emit('ride-status-updated', {
      rideId,
      status,
      driverId,
      estimatedArrival,
      timestamp: new Date(),
    });

    this.logger.log(`Statut de la course ${rideId} mis à jour: ${status}`);

    return { success: true, message: 'Statut de la course mis à jour' };
  }

  // Événements écoutés depuis l'EventEmitter
  @OnEvent('notification.created')
  handleNotificationCreated(payload: { userId: number; notification: any }) {
    const { userId, notification } = payload;

    // Envoyer la notification à l'utilisateur spécifique
    this.server.to(`user:${userId}`).emit('new-notification', {
      notification,
      timestamp: new Date(),
    });

    this.logger.log(`Notification envoyée à l'utilisateur ${userId}`);
  }

  @OnEvent('location.updated')
  handleLocationUpdated(payload: { driverId: number; location: any }) {
    const { driverId, location } = payload;

    // Envoyer la mise à jour de localisation à tous les clients intéressés
    this.server.to(`driver:${driverId}`).emit('driver-location-updated', {
      driverId,
      location,
      timestamp: new Date(),
    });

    this.logger.log(`Localisation du chauffeur ${driverId} diffusée`);
  }

  @OnEvent('ride.status.changed')
  handleRideStatusChanged(payload: {
    rideId: number;
    status: string;
    driverId?: number;
    passengerId?: number;
  }) {
    const { rideId, status, driverId, passengerId } = payload;

    // Envoyer la mise à jour de statut à tous les clients dans la room de la course
    this.server.to(`ride:${rideId}`).emit('ride-status-updated', {
      rideId,
      status,
      driverId,
      passengerId,
      timestamp: new Date(),
    });

    this.logger.log(`Statut de la course ${rideId} diffusé: ${status}`);
  }

  // Méthodes utilitaires pour envoyer des messages spécifiques
  sendNotificationToUser(userId: number, notification: any) {
    this.server.to(`user:${userId}`).emit('new-notification', {
      notification,
      timestamp: new Date(),
    });
  }

  sendLocationUpdateToRide(rideId: number, driverId: number, location: any) {
    this.server.to(`ride:${rideId}`).emit('driver-location-updated', {
      driverId,
      location,
      timestamp: new Date(),
    });
  }

  sendRideStatusUpdateToRide(rideId: number, status: string, data?: any) {
    this.server.to(`ride:${rideId}`).emit('ride-status-updated', {
      rideId,
      status,
      ...data,
      timestamp: new Date(),
    });
  }

  sendMessageToDrivers(event: string, data: any) {
    this.server.to('drivers').emit(event, data);
  }

  sendMessageToPassengers(event: string, data: any) {
    this.server.to('passengers').emit(event, data);
  }

  // Méthode pour obtenir les statistiques des connexions
  getConnectionStats() {
    return {
      totalConnections: this.connectedUsers.size,
      connectedUsers: Array.from(this.connectedUsers.values()).map((user) => ({
        userId: user.userId,
        userType: user.userType,
        socketId: user.socket.id,
      })),
    };
  }
}
