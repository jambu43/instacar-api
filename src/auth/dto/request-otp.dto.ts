import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({
    description:
      "Email de l'utilisateur existant pour demander un code OTP de connexion",
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  email: string;
}
