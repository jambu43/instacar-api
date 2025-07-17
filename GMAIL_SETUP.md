# 📧 Configuration Gmail pour l'envoi d'emails OTP

Ce guide vous explique comment configurer Gmail pour envoyer des emails OTP depuis l'API InstaCar.

## 🔧 Étapes de configuration

### 1. Activer l'authentification à 2 facteurs

1. Allez sur [myaccount.google.com](https://myaccount.google.com)
2. Cliquez sur **"Sécurité"** dans le menu de gauche
3. Trouvez **"La validation en 2 étapes"** et cliquez dessus
4. Suivez les instructions pour activer la validation en 2 étapes
5. Utilisez votre téléphone pour recevoir les codes de vérification

### 2. Créer un mot de passe d'application

1. Retournez à la page **"Sécurité"**
2. Trouvez **"Mots de passe d'application"** (apparaît après avoir activé la validation en 2 étapes)
3. Cliquez sur **"Mots de passe d'application"**
4. Sélectionnez **"Application"** → **"Autre (nom personnalisé)"**
5. Entrez le nom : **"InstaCar API"**
6. Cliquez sur **"Générer"**
7. **Copiez le mot de passe de 16 caractères** qui s'affiche

### 3. Mettre à jour le fichier .env

Modifiez votre fichier `.env` avec vos informations :

```env
# Email (Gmail)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="ambujoel@gmail.com"
EMAIL_PASS="votre-mot-de-passe-d-application-16-caracteres"
```

**Important :** 
- Utilisez votre email Gmail complet
- Utilisez le mot de passe d'application de 16 caractères (pas votre mot de passe Gmail normal)

### 4. Redémarrer l'application

```bash
# Arrêter l'application (Ctrl+C)
# Puis redémarrer
pnpm run start:dev
```

## 🧪 Test de la configuration

### Test automatique
```bash
./test-email-config.sh
```

### Test manuel
```bash
# 1. Inscription
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "votre-email@gmail.com",
    "phone": "+33123456789",
    "gender": "MALE"
  }'

# 2. Vérifier les logs de l'application
# Regardez les logs pour voir si l'email a été envoyé

# 3. Récupérer le code OTP
psql postgresql://root:root@localhost:5432/instacar -c "
SELECT u.email, o.code, o.type, o.\"expiresAt\", o.\"isUsed\", o.\"createdAt\" 
FROM \"User\" u 
JOIN \"OtpCode\" o ON u.id = o.\"userId\" 
WHERE u.email = 'votre-email@gmail.com' 
ORDER BY o.\"createdAt\" DESC 
LIMIT 1;"

# 4. Vérifier le code OTP
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@gmail.com",
    "code": "CODE_OTP_RECUPERE"
  }'
```

## 🔍 Diagnostic des problèmes

### Problème : "Configuration email manquante"
**Solution :** Vérifiez que `EMAIL_USER` et `EMAIL_PASS` sont correctement définis dans `.env`

### Problème : "Erreur de configuration email"
**Solutions possibles :**
1. **Authentification à 2 facteurs non activée** → Activez-la d'abord
2. **Mot de passe d'application incorrect** → Régénérez un nouveau mot de passe d'application
3. **Email incorrect** → Vérifiez l'email dans `.env`

### Problème : "Email non reçu"
**Solutions possibles :**
1. **Vérifiez les spams** → L'email peut être dans le dossier spam
2. **Vérifiez les logs** → L'application affiche si l'email a été envoyé ou simulé
3. **Testez avec un autre email** → Essayez avec un email Gmail différent

### Problème : "Erreur SMTP"
**Solutions possibles :**
1. **Port incorrect** → Gmail utilise le port 587
2. **Host incorrect** → Utilisez `smtp.gmail.com`
3. **TLS requis** → L'application gère automatiquement TLS

## 📋 Messages de log

### Configuration réussie
```
✅ Configuration email validée avec succès
Email OTP envoyé avec succès à ambujoel@gmail.com
```

### Configuration échouée
```
Configuration email manquante ou par défaut. Les emails seront simulés.
Email simulé pour ambujoel@gmail.com: Code OTP = 12345
```

### Erreur de configuration
```
Erreur de configuration email: Invalid login
Vérifiez:
- L'authentification à 2 facteurs est activée
- Le mot de passe d'application est correct
- Les paramètres EMAIL_USER et EMAIL_PASS dans .env
```

## 🔒 Sécurité

- **Ne partagez jamais** votre mot de passe d'application
- **Utilisez uniquement** des mots de passe d'application pour les applications
- **Désactivez** les mots de passe d'application non utilisés
- **Surveillez** l'activité de votre compte Google

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que l'authentification à 2 facteurs est activée
2. Régénérez un nouveau mot de passe d'application
3. Vérifiez les logs de l'application
4. Testez avec un email Gmail différent 