import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AppKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const appKey = request.headers['instakey'] as string;

    if (!appKey) {
      throw new UnauthorizedException("Clé d'application manquante");
    }

    // Vérifier la clé d'application (à configurer dans les variables d'environnement)
    const validAppKey = process.env.APP_KEY || 'instacar-secret-key-2024';

    if (appKey !== validAppKey) {
      throw new UnauthorizedException("Clé d'application invalide");
    }

    return true;
  }
}
