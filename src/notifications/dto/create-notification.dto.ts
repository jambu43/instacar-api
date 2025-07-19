import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({
    description: "ID de l'utilisateur qui recevra la notification",
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: 'Type de notification',
    enum: NotificationType,
    example: NotificationType.RIDE_REQUESTED,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({ description: 'Titre de la notification' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Message de la notification' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Données supplémentaires (optionnel)',
    example: { rideId: 1, driverId: 2 },
  })
  @IsOptional()
  data?: any;

  @ApiProperty({ description: 'ID de la course associée (optionnel)' })
  @IsNumber()
  @IsOptional()
  rideId?: number;

  @ApiProperty({ description: 'ID du chauffeur associé (optionnel)' })
  @IsNumber()
  @IsOptional()
  driverId?: number;
}
