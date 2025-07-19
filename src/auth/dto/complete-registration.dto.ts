import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Gender } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteRegistrationDto {
  @ApiProperty({
    description: "Adresse complète de l'utilisateur",
    example: '123 Rue de la Paix',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: "Ville de l'utilisateur",
    example: 'Paris',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: "Commune/Arrondissement de l'utilisateur",
    example: '1er arrondissement',
    required: false,
  })
  @IsOptional()
  @IsString()
  commune?: string;

  @ApiProperty({
    description: 'URL de la photo de profil',
    example: 'https://example.com/photo.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @ApiProperty({
    description: "Genre de l'utilisateur",
    enum: Gender,
    example: Gender.MALE,
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
