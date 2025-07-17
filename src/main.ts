import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
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

  // Configuration CORS
  app.enableCors();

  // Configuration des fichiers statiques
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('InstaCar API')
    .setDescription('API pour l\'application de taxi InstaCar')
    .setVersion('1.0')
    .addTag('auth', 'Authentification et inscription')
    .addTag('users', 'Gestion des utilisateurs')
    .addTag('drivers', 'Gestion des chauffeurs')
    .addTag('rides', 'Gestion des courses')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`Swagger documentation: http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap();
