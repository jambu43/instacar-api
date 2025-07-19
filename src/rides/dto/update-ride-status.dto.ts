import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum RideStatus {
  REQUESTED = 'REQUESTED',
  SEARCHING = 'SEARCHING',
  ACCEPTED = 'ACCEPTED',
  ARRIVING = 'ARRIVING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateRideStatusDto {
  @ApiProperty({
    description: 'Nouveau statut de la course',
    enum: RideStatus,
    example: 'ACCEPTED',
  })
  @IsEnum(RideStatus)
  status: RideStatus;

  @ApiProperty({
    description: "Raison de l'annulation (si applicable)",
    example: 'Passager non trouvé',
    required: false,
  })
  @IsOptional()
  @IsString()
  cancelReason?: string;
}
