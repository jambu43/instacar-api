# 🚗 Guide de disponibilité des chauffeurs - InstaCar API

Ce guide explique comment utiliser le système de disponibilité des chauffeurs pour qu'ils puissent recevoir des courses.

## 🎯 Vue d'ensemble

Le système de disponibilité permet aux chauffeurs de :
- **S'activer** pour recevoir des courses
- **Se désactiver** quand ils ne sont pas disponibles
- **Mettre à jour leur position** pour être trouvés par les passagers
- **Apparaître dans les recherches** uniquement quand ils sont en ligne

## 📋 Workflow complet

### 1. Inscription du chauffeur (2 étapes)

#### Étape 1 : Enregistrement du véhicule
```http
POST /drivers/register-vehicle
```

```json
{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Toyota",
  "model": "Corolla",
  "color": "Blanc",
  "year": 2023,
  "plateNumber": "AB-123-CD"
}
```

#### Étape 2 : Enregistrement du chauffeur
```http
POST /drivers/register-driver/{vehicleId}
```

```json
{
  "fullName": "Jean Dupont",
  "phone": "+33123456789",
  "licenseNumber": "123456789012345",
  "identityDocument": "documents/test.pdf"
}
```

### 2. Vérification du statut d'inscription

```http
GET /drivers/status/{driverId}
```

**Réponse :**
```json
{
  "success": true,
  "isVehicleRegistered": true,
  "isIdentityComplete": true,
  "isRegistrationComplete": true,
  "driver": { ... }
}
```

### 3. Mise en ligne du chauffeur

```http
PUT /drivers/availability/{driverId}
```

```json
{
  "isAvailable": true,
  "currentLat": 48.8566,
  "currentLng": 2.3522
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Chauffeur mis en ligne avec succès",
  "driver": {
    "id": 1,
    "fullName": "Jean Dupont",
    "isAvailable": true,
    "currentLat": 48.8566,
    "currentLng": 2.3522,
    "lastLocationUpdate": "2025-07-18T20:44:34.470Z",
    "vehicle": { ... }
  }
}
```

### 4. Recherche de chauffeurs disponibles

```http
POST /drivers/search
```

```json
{
  "lat": 48.8566,
  "lng": 2.3522,
  "radius": 5,
  "vehicleType": "PROPRIETAIRE",
  "limit": 10
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "1 chauffeur(s) disponible(s) trouvé(s)",
  "searchLocation": {
    "lat": 48.8566,
    "lng": 2.3522,
    "radius": 5
  },
  "drivers": [
    {
      "id": 1,
      "fullName": "Jean Dupont",
      "phone": "+33123456789",
      "profilePhoto": "http://localhost:3000/uploads/profiles/photo.jpg",
      "rating": 4.5,
      "totalRides": 150,
      "distance": 1.2,
      "currentLocation": {
        "lat": 48.8566,
        "lng": 2.3522,
        "lastUpdate": "2025-07-18T20:44:34.470Z"
      },
      "vehicle": {
        "id": 1,
        "brand": "Toyota",
        "model": "Corolla",
        "color": "Blanc",
        "plateNumber": "AB-123-CD",
        "vehicleType": "PROPRIETAIRE"
      }
    }
  ]
}
```

### 5. Mise hors ligne du chauffeur

```http
PUT /drivers/availability/{driverId}
```

```json
{
  "isAvailable": false
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Chauffeur mis hors ligne avec succès",
  "driver": {
    "id": 1,
    "fullName": "Jean Dupont",
    "isAvailable": false,
    "currentLat": 48.8566,
    "currentLng": 2.3522,
    "lastLocationUpdate": "2025-07-18T20:44:34.470Z",
    "vehicle": { ... }
  }
}
```

## 🔍 Fonctionnalités de recherche

### Paramètres de recherche

| Paramètre | Type | Requis | Description | Exemple |
|-----------|------|--------|-------------|---------|
| `lat` | number | ✅ | Latitude de la position de recherche | 48.8566 |
| `lng` | number | ✅ | Longitude de la position de recherche | 2.3522 |
| `radius` | number | ❌ | Rayon de recherche en km (défaut: 5) | 5 |
| `vehicleType` | string | ❌ | Type de véhicule (PROPRIETAIRE/LOCATION) | "PROPRIETAIRE" |
| `limit` | number | ❌ | Nombre max de résultats (défaut: 10) | 10 |

### Critères de recherche

Les chauffeurs apparaissent dans la recherche uniquement si :
- ✅ `isAvailable = true`
- ✅ `isRegistrationComplete = true`
- ✅ `currentLat` et `currentLng` sont définis
- ✅ Distance ≤ rayon de recherche
- ✅ Type de véhicule correspond (si spécifié)

### Tri des résultats

Les chauffeurs sont triés par :
1. **Distance** (du plus proche au plus loin)
2. **Limite** (nombre maximum de résultats)

## 📱 Utilisation dans l'application mobile

### Pour les chauffeurs

#### Mise en ligne
```javascript
// Quand le chauffeur veut recevoir des courses
const goOnline = async (driverId, lat, lng) => {
  const response = await fetch(`/drivers/availability/${driverId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      isAvailable: true,
      currentLat: lat,
      currentLng: lng
    })
  });
  return response.json();
};
```

#### Mise hors ligne
```javascript
// Quand le chauffeur ne veut plus recevoir de courses
const goOffline = async (driverId) => {
  const response = await fetch(`/drivers/availability/${driverId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      isAvailable: false
    })
  });
  return response.json();
};
```

#### Mise à jour de position
```javascript
// Mettre à jour la position périodiquement
const updateLocation = async (driverId, lat, lng) => {
  const response = await fetch(`/drivers/availability/${driverId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      isAvailable: true, // Garder en ligne
      currentLat: lat,
      currentLng: lng
    })
  });
  return response.json();
};
```

### Pour les passagers

#### Recherche de chauffeurs
```javascript
// Rechercher des chauffeurs disponibles
const searchDrivers = async (lat, lng, radius = 5) => {
  const response = await fetch('/drivers/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lat: lat,
      lng: lng,
      radius: radius,
      limit: 10
    })
  });
  return response.json();
};
```

## 🧪 Tests et exemples

### Scripts de test disponibles

```bash
# Test complet de disponibilité
./test-driver-availability.sh

# Démonstration du workflow complet
./demo-driver-workflow.sh

# Test d'inscription chauffeur
./test-driver-registration.sh
```

### Exemples avec cURL

#### Mise en ligne
```bash
curl -X PUT http://localhost:3000/drivers/availability/1 \
  -H "Content-Type: application/json" \
  -d '{
    "isAvailable": true,
    "currentLat": 48.8566,
    "currentLng": 2.3522
  }'
```

#### Recherche
```bash
curl -X POST http://localhost:3000/drivers/search \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 48.8566,
    "lng": 2.3522,
    "radius": 5,
    "limit": 10
  }'
```

#### Mise hors ligne
```bash
curl -X PUT http://localhost:3000/drivers/availability/1 \
  -H "Content-Type: application/json" \
  -d '{
    "isAvailable": false
  }'
```

## ⚠️ Points importants

### Règles métier

1. **Inscription obligatoire** : Le chauffeur doit avoir une inscription complète pour être disponible
2. **Position requise** : La position GPS est obligatoire pour apparaître dans la recherche
3. **Disponibilité explicite** : Le chauffeur doit activer manuellement sa disponibilité
4. **Mise à jour de position** : La position doit être mise à jour régulièrement

### Gestion des erreurs

#### Erreur 404 - Chauffeur non trouvé
```json
{
  "statusCode": 404,
  "message": "Chauffeur non trouvé"
}
```

#### Erreur 409 - Inscription incomplète
```json
{
  "statusCode": 409,
  "message": "L'inscription du chauffeur doit être complète pour être disponible"
}
```

### Bonnes pratiques

1. **Mise à jour régulière** : Mettre à jour la position toutes les 30 secondes
2. **Gestion de la batterie** : Réduire la fréquence en arrière-plan
3. **Gestion du réseau** : Gérer les erreurs de connexion
4. **Validation des données** : Vérifier la validité des coordonnées GPS

## 🔧 Configuration avancée

### Variables d'environnement

```env
# Rayon de recherche par défaut (km)
DEFAULT_SEARCH_RADIUS=5

# Limite de résultats par défaut
DEFAULT_SEARCH_LIMIT=10

# Intervalle de mise à jour de position (ms)
LOCATION_UPDATE_INTERVAL=30000
```

### Personnalisation

Le système peut être personnalisé pour :
- Ajuster les algorithmes de recherche
- Ajouter des filtres supplémentaires
- Optimiser les performances
- Intégrer des services de géolocalisation tiers

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs de l'application
2. Utilisez les scripts de test pour diagnostiquer
3. Vérifiez la documentation Swagger : `http://localhost:3000/api`
4. Consultez le guide de dépannage : `TROUBLESHOOTING.md` 