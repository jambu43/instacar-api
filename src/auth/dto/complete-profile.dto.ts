import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteProfileDto {
  @ApiProperty({
    description: 'Adresse complète de l\'utilisateur',
    example: '123 Rue de la Paix',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Ville de l\'utilisateur',
    example: 'Paris',
  })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Commune/Quartier de l\'utilisateur',
    example: 'Le Marais',
  })
  @IsNotEmpty()
  @IsString()
  commune: string;

  @ApiProperty({
    description: 'URL de la photo de profil',
    example: 'https://example.com/photos/profile.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  profilePhoto?: string;
} 