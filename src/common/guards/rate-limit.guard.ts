import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private store: RateLimitStore = {};
  private readonly maxAttempts = 5;
  private readonly windowMs = 60 * 60 * 1000; // 1 heure

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = this.getKey(request);
    const now = Date.now();

    // Nettoyer les entrées expirées
    this.cleanup();

    // Vérifier si la limite est dépassée
    if (this.store[key] && now < this.store[key].resetTime) {
      if (this.store[key].count >= this.maxAttempts) {
        const remainingTime = Math.ceil((this.store[key].resetTime - now) / 1000 / 60);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Trop de tentatives. Réessayez dans ${remainingTime} minutes.`,
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      this.store[key].count++;
    } else {
      // Première tentative ou fenêtre expirée
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
    }

    return true;
  }

  private getKey(request: Request): string {
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const endpoint = request.route?.path || request.path;
    return `${ip}:${endpoint}`;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }
} 