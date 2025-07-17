# Configuration des Services Gratuits pour InstaCar

## Services d'Email (Gmail)

### 1. Configuration Gmail
1. Allez sur votre compte Google
2. Activez l'authentification à 2 facteurs
3. Générez un "mot de passe d'application" :
   - Allez dans "Sécurité" > "Connexion à Google"
   - Cliquez sur "Mots de passe d'application"
   - Sélectionnez "Autre" et nommez-le "InstaCar API"
   - Copiez le mot de passe généré

### 2. Mise à jour du fichier .env
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-d-application
```

## Services SMS/WhatsApp (Twilio)

### 1. Créer un compte Twilio
1. Allez sur [twilio.com](https://www.twilio.com)
2. Créez un compte gratuit
3. Vous recevrez :
   - Account SID
   - Auth Token
   - Un numéro de téléphone gratuit

### 2. Mise à jour du fichier .env
```env
TWILIO_ACCOUNT_SID=votre-account-sid
TWILIO_AUTH_TOKEN=votre-auth-token
TWILIO_PHONE_NUMBER=votre-numero-twilio
```

## Services Alternatifs Gratuits

### Email
- **SendGrid** : 100 emails/jour gratuit
- **Mailgun** : 5,000 emails/mois gratuit
- **Brevo (ex-Sendinblue)** : 300 emails/jour gratuit

### SMS
- **Twilio** : Compte gratuit avec crédit
- **Vonage** : Compte gratuit avec crédit
- **MessageBird** : Compte gratuit avec crédit

## Test de l'Application

### 1. Démarrer l'application
```bash
pnpm run start:dev
```

### 2. Endpoints disponibles
- `POST /auth/register` - Inscription
- `POST /auth/verify-otp` - Vérification OTP
- `POST /auth/resend-otp` - Renvoi OTP

### 3. Exemple d'inscription
```json
POST http://localhost:3000/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+33123456789",
  "gender": "MALE"
}
```

### 4. Exemple de vérification OTP
```json
POST http://localhost:3000/auth/verify-otp
{
  "email": "john@example.com",
  "code": "12345"
}
```

## Notes Importantes

1. **En développement** : Les SMS/WhatsApp sont simulés si Twilio n'est pas configuré
2. **Gmail** : Utilisez toujours un mot de passe d'application, pas votre mot de passe principal
3. **Twilio** : Le compte gratuit a des limitations, vérifiez la documentation
4. **Sécurité** : Changez les clés JWT_SECRET en production 