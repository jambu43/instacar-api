import { Injectable, Logger } from '@nestjs/common';

export interface CacheOptions {
  ttl?: number; // Time to live en secondes
  prefix?: string;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache = new Map<string, { value: any; expiresAt: number }>();

  constructor() {
    // Nettoyer le cache expiré toutes les 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async get<T>(key: string, prefix?: string): Promise<T | null> {
    const fullKey = this.buildKey(key, prefix);
    const item = this.cache.get(fullKey);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(fullKey);
      return null;
    }

    this.logger.debug(`Cache hit: ${fullKey}`);
    return item.value as T;
  }

  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<void> {
    const { ttl = 3600, prefix } = options; // TTL par défaut: 1 heure
    const fullKey = this.buildKey(key, prefix);
    const expiresAt = Date.now() + ttl * 1000;

    this.cache.set(fullKey, { value, expiresAt });
    this.logger.debug(`Cache set: ${fullKey} (TTL: ${ttl}s)`);
  }

  async delete(key: string, prefix?: string): Promise<void> {
    const fullKey = this.buildKey(key, prefix);
    this.cache.delete(fullKey);
    this.logger.debug(`Cache delete: ${fullKey}`);
  }

  async deletePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
    this.logger.debug(`Cache delete pattern: ${pattern} (${keysToDelete.length} keys)`);
  }

  async exists(key: string, prefix?: string): Promise<boolean> {
    const fullKey = this.buildKey(key, prefix);
    const item = this.cache.get(fullKey);

    if (!item) {
      return false;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(fullKey);
      return false;
    }

    return true;
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
    const fullKey = this.buildKey(key, prefix);
    const current = await this.get<number>(key, prefix) || 0;
    const newValue = current + value;
    
    await this.set(key, newValue, { prefix });
    return newValue;
  }

  async decrement(key: string, value: number = 1, prefix?: string): Promise<number> {
    return this.increment(key, -value, prefix);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.logger.log('Cache cleared');
  }

  async getStats(): Promise<{
    size: number;
    keys: string[];
    memoryUsage: number;
  }> {
    const keys = Array.from(this.cache.keys());
    const memoryUsage = this.estimateMemoryUsage();

    return {
      size: this.cache.size,
      keys,
      memoryUsage,
    };
  }

  private buildKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  private cleanup(): void {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.logger.debug(`Cache cleanup: ${deletedCount} expired entries removed`);
    }
  }

  private estimateMemoryUsage(): number {
    // Estimation simple de l'utilisation mémoire
    let totalSize = 0;
    
    for (const [key, item] of this.cache.entries()) {
      totalSize += key.length * 2; // UTF-16
      totalSize += JSON.stringify(item.value).length * 2;
      totalSize += 16; // Overhead pour l'objet
    }
    
    return totalSize;
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
} 