import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live en secondes
  prefix?: string;
}

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private redis: Redis | null;

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.logger.log('Redis connecté avec succès');
      });

      this.redis.on('error', (error) => {
        this.logger.error('Erreur Redis:', error);
      });

      this.redis.on('close', () => {
        this.logger.warn('Connexion Redis fermée');
      });

      this.redis.on('reconnecting', () => {
        this.logger.log('Reconnexion à Redis...');
      });
    } catch (error) {
      this.logger.error('Erreur lors de l\'initialisation Redis:', error);
      // Fallback vers le cache en mémoire si Redis n'est pas disponible
      this.redis = null;
    }
  }

  async get<T>(key: string, prefix?: string): Promise<T | null> {
    if (!this.redis) {
      return null;
    }

    try {
      const fullKey = this.buildKey(key, prefix);
      const value = await this.redis.get(fullKey);
      
      if (!value) {
        return null;
      }

      this.logger.debug(`Cache hit: ${fullKey}`);
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du cache: ${error.message}`);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const { ttl = 3600, prefix } = options; // TTL par défaut: 1 heure
      const fullKey = this.buildKey(key, prefix);
      const serializedValue = JSON.stringify(value);

      if (ttl > 0) {
        await this.redis.setex(fullKey, ttl, serializedValue);
      } else {
        await this.redis.set(fullKey, serializedValue);
      }

      this.logger.debug(`Cache set: ${fullKey} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Erreur lors de la sauvegarde du cache: ${error.message}`);
    }
  }

  async delete(key: string, prefix?: string): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const fullKey = this.buildKey(key, prefix);
      await this.redis.del(fullKey);
      this.logger.debug(`Cache delete: ${fullKey}`);
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression du cache: ${error.message}`);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Cache delete pattern: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression par pattern: ${error.message}`);
    }
  }

  async exists(key: string, prefix?: string): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, prefix);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      this.logger.error(`Erreur lors de la vérification d'existence: ${error.message}`);
      return false;
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    const cached = await this.get<T>(key, options.prefix);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  async increment(key: string, value: number = 1, prefix?: string): Promise<number> {
    if (!this.redis) {
      return 0;
    }

    try {
      const fullKey = this.buildKey(key, prefix);
      return await this.redis.incrby(fullKey, value);
    } catch (error) {
      this.logger.error(`Erreur lors de l'incrémentation: ${error.message}`);
      return 0;
    }
  }

  async decrement(key: string, value: number = 1, prefix?: string): Promise<number> {
    return this.increment(key, -value, prefix);
  }

  async clear(): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      await this.redis.flushdb();
      this.logger.log('Cache Redis vidé');
    } catch (error) {
      this.logger.error(`Erreur lors du vidage du cache: ${error.message}`);
    }
  }

  async getStats(): Promise<{
    size: number;
    memoryUsage: string;
    connected: boolean;
  }> {
    if (!this.redis) {
      return {
        size: 0,
        memoryUsage: '0 B',
        connected: false,
      };
    }

    try {
      const info = await this.redis.info('memory');
      const keys = await this.redis.dbsize();
      
      // Extraire l'utilisation mémoire depuis les infos Redis
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : '0 B';

      return {
        size: keys,
        memoryUsage,
        connected: this.redis.status === 'ready',
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des stats: ${error.message}`);
      return {
        size: 0,
        memoryUsage: '0 B',
        connected: false,
      };
    }
  }

  async ping(): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error(`Erreur lors du ping Redis: ${error.message}`);
      return false;
    }
  }

  private buildKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  // Méthodes spécialisées pour les cas d'usage courants
  async cacheUserProfile(userId: number, profile: any): Promise<void> {
    await this.set(`user:${userId}:profile`, profile, { ttl: 1800 }); // 30 minutes
  }

  async getUserProfile(userId: number): Promise<any | null> {
    return this.get(`user:${userId}:profile`);
  }

  async cacheDriverLocation(driverId: number, location: any): Promise<void> {
    await this.set(`driver:${driverId}:location`, location, { ttl: 300 }); // 5 minutes
  }

  async getDriverLocation(driverId: number): Promise<any | null> {
    return this.get(`driver:${driverId}:location`);
  }

  async cacheNearbyDrivers(
    latitude: number,
    longitude: number,
    radius: number,
    drivers: any[],
  ): Promise<void> {
    const key = `nearby:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${radius}`;
    await this.set(key, drivers, { ttl: 60 }); // 1 minute
  }

  async getNearbyDrivers(
    latitude: number,
    longitude: number,
    radius: number,
  ): Promise<any[] | null> {
    const key = `nearby:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${radius}`;
    return this.get(key);
  }

  async invalidateUserCache(userId: number): Promise<void> {
    await this.deletePattern(`user:${userId}:*`);
  }

  async invalidateDriverCache(driverId: number): Promise<void> {
    await this.deletePattern(`driver:${driverId}:*`);
  }

  async invalidateLocationCache(): Promise<void> {
    await this.deletePattern('nearby:*');
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Connexion Redis fermée');
    }
  }
} 