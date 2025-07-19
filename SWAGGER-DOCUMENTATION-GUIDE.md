# 📚 Guide de Documentation Swagger - InstaCar API

## 🎯 Vue d'ensemble

Tous les endpoints d'authentification de l'API InstaCar sont maintenant complètement documentés dans Swagger avec des descriptions détaillées, des exemples de requêtes/réponses et des schémas complets.

## 🔗 Accès à Swagger

**URL Swagger UI :** http://localhost:3000/api

## 📋 Endpoints d'Authentification Documentés

### 1. **POST** `/api/auth/register-user`
**Inscription d'un nouvel utilisateur (passager)**

- **Description :** Crée un nouveau compte utilisateur et envoie un code OTP par email pour vérification. Aucun mot de passe requis - authentification uniquement par OTP.
- **Authentification :** App Key requise
- **Paramètres :**
  - `email` (string, requis) - Adresse email unique
  - `name` (string, requis) - Nom complet
  - `phone` (string, requis) - Numéro de téléphone unique
  - `gender` (enum, requis) - Genre (MALE/FEMALE)
  - `role` (enum, optionnel) - Rôle utilisateur (défaut: PASSENGER)
  - `address`, `city`, `commune`, `profilePhoto` (optionnels)

**Exemple de réponse :**
```json
{
  "success": true,
  "message": "Code OTP envoyé pour vérifier votre compte",
  "userId": 1,
  "isNewUser": true,
  "otpCode": "123456"
}
```

### 2. **POST** `/api/auth/register-driver`
**Inscription d'un nouveau chauffeur**

- **Description :** Crée un nouveau compte chauffeur avec véhicule et envoie un code OTP par email. Aucun mot de passe requis.
- **Authentification :** App Key requise
- **Paramètres :**
  - Informations véhicule : `brand`, `model`, `year`, `color`, `plateNumber`, `capacity`, `city`, `vehicleType`
  - Informations chauffeur : `licenseNumber`, `fullName`, `phone`, `profilePhoto`, `identityDocument`

**Exemple de réponse :**
```json
{
  "success": true,
  "message": "Code OTP envoyé pour vérifier votre compte chauffeur",
  "userId": 1,
  "driverId": 1,
  "vehicleId": 1,
  "isNewUser": true,
  "otpCode": "123456"
}
```

### 3. **POST** `/api/auth/request-otp`
**Demande OTP pour connexion**

- **Description :** Envoie un code OTP par email pour un utilisateur existant. Utilisé pour la connexion sans mot de passe.
- **Authentification :** App Key requise
- **Paramètres :**
  - `email` (string, requis) - Email de l'utilisateur existant

**Exemple de réponse :**
```json
{
  "success": true,
  "message": "Code OTP envoyé pour la connexion",
  "isNewUser": false,
  "otpCode": "123456"
}
```

### 4. **POST** `/api/auth/verify-otp`
**Vérification OTP et authentification**

- **Description :** Vérifie le code OTP et authentifie l'utilisateur. Retourne les tokens JWT pour l'accès aux endpoints protégés.
- **Authentification :** App Key requise
- **Paramètres :**
  - `email` (string, requis) - Email de l'utilisateur
  - `otpCode` (string, requis) - Code OTP de 6 chiffres

**Exemple de réponse :**
```json
{
  "success": true,
  "message": "Authentification réussie",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Jean Dupont",
    "phone": "+33123456789",
    "role": "PASSENGER",
    "isVerified": true,
    "emailVerified": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 5. **GET** `/api/auth/profile`
**Récupérer le profil utilisateur**

- **Description :** Récupère les informations complètes du profil de l'utilisateur authentifié. Nécessite un token JWT valide.
- **Authentification :** App Key + JWT Bearer Token
- **Paramètres :** Aucun

**Exemple de réponse :**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Jean Dupont",
    "phone": "+33123456789",
    "role": "PASSENGER",
    "isVerified": true,
    "address": "123 Rue de la Paix",
    "city": "Paris",
    "commune": "1er arrondissement",
    "profilePhoto": "https://example.com/photo.jpg",
    "isProfileComplete": true
  }
}
```

### 6. **POST** `/api/auth/resend-otp`
**Renvoyer un code OTP**

- **Description :** Renvoye un nouveau code OTP par email. Utilisé si le code précédent a expiré ou n'a pas été reçu.
- **Authentification :** App Key requise
- **Paramètres :**
  - `email` (string, requis) - Email de l'utilisateur

**Exemple de réponse :**
```json
{
  "success": true,
  "message": "Code OTP renvoyé avec succès"
}
```

### 7. **POST** `/api/auth/refresh`
**Renouveler les tokens d'authentification**

- **Description :** Renouvelle les tokens JWT (access token et refresh token) en utilisant un refresh token valide.
- **Authentification :** App Key requise
- **Paramètres :**
  - `refreshToken` (string, requis) - Refresh token valide

**Exemple de réponse :**
```json
{
  "success": true,
  "message": "Tokens renouvelés avec succès",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 8. **POST** `/api/auth/logout`
**Déconnexion de l'utilisateur**

- **Description :** Déconnecte l'utilisateur en invalidant son refresh token. Nécessite un token JWT valide.
- **Authentification :** App Key + JWT Bearer Token
- **Paramètres :** Aucun

**Exemple de réponse :**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

## 🔐 Authentification

### App Key
Tous les endpoints d'authentification nécessitent l'en-tête `instakey` :
```
instakey: instacar-secret-key-2024
```

### JWT Bearer Token
Les endpoints protégés nécessitent l'en-tête `Authorization` :
```
Authorization: Bearer <access_token>
```

## 📊 Codes de Réponse

### Succès
- **200** - Opération réussie
- **201** - Ressource créée avec succès

### Erreurs
- **400** - Données invalides ou utilisateur existant
- **401** - Non authentifié (token JWT manquant ou invalide)
- **403** - Accès interdit
- **404** - Ressource non trouvée
- **500** - Erreur serveur interne

## 🚀 Flux d'Utilisation

### 1. Inscription Utilisateur Normal
```bash
# 1. Inscription
POST /api/auth/register-user
{
  "email": "user@example.com",
  "name": "Jean Dupont",
  "phone": "+33123456789",
  "gender": "MALE"
}

# 2. Vérification OTP
POST /api/auth/verify-otp
{
  "email": "user@example.com",
  "otpCode": "123456"
}

# 3. Utilisation avec token JWT
GET /api/auth/profile
Authorization: Bearer <access_token>
```

### 2. Connexion Utilisateur Existant
```bash
# 1. Demande OTP
POST /api/auth/request-otp
{
  "email": "user@example.com"
}

# 2. Vérification OTP
POST /api/auth/verify-otp
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

### 3. Inscription Chauffeur
```bash
# 1. Inscription avec véhicule
POST /api/auth/register-driver
{
  "brand": "Toyota",
  "model": "Corolla",
  "year": 2020,
  "color": "Blanc",
  "plateNumber": "AB-123-CD",
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "licenseNumber": "123456789",
  "fullName": "Jean Dupont",
  "phone": "+33123456789"
}

# 2. Vérification OTP
POST /api/auth/verify-otp
{
  "email": "driver@example.com",
  "otpCode": "123456"
}
```

## ✨ Fonctionnalités Spéciales

### 🔐 Authentification Sans Mot de Passe
- Aucun mot de passe n'est demandé lors de l'inscription
- Authentification uniquement par OTP envoyé par email
- Tokens JWT pour les sessions

### 📱 Support Mobile
- Tous les endpoints sont optimisés pour les applications mobiles
- Réponses JSON standardisées
- Gestion des erreurs cohérente

### 🔄 Refresh Token
- Access token de courte durée (15 minutes)
- Refresh token de longue durée (7 jours)
- Renouvellement automatique des tokens

## 🛠️ Tests

Utilisez les scripts de test fournis :
```bash
# Test de la documentation Swagger
./test-swagger-documentation.sh

# Test complet de tous les endpoints
./test-all-swagger-endpoints.sh
```

## 📝 Notes Importantes

1. **Sécurité :** Tous les endpoints nécessitent l'App Key pour la sécurité
2. **OTP :** Les codes OTP sont visibles en mode développement
3. **Tokens :** Les tokens JWT contiennent l'ID utilisateur et le rôle
4. **Validation :** Tous les paramètres sont validés avec class-validator
5. **Documentation :** Tous les endpoints sont documentés avec des exemples

---

**🎉 Tous les endpoints d'authentification sont maintenant parfaitement documentés dans Swagger !** 