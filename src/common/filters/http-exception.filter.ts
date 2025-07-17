import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Déterminer le statut HTTP
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Obtenir le message d'erreur
    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        message = Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message[0]
          : exceptionResponse.message;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Logger l'erreur avec tous les détails
    this.logger.error(
      `Exception occurred: ${exception instanceof Error ? exception.stack : 'Unknown error'}`,
      {
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        body: request.body,
        params: request.params,
        query: request.query,
        headers: request.headers,
        status,
        message,
      },
    );

    // Réponse d'erreur
    const errorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // En mode développement, ajouter plus de détails
    if (process.env.NODE_ENV !== 'production') {
      errorResponse['error'] = exception instanceof Error ? exception.stack : 'Unknown error';
    }

    response.status(status).json(errorResponse);
  }
} 