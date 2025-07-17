# 🔧 Guide de Dépannage - InstaCar API

Ce guide vous aide à diagnostiquer et résoudre les problèmes courants de l'API InstaCar.

## 🚨 Erreur 500 - Internal Server Error

### Causes possibles

#### 1. **Contraintes uniques violées**
- **Numéro de téléphone déjà utilisé**
- **Numéro de permis déjà utilisé**
- **Plaque d'immatriculation déjà utilisée**

**Solution :**
```bash
# Vérifier les données existantes
./debug-driver-registration.sh

# Utiliser des données uniques
TIMESTAMP=$(date +%s)
PHONE="+331234567${TIMESTAMP: -4}"
LICENSE_NUMBER="123456789${TIMESTAMP: -6}"
PLATE_NUMBER="TEST-${TIMESTAMP}"
```

#### 2. **Problème de base de données**
```bash
# Vérifier la connexion à la base
psql postgresql://root:root@localhost:5432/instacar -c "SELECT 1;"

# Vérifier les tables
psql postgresql://root:root@localhost:5432/instacar -c "\dt"

# Vérifier les contraintes
psql postgresql://root:root@localhost:5432/instacar -c "\d \"Driver\""
psql postgresql://root:root@localhost:5432/instacar -c "\d \"Vehicle\""
```

#### 3. **Fichier manquant**
- Le document d'identité référencé n'existe pas
- La photo de profil référencée n'existe pas

**Solution :**
```bash
# Vérifier les fichiers uploadés
ls -la uploads/
ls -la uploads/documents/
ls -la uploads/profiles/
```

#### 4. **Problème de permissions**
```bash
# Vérifier les permissions des dossiers
ls -la uploads/
chmod 755 uploads/
chmod 755 uploads/documents/
chmod 755 uploads/profiles/
```

### Diagnostic automatique

#### Script de diagnostic complet
```bash
./debug-driver-registration.sh
```

#### Test des contraintes uniques
```bash
./test-driver-constraints.sh
```

## 📧 Erreurs d'envoi d'emails

### Configuration Gmail
1. **Activer l'authentification à 2 facteurs**
2. **Générer un mot de passe d'application**
3. **Mettre à jour le fichier .env**

```env
# .env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-d-application
```

### Test de configuration email
```bash
./test-email-config.sh
```

## 🔐 Erreurs d'authentification

### Problème de JWT
```bash
# Vérifier la variable JWT_SECRET
echo $JWT_SECRET

# Régénérer une clé secrète
openssl rand -base64 32
```

### Problème d'OTP
```bash
# Vérifier les codes OTP en base
psql postgresql://root:root@localhost:5432/instacar -c "SELECT * FROM \"OtpCode\" ORDER BY id DESC LIMIT 5;"

# Tester l'envoi d'OTP
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","method":"email"}'
```

## 📁 Erreurs d'upload de fichiers

### Problèmes courants
1. **Dossier uploads manquant**
2. **Permissions insuffisantes**
3. **Type de fichier non autorisé**
4. **Taille de fichier trop importante**

### Solutions
```bash
# Créer les dossiers manquants
mkdir -p uploads/documents
mkdir -p uploads/profiles

# Définir les permissions
chmod 755 uploads/
chmod 755 uploads/documents/
chmod 755 uploads/profiles/

# Vérifier la configuration Multer
# Taille max : 5MB
# Types autorisés : jpg, jpeg, png, pdf
```

## 🗄️ Problèmes de base de données

### Migration Prisma
```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev

# Réinitialiser la base (⚠️ ATTENTION : supprime toutes les données)
npx prisma migrate reset

# Voir l'état des migrations
npx prisma migrate status
```

### Problèmes de connexion
```bash
# Vérifier que PostgreSQL est démarré
brew services list | grep postgresql

# Redémarrer PostgreSQL
brew services restart postgresql

# Vérifier la connexion
psql postgresql://root:root@localhost:5432/instacar -c "SELECT version();"
```

## 🔍 Logs et Debug

### Activer les logs détaillés
```typescript
// Dans le service concerné
this.logger.log('Message de debug');
this.logger.error('Message d\'erreur');
this.logger.warn('Message d\'avertissement');
```

### Vérifier les logs de l'application
```bash
# Démarrer en mode debug
DEBUG=* pnpm run start:dev

# Ou avec plus de verbosité
pnpm run start:dev -- --verbose
```

## 🧪 Tests automatisés

### Tests d'intégration
```bash
# Tous les tests
pnpm run test:e2e

# Test spécifique
pnpm run test:e2e -- --testNamePattern="Driver registration"
```

### Tests manuels
```bash
# Test complet d'inscription
./test-driver-registration.sh

# Test des contraintes
./test-driver-constraints.sh

# Test de configuration email
./test-email-config.sh
```

## 📋 Checklist de diagnostic

### Avant de signaler un bug
- [ ] L'application est-elle démarrée ?
- [ ] La base de données est-elle accessible ?
- [ ] Les variables d'environnement sont-elles configurées ?
- [ ] Les dossiers uploads existent-ils ?
- [ ] Les permissions sont-elles correctes ?
- [ ] Les données utilisées sont-elles uniques ?
- [ ] Les logs montrent-ils des erreurs spécifiques ?

### Informations à fournir
- **Message d'erreur complet**
- **Code de statut HTTP**
- **Données envoyées**
- **Logs de l'application**
- **Version de Node.js et pnpm**
- **Système d'exploitation**

## 🆘 Support

Si vous ne trouvez pas la solution dans ce guide :

1. **Vérifiez les logs** de l'application
2. **Exécutez les scripts de diagnostic**
3. **Testez avec des données uniques**
4. **Vérifiez la configuration**

### Commandes utiles
```bash
# État général du système
./debug-driver-registration.sh

# Test complet
./test-driver-registration.sh

# Vérification de la base
psql postgresql://root:root@localhost:5432/instacar -c "SELECT COUNT(*) FROM \"Driver\";"
psql postgresql://root:root@localhost:5432/instacar -c "SELECT COUNT(*) FROM \"Vehicle\";"
``` 