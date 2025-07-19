import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { NotificationType } from '@prisma/client';

export class SendNotificationDto {
  @ApiProperty({
    description: 'IDs des utilisateurs destinataires',
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  userIds: number[];

  @ApiProperty({
    description: 'Type de notification',
    enum: NotificationType,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({ description: 'Titre de la notification' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Corps de la notification' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Données supplémentaires (optionnel)',
    example: { rideId: 1, driverId: 2 },
  })
  @IsOptional()
  data?: any;

  @ApiProperty({
    description: 'Image de la notification (optionnel)',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({
    description: 'Action à effectuer lors du clic (optionnel)',
    example: 'OPEN_RIDE_DETAILS',
  })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiProperty({
    description: 'Badge à afficher (optionnel)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  badge?: number;

  @ApiProperty({
    description: 'Son à jouer (optionnel)',
    example: 'default',
    required: false,
  })
  @IsOptional()
  @IsString()
  sound?: string;

  @ApiProperty({
    description: 'Priorité de la notification',
    example: 'high',
    enum: ['high', 'normal'],
    default: 'normal',
    required: false,
  })
  @IsOptional()
  @IsString()
  priority?: 'high' | 'normal';

  @ApiProperty({
    description: 'Durée de vie en secondes',
    example: 3600,
    default: 3600,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  ttl?: number;

  @ApiProperty({
    description: 'ID du canal de notification',
    example: 'instacar_channel',
    required: false,
  })
  @IsOptional()
  @IsString()
  channelId?: string;
}
