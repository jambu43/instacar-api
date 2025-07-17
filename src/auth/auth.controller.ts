import { Controller, Post, Body, HttpException, HttpStatus, Param, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { OtpService, OtpType } from './services/otp.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private otpService: OtpService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Inscription d\'un nouvel utilisateur' })
  @ApiResponse({ 
    status: 201, 
    description: 'Utilisateur créé avec succès. Un code OTP a été envoyé.' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Un utilisateur avec cet email ou téléphone existe déjà' 
  })
  async register(@Body() registerDto: RegisterDto) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await this.authService.findUserByEmail(registerDto.email);
      if (existingUser) {
        throw new HttpException('Un utilisateur avec cet email existe déjà', HttpStatus.CONFLICT);
      }

      const existingPhone = await this.authService.findUserByPhone(registerDto.phone);
      if (existingPhone) {
        throw new HttpException('Un utilisateur avec ce numéro de téléphone existe déjà', HttpStatus.CONFLICT);
      }

      // Créer l'utilisateur
      const user = await this.authService.createUser(registerDto);

      // Envoyer le code OTP par email (par défaut)
      const otpSent = await this.otpService.sendOtp(
        user.id,
        user.email,
        user.phone,
        OtpType.EMAIL
      );

      if (!otpSent) {
        throw new HttpException('Erreur lors de l\'envoi du code OTP', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return {
        success: true,
        message: 'Inscription réussie. Un code de vérification a été envoyé à votre email.',
        userId: user.id,
        email: user.email,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erreur lors de l\'inscription', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Vérification du code OTP' })
  @ApiResponse({ 
    status: 200, 
    description: 'Code OTP vérifié avec succès. Compte activé.' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Code OTP invalide ou expiré' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Utilisateur non trouvé' 
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    try {
      // Trouver l'utilisateur par email
      const user = await this.authService.findUserByEmail(verifyOtpDto.email);
      if (!user) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      // Vérifier le code OTP
      const isValid = await this.otpService.verifyOtp(
        user.id,
        verifyOtpDto.code,
        OtpType.EMAIL
      );

      if (!isValid) {
        throw new HttpException('Code OTP invalide ou expiré', HttpStatus.BAD_REQUEST);
      }

      return {
        success: true,
        message: 'Vérification réussie. Votre compte est maintenant activé.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: true,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erreur lors de la vérification', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Renvoi du code OTP' })
  @ApiResponse({ 
    status: 200, 
    description: 'Nouveau code OTP envoyé avec succès' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Utilisateur non trouvé' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Utilisateur déjà vérifié' 
  })
  async resendOtp(@Body() body: { email: string; type?: OtpType }) {
    try {
      const user = await this.authService.findUserByEmail(body.email);
      if (!user) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      if (user.isVerified) {
        throw new HttpException('Utilisateur déjà vérifié', HttpStatus.BAD_REQUEST);
      }

      const otpType = body.type || OtpType.EMAIL;
      const otpSent = await this.otpService.sendOtp(
        user.id,
        user.email,
        user.phone,
        otpType
      );

      if (!otpSent) {
        throw new HttpException('Erreur lors de l\'envoi du code OTP', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return {
        success: true,
        message: `Nouveau code de vérification envoyé par ${otpType.toLowerCase()}.`,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erreur lors de l\'envoi du code OTP', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('complete-profile/:userId')
  @ApiOperation({ summary: 'Compléter le profil utilisateur (étape 2)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Profil complété avec succès' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Utilisateur non trouvé' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides' 
  })
  async completeProfile(
    @Param('userId') userId: string,
    @Body() completeProfileDto: CompleteProfileDto
  ) {
    try {
      const user = await this.authService.findUserById(parseInt(userId));
      if (!user) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      if (!user.isVerified) {
        throw new HttpException('Utilisateur non vérifié. Vérifiez d\'abord votre email.', HttpStatus.BAD_REQUEST);
      }

      const updatedUser = await this.authService.completeProfile(parseInt(userId), completeProfileDto);

      return {
        success: true,
        message: 'Profil complété avec succès.',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          address: updatedUser.address,
          city: updatedUser.city,
          commune: updatedUser.commune,
          profilePhoto: updatedUser.profilePhoto,
          isProfileComplete: true,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erreur lors de la complétion du profil', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('profile-status/:userId')
  @ApiOperation({ summary: 'Vérifier le statut du profil utilisateur' })
  @ApiResponse({ 
    status: 200, 
    description: 'Statut du profil récupéré' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Utilisateur non trouvé' 
  })
  async getProfileStatus(@Param('userId') userId: string) {
    try {
      const user = await this.authService.findUserById(parseInt(userId));
      if (!user) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      const isComplete = await this.authService.isProfileComplete(parseInt(userId));

      return {
        success: true,
        isVerified: user.isVerified,
        isProfileComplete: isComplete,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          address: user.address,
          city: user.city,
          commune: user.commune,
          profilePhoto: user.profilePhoto,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erreur lors de la récupération du statut', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 