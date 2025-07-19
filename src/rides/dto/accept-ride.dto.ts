import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class AcceptRideDto {
  @ApiProperty({
    description: 'ID du chauffeur qui accepte la course',
    example: 1,
  })
  @IsNumber()
  driverId: number;

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
