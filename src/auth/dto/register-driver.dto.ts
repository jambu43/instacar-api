import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { VehicleType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDriverDto {
  // Informations du véhicule
  @ApiProperty({
    description: 'Marque du véhicule',
    example: 'Toyota',
    required: true,
  })
  @IsString()
  brand: string;

  @ApiProperty({
    description: 'Modèle du véhicule',
    example: 'Corolla',
    required: true,
  })
  @IsString()
  model: string;

  @ApiProperty({
    description: 'Année de fabrication du véhicule',
    example: 2020,
    required: true,
  })
  @IsNumber()
  year: number;

  @ApiProperty({
    description: 'Couleur du véhicule',
    example: 'Blanc',
    required: true,
  })
  @IsString()
  color: string;

  @ApiProperty({
    description: "Plaque d'immatriculation (doit être unique)",
    example: 'AB-123-CD',
    required: true,
  })
  @IsString()
  plateNumber: string;

  @ApiProperty({
    description: 'Nombre de places assises (par défaut: 4)',
    example: 4,
    required: false,
    default: 4,
  })
  @IsOptional()
  @IsNumber()
  capacity?: number = 4;

  @ApiProperty({
    description: "Ville d'enregistrement du véhicule",
    example: 'Paris',
    required: true,
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Type de véhicule (PROPRIETAIRE ou LOCATION)',
    enum: VehicleType,
    example: VehicleType.PROPRIETAIRE,
    required: true,
  })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  // Informations du chauffeur
  @ApiProperty({
    description: 'Numéro de permis de conduire (doit être unique)',
    example: '123456789',
    required: true,
  })
  @IsString()
  licenseNumber: string;

  @ApiProperty({
    description: 'Nom complet du chauffeur',
    example: 'Jean Dupont',
    required: true,
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'Numéro de téléphone du chauffeur (doit être unique)',
    example: '+33123456789',
    required: true,
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'URL de la photo de profil du chauffeur',
    example: 'https://example.com/driver-photo.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @ApiProperty({
    description: "URL du document d'identité (permis ou carte d'identité)",
    example: 'https://example.com/identity-doc.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  identityDocument?: string;
}
