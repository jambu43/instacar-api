import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = 'uploads';
  private readonly profilesDir = 'profiles';
  private readonly documentsDir = 'documents';

  constructor(private configService: ConfigService) {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const dirs = [
      this.uploadDir,
      path.join(this.uploadDir, this.profilesDir),
      path.join(this.uploadDir, this.documentsDir),
    ];

    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.log(`Dossier créé: ${dir}`);
      }
    });
  }

  async uploadProfilePhoto(file: Express.Multer.File): Promise<string> {
    try {
      // Vérifier le type de fichier
      if (!this.isValidImageType(file.mimetype)) {
        throw new Error('Type de fichier non supporté. Utilisez JPG, PNG ou GIF.');
      }

      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Fichier trop volumineux. Taille maximum: 5MB.');
      }

      // Générer un nom de fichier unique
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(this.uploadDir, this.profilesDir, fileName);

      // Sauvegarder le fichier
      fs.writeFileSync(filePath, file.buffer);

      // Retourner l'URL relative du fichier
      const relativePath = path.join(this.profilesDir, fileName).replace(/\\/g, '/');
      
      this.logger.log(`Photo de profil uploadée: ${relativePath}`);
      return relativePath;
    } catch (error) {
      this.logger.error(`Erreur lors de l'upload: ${error.message}`);
      throw error;
    }
  }

  private isValidImageType(mimetype: string): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    return allowedTypes.includes(mimetype);
  }

  private isValidDocumentType(mimetype: string): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
    ];
    return allowedTypes.includes(mimetype);
  }

  async deleteProfilePhoto(photoPath: string): Promise<boolean> {
    try {
      if (!photoPath) return true;

      const fullPath = path.join(this.uploadDir, photoPath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        this.logger.log(`Photo supprimée: ${photoPath}`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression: ${error.message}`);
      return false;
    }
  }

  getPhotoUrl(photoPath: string): string | null {
    if (!photoPath) return null;
    
    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    return `${baseUrl}/uploads/${photoPath}`;
  }

  async uploadDocument(file: Express.Multer.File): Promise<string> {
    try {
      // Vérifier le type de fichier
      if (!this.isValidDocumentType(file.mimetype)) {
        throw new Error(
          'Type de fichier non supporté. Utilisez JPG, PNG ou PDF.',
        );
      }

      // Vérifier la taille du fichier (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Fichier trop volumineux. Taille maximum: 10MB.');
      }

      // Générer un nom de fichier unique
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(this.uploadDir, this.documentsDir, fileName);

      // Sauvegarder le fichier
      fs.writeFileSync(filePath, file.buffer);

      // Retourner l'URL relative du fichier
      const relativePath = path
        .join(this.documentsDir, fileName)
        .replace(/\\/g, '/');
      
      this.logger.log(`Document uploadé: ${relativePath}`);
      return relativePath;
    } catch (error) {
      this.logger.error(`Erreur lors de l'upload: ${error.message}`);
      throw error;
    }
  }
} 