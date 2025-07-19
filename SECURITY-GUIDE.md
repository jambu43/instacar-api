# Guide de Sécurité - API InstaCar

## 🔐 Système de Sécurité Implémenté

L'API InstaCar dispose maintenant d'un système de sécurité complet avec authentification JWT et clé d'application.

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Clé d'Application](#clé-dapplication)
3. [Authentification JWT](#authentification-jwt)
4. [Guards et Stratégies](#guards-et-stratégies)
5. [Configuration](#configuration)
6. [Utilisation](#utilisation)
7. [Tests de Sécurité](#tests-de-sécurité)
8. [Bonnes Pratiques](#bonnes-pratiques)

## 🚀 Vue d'ensemble

### Fonctionnalités de Sécurité

✅ **Clé d'Application (instakey)**
- Vérification obligatoire sur toutes les routes
- Clé statique configurable
- Protection contre les accès non autorisés

✅ **Authentification JWT**
- Tokens d'accès (15 minutes)
- Tokens de renouvellement (7 jours)
- Gestion automatique des tokens expirés

✅ **Guards de Sécurité**
- Guard global pour la clé d'application
- Guard JWT pour l'authentification
- Guard de rôles pour les permissions

✅ **Stratégies Passport**
- Stratégie JWT pour la validation des tokens
- Intégration avec Prisma pour la vérification des utilisateurs

## 🔑 Clé d'Application

### Configuration

La clé d'application est configurée via la variable d'environnement `APP_KEY` :

```env
APP_KEY="instacar-secret-key-2024"
```

### Utilisation

Toutes les requêtes doivent inclure la clé d'application dans le header `instakey` :

```bash
curl -H "instakey: instacar-secret-key-2024" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/auth/login
```

### Exemption

Certaines routes peuvent être exemptées de la vérification de la clé d'application :

```typescript
import { SkipAppKey } from '../common/decorators/skip-app-key.decorator';

@SkipAppKey()
@Get('health')
async healthCheck() {
  return { status: 'ok' };
}
```

## 🎫 Authentification JWT

### Types de Tokens

1. **Access Token** : Valide 15 minutes, utilisé pour les requêtes API
2. **Refresh Token** : Valide 7 jours, utilisé pour renouveler l'access token

### Configuration JWT

```env
JWT_SECRET="instacar-super-secret-jwt-key-2024-change-in-production"
JWT_REFRESH_SECRET="instacar-super-secret-refresh-key-2024-change-in-production"
```

### Workflow d'Authentification

1. **Inscription** → Génération automatique des tokens
2. **Connexion** → Génération des tokens
3. **Requêtes API** → Utilisation de l'access token
4. **Expiration** → Renouvellement via refresh token
5. **Déconnexion** → Invalidation du refresh token

### Endpoints d'Authentification

```bash
# Inscription
POST /api/auth/register
Headers: instakey: <app-key>
Body: {
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+33123456789",
  "password": "password123",
  "gender": "MALE"
}

# Connexion
POST /api/auth/login
Headers: instakey: <app-key>
Body: {
  "email": "user@example.com",
  "password": "password123"
}

# Renouvellement de token
POST /api/auth/refresh
Headers: instakey: <app-key>
Body: {
  "refreshToken": "<refresh-token>"
}

# Déconnexion
POST /api/auth/logout
Headers: 
  instakey: <app-key>
  Authorization: Bearer <access-token>

# Profil utilisateur
GET /api/auth/profile
Headers: 
  instakey: <app-key>
  Authorization: Bearer <access-token>
```

## 🛡️ Guards et Stratégies

### Guards Implémentés

1. **AppKeyGlobalGuard** : Vérification globale de la clé d'application
2. **JwtAuthGuard** : Vérification des tokens JWT
3. **RolesGuard** : Vérification des rôles utilisateur

### Stratégies Passport

1. **JwtStrategy** : Validation des tokens JWT avec Prisma

### Utilisation des Guards

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DRIVER)
@Get('driver-only')
async driverOnlyEndpoint() {
  return { message: 'Accès chauffeur uniquement' };
}
```

### Décorateurs Disponibles

```typescript
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: any) {
  return { user };
}
```

## ⚙️ Configuration

### Variables d'Environnement

```env
# Base de données
DATABASE_URL="postgresql://postgres:password@localhost:5432/instacar"

# Sécurité JWT
JWT_SECRET="instacar-super-secret-jwt-key-2024-change-in-production"
JWT_REFRESH_SECRET="instacar-super-secret-refresh-key-2024-change-in-production"

# Clé d'application
APP_KEY="instacar-secret-key-2024"

# Configuration de l'application
PORT=3000
NODE_ENV=development
```

### Configuration dans main.ts

```typescript
// Guard global pour la clé d'application
app.useGlobalGuards(new AppKeyGlobalGuard(app.get(Reflector)));

// Configuration Swagger avec sécurité
const config = new DocumentBuilder()
  .addBearerAuth()
  .addApiKey({ type: 'apiKey', name: 'instakey', in: 'header' }, 'AppKey')
  .build();
```

## 📖 Utilisation

### Exemple de Requête Complète

```bash
# 1. Inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "instakey: instacar-secret-key-2024" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+33123456789",
    "password": "password123",
    "gender": "MALE"
  }'

# 2. Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "instakey: instacar-secret-key-2024" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# 3. Utilisation de l'API avec token
curl -X GET http://localhost:3000/api/notifications/user/1 \
  -H "Content-Type: application/json" \
  -H "instakey: instacar-secret-key-2024" \
  -H "Authorization: Bearer <access-token>"
```

### Exemple JavaScript/TypeScript

```javascript
const API_BASE = 'http://localhost:3000/api';
const APP_KEY = 'instacar-secret-key-2024';

// Fonction d'authentification
async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'instakey': APP_KEY,
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  return data;
}

// Fonction pour faire des requêtes authentifiées
async function authenticatedRequest(endpoint, token, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'instakey': APP_KEY,
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  
  return response.json();
}

// Utilisation
const { accessToken } = await login('user@example.com', 'password123');
const notifications = await authenticatedRequest('/notifications/user/1', accessToken);
```

### Exemple avec Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'instakey': 'instacar-secret-key-2024',
  },
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour renouveler le token automatiquement
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await api.post('/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          
          // Retry la requête originale
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api.request(error.config);
        } catch (refreshError) {
          // Rediriger vers la page de connexion
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

## 🧪 Tests de Sécurité

### Script de Test Automatisé

```bash
# Exécuter les tests de sécurité
chmod +x test-security.sh
./test-security.sh
```

### Tests Manuels

```bash
# Test sans clé d'application
curl -X GET http://localhost:3000/api/auth/profile
# Devrait retourner 401

# Test avec mauvaise clé
curl -X GET http://localhost:3000/api/auth/profile \
  -H "instakey: wrong-key"
# Devrait retourner 401

# Test avec bonne clé mais sans token
curl -X GET http://localhost:3000/api/auth/profile \
  -H "instakey: instacar-secret-key-2024"
# Devrait retourner 401 (token manquant)

# Test complet
curl -X GET http://localhost:3000/api/auth/profile \
  -H "instakey: instacar-secret-key-2024" \
  -H "Authorization: Bearer <valid-token>"
# Devrait retourner 200
```

## 🔒 Bonnes Pratiques

### Sécurité en Production

1. **Changer les clés secrètes** :
   ```env
   JWT_SECRET="change-this-in-production"
   JWT_REFRESH_SECRET="change-this-in-production"
   APP_KEY="change-this-in-production"
   ```

2. **Utiliser des clés fortes** :
   ```bash
   # Générer une clé JWT sécurisée
   openssl rand -base64 64
   
   # Générer une clé d'application sécurisée
   openssl rand -base64 32
   ```

3. **Configurer HTTPS** :
   ```typescript
   // Dans main.ts
   const app = await NestFactory.create(AppModule, {
     httpsOptions: {
       key: fs.readFileSync('path/to/key.pem'),
       cert: fs.readFileSync('path/to/cert.pem'),
     },
   });
   ```

4. **Limiter la durée des tokens** :
   ```typescript
   JwtModule.register({
     secret: process.env.JWT_SECRET,
     signOptions: { 
       expiresIn: '5m', // Réduire à 5 minutes en production
     },
   }),
   ```

### Gestion des Erreurs

```typescript
// Intercepteur global pour les erreurs d'authentification
@Injectable()
export class AuthInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        if (error instanceof UnauthorizedException) {
          return throwError(() => new UnauthorizedException({
            message: 'Accès non autorisé',
            code: 'UNAUTHORIZED',
            timestamp: new Date().toISOString(),
          }));
        }
        return throwError(() => error);
      }),
    );
  }
}
```

### Monitoring et Logs

```typescript
// Logger pour les tentatives d'authentification
@Injectable()
export class AuthLogger {
  private readonly logger = new Logger(AuthLogger.name);

  logLoginAttempt(email: string, success: boolean, ip: string) {
    this.logger.log(`Login attempt: ${email} - ${success ? 'SUCCESS' : 'FAILED'} - IP: ${ip}`);
  }

  logTokenRefresh(userId: number, success: boolean) {
    this.logger.log(`Token refresh: User ${userId} - ${success ? 'SUCCESS' : 'FAILED'}`);
  }
}
```

## 📚 Documentation Swagger

La documentation Swagger inclut maintenant les paramètres de sécurité :

- **AppKey** : Clé d'application dans le header `instakey`
- **BearerAuth** : Token JWT dans le header `Authorization`

Accédez à la documentation : `http://localhost:3000/api`

## 🚨 Sécurité Avancée

### Rate Limiting

```bash
# Installer le package
pnpm add @nestjs/throttler
```

```typescript
// Configuration du rate limiting
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 10, // 10 requêtes par minute
    }]),
  ],
})
```

### Validation des Tokens

```typescript
// Vérification de la validité du token
async validateToken(token: string): Promise<boolean> {
  try {
    const payload = await this.jwtService.verifyAsync(token);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    return !!user && user.refreshToken !== null;
  } catch {
    return false;
  }
}
```

### Blacklist de Tokens

```typescript
// Service de blacklist (avec Redis)
@Injectable()
export class TokenBlacklistService {
  constructor(private redisService: RedisService) {}

  async blacklistToken(token: string, expiresIn: number) {
    await this.redisService.setex(`blacklist:${token}`, expiresIn, '1');
  }

  async isBlacklisted(token: string): Promise<boolean> {
    return await this.redisService.exists(`blacklist:${token}`) === 1;
  }
}
```

---

**🔐 Votre API InstaCar est maintenant sécurisée avec un système d'authentification complet et robuste !** 