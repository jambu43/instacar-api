import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppKeyGlobalGuard } from './common/guards/app-key-global.guard';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { MetricsService } from './common/services/metrics.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configuration du préfixe global pour toutes les routes
  app.setGlobalPrefix('api');

  // Configuration du guard global pour la clé d'application
  app.useGlobalGuards(new AppKeyGlobalGuard(app.get(Reflector)));

  // Configuration de la validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuration du filtre d'exception global
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configuration de l'interceptor de métriques global
  const metricsService = app.get(MetricsService);
  app.useGlobalInterceptors(new MetricsInterceptor(metricsService));

  // Configuration CORS
  app.enableCors();

  // Configuration des fichiers statiques
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('InstaCar API')
    .setDescription("API pour l'application de taxi InstaCar")
    .setVersion('1.0')
    .addTag('auth', 'Authentification et inscription')
    .addTag('users', 'Gestion des utilisateurs')
    .addTag('drivers', 'Gestion des chauffeurs')
    .addTag('rides', 'Gestion des courses')
    .addTag('notifications', 'Système de notifications')
    .addTag('location', 'Géolocalisation en temps réel')
    .addTag('push-notifications', 'Notifications push mobiles')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'instakey', in: 'header' }, 'AppKey')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `Swagger documentation: http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}
bootstrap();
