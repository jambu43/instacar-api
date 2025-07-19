import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDriverDto {
  @ApiProperty({
    description: 'Nom complet du chauffeur',
    example: 'Jean Dupont',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'Numéro de téléphone du chauffeur',
    example: '+33123456789',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Numéro de permis de conduire',
    example: '123456789012345',
  })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiProperty({
    description: 'Chemin vers la photo de profil (optionnel)',
    example: 'profiles/uuid-photo.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  profilePhoto?: string;

  @ApiProperty({
    description:
      "Chemin vers le document d'identité (permis ou carte d'identité)",
    example: 'documents/uuid-document.pdf',
  })
  @IsString()
  @IsNotEmpty()
  identityDocument: string;
}
