# 🚗 Guide des courses - InstaCar API

Ce guide explique comment utiliser le système de courses pour permettre aux passagers de commander des trajets et aux chauffeurs de les accepter.

## 🎯 Vue d'ensemble

Le système de courses permet :
- **Passagers** : Créer des demandes de course
- **Chauffeurs** : Voir et accepter les courses disponibles
- **Suivi** : Suivre l'état de la course en temps réel
- **Finalisation** : Terminer les courses et mettre à jour les statistiques

## 📋 Workflow complet d'une course

### 1. Création d'une course par le passager

```http
POST /rides
```

**Données à envoyer :**
```json
{
  "passengerId": 1,
  "pickupLat": 48.8566,
  "pickupLng": 2.3522,
  "pickupAddress": "123 Rue de la Paix, Paris",
  "dropoffLat": 48.8584,
  "dropoffLng": 2.2945,
  "dropoffAddress": "456 Avenue des Champs-Élysées, Paris",
  "price": 15.50
}
```

**Réponse réussie (201) :**
```json
{
  "success": true,
  "message": "Course créée avec succès",
  "ride": {
    "id": 1,
    "status": "REQUESTED",
    "pickupAddress": "123 Rue de la Paix, Paris",
    "dropoffAddress": "456 Avenue des Champs-Élysées, Paris",
    "distance": 4.23,
    "duration": null,
    "price": "15.5",
    "requestedAt": "2025-07-19T06:12:16.006Z",
    "passenger": {
      "id": 1,
      "name": "Marie Dupont",
      "phone": "+33123456789"
    }
  }
}
```

### 2. Recherche de courses disponibles (chauffeurs)

```http
GET /rides/available
```

**Réponse réussie (200) :**
```json
{
  "success": true,
  "rides": [
    {
      "id": 1,
      "status": "REQUESTED",
      "pickupAddress": "123 Rue de la Paix, Paris",
      "dropoffAddress": "456 Avenue des Champs-Élysées, Paris",
      "distance": 4.23,
      "duration": null,
      "price": "15.5",
      "requestedAt": "2025-07-19T06:12:16.006Z",
      "passenger": {
        "id": 1,
        "name": "Marie Dupont",
        "phone": "+33123456789"
      }
    }
  ]
}
```

### 3. Acceptation de la course par le chauffeur

```http
POST /rides/{rideId}/accept
```

**Données à envoyer :**
```json
{
  "driverId": 1,
  "currentLat": 48.8566,
  "currentLng": 2.3522
}
```

**Réponse réussie (200) :**
```json
{
  "success": true,
  "message": "Course acceptée avec succès",
  "ride": {
    "id": 1,
    "status": "ACCEPTED",
    "pickupAddress": "123 Rue de la Paix, Paris",
    "dropoffAddress": "456 Avenue des Champs-Élysées, Paris",
    "distance": 4.23,
    "duration": null,
    "price": "15.5",
    "requestedAt": "2025-07-19T06:12:16.006Z",
    "acceptedAt": "2025-07-19T06:12:23.979Z",
    "passenger": {
      "id": 1,
      "name": "Marie Dupont",
      "phone": "+33123456789"
    },
    "driver": {
      "id": 1,
      "fullName": "Pierre Martin",
      "phone": "+33123456790",
      "profilePhoto": null,
      "rating": 4.5,
      "vehicle": {
        "id": 1,
        "brand": "Renault",
        "model": "Clio",
        "color": "Rouge",
        "plateNumber": "AB-123-CD"
      }
    }
  }
}
```

### 4. Mise à jour du statut de la course

```http
PUT /rides/{rideId}/status
```

**Statuts possibles :**
- `ARRIVING` - Le chauffeur arrive au point de départ
- `IN_PROGRESS` - La course est en cours
- `COMPLETED` - La course est terminée
- `CANCELLED` - La course est annulée

**Exemple de mise à jour :**
```json
{
  "status": "ARRIVING"
}
```

**Réponse réussie (200) :**
```json
{
  "success": true,
  "message": "Statut de la course mis à jour vers ARRIVING",
  "ride": {
    "id": 1,
    "status": "ARRIVING",
    "pickupAddress": "123 Rue de la Paix, Paris",
    "dropoffAddress": "456 Avenue des Champs-Élysées, Paris",
    "distance": 4.23,
    "duration": null,
    "price": "15.5",
    "requestedAt": "2025-07-19T06:12:16.006Z",
    "acceptedAt": "2025-07-19T06:12:23.979Z",
    "startedAt": "2025-07-19T06:12:35.601Z",
    "completedAt": null,
    "cancelledAt": null,
    "cancelReason": null,
    "passenger": { ... },
    "driver": { ... }
  }
}
```

## 🔄 États de la course

### Diagramme des transitions

```
REQUESTED → ACCEPTED → ARRIVING → IN_PROGRESS → COMPLETED
     ↓           ↓         ↓           ↓
  CANCELLED   CANCELLED  CANCELLED  CANCELLED
```

### Règles de transition

| État actuel | États autorisés |
|-------------|-----------------|
| REQUESTED   | SEARCHING, ACCEPTED, CANCELLED |
| SEARCHING   | ACCEPTED, CANCELLED |
| ACCEPTED    | ARRIVING, CANCELLED |
| ARRIVING    | IN_PROGRESS, CANCELLED |
| IN_PROGRESS | COMPLETED, CANCELLED |
| COMPLETED   | (aucun) |
| CANCELLED   | (aucun) |

## 📱 Utilisation dans l'application mobile

### Pour les passagers

#### Créer une course
```javascript
const createRide = async (rideData) => {
  const response = await fetch('/rides', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rideData)
  });
  return response.json();
};

// Exemple d'utilisation
const newRide = await createRide({
  passengerId: 1,
  pickupLat: 48.8566,
  pickupLng: 2.3522,
  pickupAddress: "123 Rue de la Paix, Paris",
  dropoffLat: 48.8584,
  dropoffLng: 2.2945,
  dropoffAddress: "456 Avenue des Champs-Élysées, Paris",
  price: 15.50
});
```

#### Suivre le statut de la course
```javascript
const getRideStatus = async (rideId) => {
  const response = await fetch(`/rides/${rideId}`);
  return response.json();
};

// Polling pour mettre à jour le statut
const pollRideStatus = async (rideId) => {
  const interval = setInterval(async () => {
    const ride = await getRideStatus(rideId);
    updateUI(ride);
    
    if (ride.ride.status === 'COMPLETED' || ride.ride.status === 'CANCELLED') {
      clearInterval(interval);
    }
  }, 5000); // Vérifier toutes les 5 secondes
};
```

#### Voir l'historique des courses
```javascript
const getRideHistory = async (passengerId) => {
  const response = await fetch(`/rides/passenger/${passengerId}`);
  return response.json();
};
```

### Pour les chauffeurs

#### Voir les courses disponibles
```javascript
const getAvailableRides = async () => {
  const response = await fetch('/rides/available');
  return response.json();
};

// Mettre à jour la liste périodiquement
const updateAvailableRides = async () => {
  const rides = await getAvailableRides();
  displayRides(rides.rides);
};
```

#### Accepter une course
```javascript
const acceptRide = async (rideId, driverId, currentLocation) => {
  const response = await fetch(`/rides/${rideId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      driverId: driverId,
      currentLat: currentLocation.lat,
      currentLng: currentLocation.lng
    })
  });
  return response.json();
};
```

#### Mettre à jour le statut
```javascript
const updateRideStatus = async (rideId, status, cancelReason = null) => {
  const response = await fetch(`/rides/${rideId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: status,
      cancelReason: cancelReason
    })
  });
  return response.json();
};

// Exemples d'utilisation
await updateRideStatus(rideId, 'ARRIVING');
await updateRideStatus(rideId, 'IN_PROGRESS');
await updateRideStatus(rideId, 'COMPLETED');
await updateRideStatus(rideId, 'CANCELLED', 'Passager non trouvé');
```

#### Voir l'historique des courses
```javascript
const getDriverHistory = async (driverId) => {
  const response = await fetch(`/rides/driver/${driverId}`);
  return response.json();
};
```

## 🧪 Tests et exemples

### Scripts de test disponibles

```bash
# Test complet du workflow des courses
./test-ride-workflow.sh

# Test de disponibilité des chauffeurs
./test-driver-availability.sh

# Démonstration du workflow chauffeur
./demo-driver-workflow.sh
```

### Exemples avec cURL

#### Créer une course
```bash
curl -X POST http://localhost:3000/rides \
  -H "Content-Type: application/json" \
  -d '{
    "passengerId": 1,
    "pickupLat": 48.8566,
    "pickupLng": 2.3522,
    "pickupAddress": "123 Rue de la Paix, Paris",
    "dropoffLat": 48.8584,
    "dropoffLng": 2.2945,
    "dropoffAddress": "456 Avenue des Champs-Élysées, Paris",
    "price": 15.50
  }'
```

#### Voir les courses disponibles
```bash
curl -X GET http://localhost:3000/rides/available
```

#### Accepter une course
```bash
curl -X POST http://localhost:3000/rides/1/accept \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": 1,
    "currentLat": 48.8566,
    "currentLng": 2.3522
  }'
```

#### Mettre à jour le statut
```bash
curl -X PUT http://localhost:3000/rides/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ARRIVING"
  }'
```

#### Voir les détails d'une course
```bash
curl -X GET http://localhost:3000/rides/1
```

#### Voir l'historique d'un passager
```bash
curl -X GET http://localhost:3000/rides/passenger/1
```

#### Voir l'historique d'un chauffeur
```bash
curl -X GET http://localhost:3000/rides/driver/1
```

## ⚠️ Points importants

### Règles métier

1. **Une course à la fois** : Un passager ne peut avoir qu'une seule course active
2. **Chauffeur disponible** : Un chauffeur ne peut accepter qu'une course à la fois
3. **Transitions valides** : Les changements de statut doivent suivre le workflow défini
4. **Position requise** : La position GPS est mise à jour lors de l'acceptation
5. **Statistiques automatiques** : Les stats du chauffeur sont mises à jour à la fin

### Gestion des erreurs

#### Erreur 404 - Course non trouvée
```json
{
  "statusCode": 404,
  "message": "Course non trouvée"
}
```

#### Erreur 409 - Course déjà acceptée
```json
{
  "statusCode": 409,
  "message": "La course ne peut pas être acceptée (statut: ACCEPTED)"
}
```

#### Erreur 409 - Chauffeur non disponible
```json
{
  "statusCode": 409,
  "message": "Le chauffeur a déjà une course en cours"
}
```

#### Erreur 400 - Transition invalide
```json
{
  "statusCode": 400,
  "message": "Transition de statut invalide: ARRIVING -> COMPLETED"
}
```

### Bonnes pratiques

1. **Polling intelligent** : Mettre à jour le statut toutes les 5-10 secondes
2. **Gestion des erreurs** : Toujours gérer les cas d'erreur réseau
3. **Validation côté client** : Vérifier les données avant envoi
4. **Feedback utilisateur** : Informer l'utilisateur des changements de statut
5. **Gestion de la batterie** : Réduire la fréquence en arrière-plan

## 🔧 Configuration avancée

### Variables d'environnement

```env
# Intervalle de polling par défaut (ms)
DEFAULT_POLLING_INTERVAL=5000

# Timeout pour l'acceptation de course (ms)
RIDE_ACCEPTANCE_TIMEOUT=30000

# Distance maximale pour l'acceptation (km)
MAX_ACCEPTANCE_DISTANCE=10
```

### Personnalisation

Le système peut être personnalisé pour :
- Ajuster les algorithmes de calcul de distance
- Ajouter des notifications push
- Intégrer des services de paiement
- Optimiser les performances de recherche
- Ajouter des fonctionnalités de chat

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs de l'application
2. Utilisez les scripts de test pour diagnostiquer
3. Vérifiez la documentation Swagger : `http://localhost:3000/api`
4. Consultez le guide de dépannage : `TROUBLESHOOTING.md` 