import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../services/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        this.metricsService.trackUserAction({
          userId: request.user?.sub,
          action: this.getActionName(request),
          endpoint: request.route?.path || request.path,
          method: request.method,
          statusCode: response.statusCode,
          responseTime,
          timestamp: new Date(),
          metadata: {
            userAgent: request.headers['user-agent'],
            ip: request.ip,
          },
        });
      }),
    );
  }

  private getActionName(request: any): string {
    const path = request.route?.path || request.path;
    const method = request.method;

    // Mapping des endpoints vers des actions plus lisibles
    const actionMap: Record<string, string> = {
      'POST:/api/auth/register-user': 'user_registration',
      'POST:/api/auth/register-driver': 'driver_registration',
      'POST:/api/auth/request-otp': 'otp_request',
      'POST:/api/auth/verify-otp': 'otp_verification',
      'GET:/api/auth/profile': 'profile_view',
      'POST:/api/auth/refresh': 'token_refresh',
      'POST:/api/auth/logout': 'user_logout',
    };

    const key = `${method}:${path}`;
    return actionMap[key] || `${method.toLowerCase()}_${path.replace(/\//g, '_')}`;
  }
} 