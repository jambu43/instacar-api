import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './services/otp.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, ConfigModule, UploadModule],
  controllers: [AuthController],
  providers: [AuthService, OtpService],
  exports: [AuthService, OtpService],
})
export class AuthModule {} 