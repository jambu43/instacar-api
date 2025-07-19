# 🔴 Configuration Redis pour InstaCar API

## 📋 Vue d'ensemble

Ce guide explique comment configurer Redis pour optimiser les performances de l'application InstaCar API en production.

## 🚀 Installation Redis

### Ubuntu/Debian
```bash
# Installation
sudo apt update
sudo apt install redis-server

# Démarrer le service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Vérifier le statut
sudo systemctl status redis-server
```

### macOS
```bash
# Installation avec Homebrew
brew install redis

# Démarrer le service
brew services start redis

# Vérifier le statut
brew services list | grep redis
```

### Docker
```bash
# Lancer Redis avec Docker
docker run -d \
  --name redis-instacar \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine \
  redis-server --appendonly yes

# Vérifier le conteneur
docker ps | grep redis
```

## ⚙️ Configuration Redis

### Fichier de configuration (`redis.conf`)

```conf
# Configuration de base
bind 127.0.0.1
port 6379
timeout 300
tcp-keepalive 60

# Persistance
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# AOF (Append Only File)
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Sécurité
requirepass votre_mot_de_passe_redis
maxclients 10000

# Performance
maxmemory 256mb
maxmemory-policy allkeys-lru
lazyfree-lazy-eviction no
lazyfree-lazy-expire no
lazyfree-lazy-server-del no

# Logs
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16
```

### Variables d'environnement

Ajoutez ces variables à votre fichier `.env` :

```env
# Configuration Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=votre_mot_de_passe_redis
REDIS_DB=0

# Configuration de cache
CACHE_TTL_DEFAULT=3600
CACHE_TTL_USER_PROFILE=1800
CACHE_TTL_DRIVER_LOCATION=300
CACHE_TTL_NEARBY_DRIVERS=60
```

## 🔧 Optimisations de Performance

### 1. Configuration mémoire
```conf
# Limiter l'utilisation mémoire
maxmemory 512mb
maxmemory-policy allkeys-lru

# Activer la compression
rdbcompression yes
```

### 2. Configuration réseau
```conf
# Optimiser les connexions
tcp-keepalive 60
tcp-backlog 511
```

### 3. Configuration de persistance
```conf
# Sauvegarde automatique
save 900 1      # Sauvegarder si au moins 1 clé modifiée en 900s
save 300 10     # Sauvegarder si au moins 10 clés modifiées en 300s
save 60 10000   # Sauvegarder si au moins 10000 clés modifiées en 60s
```

## 📊 Monitoring Redis

### Commandes de monitoring
```bash
# Connexion à Redis CLI
redis-cli -a votre_mot_de_passe_redis

# Statistiques générales
INFO

# Statistiques mémoire
INFO memory

# Statistiques des clés
INFO keyspace

# Monitoring en temps réel
MONITOR

# Statistiques des commandes
INFO commandstats
```

### Script de monitoring
```bash
#!/bin/bash
# monitoring-redis.sh

REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="votre_mot_de_passe_redis"

echo "🔴 Monitoring Redis - $(date)"
echo "================================"

# Connexions actives
CONNECTIONS=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD INFO clients | grep "connected_clients" | cut -d: -f2)
echo "📡 Connexions actives: $CONNECTIONS"

# Utilisation mémoire
MEMORY=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD INFO memory | grep "used_memory_human" | cut -d: -f2)
echo "💾 Utilisation mémoire: $MEMORY"

# Nombre de clés
KEYS=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD DBSIZE)
echo "🔑 Nombre de clés: $KEYS"

# Hit rate
HITS=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD INFO stats | grep "keyspace_hits" | cut -d: -f2)
MISSES=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD INFO stats | grep "keyspace_misses" | cut -d: -f2)

if [ "$HITS" -gt 0 ] || [ "$MISSES" -gt 0 ]; then
    TOTAL=$((HITS + MISSES))
    HIT_RATE=$(echo "scale=2; $HITS * 100 / $TOTAL" | bc)
    echo "📈 Hit rate: ${HIT_RATE}%"
else
    echo "📈 Hit rate: 0%"
fi

echo ""
```

## 🔒 Sécurité

### 1. Authentification
```conf
# Activer l'authentification
requirepass votre_mot_de_passe_complexe
```

### 2. Réseau
```conf
# Limiter l'accès réseau
bind 127.0.0.1
protected-mode yes
```

### 3. Commandes dangereuses
```conf
# Désactiver les commandes dangereuses
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
```

## 🚀 Intégration avec l'application

### Service Redis dans l'application

Le service `RedisCacheService` est déjà configuré pour :

- **Connexion automatique** avec retry
- **Fallback gracieux** si Redis n'est pas disponible
- **Gestion des erreurs** robuste
- **Méthodes spécialisées** pour les cas d'usage courants

### Utilisation dans le code

```typescript
// Injection du service
constructor(private redisCache: RedisCacheService) {}

// Cache simple
await this.redisCache.set('key', value, { ttl: 3600 });

// Cache avec factory
const data = await this.redisCache.getOrSet('key', async () => {
  return await this.fetchDataFromDatabase();
}, { ttl: 1800 });

// Cache spécialisé
await this.redisCache.cacheUserProfile(userId, profile);
await this.redisCache.cacheDriverLocation(driverId, location);
```

## 📈 Métriques de Performance

### Objectifs de performance
- **Temps de réponse cache** : < 1ms
- **Hit rate** : > 80%
- **Utilisation mémoire** : < 70%
- **Connexions simultanées** : < 1000

### Monitoring recommandé
- **Redis Exporter** pour Prometheus
- **Grafana** pour les dashboards
- **Alertes** sur les seuils critiques

## 🔧 Maintenance

### Sauvegarde automatique
```bash
#!/bin/bash
# backup-redis.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/redis"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Créer le répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarde RDB
redis-cli -h $REDIS_HOST -p $REDIS_PORT BGSAVE

# Attendre la fin de la sauvegarde
sleep 10

# Copier le fichier de sauvegarde
cp /var/lib/redis/dump.rdb $BACKUP_DIR/dump_$DATE.rdb

# Nettoyer les anciennes sauvegardes (garder 7 jours)
find $BACKUP_DIR -name "dump_*.rdb" -mtime +7 -delete

echo "Sauvegarde Redis terminée: $BACKUP_DIR/dump_$DATE.rdb"
```

### Nettoyage automatique
```bash
# Script de nettoyage des clés expirées
redis-cli --scan --pattern "*" | while read key; do
  redis-cli TTL "$key" | grep -q "^-1$" && redis-cli DEL "$key"
done
```

## 🎯 Conclusion

Avec cette configuration Redis, votre application InstaCar API bénéficiera de :

- ✅ **Performance optimale** avec cache en mémoire
- ✅ **Haute disponibilité** avec persistance
- ✅ **Sécurité renforcée** avec authentification
- ✅ **Monitoring complet** des métriques
- ✅ **Maintenance automatisée** des sauvegardes

L'intégration Redis est maintenant prête pour la production ! 🚀 