import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import * as twilio from 'twilio';

export enum OtpType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private emailTransporter: nodemailer.Transporter;
  private twilioClient: twilio.Twilio;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.initializeEmailTransporter();
    // Initialiser Twilio de manière asynchrone pour éviter les erreurs au démarrage
    setTimeout(() => {
      this.initializeTwilioClient();
    }, 0);
  }

  private initializeEmailTransporter() {
    try {
      const emailUser = this.configService.get('EMAIL_USER');
      const emailPass = this.configService.get('EMAIL_PASS');
      const emailHost = this.configService.get('EMAIL_HOST');
      const emailPort = this.configService.get('EMAIL_PORT');

      this.logger.log(
        `Configuration email: ${emailUser}@${emailHost}:${emailPort}`,
      );

      if (
        !emailUser ||
        !emailPass ||
        emailUser === 'your-email@gmail.com' ||
        emailPass === 'your-app-password'
      ) {
        this.logger.warn(
          'Configuration email manquante ou par défaut. Les emails seront simulés.',
        );
        this.logger.warn('Pour configurer Gmail:');
        this.logger.warn("1. Activez l'authentification à 2 facteurs");
        this.logger.warn("2. Créez un mot de passe d'application");
        this.logger.warn('3. Mettez à jour EMAIL_USER et EMAIL_PASS dans .env');
        return;
      }

      this.emailTransporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: false,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Tester la connexion
      this.emailTransporter.verify((error, success) => {
        if (error) {
          this.logger.error(`Erreur de configuration email: ${error.message}`);
          this.logger.error('Vérifiez:');
          this.logger.error("- L'authentification à 2 facteurs est activée");
          this.logger.error("- Le mot de passe d'application est correct");
          this.logger.error(
            '- Les paramètres EMAIL_USER et EMAIL_PASS dans .env',
          );
          this.logger.warn('Les emails seront simulés en mode développement.');
        } else {
          this.logger.log('✅ Configuration email validée avec succès');
        }
      });
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'initialisation email: ${error.message}`,
      );
      this.logger.warn('Les emails seront simulés en mode développement.');
    }
  }

  private initializeTwilioClient() {
    try {
      const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get('TWILIO_AUTH_TOKEN');

      if (accountSid && authToken && accountSid.startsWith('AC')) {
        this.twilioClient = twilio(accountSid, authToken);
        this.logger.log('Twilio initialisé avec succès');
      } else {
        this.logger.warn(
          'Twilio non configuré ou configuration invalide. SMS/WhatsApp seront simulés.',
        );
      }
    } catch (error) {
      this.logger.warn(
        "Erreur lors de l'initialisation de Twilio. SMS/WhatsApp seront simulés.",
      );
    }
  }

  private generateOtpCode(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  async sendOtp(
    userId: number,
    email: string,
    phone: string,
    type: OtpType,
  ): Promise<boolean> {
    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    try {
      // Sauvegarder le code OTP en base
      await this.prisma.otpCode.create({
        data: {
          userId,
          code,
          type,
          expiresAt,
        },
      });

      // Envoyer le code selon le type
      switch (type) {
        case OtpType.EMAIL:
          return await this.sendEmailOtp(email, code);
        case OtpType.SMS:
          return await this.sendSmsOtp(phone, code);
        case OtpType.WHATSAPP:
          return await this.sendWhatsAppOtp(phone, code);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi OTP: ${error.message}`);
      return false;
    }
  }

  private async sendEmailOtp(email: string, code: string): Promise<boolean> {
    try {
      if (!this.emailTransporter) {
        this.logger.warn(`Email simulé pour ${email}: Code OTP = ${code}`);
        return true; // Simulation en mode développement
      }

      await this.emailTransporter.sendMail({
        from: this.configService.get('EMAIL_USER'),
        to: email,
        subject: 'Code de vérification InstaCar',
        html: `
          <h2>Votre code de vérification</h2>
          <p>Votre code de vérification est : <strong>${code}</strong></p>
          <p>Ce code expire dans 10 minutes.</p>
          <p>Si vous n'avez pas demandé ce code, ignorez cet email.</p>
        `,
      });
      this.logger.log(`Email OTP envoyé avec succès à ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Erreur envoi email: ${error.message}`);
      this.logger.warn(`Email simulé pour ${email}: Code OTP = ${code}`);
      return true; // Simulation en mode développement
    }
  }

  private async sendSmsOtp(phone: string, code: string): Promise<boolean> {
    if (!this.twilioClient) {
      this.logger.warn('Twilio non configuré, simulation SMS');
      return true; // Simulation pour le développement
    }

    try {
      await this.twilioClient.messages.create({
        body: `Votre code de vérification InstaCar: ${code}. Expire dans 10 minutes.`,
        from: this.configService.get('TWILIO_PHONE_NUMBER'),
        to: phone,
      });
      return true;
    } catch (error) {
      this.logger.error(`Erreur envoi SMS: ${error.message}`);
      return false;
    }
  }

  private async sendWhatsAppOtp(phone: string, code: string): Promise<boolean> {
    if (!this.twilioClient) {
      this.logger.warn('Twilio non configuré, simulation WhatsApp');
      return true; // Simulation pour le développement
    }

    try {
      await this.twilioClient.messages.create({
        body: `Votre code de vérification InstaCar: ${code}. Expire dans 10 minutes.`,
        from: `whatsapp:${this.configService.get('TWILIO_PHONE_NUMBER')}`,
        to: `whatsapp:${phone}`,
      });
      return true;
    } catch (error) {
      this.logger.error(`Erreur envoi WhatsApp: ${error.message}`);
      return false;
    }
  }

  async verifyOtp(
    userId: number,
    code: string,
    type: OtpType,
  ): Promise<boolean> {
    try {
      const otpRecord = await this.prisma.otpCode.findFirst({
        where: {
          userId,
          code,
          type,
          isUsed: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!otpRecord) {
        return false;
      }

      // Marquer le code comme utilisé
      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });

      // Marquer l'utilisateur comme vérifié
      await this.prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });

      return true;
    } catch (error) {
      this.logger.error(`Erreur vérification OTP: ${error.message}`);
      return false;
    }
  }
}
