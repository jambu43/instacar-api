import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll() {
    return await this.prisma.user.findMany();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
  }

  @Post()
  async create(@Body() createUserDto: { email: string; name?: string }) {
    return await this.prisma.user.create({
      data: createUserDto,
    });
  }
} 