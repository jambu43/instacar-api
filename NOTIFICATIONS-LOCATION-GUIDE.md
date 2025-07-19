# Guide des Notifications et Géolocalisation - API InstaCar

Ce guide détaille l'utilisation des nouvelles fonctionnalités de notifications et de géolocalisation en temps réel de l'API InstaCar.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Système de Notifications](#système-de-notifications)
3. [Géolocalisation en Temps Réel](#géolocalisation-en-temps-réel)
4. [WebSockets](#websockets)
5. [Intégration avec les Courses](#intégration-avec-les-courses)
6. [Exemples d'utilisation](#exemples-dutilisation)
7. [Tests](#tests)

## Vue d'ensemble

L'API InstaCar propose maintenant un système complet de notifications et de géolocalisation en temps réel pour améliorer l'expérience utilisateur :

- **Notifications** : Système de notifications push pour informer les utilisateurs des événements importants
- **Géolocalisation** : Suivi en temps réel de la position des chauffeurs
- **WebSockets** : Communication bidirectionnelle pour les mises à jour instantanées

## Système de Notifications

### Types de Notifications

```typescript
enum NotificationType {
  RIDE_REQUESTED     // Nouvelle demande de course
  RIDE_ACCEPTED      // Course acceptée par un chauffeur
  RIDE_STARTED       // Course commencée
  RIDE_COMPLETED     // Course terminée
  RIDE_CANCELLED     // Course annulée
  DRIVER_ARRIVING    // Chauffeur en route
  DRIVER_ARRIVED     // Chauffeur arrivé
  PAYMENT_SUCCESS    // Paiement réussi
  PAYMENT_FAILED     // Paiement échoué
  SYSTEM_MESSAGE     // Message système
  PROMOTION          // Promotion ou offre spéciale
}
```

### Endpoints des Notifications

#### Créer une notification
```http
POST /api/notifications
Content-Type: application/json

{
  "userId": 1,
  "type": "RIDE_ACCEPTED",
  "title": "Chauffeur trouvé !",
  "message": "Pierre Martin a accepté votre course.",
  "rideId": 123,
  "driverId": 456
}
```

#### Récupérer les notifications d'un utilisateur
```http
GET /api/notifications/user/{userId}
```

#### Récupérer les notifications non lues
```http
GET /api/notifications/user/{userId}/unread
```

#### Compter les notifications non lues
```http
GET /api/notifications/user/{userId}/count
```

#### Marquer une notification comme lue
```http
PATCH /api/notifications/{id}/user/{userId}/read
```

#### Marquer toutes les notifications comme lues
```http
PATCH /api/notifications/user/{userId}/read-all
```

#### Supprimer une notification
```http
DELETE /api/notifications/{id}/user/{userId}
```

### Exemple de réponse

```json
{
  "id": 1,
  "userId": 1,
  "type": "RIDE_ACCEPTED",
  "title": "Chauffeur trouvé !",
  "message": "Pierre Martin a accepté votre course.",
  "data": null,
  "isRead": false,
  "readAt": null,
  "createdAt": "2024-01-15T10:30:00Z",
  "ride": {
    "id": 123,
    "pickupAddress": "Tour Eiffel, Paris",
    "dropoffAddress": "Arc de Triomphe, Paris",
    "status": "ACCEPTED"
  },
  "driver": {
    "id": 456,
    "fullName": "Pierre Martin",
    "phone": "+33987654321"
  }
}
```

## Géolocalisation en Temps Réel

### Endpoints de Géolocalisation

#### Mettre à jour la localisation d'un chauffeur
```http
POST /api/location/driver/{driverId}/update
Content-Type: application/json

{
  "latitude": 48.8566,
  "longitude": 2.3522,
  "accuracy": 10,
  "speed": 25,
  "heading": 180
}
```

#### Récupérer la localisation actuelle d'un chauffeur
```http
GET /api/location/driver/{driverId}/current
```

#### Récupérer l'historique des localisations
```http
GET /api/location/driver/{driverId}/history?limit=50
```

#### Rechercher les chauffeurs à proximité
```http
GET /api/location/nearby-drivers?latitude=48.8566&longitude=2.3522&radius=5
```

#### Suivre la progression d'une course
```http
GET /api/location/ride/{rideId}/track
```

#### Calculer le temps d'arrivée estimé
```http
GET /api/location/eta/driver/{driverId}?destinationLat=48.8606&destinationLng=2.3376
```

### Exemple de réponse de localisation

```json
{
  "id": 1,
  "fullName": "Pierre Martin",
  "currentLat": 48.8566,
  "currentLng": 2.3522,
  "lastLocationUpdate": "2024-01-15T10:30:00Z",
  "isAvailable": true
}
```

### Exemple de suivi de course

```json
{
  "rideId": 123,
  "driver": {
    "id": 456,
    "fullName": "Pierre Martin",
    "currentLocation": {
      "latitude": 48.8566,
      "longitude": 2.3522,
      "lastUpdate": "2024-01-15T10:30:00Z"
    }
  },
  "distances": {
    "toPickup": 0.5,
    "pickupToDropoff": 2.1
  },
  "eta": {
    "toPickup": 2,
    "total": 8
  }
}
```

## WebSockets

### Connexion

```javascript
const socket = io('http://localhost:3000');
```

### Authentification

```javascript
socket.emit('authenticate', {
  userId: 1,
  userType: 'passenger' // ou 'driver'
});
```

### Événements d'écoute

#### Nouvelle notification
```javascript
socket.on('new-notification', (data) => {
  console.log('Nouvelle notification:', data.notification);
});
```

#### Mise à jour de localisation du chauffeur
```javascript
socket.on('driver-location-updated', (data) => {
  console.log('Localisation mise à jour:', data.location);
});
```

#### Mise à jour du statut de course
```javascript
socket.on('ride-status-updated', (data) => {
  console.log('Statut de course mis à jour:', data.status);
});
```

### Événements d'émission

#### Rejoindre une course
```javascript
socket.emit('join-ride', { rideId: 123 });
```

#### Mettre à jour la localisation (chauffeur)
```javascript
socket.emit('driver-location-update', {
  driverId: 456,
  latitude: 48.8566,
  longitude: 2.3522,
  accuracy: 10,
  speed: 25,
  heading: 180
});
```

#### Mettre à jour le statut de course
```javascript
socket.emit('ride-status-update', {
  rideId: 123,
  status: 'ARRIVING',
  driverId: 456,
  estimatedArrival: 5
});
```

## Intégration avec les Courses

### Notifications automatiques

Le système génère automatiquement des notifications lors des événements de course :

1. **Course demandée** : Notification au passager
2. **Course acceptée** : Notification au passager avec les détails du chauffeur
3. **Chauffeur en route** : Notification au passager
4. **Course commencée** : Notification au passager
5. **Course terminée** : Notification au passager

### Exemple d'intégration

```typescript
// Dans le service de courses
async acceptRide(rideId: number, driverId: number) {
  // ... logique d'acceptation ...
  
  // Créer une notification automatique
  await this.notificationsService.createRideAcceptedNotification(
    ride.passengerId,
    driverId,
    rideId
  );
  
  // Émettre un événement WebSocket
  this.eventEmitter.emit('ride.status.changed', {
    rideId,
    status: 'ACCEPTED',
    driverId,
    passengerId: ride.passengerId
  });
}
```

## Exemples d'utilisation

### Application mobile (React Native)

```javascript
import io from 'socket.io-client';

class InstaCarService {
  constructor() {
    this.socket = io('http://localhost:3000');
    this.setupListeners();
  }

  setupListeners() {
    // Authentification
    this.socket.emit('authenticate', {
      userId: this.userId,
      userType: this.userType
    });

    // Écouter les notifications
    this.socket.on('new-notification', (data) => {
      this.showNotification(data.notification);
    });

    // Écouter les mises à jour de localisation
    this.socket.on('driver-location-updated', (data) => {
      this.updateDriverLocation(data.location);
    });
  }

  // Mettre à jour la localisation (pour les chauffeurs)
  updateLocation(latitude, longitude) {
    this.socket.emit('driver-location-update', {
      driverId: this.driverId,
      latitude,
      longitude,
      accuracy: 10
    });
  }

  // Rejoindre une course pour recevoir les mises à jour
  joinRide(rideId) {
    this.socket.emit('join-ride', { rideId });
  }
}
```

### Application web (JavaScript)

```javascript
// Connexion WebSocket
const socket = io('http://localhost:3000');

// Authentification
socket.emit('authenticate', {
  userId: 1,
  userType: 'passenger'
});

// Écouter les notifications
socket.on('new-notification', (data) => {
  const notification = data.notification;
  
  // Afficher une notification toast
  showToast(notification.title, notification.message);
  
  // Mettre à jour le compteur de notifications
  updateNotificationCount();
});

// Écouter les mises à jour de localisation
socket.on('driver-location-updated', (data) => {
  const location = data.location;
  
  // Mettre à jour la carte
  updateDriverMarker(location.latitude, location.longitude);
  
  // Mettre à jour l'ETA
  updateETA(location);
});
```

## Tests

### Script de test automatique

Exécutez le script de test pour vérifier toutes les fonctionnalités :

```bash
chmod +x test-notifications-location.sh
./test-notifications-location.sh
```

### Tests manuels

#### Test des notifications

1. Créer un utilisateur
2. Créer une notification
3. Vérifier la récupération des notifications
4. Marquer comme lue
5. Vérifier le compteur

#### Test de la géolocalisation

1. Créer un chauffeur
2. Mettre à jour sa localisation
3. Récupérer sa position actuelle
4. Rechercher les chauffeurs à proximité
5. Calculer l'ETA

#### Test des WebSockets

1. Se connecter au WebSocket
2. S'authentifier
3. Rejoindre une course
4. Envoyer des mises à jour de localisation
5. Vérifier la réception des événements

### Outils de test

- **Postman** : Pour tester les endpoints REST
- **Socket.IO Client** : Pour tester les WebSockets
- **Scripts bash** : Pour les tests automatisés

## Configuration

### Variables d'environnement

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/instacar"

# WebSocket
WS_PORT=3000

# Notifications
NOTIFICATION_RETENTION_DAYS=30
```

### Configuration WebSocket

```typescript
// Dans main.ts
const app = await NestFactory.create(AppModule);
app.enableCors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
});
```

## Sécurité

### Authentification WebSocket

- Tous les utilisateurs doivent s'authentifier avant d'utiliser les WebSockets
- Les rooms sont isolées par utilisateur et par course
- Validation des permissions pour chaque événement

### Validation des données

- Validation des coordonnées GPS
- Limitation de la fréquence des mises à jour
- Sanitisation des messages de notification

## Performance

### Optimisations

- Indexation des tables de localisation
- Limitation de l'historique des localisations
- Compression des données WebSocket
- Mise en cache des positions fréquemment demandées

### Monitoring

- Logs des connexions WebSocket
- Métriques de performance
- Alertes en cas d'anomalies

## Support

Pour toute question ou problème :

1. Consultez la documentation API
2. Vérifiez les logs du serveur
3. Testez avec les scripts fournis
4. Contactez l'équipe de développement

---

**Note** : Ce guide est régulièrement mis à jour. Vérifiez la version la plus récente pour les dernières fonctionnalités. 