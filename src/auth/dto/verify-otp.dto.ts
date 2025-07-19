import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    description: "Email de l'utilisateur pour vérification OTP",
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Code OTP de 6 chiffres reçu par email',
    example: '123456',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  otpCode: string;
}
