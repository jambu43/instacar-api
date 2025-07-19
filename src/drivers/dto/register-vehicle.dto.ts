import { IsString, IsInt, IsEnum, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VehicleType {
  PROPRIETAIRE = 'PROPRIETAIRE',
  LOCATION = 'LOCATION',
}

export class RegisterVehicleDto {
  @ApiProperty({
    description: "Ville d'enregistrement du véhicule",
    example: 'Paris',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Type de véhicule (propriétaire ou location)',
    enum: VehicleType,
    example: VehicleType.PROPRIETAIRE,
  })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({
    description: 'Marque du véhicule',
    example: 'Toyota',
  })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({
    description: 'Modèle du véhicule',
    example: 'Corolla',
  })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({
    description: 'Couleur du véhicule',
    example: 'Blanc',
  })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({
    description: 'Année de fabrication du véhicule',
    example: 2020,
    minimum: 1900,
    maximum: 2030,
  })
  @IsInt()
  @Min(1900)
  @Max(2030)
  year: number;

  @ApiProperty({
    description: "Numéro de plaque d'immatriculation",
    example: 'AB-123-CD',
  })
  @IsString()
  @IsNotEmpty()
  plateNumber: string;
}
