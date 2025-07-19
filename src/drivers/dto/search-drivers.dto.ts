import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class SearchDriversDto {
  @ApiProperty({
    description: 'Latitude de la position de recherche',
    example: 48.8566,
  })
  @IsNumber()
  lat: number;

  @ApiProperty({
    description: 'Longitude de la position de recherche',
    example: 2.3522,
  })
  @IsNumber()
  lng: number;

  @ApiProperty({
    description: 'Rayon de recherche en kilomètres',
    example: 5,
    default: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  radius?: number = 5;

  @ApiProperty({
    description: 'Type de véhicule recherché',
    example: 'PROPRIETAIRE',
    required: false,
  })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiProperty({
    description: 'Nombre maximum de chauffeurs à retourner',
    example: 10,
    default: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
