# 🔐 Guide d'Authentification par OTP - InstaCar API

## 📋 Vue d'Ensemble

Le système d'authentification a été entièrement refactorisé pour utiliser **uniquement l'OTP par email** au lieu des mots de passe. Cela améliore la sécurité et simplifie l'expérience utilisateur.

## 🚀 Nouveautés

### ✅ Supprimé
- ❌ Mots de passe et hachage bcrypt
- ❌ Endpoints `/login` et `/register` classiques
- ❌ Validation de mot de passe

### ✅ Ajouté
- ✅ Authentification par OTP email
- ✅ Envoi d'emails automatiques
- ✅ Templates d'emails personnalisés
- ✅ Vérification d'email
- ✅ Protection contre le spam OTP
- ✅ Emails de bienvenue

## 📧 Configuration Email

### Variables d'Environnement Requises

```env
# Configuration SMTP (Gmail recommandé)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app

# Alternative: SendGrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=votre-api-key-sendgrid
```

### Configuration Gmail

1. **Activer l'authentification à 2 facteurs** sur votre compte Gmail
2. **Générer un mot de passe d'application** :
   - Aller dans Paramètres Google → Sécurité
   - Authentification à 2 facteurs → Mots de passe d'application
   - Créer un nouveau mot de passe pour "InstaCar API"

## 🔄 Nouveau Flux d'Authentification

### 1. **Demande d'OTP** (`POST /auth/request-otp`)

```bash
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -H "instakey: instacar-secret-key-2024" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+33123456789",
    "gender": "MALE"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Code OTP envoyé pour l'inscription",
  "isNewUser": true
}
```

### 2. **Vérification OTP** (`POST /auth/verify-otp`)

```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -H "instakey: instacar-secret-key-2024" \
  -d '{
    "email": "user@example.com",
    "otpCode": "123456"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Authentification réussie",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+33123456789",
    "role": "PASSENGER",
    "isVerified": false,
    "emailVerified": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. **Renvoi d'OTP** (`POST /auth/resend-otp`)

```bash
curl -X POST http://localhost:3000/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -H "instakey: instacar-secret-key-2024" \
  -d '{
    "email": "user@example.com"
  }'
```

## 📱 Exemples d'Intégration

### JavaScript/TypeScript

```javascript
class OtpAuthService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api';
    this.appKey = 'instacar-secret-key-2024';
  }

  async requestOtp(email, userData = null) {
    const payload = { email };
    if (userData) {
      Object.assign(payload, userData);
    }

    const response = await fetch(`${this.baseUrl}/auth/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'instakey': this.appKey,
      },
      body: JSON.stringify(payload),
    });

    return response.json();
  }

  async verifyOtp(email, otpCode) {
    const response = await fetch(`${this.baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'instakey': this.appKey,
      },
      body: JSON.stringify({ email, otpCode }),
    });

    const data = await response.json();
    
    if (data.success) {
      // Stocker les tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  async resendOtp(email) {
    const response = await fetch(`${this.baseUrl}/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'instakey': this.appKey,
      },
      body: JSON.stringify({ email }),
    });

    return response.json();
  }

  async makeAuthenticatedRequest(endpoint, options = {}) {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'instakey': this.appKey,
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expiré, essayer de le renouveler
      const newToken = await this.refreshToken();
      if (newToken) {
        return fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'instakey': this.appKey,
            'Authorization': `Bearer ${newToken}`,
            ...options.headers,
          },
        });
      }
    }

    return response;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'instakey': this.appKey,
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data.accessToken;
    }
    
    return null;
  }
}

// Utilisation
const authService = new OtpAuthService();

// Inscription
const registerResult = await authService.requestOtp('user@example.com', {
  name: 'John Doe',
  phone: '+33123456789',
  gender: 'MALE'
});

// Vérification OTP
const loginResult = await authService.verifyOtp('user@example.com', '123456');

// Requête authentifiée
const profile = await authService.makeAuthenticatedRequest('/auth/profile');
```

### React Native

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class OtpAuthService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api';
    this.appKey = 'instacar-secret-key-2024';
  }

  async requestOtp(email, userData = null) {
    const payload = { email };
    if (userData) {
      Object.assign(payload, userData);
    }

    const response = await fetch(`${this.baseUrl}/auth/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'instakey': this.appKey,
      },
      body: JSON.stringify(payload),
    });

    return response.json();
  }

  async verifyOtp(email, otpCode) {
    const response = await fetch(`${this.baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'instakey': this.appKey,
      },
      body: JSON.stringify({ email, otpCode }),
    });

    const data = await response.json();
    
    if (data.success) {
      // Stocker les tokens
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  async makeAuthenticatedRequest(endpoint, options = {}) {
    const accessToken = await AsyncStorage.getItem('accessToken');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'instakey': this.appKey,
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expiré, essayer de le renouveler
      const newToken = await this.refreshToken();
      if (newToken) {
        return fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'instakey': this.appKey,
            'Authorization': `Bearer ${newToken}`,
            ...options.headers,
          },
        });
      }
    }

    return response;
  }

  async refreshToken() {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'instakey': this.appKey,
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();
    
    if (data.success) {
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
      return data.accessToken;
    }
    
    return null;
  }

  async logout() {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
  }
}
```

## 📧 Templates d'Emails

### Email OTP (`otp-email.hbs`)
- Code OTP de 6 chiffres
- Expiration dans 10 minutes
- Design responsive
- Instructions de sécurité

### Email de Bienvenue (`welcome-email.hbs`)
- Message de bienvenue personnalisé
- Liste des fonctionnalités
- Design moderne

## 🔒 Sécurité

### Protection Anti-Spam
- **Limite de temps** : 1 minute entre les demandes OTP
- **Expiration** : Codes OTP expirent en 10 minutes
- **Usage unique** : Chaque code ne peut être utilisé qu'une fois

### Validation
- **Email** : Format email valide requis
- **OTP** : Code de 6 chiffres requis
- **Données utilisateur** : Nom, téléphone, genre requis pour l'inscription

## 🧪 Tests

Exécutez le script de test pour valider le système :

```bash
chmod +x test-otp-auth.sh
./test-otp-auth.sh
```

## 📊 Base de Données

### Modifications du Schéma

```sql
-- Supprimé
ALTER TABLE "User" DROP COLUMN "password";

-- Ajouté
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN DEFAULT false;
```

### Table OTP

```sql
CREATE TABLE "OtpCode" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "code" TEXT NOT NULL,
  "type" "OtpType" NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "isUsed" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT now(),
  FOREIGN KEY ("userId") REFERENCES "User"("id")
);
```

## 🚀 Déploiement

### 1. **Variables d'Environnement**
```env
# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app

# JWT
JWT_SECRET=votre-secret-jwt
JWT_REFRESH_SECRET=votre-secret-refresh-jwt

# App
APP_KEY=instacar-secret-key-2024
```

### 2. **Base de Données**
```bash
npx prisma db push
npx prisma generate
```

### 3. **Démarrage**
```bash
pnpm run start:dev
```

## 📝 Logs et Debugging

### Vérifier les Emails
Les codes OTP sont affichés dans les logs de l'application :

```bash
# Dans les logs de l'application
[OTP Service] Code OTP généré: 123456 pour user@example.com
[Email Service] Email OTP envoyé à user@example.com
```

### Erreurs Courantes

1. **SMTP non configuré**
   ```
   Error: SMTP configuration missing
   Solution: Configurer les variables SMTP_*
   ```

2. **Email non envoyé**
   ```
   Error: Email delivery failed
   Solution: Vérifier les credentials SMTP
   ```

3. **OTP expiré**
   ```
   Error: Code OTP invalide ou expiré
   Solution: Demander un nouveau code
   ```

## 🎯 Avantages du Nouveau Système

1. **Sécurité renforcée** : Pas de mots de passe à stocker
2. **Simplicité** : Un seul code à retenir
3. **Vérification email** : Confirmation automatique de l'email
4. **Expérience utilisateur** : Processus d'inscription simplifié
5. **Maintenance** : Moins de complexité côté serveur

## 🔄 Migration depuis l'Ancien Système

Si vous migrez depuis l'ancien système avec mots de passe :

1. **Supprimer les anciens endpoints** : `/login`, `/register`
2. **Mettre à jour les clients** : Utiliser les nouveaux endpoints OTP
3. **Migrer les utilisateurs** : Les utilisateurs existants devront se réinscrire via OTP
4. **Nettoyer la base** : Supprimer les colonnes password obsolètes

---

**🎉 Le système d'authentification par OTP est maintenant opérationnel !** 