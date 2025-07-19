import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class AppKeyGlobalGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Vérifier si la route est exemptée de la vérification de la clé d'application
    const isExempted = this.reflector.get<boolean>(
      'skipAppKeyCheck',
      context.getHandler(),
    );
    if (isExempted) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const appKey = request.headers['instakey'] as string;

    if (!appKey) {
      throw new UnauthorizedException("Clé d'application manquante (instakey)");
    }

    // Vérifier la clé d'application (à configurer dans les variables d'environnement)
    const validAppKey = process.env.APP_KEY || 'instacar-secret-key-2024';

    if (appKey !== validAppKey) {
      throw new UnauthorizedException("Clé d'application invalide");
    }

    return true;
  }
}
