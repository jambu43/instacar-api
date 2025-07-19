import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePreferencesDto {
  @ApiProperty({ description: 'Notifications de courses' })
  @IsBoolean()
  @IsOptional()
  rideNotifications?: boolean;

  @ApiProperty({ description: 'Notifications promotionnelles' })
  @IsBoolean()
  @IsOptional()
  promotionalNotifications?: boolean;

  @ApiProperty({ description: 'Notifications système' })
  @IsBoolean()
  @IsOptional()
  systemNotifications?: boolean;

  @ApiProperty({ description: 'Notifications par email' })
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @ApiProperty({ description: 'Notifications par SMS' })
  @IsBoolean()
  @IsOptional()
  smsNotifications?: boolean;

  @ApiProperty({ description: 'Notifications push' })
  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;

  @ApiProperty({ description: 'Activer les notifications push' })
  @IsBoolean()
  @IsOptional()
  enablePushNotifications?: boolean;

  @ApiProperty({ description: 'Activer les notifications de courses' })
  @IsBoolean()
  @IsOptional()
  enableRideNotifications?: boolean;

  @ApiProperty({ description: 'Activer les notifications promotionnelles' })
  @IsBoolean()
  @IsOptional()
  enablePromotionalNotifications?: boolean;

  @ApiProperty({
    description: 'Heure de début des heures silencieuses (format HH:MM)',
    example: '22:00',
  })
  @IsString()
  @IsOptional()
  quietHoursStart?: string;

  @ApiProperty({
    description: 'Heure de fin des heures silencieuses (format HH:MM)',
    example: '08:00',
  })
  @IsString()
  @IsOptional()
  quietHoursEnd?: string;
}
