# Guide de Déploiement - InstaCar API

## 🚀 Vue d'ensemble

Ce guide détaille le déploiement de l'API InstaCar en production avec toutes les fonctionnalités avancées intégrées.

## 📋 Prérequis

### Infrastructure
- **Serveur**: Ubuntu 20.04+ ou équivalent
- **RAM**: Minimum 4GB (recommandé 8GB+)
- **CPU**: 2 cores minimum (recommandé 4+)
- **Stockage**: 50GB minimum
- **Réseau**: Connexion stable avec ports 80/443 ouverts

### Services externes
- **Base de données**: PostgreSQL 13+
- **Cache**: Redis 6+
- **Email**: Service SMTP (Gmail, SendGrid, etc.)
- **Push Notifications**: Firebase Cloud Messaging
- **Monitoring**: DataDog, New Relic ou équivalent

## 🔧 Installation

### 1. Préparation du serveur

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des dépendances
sudo apt install -y curl wget git build-essential

# Installation de Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation de PM2
sudo npm install -g pm2

# Installation de Redis
sudo apt install -y redis-server

# Installation de PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Installation de Nginx
sudo apt install -y nginx

# Installation de Certbot pour SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Configuration de la base de données

```bash
# Accès à PostgreSQL
sudo -u postgres psql

# Création de la base de données
CREATE DATABASE instacar_prod;
CREATE USER instacar_user WITH PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE instacar_prod TO instacar_user;
\q
```

### 3. Configuration de Redis

```bash
# Édition de la configuration Redis
sudo nano /etc/redis/redis.conf

# Modifications recommandées:
# maxmemory 512mb
# maxmemory-policy allkeys-lru
# save 900 1
# save 300 10
# save 60 10000

# Redémarrage de Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### 4. Déploiement de l'application

```bash
# Création du répertoire de l'application
sudo mkdir -p /var/www/instacar-api
sudo chown $USER:$USER /var/www/instacar-api

# Clonage du repository
cd /var/www/instacar-api
git clone https://github.com/votre-repo/instacar-api.git .

# Installation des dépendances
npm ci --only=production

# Configuration des variables d'environnement
cp .env.example .env
nano .env
```

### 5. Configuration des variables d'environnement

```env
# Application
NODE_ENV=production
PORT=3000
API_KEY=votre_api_key_securisee

# Base de données
DATABASE_URL="postgresql://instacar_user:votre_mot_de_passe_securise@localhost:5432/instacar_prod"

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=votre_jwt_secret_tres_securise
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_app

# Firebase Cloud Messaging
FCM_SERVER_KEY=votre_fcm_server_key
FCM_PROJECT_ID=votre_project_id

# Monitoring
DATADOG_API_KEY=votre_datadog_api_key
SENTRY_DSN=votre_sentry_dsn

# Sécurité
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

### 6. Migration de la base de données

```bash
# Génération du client Prisma
npx prisma generate

# Migration de la base de données
npx prisma migrate deploy

# Vérification de la base de données
npx prisma studio
```

### 7. Configuration de PM2

```bash
# Création du fichier ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'instacar-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Création des répertoires de logs
mkdir -p logs

# Démarrage de l'application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 8. Configuration de Nginx

```bash
# Création du fichier de configuration
sudo nano /etc/nginx/sites-available/instacar-api

# Contenu du fichier:
server {
    listen 80;
    server_name votre-domaine.com;

    # Redirection vers HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    # Certificat SSL
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    # Configuration SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Headers de sécurité
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy vers l'application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
```

```bash
# Activation du site
sudo ln -s /etc/nginx/sites-available/instacar-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Configuration SSL avec Let's Encrypt

```bash
# Obtention du certificat SSL
sudo certbot --nginx -d votre-domaine.com

# Renouvellement automatique
sudo crontab -e
# Ajouter: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔒 Sécurité

### 1. Configuration du pare-feu

```bash
# Installation d'UFW
sudo apt install -y ufw

# Configuration du pare-feu
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Sécurisation de PostgreSQL

```bash
# Édition de la configuration PostgreSQL
sudo nano /etc/postgresql/13/main/postgresql.conf

# Modifications recommandées:
# listen_addresses = 'localhost'
# max_connections = 100
# shared_buffers = 256MB
# effective_cache_size = 1GB

sudo nano /etc/postgresql/13/main/pg_hba.conf

# Restriction des accès:
# local   all             postgres                                peer
# local   all             all                                     md5
# host    all             all             127.0.0.1/32            md5
# host    all             all             ::1/128                 md5

sudo systemctl restart postgresql
```

### 3. Sécurisation de Redis

```bash
# Configuration de Redis
sudo nano /etc/redis/redis.conf

# Modifications de sécurité:
# bind 127.0.0.1
# requirepass votre_mot_de_passe_redis
# maxmemory 512mb
# maxmemory-policy allkeys-lru

sudo systemctl restart redis-server
```

## 📊 Monitoring et Logs

### 1. Configuration de PM2 Monitoring

```bash
# Installation de PM2 Plus
pm2 install pm2-server-monit

# Configuration des alertes
pm2 set pm2-server-monit:email votre-email@example.com
pm2 set pm2-server-monit:threshold 80
```

### 2. Configuration de logs avec logrotate

```bash
# Création du fichier de configuration logrotate
sudo nano /etc/logrotate.d/instacar-api

# Contenu:
/var/www/instacar-api/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. Intégration avec DataDog

```bash
# Installation de l'agent DataDog
DD_API_KEY=votre_datadog_api_key DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script_agent7.sh)"

# Configuration pour Node.js
sudo nano /etc/datadog-agent/conf.d/nodejs.d/conf.yaml

# Contenu:
instances:
  - host: localhost
    port: 3000
    tags:
      - "env:production"
      - "service:instacar-api"
```

## 🚀 Déploiement continu

### 1. Script de déploiement

```bash
# Création du script de déploiement
cat > deploy.sh << 'EOF'
#!/bin/bash

echo "🚀 Déploiement InstaCar API"

# Sauvegarde de la base de données
echo "📦 Sauvegarde de la base de données..."
pg_dump instacar_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Pull des dernières modifications
echo "📥 Récupération des modifications..."
git pull origin main

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm ci --only=production

# Génération du client Prisma
echo "🔧 Génération du client Prisma..."
npx prisma generate

# Migration de la base de données
echo "🗄️ Migration de la base de données..."
npx prisma migrate deploy

# Build de l'application
echo "🔨 Build de l'application..."
npm run build

# Redémarrage de l'application
echo "🔄 Redémarrage de l'application..."
pm2 reload instacar-api

# Vérification du statut
echo "✅ Vérification du statut..."
pm2 status

echo "🎉 Déploiement terminé!"
EOF

chmod +x deploy.sh
```

### 2. Configuration de GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.4
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        script: |
          cd /var/www/instacar-api
          ./deploy.sh
```

## 🔧 Maintenance

### 1. Sauvegarde automatique

```bash
# Script de sauvegarde
cat > backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/instacar"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Sauvegarde de la base de données
pg_dump instacar_prod > $BACKUP_DIR/db_backup_$DATE.sql

# Sauvegarde des fichiers
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/instacar-api

# Nettoyage des anciennes sauvegardes (garde 7 jours)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Sauvegarde terminée: $DATE"
EOF

chmod +x backup.sh

# Ajout au cron
crontab -e
# Ajouter: 0 2 * * * /var/www/instacar-api/backup.sh
```

### 2. Surveillance des performances

```bash
# Script de monitoring
cat > monitor.sh << 'EOF'
#!/bin/bash

# Vérification de l'utilisation CPU
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)

# Vérification de l'utilisation mémoire
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')

# Vérification de l'espace disque
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)

# Vérification de l'application
APP_STATUS=$(pm2 status | grep instacar-api | awk '{print $10}')

# Envoi d'alertes si nécessaire
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "ALERTE: CPU usage élevé: ${CPU_USAGE}%" | mail -s "Alerte CPU" admin@example.com
fi

if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "ALERTE: Mémoire usage élevé: ${MEMORY_USAGE}%" | mail -s "Alerte Mémoire" admin@example.com
fi

if [ "$DISK_USAGE" -gt 80 ]; then
    echo "ALERTE: Espace disque faible: ${DISK_USAGE}%" | mail -s "Alerte Disque" admin@example.com
fi

if [ "$APP_STATUS" != "online" ]; then
    echo "ALERTE: Application hors ligne" | mail -s "Alerte Application" admin@example.com
fi
EOF

chmod +x monitor.sh

# Ajout au cron (toutes les 5 minutes)
crontab -e
# Ajouter: */5 * * * * /var/www/instacar-api/monitor.sh
```

## 📈 Optimisation des performances

### 1. Configuration de la base de données

```sql
-- Optimisations PostgreSQL
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Redémarrage de PostgreSQL
SELECT pg_reload_conf();
```

### 2. Configuration de Redis

```bash
# Optimisations Redis
sudo nano /etc/redis/redis.conf

# Modifications:
# maxmemory 1gb
# maxmemory-policy allkeys-lru
# save 900 1
# save 300 10
# save 60 10000
# tcp-keepalive 300
# timeout 0
```

### 3. Configuration de Nginx

```bash
# Optimisations Nginx
sudo nano /etc/nginx/nginx.conf

# Dans le bloc http:
# client_max_body_size 10M;
# client_body_timeout 12;
# client_header_timeout 12;
# keepalive_timeout 15;
# send_timeout 10;
# gzip on;
# gzip_vary on;
# gzip_min_length 1024;
# gzip_comp_level 6;
```

## 🎯 Checklist de déploiement

- [ ] Infrastructure préparée
- [ ] Base de données configurée
- [ ] Redis configuré
- [ ] Variables d'environnement définies
- [ ] Application déployée
- [ ] PM2 configuré
- [ ] Nginx configuré
- [ ] SSL configuré
- [ ] Pare-feu configuré
- [ ] Monitoring configuré
- [ ] Sauvegardes configurées
- [ ] Tests d'intégration passés
- [ ] Documentation mise à jour

## 🆘 Dépannage

### Problèmes courants

1. **Application ne démarre pas**
   ```bash
   pm2 logs instacar-api
   pm2 restart instacar-api
   ```

2. **Base de données inaccessible**
   ```bash
   sudo systemctl status postgresql
   sudo systemctl restart postgresql
   ```

3. **Redis inaccessible**
   ```bash
   sudo systemctl status redis-server
   sudo systemctl restart redis-server
   ```

4. **Nginx erreur 502**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   pm2 status
   ```

### Contacts d'urgence

- **Administrateur système**: admin@example.com
- **Développeur**: dev@example.com
- **Support technique**: support@example.com

---

**Note**: Ce guide doit être adapté à votre environnement spécifique et à vos besoins de sécurité. 