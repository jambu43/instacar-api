import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export class RegisterDto {
  @ApiProperty({
    description: 'Nom complet de l\'utilisateur',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Adresse email de l\'utilisateur',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Numéro de téléphone de l\'utilisateur',
    example: '+33123456789',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Genre de l\'utilisateur',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;
} 