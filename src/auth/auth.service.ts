import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { EmailService } from '../email/email.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { User, UserRole, Gender } from '@prisma/client';

interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}

interface CompleteRegistrationDto {
  address?: string;
  city?: string;
  commune?: string;
  profilePhoto?: string;
  gender?: Gender;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private otpService: OtpService,
    private emailService: EmailService,
  ) {}

  // Demander un code OTP pour connexion (utilisateur existant)
  async requestOtp(requestOtpDto: RequestOtpDto) {
    const { email } = requestOtpDto;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!existingUser) {
      throw new BadRequestException(
        "Aucun compte trouvé avec cet email. Veuillez d'abord vous inscrire.",
      );
    }

    // Envoyer le code OTP pour connexion
    try {
      const result = await this.otpService.sendOtpEmail(existingUser.id);
      return {
        success: true,
        message: 'Code OTP envoyé pour la connexion',
        isNewUser: false,
        ...(result.otpCode && { otpCode: result.otpCode }), // Inclure le code en mode développement
      };
    } catch (error) {
      console.error("Erreur lors de l'envoi OTP:", error);

      // En mode développement, retourner une réponse partielle
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          message: 'Code OTP généré (email non envoyé en mode développement)',
          isNewUser: false,
          otpCode: '123456', // Code de test pour le développement
        };
      }

      throw error;
    }
  }

  // Inscription initiale - créer un utilisateur temporaire et envoyer OTP
  async registerUser(registerUserDto: RegisterUserDto) {
    const {
      email,
      name,
      phone,
      gender,
      role = UserRole.PASSENGER,
    } = registerUserDto;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Un compte existe déjà avec cet email ou ce numéro de téléphone',
      );
    }

    // Créer l'utilisateur temporaire (non vérifié)
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        phone,
        gender,
        role,
        isVerified: false,
        emailVerified: false,
      },
    });

    // Envoyer le code OTP pour vérification
    try {
      const result = await this.otpService.sendOtpEmail(user.id);
      return {
        success: true,
        message: 'Code OTP envoyé pour vérifier votre compte',
        userId: user.id,
        isNewUser: true,
        ...(result.otpCode && { otpCode: result.otpCode }), // Inclure le code en mode développement
      };
    } catch (error) {
      console.error("Erreur lors de l'envoi OTP:", error);

      // En mode développement, retourner une réponse partielle
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          message: 'Code OTP généré (email non envoyé en mode développement)',
          userId: user.id,
          isNewUser: true,
          otpCode: '123456', // Code de test pour le développement
        };
      }

      throw error;
    }
  }

  // Inscription chauffeur - créer utilisateur + véhicule + chauffeur
  async registerDriver(registerDriverDto: RegisterDriverDto) {
    const {
      brand,
      model,
      year,
      color,
      plateNumber,
      capacity = 4,
      city,
      vehicleType,
      licenseNumber,
      fullName,
      phone,
      profilePhoto,
      identityDocument,
    } = registerDriverDto;

    // Vérifier si le chauffeur existe déjà
    const existingDriver = await this.prisma.driver.findFirst({
      where: {
        OR: [{ licenseNumber }, { phone }],
      },
    });

    if (existingDriver) {
      throw new BadRequestException(
        'Un chauffeur existe déjà avec ce numéro de permis ou ce téléphone',
      );
    }

    // Vérifier si le véhicule existe déjà
    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { plateNumber },
    });

    if (existingVehicle) {
      throw new BadRequestException(
        "Un véhicule existe déjà avec cette plaque d'immatriculation",
      );
    }

    // Créer l'utilisateur temporaire
    const user = await this.prisma.user.create({
      data: {
        email: `${phone}@driver.instacar.com`, // Email temporaire basé sur le téléphone
        name: fullName,
        phone,
        gender: 'MALE', // Par défaut, peut être modifié plus tard
        role: UserRole.DRIVER,
        isVerified: false,
        emailVerified: false,
      },
    });

    // Créer le véhicule
    const vehicle = await this.prisma.vehicle.create({
      data: {
        brand,
        model,
        year,
        color,
        plateNumber,
        capacity,
        city,
        vehicleType,
        isActive: true,
      },
    });

    // Créer le chauffeur
    const driver = await this.prisma.driver.create({
      data: {
        userId: user.id,
        licenseNumber,
        vehicleId: vehicle.id,
        fullName,
        phone,
        profilePhoto,
        identityDocument,
        isAvailable: false, // Non disponible tant que non vérifié
        isRegistrationComplete: false,
      },
    });

    // Envoyer le code OTP pour vérification
    try {
      const result = await this.otpService.sendOtpEmail(user.id);
      return {
        success: true,
        message: 'Code OTP envoyé pour vérifier votre compte chauffeur',
        userId: user.id,
        driverId: driver.id,
        vehicleId: vehicle.id,
        isNewUser: true,
        ...(result.otpCode && { otpCode: result.otpCode }), // Inclure le code en mode développement
      };
    } catch (error) {
      console.error("Erreur lors de l'envoi OTP:", error);

      // En mode développement, retourner une réponse partielle
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          message: 'Code OTP généré (email non envoyé en mode développement)',
          userId: user.id,
          driverId: driver.id,
          vehicleId: vehicle.id,
          isNewUser: true,
          otpCode: '123456', // Code de test pour le développement
        };
      }

      throw error;
    }
  }

  // Vérifier OTP et compléter l'inscription
  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otpCode } = verifyOtpDto;

    // Trouver l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        driver: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Vérifier le code OTP
    await this.otpService.verifyOtp(user.id, otpCode);

    // Marquer l'utilisateur comme vérifié
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerified: true,
      },
    });

    // Si c'est un chauffeur, le marquer comme disponible
    if (user.role === UserRole.DRIVER && user.driver) {
      await this.prisma.driver.update({
        where: { id: user.driver.id },
        data: {
          isAvailable: true,
          isRegistrationComplete: true,
        },
      });
    }

    // Générer les tokens
    const tokens = await this.generateTokens(user);

    // Sauvegarder le refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // Envoyer un email de bienvenue
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      console.error('Erreur envoi email de bienvenue:', error);
    }

    return {
      success: true,
      message: 'Authentification réussie',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: true,
        emailVerified: true,
        driver: user.driver
          ? {
              id: user.driver.id,
              isAvailable: user.driver.isAvailable,
              isRegistrationComplete: user.driver.isRegistrationComplete,
            }
          : null,
      },
      ...tokens,
    };
  }

  // Compléter l'inscription avec les informations manquantes
  async completeRegistration(
    completeRegistrationDto: CompleteRegistrationDto,
    userId: number,
  ) {
    // Vérifier que l'utilisateur existe et est vérifié
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { driver: true },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    if (!user.isVerified) {
      throw new BadRequestException(
        "Utilisateur non vérifié. Veuillez d'abord vérifier votre email.",
      );
    }

    // Mettre à jour les informations utilisateur
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        address: completeRegistrationDto.address,
        city: completeRegistrationDto.city,
        commune: completeRegistrationDto.commune,
        profilePhoto: completeRegistrationDto.profilePhoto,
        gender: completeRegistrationDto.gender,
        isProfileComplete: true,
      },
      include: { driver: true },
    });

    return {
      success: true,
      message: 'Inscription complétée avec succès',
      user: updatedUser,
    };
  }

  async resendOtp(email: string) {
    // Trouver l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Renvoyer le code OTP
    await this.otpService.resendOtp(user.id);

    return {
      success: true,
      message: 'Code OTP renvoyé avec succès',
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      // Vérifier le refresh token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshTokenDto.refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET,
        },
      );

      // Trouver l'utilisateur
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== refreshTokenDto.refreshToken) {
        throw new UnauthorizedException('Refresh token invalide');
      }

      // Générer de nouveaux tokens
      const tokens = await this.generateTokens(user);

      // Sauvegarder le nouveau refresh token
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return {
        success: true,
        message: 'Tokens renouvelés avec succès',
        ...tokens,
      };
    } catch {
      throw new UnauthorizedException('Refresh token invalide');
    }
  }

  async logout(userId: number) {
    // Supprimer le refresh token
    await this.updateRefreshToken(userId, null);

    return {
      success: true,
      message: 'Déconnexion réussie',
    };
  }

  async validateUser(userId: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '1h', // Access token expire en 1 heure (augmenté pour les tests)
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d', // Refresh token expire en 7 jours
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(
    userId: number,
    refreshToken: string | null,
  ) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }
}
