import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({
    description: 'Latitude de la position',
    example: 48.8566,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude de la position',
    example: 2.3522,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Précision de la localisation en mètres',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiProperty({
    description: 'Vitesse en m/s',
    example: 5.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiProperty({
    description: 'Direction en degrés (0-360)',
    example: 180,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiProperty({
    description: 'Altitude en mètres',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  altitude?: number;

  @ApiProperty({
    description: 'Adresse formatée',
    example: '123 Rue de la Paix, Paris',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Timestamp de la localisation',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  timestamp?: string;
}
