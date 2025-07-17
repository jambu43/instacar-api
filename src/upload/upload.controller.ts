import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { UploadService } from './upload.service';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('profile-photo')
  @ApiOperation({ summary: "Upload d'une photo de profil" })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Photo de profil',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Fichier image (JPG, PNG, GIF, max 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Photo uploadée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        photoPath: { type: 'string' },
        photoUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Fichier invalide ou trop volumineux',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new BadRequestException('Seuls les fichiers JPG, PNG et GIF sont autorisés'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadProfilePhoto(@UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException('Aucun fichier fourni');
      }

      const photoPath = await this.uploadService.uploadProfilePhoto(file);
      const photoUrl = this.uploadService.getPhotoUrl(photoPath);

      return {
        success: true,
        message: 'Photo de profil uploadée avec succès',
        photoPath,
        photoUrl,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de l'upload: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('document')
  @ApiOperation({ summary: "Upload d'un document d'identité" })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Document d\'identité (permis, carte d\'identité)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Fichier document (JPG, PNG, PDF, max 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploadé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        documentPath: { type: 'string' },
        documentUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Fichier invalide ou trop volumineux',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
          return cb(
            new BadRequestException(
              'Seuls les fichiers JPG, PNG et PDF sont autorisés',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException('Aucun fichier fourni');
      }

      const documentPath = await this.uploadService.uploadDocument(file);
      const documentUrl = this.uploadService.getPhotoUrl(documentPath);

      return {
        success: true,
        message: 'Document uploadé avec succès',
        documentPath,
        documentUrl,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de l'upload: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 