import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private mailerService: MailerService) {
    // Vérifier la configuration SMTP au démarrage
    this.validateSmtpConfig();
  }

  private validateSmtpConfig() {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST;

    if (!smtpUser || !smtpPass) {
      this.logger.error('Configuration SMTP manquante: SMTP_USER et SMTP_PASS doivent être définis');
      this.logger.warn('Les emails ne pourront pas être envoyés sans configuration SMTP valide');
    } else {
      this.logger.log(`Configuration SMTP détectée pour ${smtpUser} sur ${smtpHost || 'smtp.gmail.com'}`);
    }
  }

  async sendOtpEmail(email: string, otpCode: string, userName: string) {
    try {
      // Vérifier que les identifiants SMTP sont configurés
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('Configuration SMTP manquante. Impossible d\'envoyer l\'email.');
      }

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

      this.logger.log(`Email OTP envoyé avec succès à ${email}`);
      return {
        success: true,
        message: 'Email OTP envoyé avec succès',
      };
    } catch (error) {
      this.logger.error(`Erreur envoi email OTP à ${email}:`, error.message);
      
      // Gestion spécifique des erreurs d'authentification
      if (error.message.includes('Missing credentials') || error.message.includes('Authentication failed')) {
        throw new Error('Erreur d\'authentification SMTP. Vérifiez les identifiants SMTP_USER et SMTP_PASS.');
      }
      
      if (error.message.includes('Configuration SMTP manquante')) {
        throw new Error('Configuration SMTP manquante. Contactez l\'administrateur.');
      }

      throw new Error("Erreur lors de l'envoi de l'email OTP");
    }
  }

  async sendWelcomeEmail(email: string, userName: string) {
    try {
      // Vérifier que les identifiants SMTP sont configurés
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('Configuration SMTP manquante. Impossible d\'envoyer l\'email.');
      }

      await this.mailerService.sendMail({
        to: email,
        subject: 'Bienvenue sur InstaCar !',
        template: 'welcome-email',
        context: {
          userName,
          appName: 'InstaCar',
        },
      });

      this.logger.log(`Email de bienvenue envoyé avec succès à ${email}`);
      return {
        success: true,
        message: 'Email de bienvenue envoyé avec succès',
      };
    } catch (error) {
      this.logger.error(`Erreur envoi email de bienvenue à ${email}:`, error.message);
      
      // Gestion spécifique des erreurs d'authentification
      if (error.message.includes('Missing credentials') || error.message.includes('Authentication failed')) {
        throw new Error('Erreur d\'authentification SMTP. Vérifiez les identifiants SMTP_USER et SMTP_PASS.');
      }
      
      if (error.message.includes('Configuration SMTP manquante')) {
        throw new Error('Configuration SMTP manquante. Contactez l\'administrateur.');
      }

      throw new Error("Erreur lors de l'envoi de l'email de bienvenue");
    }
  }

  // Méthode pour vérifier la configuration SMTP
  async checkSmtpConfig() {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = process.env.SMTP_PORT || '587';

    if (!smtpUser || !smtpPass) {
      return {
        success: false,
        message: 'Configuration SMTP manquante',
        details: 'SMTP_USER et SMTP_PASS doivent être définis',
        config: {
          host: smtpHost,
          port: smtpPort,
          user: smtpUser ? '***configured***' : 'MISSING',
          pass: smtpPass ? '***configured***' : 'MISSING'
        }
      };
    }

    return {
      success: true,
      message: 'Configuration SMTP détectée',
      details: `Prêt à envoyer des emails via ${smtpHost}:${smtpPort}`,
      config: {
        host: smtpHost,
        port: smtpPort,
        user: `${smtpUser.substring(0, 3)}***@***`,
        pass: '***configured***'
      }
    };
  }
}
