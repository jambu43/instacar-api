import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Platform } from '@prisma/client';

export class RegisterTokenDto {
  @ApiProperty({ description: 'Token FCM (Firebase Cloud Messaging)' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: "Plateforme de l'appareil",
    enum: Platform,
    example: Platform.ANDROID,
  })
  @IsEnum(Platform)
  @IsNotEmpty()
  platform: Platform;

  @ApiProperty({
    description: 'ID unique de l\'appareil',
    example: 'device-123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
