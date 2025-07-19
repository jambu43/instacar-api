import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AppKeyGuard } from './guards/app-key.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: {
    sub: number;
  };
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  @UseGuards(AppKeyGuard, RateLimitGuard)
  @ApiOperation({
    summary: 'Demander un code OTP pour connexion',
    description:
      'Envoie un code OTP par email pour un utilisateur existant. Utilisé pour la connexion sans mot de passe.',
  })
  @ApiResponse({
    status: 200,
    description: 'Code OTP envoyé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Code OTP envoyé pour la connexion',
        },
        isNewUser: { type: 'boolean', example: false },
        otpCode: {
          type: 'string',
          example: '123456',
          description: 'Code OTP (visible en mode développement)',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Email invalide ou utilisateur non trouvé',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example:
            "Aucun compte trouvé avec cet email. Veuillez d'abord vous inscrire.",
        },
      },
    },
  })
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return this.authService.requestOtp(requestOtpDto);
  }

  @Post('register-user')
  @UseGuards(AppKeyGuard, RateLimitGuard)
  @ApiOperation({
    summary: "Inscription d'un nouvel utilisateur (passager)",
    description:
      'Crée un nouveau compte utilisateur et envoie un code OTP par email pour vérification. Aucun mot de passe requis - authentification uniquement par OTP.',
  })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé et OTP envoyé',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Code OTP envoyé pour vérifier votre compte',
        },
        userId: { type: 'number', example: 1 },
        isNewUser: { type: 'boolean', example: true },
        otpCode: {
          type: 'string',
          example: '123456',
          description: 'Code OTP (visible en mode développement)',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou utilisateur existant',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example:
            'Un compte existe déjà avec cet email ou ce numéro de téléphone',
        },
      },
    },
  })
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  @Post('register-driver')
  @UseGuards(AppKeyGuard)
  @ApiOperation({
    summary: "Inscription d'un nouveau chauffeur",
    description:
      'Crée un nouveau compte chauffeur avec véhicule et envoie un code OTP par email. Aucun mot de passe requis - authentification uniquement par OTP.',
  })
  @ApiResponse({
    status: 201,
    description: 'Chauffeur créé et OTP envoyé',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Code OTP envoyé pour vérifier votre compte chauffeur',
        },
        userId: { type: 'number', example: 1 },
        driverId: { type: 'number', example: 1 },
        vehicleId: { type: 'number', example: 1 },
        isNewUser: { type: 'boolean', example: true },
        otpCode: {
          type: 'string',
          example: '123456',
          description: 'Code OTP (visible en mode développement)',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou chauffeur existant',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example:
            'Un chauffeur existe déjà avec ce numéro de permis ou ce téléphone',
        },
      },
    },
  })
  async registerDriver(@Body() registerDriverDto: RegisterDriverDto) {
    return this.authService.registerDriver(registerDriverDto);
  }

  @Post('verify-otp')
  @UseGuards(AppKeyGuard, RateLimitGuard)
  @ApiOperation({
    summary: "Vérifier le code OTP et authentifier l'utilisateur",
    description:
      "Vérifie le code OTP et authentifie l'utilisateur. Retourne les tokens JWT pour l'accès aux endpoints protégés.",
  })
  @ApiResponse({
    status: 200,
    description: 'Authentification réussie',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Authentification réussie' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            phone: { type: 'string', example: '+33123456789' },
            role: { type: 'string', example: 'PASSENGER' },
            isVerified: { type: 'boolean', example: true },
            emailVerified: { type: 'boolean', example: true },
          },
        },
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Code OTP invalide',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Code OTP invalide ou expiré' },
      },
    },
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('resend-otp')
  @UseGuards(AppKeyGuard)
  @ApiOperation({
    summary: 'Renvoyer un code OTP',
    description:
      "Renvoye un nouveau code OTP par email. Utilisé si le code précédent a expiré ou n'a pas été reçu.",
  })
  @ApiResponse({
    status: 200,
    description: 'Code OTP renvoyé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Code OTP renvoyé avec succès' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Trop de demandes ou utilisateur non trouvé',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Utilisateur non trouvé' },
      },
    },
  })
  async resendOtp(@Body() body: { email: string }) {
    return this.authService.resendOtp(body.email);
  }

  @Post('refresh')
  @UseGuards(AppKeyGuard)
  @ApiOperation({
    summary: "Renouveler les tokens d'authentification",
    description:
      'Renouvelle les tokens JWT (access token et refresh token) en utilisant un refresh token valide.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens renouvelés avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Tokens renouvelés avec succès' },
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalide',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Refresh token invalide' },
      },
    },
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Get('profile')
  @UseGuards(AppKeyGuard, JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Récupérer le profil de l'utilisateur connecté",
    description:
      "Récupère les informations complètes du profil de l'utilisateur authentifié. Nécessite un token JWT valide.",
  })
  @ApiResponse({
    status: 200,
    description: 'Profil utilisateur récupéré avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'Jean Dupont' },
            phone: { type: 'string', example: '+33123456789' },
            role: { type: 'string', example: 'PASSENGER' },
            isVerified: { type: 'boolean', example: true },
            address: {
              type: 'string',
              example: '123 Rue de la Paix',
              nullable: true,
            },
            city: { type: 'string', example: 'Paris', nullable: true },
            commune: {
              type: 'string',
              example: '1er arrondissement',
              nullable: true,
            },
            profilePhoto: {
              type: 'string',
              example: 'https://example.com/photo.jpg',
              nullable: true,
            },
            isProfileComplete: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié - Token JWT manquant ou invalide',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async getProfile(@Request() req: RequestWithUser) {
    const user = await this.authService.validateUser(req.user.sub);

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        address: user.address,
        city: user.city,
        commune: user.commune,
        profilePhoto: user.profilePhoto,
        isProfileComplete: user.isProfileComplete,
      },
    };
  }

  @Post('logout')
  @UseGuards(AppKeyGuard, JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Déconnexion de l'utilisateur",
    description:
      "Déconnecte l'utilisateur en invalidant son refresh token. Nécessite un token JWT valide.",
  })
  @ApiResponse({
    status: 200,
    description: 'Déconnexion réussie',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Déconnexion réussie' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié - Token JWT manquant ou invalide',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async logout(@Request() req: RequestWithUser) {
    return this.authService.logout(req.user.sub);
  }
}
