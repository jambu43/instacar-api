import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { OtpType } from '@prisma/client';

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async generateOtp(
    userId: number,
    type: OtpType = OtpType.EMAIL,
  ): Promise<string> {
    // Générer un code OTP de 6 chiffres
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Expiration dans 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Supprimer les anciens codes OTP non utilisés pour cet utilisateur
    await this.prisma.otpCode.deleteMany({
      where: {
        userId,
        type,
        isUsed: false,
      },
    });

    // Créer le nouveau code OTP
    await this.prisma.otpCode.create({
      data: {
        userId,
        code: otpCode,
        type,
        expiresAt,
      },
    });

    return otpCode;
  }

  async sendOtpEmail(
    userId: number,
  ): Promise<{ success: boolean; message: string; otpCode?: string }> {
    // Récupérer les informations de l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    // Générer le code OTP
    const otpCode = await this.generateOtp(userId, OtpType.EMAIL);

    // En mode développement, afficher le code dans les logs et retourner directement
    console.log(
      `🔐 [OTP Service] Code OTP généré: ${otpCode} pour ${user.email}`,
    );

    // En mode développement, ne pas essayer d'envoyer l'email
    if (process.env.NODE_ENV === 'development' || !process.env.SMTP_USER) {
      return {
        success: true,
        message: 'Code OTP généré (mode développement)',
        otpCode,
      };
    }

    try {
      // Envoyer l'email
      await this.emailService.sendOtpEmail(user.email, otpCode, user.name);

      return {
        success: true,
        message: 'Code OTP envoyé par email',
      };
    } catch (error) {
      console.error('Erreur envoi email OTP:', error);
      throw new Error("Erreur lors de l'envoi de l'email OTP");
    }
  }

  async verifyOtp(
    userId: number,
    otpCode: string,
    type: OtpType = OtpType.EMAIL,
  ): Promise<boolean> {
    // Trouver le code OTP
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        code: otpCode,
        type,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otp) {
      throw new UnauthorizedException('Code OTP invalide ou expiré');
    }

    // Marquer le code comme utilisé
    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    // Marquer l'email comme vérifié si c'est un OTP email
    if (type === OtpType.EMAIL) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });
    }

    return true;
  }

  async resendOtp(
    userId: number,
    type: OtpType = OtpType.EMAIL,
  ): Promise<{ success: boolean; message: string; otpCode?: string }> {
    // Vérifier s'il y a un code OTP récent (moins de 1 minute)
    const recentOtp = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        type,
        isUsed: false,
        createdAt: {
          gt: new Date(Date.now() - 60 * 1000), // 1 minute
        },
      },
    });

    if (recentOtp) {
      throw new BadRequestException(
        'Veuillez attendre 1 minute avant de redemander un code',
      );
    }

    // Envoyer un nouveau code OTP
    if (type === OtpType.EMAIL) {
      return await this.sendOtpEmail(userId);
    }

    throw new BadRequestException('Type OTP non supporté');
  }

  async cleanupExpiredOtps(): Promise<void> {
    // Supprimer les codes OTP expirés
    await this.prisma.otpCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
