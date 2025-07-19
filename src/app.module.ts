import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { DriversModule } from './drivers/drivers.module';
import { RidesModule } from './rides/rides.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LocationModule } from './location/location.module';
import { WebsocketModule } from './websocket/websocket.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';
import { EmailModule } from './email/email.module';
import { OtpModule } from './otp/otp.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    UploadModule,
    DriversModule,
    RidesModule,
    NotificationsModule,
    LocationModule,
    WebsocketModule,
    PushNotificationsModule,
    EmailModule,
    OtpModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
