import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendOtpEmail(email: string, otpCode: string, userName: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Code de vérification InstaCar',
        template: 'otp-email',
        context: {
          userName,
          otpCode,
          appName: 'InstaCar',
        },
      });

      return {
        success: true,
        message: 'Email OTP envoyé avec succès',
      };
    } catch (error) {
      console.error('Erreur envoi email OTP:', error);
      throw new Error("Erreur lors de l'envoi de l'email OTP");
    }
  }

  async sendWelcomeEmail(email: string, userName: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Bienvenue sur InstaCar !',
        template: 'welcome-email',
        context: {
          userName,
          appName: 'InstaCar',
        },
      });

      return {
        success: true,
        message: 'Email de bienvenue envoyé avec succès',
      };
    } catch (error) {
      console.error('Erreur envoi email de bienvenue:', error);
      throw new Error("Erreur lors de l'envoi de l'email de bienvenue");
    }
  }
}
