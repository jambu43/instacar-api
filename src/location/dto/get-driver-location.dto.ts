import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class GetDriverLocationDto {
  @ApiProperty({
    description: 'Latitude du point de référence',
    example: 48.8566,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({
    description: 'Longitude du point de référence',
    example: 2.3522,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty({
    description: 'Rayon de recherche en kilomètres',
    example: 5,
    default: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(50)
  radius?: number = 5;

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

  @ApiProperty({
    description: 'Filtrer uniquement les chauffeurs disponibles',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  available?: boolean = true;
}
