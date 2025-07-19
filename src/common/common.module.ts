import { Module } from '@nestjs/common';
import { MetricsService } from './services/metrics.service';
import { MetricsController } from './controllers/metrics.controller';
import { MetricsInterceptor } from './interceptors/metrics.interceptor';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { CacheService } from './services/cache.service';
import { RedisCacheService } from './services/redis-cache.service';

@Module({
  providers: [
    MetricsService,
    MetricsInterceptor,
    RateLimitGuard,
    CacheService,
    RedisCacheService,
  ],
  controllers: [MetricsController],
  exports: [
    MetricsService,
    MetricsInterceptor,
    RateLimitGuard,
    CacheService,
    RedisCacheService,
  ],
})
export class CommonModule {} 