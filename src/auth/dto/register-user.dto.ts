import { IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';
import { Gender, UserRole } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({
    description: "Adresse email de l'utilisateur (doit être unique)",
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Nom complet de l'utilisateur",
    example: 'Jean Dupont',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Numéro de téléphone (doit être unique)',
    example: '+33123456789',
    required: true,
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: "Genre de l'utilisateur",
    enum: Gender,
    example: Gender.MALE,
    required: true,
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    description: "Rôle de l'utilisateur (par défaut: PASSENGER)",
    enum: UserRole,
    example: UserRole.PASSENGER,
    required: false,
    default: UserRole.PASSENGER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.PASSENGER;

  @ApiProperty({
    description: "Adresse complète (optionnelle pour l'inscription initiale)",
    example: '123 Rue de la Paix',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: "Ville (optionnelle pour l'inscription initiale)",
    example: 'Paris',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description:
      "Commune/Arrondissement (optionnelle pour l'inscription initiale)",
    example: '1er arrondissement',
    required: false,
  })
  @IsOptional()
  @IsString()
  commune?: string;

  @ApiProperty({
    description: 'URL de la photo de profil (optionnelle)',
    example: 'https://example.com/photo.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  profilePhoto?: string;
}
