# 🚗 InstaCar API

API backend pour l'application de taxi InstaCar - Service de recherche de chauffeurs proches avec géolocalisation.

## 📋 Table des matières

- [Installation](#installation)
- [Configuration](#configuration)
- [Documentation API](#documentation-api)
- [Endpoints](#endpoints)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Structure de la base de données](#structure-de-la-base-de-données)

## 🚀 Installation

### Prérequis
- Node.js (v18+)
- PostgreSQL
- pnpm (recommandé)

### Installation des dépendances
```bash
# Cloner le projet
git clone <repository-url>
cd instacar-api

# Installer les dépendances
pnpm install

# Copier le fichier d'environnement
cp .env.example .env
```

### Configuration de la base de données
```bash
# Générer le client Prisma
npx prisma generate

# Synchroniser la base de données
npx prisma db push
```

### Démarrer l'application
```bash
# Mode développement
pnpm run start:dev

# Mode production
pnpm run build
pnpm run start:prod
```

## ⚙️ Configuration

### Configuration Email Gmail

Pour configurer l'envoi d'emails OTP, suivez le guide détaillé :
**[📧 Guide de configuration Gmail](GMAIL_SETUP.md)**

### Variables d'environnement (.env)
```env
# Base de données
DATABASE_URL="postgresql://root:root@localhost:5432/instacar"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Email (Gmail)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# SMS/WhatsApp (Twilio)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"
```

## 🔧 Dépannage

### Erreur 500 - Internal Server Error

Si vous rencontrez une erreur 500 lors de l'enregistrement d'un chauffeur, voici les causes possibles :

#### 1. **Contraintes uniques violées**
- Numéro de téléphone déjà utilisé
- Numéro de permis déjà utilisé
- Plaque d'immatriculation déjà utilisée

**Solution :** Utilisez des données uniques
```bash
# Script de diagnostic automatique
./debug-driver-registration.sh

# Test des contraintes uniques
./test-driver-constraints.sh

# Reproduction des erreurs
./reproduce-500-error.sh
```

#### 2. **Document d'identité manquant**
- Le fichier référencé n'existe pas dans le dossier `uploads/documents/`

**Solution :** Assurez-vous que le document existe
```bash
ls -la uploads/documents/
```

#### 3. **Problème de base de données**
```bash
# Vérifier la connexion
psql postgresql://root:root@localhost:5432/instacar -c "SELECT 1;"

# Vérifier les contraintes
psql postgresql://root:root@localhost:5432/instacar -c "\d \"Driver\""
```

### Scripts de diagnostic

- `./debug-driver-registration.sh` - Diagnostic complet
- `./test-driver-constraints.sh` - Test des contraintes uniques
- `./reproduce-500-error.sh` - Reproduction des erreurs
- `./test-email-config.sh` - Test de configuration email

### Guide complet de dépannage

Consultez le fichier [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) pour un guide détaillé.

## 📚 Documentation API

### Swagger UI
Une fois l'application démarrée, accédez à la documentation interactive :
```
http://localhost:3000/api
```

## 🔗 Endpoints

### Authentification (`/auth`)

### Upload de fichiers (`/upload`)

#### 1. Upload de photo de profil
```http
POST /upload/profile-photo
```

**Données à envoyer :**
```
Content-Type: multipart/form-data
file: [fichier image JPG, PNG, GIF, max 5MB]
```

**Réponse réussie (201) :**
```json
{
  "success": true,
  "message": "Photo de profil uploadée avec succès",
  "photoPath": "profiles/uuid-filename.jpg",
  "photoUrl": "http://localhost:3000/uploads/profiles/uuid-filename.jpg"
}
```

#### 2. Upload de document d'identité
```http
POST /upload/document
```

**Données à envoyer :**
```
Content-Type: multipart/form-data
file: [fichier JPG, PNG, PDF, max 10MB]
```

**Réponse réussie (201) :**
```json
{
  "success": true,
  "message": "Document uploadé avec succès",
  "documentPath": "documents/uuid-filename.pdf",
  "documentUrl": "http://localhost:3000/uploads/documents/uuid-filename.pdf"
}
```

**Erreurs possibles :**
- `400` : Fichier invalide ou trop volumineux
- `500` : Erreur serveur

### Inscription des chauffeurs (`/drivers`)

#### 1. Enregistrement d'un véhicule (étape 1)
```http
POST /drivers/register-vehicle
```

**Données à envoyer :**
```json
{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Toyota",
  "model": "Corolla",
  "color": "Blanc",
  "year": 2020,
  "plateNumber": "AB-123-CD"
}
```

**Réponse réussie (201) :**
```json
{
  "success": true,
  "message": "Véhicule enregistré avec succès",
  "vehicle": {
    "id": 1,
    "city": "Paris",
    "vehicleType": "PROPRIETAIRE",
    "brand": "Toyota",
    "model": "Corolla",
    "color": "Blanc",
    "year": 2020,
    "plateNumber": "AB-123-CD"
  }
}
```

#### 2. Enregistrement d'un chauffeur (étape 2)
```http
POST /drivers/register-driver/{vehicleId}
```

**Données à envoyer :**
```json
{
  "fullName": "Jean Dupont",
  "phone": "+33123456789",
  "licenseNumber": "123456789012345",
  "profilePhoto": "profiles/uuid-photo.jpg",
  "identityDocument": "documents/uuid-document.pdf"
}
```

**Réponse réussie (201) :**
```json
{
  "success": true,
  "message": "Chauffeur enregistré avec succès",
  "driver": {
    "id": 1,
    "fullName": "Jean Dupont",
    "phone": "+33123456789",
    "licenseNumber": "123456789012345",
    "profilePhoto": "http://localhost:3000/uploads/profiles/uuid-photo.jpg",
    "identityDocument": "http://localhost:3000/uploads/documents/uuid-document.pdf",
    "vehicle": {
      "id": 1,
      "brand": "Toyota",
      "model": "Corolla",
      "color": "Blanc",
      "year": 2020,
      "plateNumber": "AB-123-CD",
      "city": "Paris",
      "vehicleType": "PROPRIETAIRE"
    }
  }
}
```

#### 3. Vérifier le statut d'un chauffeur
```http
GET /drivers/status/{driverId}
```

**Réponse réussie (200) :**
```json
{
  "success": true,
  "isVehicleRegistered": true,
  "isIdentityComplete": true,
  "isRegistrationComplete": true,
  "driver": {
    "id": 1,
    "fullName": "Jean Dupont",
    "phone": "+33123456789",
    "licenseNumber": "123456789012345",
    "profilePhoto": "http://localhost:3000/uploads/profiles/uuid-photo.jpg",
    "identityDocument": "http://localhost:3000/uploads/documents/uuid-document.pdf",
    "vehicle": { ... }
  }
}
```

#### 4. Récupérer tous les chauffeurs
```http
GET /drivers
```

**Réponse réussie (200) :**
```json
{
  "success": true,
  "drivers": [
    {
      "id": 1,
      "fullName": "Jean Dupont",
      "phone": "+33123456789",
      "licenseNumber": "123456789012345",
      "profilePhoto": "http://localhost:3000/uploads/profiles/uuid-photo.jpg",
      "isAvailable": true,
      "rating": 4.5,
      "totalRides": 150,
      "vehicle": {
        "id": 1,
        "brand": "Toyota",
        "model": "Corolla",
        "color": "Blanc",
        "plateNumber": "AB-123-CD"
      }
    }
  ]
}
```

### Authentification (`/auth`)

#### 1. Inscription utilisateur
```http
POST /auth/register
```

**Données à envoyer :**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+33123456789",
  "gender": "MALE"
}
```

**Réponse réussie (201) :**
```json
{
  "success": true,
  "message": "Inscription réussie. Un code de vérification a été envoyé à votre email.",
  "userId": 1,
  "email": "john.doe@example.com"
}
```

**Erreurs possibles :**
- `409` : Utilisateur avec cet email/téléphone existe déjà
- `400` : Données invalides
- `500` : Erreur serveur

#### 2. Vérification OTP
```http
POST /auth/verify-otp
```

**Données à envoyer :**
```json
{
  "email": "john.doe@example.com",
  "code": "12345"
}
```

**Réponse réussie (200) :**
```json
{
  "success": true,
  "message": "Vérification réussie. Votre compte est maintenant activé.",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "name": "John Doe",
    "isVerified": true
  }
}
```

#### 3. Renvoi OTP
```http
POST /auth/resend-otp
```

**Données à envoyer :**
```json
{
  "email": "john.doe@example.com",
  "type": "EMAIL" // ou "SMS", "WHATSAPP"
}
```

**Réponse réussie (200) :**
```json
{
  "success": true,
  "message": "Nouveau code de vérification envoyé par email."
}
```

#### 4. Compléter le profil (étape 2)
```http
POST /auth/complete-profile/{userId}
```

**Données à envoyer :**
```json
{
  "address": "123 Rue de la Paix",
  "city": "Paris",
  "commune": "Le Marais",
  "profilePhoto": "profiles/uuid-filename.jpg" // chemin retourné par l'upload
}
```

**Réponse réussie (200) :**
```json
{
  "success": true,
  "message": "Profil complété avec succès.",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "address": "123 Rue de la Paix",
    "city": "Paris",
    "commune": "Le Marais",
    "profilePhoto": "http://localhost:3000/uploads/profiles/uuid-filename.jpg",
    "isProfileComplete": true
  }
}
```

#### 5. Vérifier le statut du profil
```http
GET /auth/profile-status/{userId}
```

**Réponse réussie (200) :**
```json
{
  "success": true,
  "isVerified": true,
  "isProfileComplete": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+33123456789",
    "gender": "MALE",
    "address": "123 Rue de la Paix",
    "city": "Paris",
    "commune": "Le Marais",
    "profilePhoto": "https://example.com/photos/profile.jpg"
  }
}
```

## 📊 Structure de la base de données

### Modèles principaux

#### User
```sql
- id (Int, PK)
- email (String, unique)
- name (String)
- phone (String, unique)
- gender (Enum: MALE, FEMALE)
- role (Enum: PASSENGER, DRIVER, ADMIN)
- isVerified (Boolean)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### Driver
```sql
- id (Int, PK)
- userId (Int, FK -> User)
- licenseNumber (String, unique)
- vehicleId (Int, FK -> Vehicle)
- isAvailable (Boolean)
- currentLat (Float)
- currentLng (Float)
- lastLocationUpdate (DateTime)
- rating (Float)
- totalRides (Int)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### Vehicle
```sql
- id (Int, PK)
- brand (String)
- model (String)
- year (Int)
- color (String)
- plateNumber (String, unique)
- capacity (Int)
- isActive (Boolean)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### Ride
```sql
- id (Int, PK)
- passengerId (Int, FK -> User)
- driverId (Int, FK -> Driver)
- pickupLat (Float)
- pickupLng (Float)
- pickupAddress (String)
- dropoffLat (Float)
- dropoffLng (Float)
- dropoffAddress (String)
- distance (Float)
- duration (Int)
- price (Decimal)
- status (Enum: REQUESTED, SEARCHING, ACCEPTED, ARRIVING, IN_PROGRESS, COMPLETED, CANCELLED)
- requestedAt (DateTime)
- acceptedAt (DateTime)
- startedAt (DateTime)
- completedAt (DateTime)
- cancelledAt (DateTime)
- cancelReason (String)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### OtpCode
```sql
- id (Int, PK)
- userId (Int, FK -> User)
- code (String)
- type (Enum: EMAIL, SMS, WHATSAPP)
- expiresAt (DateTime)
- isUsed (Boolean)
- createdAt (DateTime)
```

## 🧪 Tests et exemples d'utilisation

### Scripts de test

#### Test d'inscription en deux étapes
```bash
# Test complet avec interaction
./test-two-step-registration.sh

# Test avec upload de photo
./test-registration-with-photo.sh

# Test d'upload de photo uniquement
./test-upload-photo.sh
```

#### Test d'inscription des chauffeurs
```bash
# Test complet d'inscription chauffeur avec uploads
./test-driver-registration.sh
```

### cURL

#### Inscription
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+33123456789",
    "gender": "MALE"
  }'
```

#### Vérification OTP
```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "code": "12345"
  }'
```

#### Upload de photo de profil
```bash
curl -X POST http://localhost:3000/upload/profile-photo \
  -F "file=@/path/to/your/photo.jpg"
```

#### Compléter le profil avec photo
```bash
curl -X POST http://localhost:3000/auth/complete-profile/1 \
  -H "Content-Type: application/json" \
  -d '{
    "address": "123 Rue de la Paix",
    "city": "Paris",
    "commune": "Le Marais",
    "profilePhoto": "profiles/uuid-filename.jpg"
  }'
```

### JavaScript/Node.js

#### Inscription
```javascript
const response = await fetch('http://localhost:3000/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+33123456789',
    gender: 'MALE'
  })
});

const data = await response.json();
console.log(data);
```

#### Vérification OTP
```javascript
const response = await fetch('http://localhost:3000/auth/verify-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john.doe@example.com',
    code: '12345'
  })
});

const data = await response.json();
console.log(data);
```

## 🔧 Développement

### Scripts disponibles
```bash
# Développement
pnpm run start:dev

# Build
pnpm run build

# Production
pnpm run start:prod

# Tests
pnpm run test
pnpm run test:e2e

# Linting
pnpm run lint

# Formatage
pnpm run format
```

### Prisma
```bash
# Générer le client
npx prisma generate

# Synchroniser la base de données
npx prisma db push

# Ouvrir Prisma Studio
npx prisma studio

# Créer une migration
npx prisma migrate dev --name init
```

## 📝 Notes importantes

1. **Sécurité** : Changez `JWT_SECRET` en production
2. **Email** : Utilisez un mot de passe d'application Gmail
3. **SMS** : Twilio offre un compte gratuit avec crédit
4. **Base de données** : PostgreSQL requis
5. **CORS** : Configuré pour le développement

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
