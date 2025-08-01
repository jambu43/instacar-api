# 🔧 Guide de Configuration SMTP - Résolution de l'erreur "Missing credentials for PLAIN"

## 🚨 Problème identifié

L'erreur `[Nest] ERROR [MailerService] Error occurred while verifying the transporter}: Missing credentials for "PLAIN"` indique que les identifiants SMTP ne sont pas correctement configurés.

## 🔍 Diagnostic

### 1. Vérifier la configuration actuelle

Exécutez le script de diagnostic :
```bash
./check-smtp-config.sh
```

### 2. Variables d'environnement requises

Assurez-vous que ces variables sont définies dans votre fichier `.env` :

```env
# Configuration SMTP Gmail (recommandée)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-d-application

# Configuration SMTP alternative (si vous utilisez un autre fournisseur)
# SMTP_HOST=smtp.votre-fournisseur.com
# SMTP_PORT=587
# SMTP_USER=votre-email@votre-domaine.com
# SMTP_PASS=votre-mot-de-passe
```

## 🔧 Solutions par fournisseur

### Gmail (Recommandé)

1. **Activer l'authentification à 2 facteurs** sur votre compte Google
2. **Générer un mot de passe d'application** :
   - Allez sur https://myaccount.google.com/security
   - Activez "Mots de passe d'application"
   - Générez un mot de passe pour "Mail"
   - Utilisez ce mot de passe dans `SMTP_PASS`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=abcd-efgh-ijkl-mnop  # Mot de passe d'application
```

### Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=votre-email@outlook.com
SMTP_PASS=votre-mot-de-passe
```

### Yahoo

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=votre-email@yahoo.com
SMTP_PASS=votre-mot-de-passe-d-application
```

### Fournisseur personnalisé

```env
SMTP_HOST=smtp.votre-domaine.com
SMTP_PORT=587
SMTP_USER=votre-email@votre-domaine.com
SMTP_PASS=votre-mot-de-passe
```

## 🧪 Test de la configuration

### 1. Redémarrer l'application

```bash
# Arrêter l'application
Ctrl+C

# Redémarrer
npm run start:dev
# ou
pnpm run start:dev
```

### 2. Vérifier les logs

Vous devriez voir ces messages dans les logs :

```
✅ Configuration SMTP détectée pour user***@*** sur smtp.gmail.com
```

Si vous voyez :
```
❌ Configuration SMTP manquante: SMTP_USER et SMTP_PASS doivent être définis
```

Alors les variables d'environnement ne sont pas correctement chargées.

### 3. Test d'envoi d'email

Utilisez l'endpoint d'envoi d'OTP pour tester :

```bash
curl -X POST http://localhost:3000/auth/request-otp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: votre-api-key" \
  -d '{
    "email": "test@example.com"
  }'
```

## 🔒 Sécurité

### Variables d'environnement

- ✅ **Correct** : Utiliser un fichier `.env` (non commité)
- ❌ **Incorrect** : Hardcoder les identifiants dans le code

### Fichier .env

```env
# .env (ne pas commiter ce fichier)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-d-application
```

### Fichier .env.example

```env
# .env.example (peut être commité)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

## 🚨 Erreurs courantes et solutions

### 1. "Missing credentials for PLAIN"

**Cause** : Identifiants manquants ou incorrects
**Solution** : Vérifier `SMTP_USER` et `SMTP_PASS`

### 2. "Authentication failed"

**Cause** : Mot de passe incorrect
**Solution** : 
- Pour Gmail : Utiliser un mot de passe d'application
- Pour autres : Vérifier le mot de passe

### 3. "Connection timeout"

**Cause** : Problème de réseau ou port incorrect
**Solution** : Vérifier `SMTP_HOST` et `SMTP_PORT`

### 4. "TLS required"

**Cause** : Configuration TLS incorrecte
**Solution** : Utiliser `SMTP_PORT=587` (TLS) ou `SMTP_PORT=465` (SSL)

## 📋 Checklist de résolution

- [ ] Variables `SMTP_USER` et `SMTP_PASS` définies dans `.env`
- [ ] Fichier `.env` chargé par l'application
- [ ] Identifiants corrects (mot de passe d'application pour Gmail)
- [ ] Port correct (587 pour TLS, 465 pour SSL)
- [ ] Application redémarrée après modification
- [ ] Logs de validation SMTP visibles
- [ ] Test d'envoi d'email réussi

## 🆘 Support

Si le problème persiste :

1. Vérifiez les logs complets de l'application
2. Testez avec un autre fournisseur SMTP
3. Vérifiez la connectivité réseau vers le serveur SMTP
4. Consultez la documentation de votre fournisseur SMTP 