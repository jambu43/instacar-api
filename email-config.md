# 📧 Configuration Email - InstaCar API

## 🔧 Configuration Requise

Pour que le système d'authentification par OTP fonctionne, vous devez configurer l'envoi d'emails.

## 📋 Variables d'Environnement

Ajoutez ces variables à votre fichier `.env` :

```env
# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app

# JWT Secrets (déjà configurés)
JWT_SECRET=votre-secret-jwt
JWT_REFRESH_SECRET=votre-secret-refresh-jwt

# App Key (déjà configuré)
APP_KEY=instacar-secret-key-2024
```

## 🚀 Configuration Gmail (Recommandé)

### 1. Activer l'Authentification à 2 Facteurs

1. Allez sur [myaccount.google.com](https://myaccount.google.com)
2. Cliquez sur **Sécurité**
3. Activez **Authentification à 2 facteurs**

### 2. Générer un Mot de Passe d'Application

1. Dans **Sécurité** → **Authentification à 2 facteurs**
2. Cliquez sur **Mots de passe d'application**
3. Sélectionnez **Autre (nom personnalisé)**
4. Entrez "InstaCar API"
5. Cliquez sur **Générer**
6. Copiez le mot de passe de 16 caractères

### 3. Configuration dans .env

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # Le mot de passe d'application généré
```

## 📧 Alternatives SMTP

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=votre-api-key-sendgrid
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=votre-mailgun-username
SMTP_PASS=votre-mailgun-password
```

### Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=votre-email@outlook.com
SMTP_PASS=votre-mot-de-passe
```

## 🧪 Test de Configuration

### 1. Démarrer l'Application

```bash
pnpm run start:dev
```

### 2. Tester l'Envoi d'Email

```bash
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -H "instakey: instacar-secret-key-2024" \
  -d '{
    "email": "votre-email@test.com",
    "name": "Test User",
    "phone": "+33123456789",
    "gender": "MALE"
  }'
```

### 3. Vérifier les Logs

Dans les logs de l'application, vous devriez voir :

```
[OTP Service] Code OTP généré: 123456 pour votre-email@test.com
[Email Service] Email OTP envoyé à votre-email@test.com
```

### 4. Vérifier votre Boîte Email

Vous devriez recevoir un email avec :
- Le code OTP de 6 chiffres
- Un design professionnel
- Des instructions de sécurité

## 🔍 Dépannage

### Erreur : "SMTP configuration missing"

**Cause :** Variables d'environnement manquantes

**Solution :**
```bash
# Vérifier que le fichier .env existe
ls -la .env

# Vérifier le contenu
cat .env | grep SMTP
```

### Erreur : "Authentication failed"

**Cause :** Mauvais credentials SMTP

**Solution :**
1. Vérifier l'email et le mot de passe
2. Pour Gmail, utiliser un mot de passe d'application
3. Vérifier que l'authentification à 2 facteurs est activée

### Erreur : "Connection timeout"

**Cause :** Problème de réseau ou de configuration

**Solution :**
1. Vérifier la connectivité internet
2. Vérifier le port SMTP (587 ou 465)
3. Essayer un autre fournisseur SMTP

### Erreur : "Email not sent"

**Cause :** Problème avec le service SMTP

**Solution :**
1. Vérifier les logs détaillés
2. Tester avec un autre fournisseur
3. Vérifier les quotas d'envoi

## 📊 Monitoring

### Logs à Surveiller

```bash
# Suivre les logs en temps réel
tail -f logs/app.log | grep -E "(OTP|Email|SMTP)"

# Vérifier les erreurs
grep -i error logs/app.log
```

### Métriques Importantes

- **Taux de livraison** : % d'emails reçus
- **Temps de livraison** : Délai d'envoi
- **Erreurs SMTP** : Nombre d'échecs
- **Codes OTP utilisés** : Taux de conversion

## 🔒 Sécurité

### Bonnes Pratiques

1. **Ne jamais commiter** les credentials SMTP dans le code
2. **Utiliser des variables d'environnement** pour tous les secrets
3. **Limiter les permissions** du compte email
4. **Monitorer les tentatives d'envoi** pour détecter les abus
5. **Utiliser HTTPS** pour toutes les communications

### Protection Anti-Spam

- Limite de 1 minute entre les demandes OTP
- Expiration des codes en 10 minutes
- Usage unique des codes OTP
- Validation des adresses email

## 🚀 Production

### Configuration Recommandée

```env
# Production - Gmail Business ou SendGrid
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@votre-domaine.com
SMTP_PASS=mot-de-passe-app-securise

# Monitoring
LOG_LEVEL=info
EMAIL_DEBUG=false
```

### Monitoring Production

1. **Alertes** : Configurer des alertes pour les échecs d'envoi
2. **Logs** : Centraliser les logs d'email
3. **Métriques** : Surveiller les taux de livraison
4. **Backup** : Avoir un fournisseur SMTP de secours

---

**📧 Votre configuration email est maintenant prête !** 