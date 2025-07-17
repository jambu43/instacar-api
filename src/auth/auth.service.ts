import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async createUser(registerDto: RegisterDto) {
    return await this.prisma.user.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        phone: registerDto.phone,
        gender: registerDto.gender,
        role: 'PASSENGER',
      },
    });
  }

  async findUserByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserByPhone(phone: string) {
    return await this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async findUserById(id: number) {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async completeProfile(userId: number, completeProfileDto: CompleteProfileDto) {
    // Si une photo de profil est fournie, générer l'URL complète
    let profilePhotoUrl = completeProfileDto.profilePhoto;
    if (profilePhotoUrl) {
      const photoUrl = this.uploadService.getPhotoUrl(profilePhotoUrl);
      profilePhotoUrl = photoUrl || undefined;
    }

    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        address: completeProfileDto.address,
        city: completeProfileDto.city,
        commune: completeProfileDto.commune,
        profilePhoto: profilePhotoUrl,
        isProfileComplete: true,
      },
    });
  }

  async isProfileComplete(userId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isProfileComplete: true },
    });
    return user?.isProfileComplete || false;
  }
} 