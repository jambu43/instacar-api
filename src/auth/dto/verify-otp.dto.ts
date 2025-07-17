import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Adresse email de l\'utilisateur',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Code OTP à 5 chiffres',
    example: '12345',
    minLength: 5,
    maxLength: 5,
  })
  @IsNotEmpty()
  @IsString()
  @Length(5, 5)
  code: string;
} 