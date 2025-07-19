import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class UpdateAvailabilityDto {
  @ApiProperty({
    description: 'Statut de disponibilité du chauffeur',
    example: true,
  })
  @IsBoolean()
  isAvailable: boolean;

  @ApiProperty({
    description: 'Latitude actuelle du chauffeur',
    example: 48.8566,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  currentLat?: number;

  @ApiProperty({
    description: 'Longitude actuelle du chauffeur',
    example: 2.3522,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  currentLng?: number;
}
