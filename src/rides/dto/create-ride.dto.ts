import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateRideDto {
  @ApiProperty({
    description: 'ID du passager qui fait la commande',
    example: 1,
  })
  @IsNumber()
  passengerId: number;

  @ApiProperty({
    description: 'Latitude du point de départ',
    example: 48.8566,
  })
  @IsNumber()
  pickupLat: number;

  @ApiProperty({
    description: 'Longitude du point de départ',
    example: 2.3522,
  })
  @IsNumber()
  pickupLng: number;

  @ApiProperty({
    description: 'Adresse du point de départ',
    example: '123 Rue de la Paix, Paris',
  })
  @IsString()
  pickupAddress: string;

  @ApiProperty({
    description: "Latitude du point d'arrivée",
    example: 48.8584,
  })
  @IsNumber()
  dropoffLat: number;

  @ApiProperty({
    description: "Longitude du point d'arrivée",
    example: 2.2945,
  })
  @IsNumber()
  dropoffLng: number;

  @ApiProperty({
    description: "Adresse du point d'arrivée",
    example: '456 Avenue des Champs-Élysées, Paris',
  })
  @IsString()
  dropoffAddress: string;

  @ApiProperty({
    description: 'Distance estimée en km',
    example: 2.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distance?: number;

  @ApiProperty({
    description: 'Durée estimée en minutes',
    example: 15,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiProperty({
    description: 'Prix estimé de la course',
    example: 12.5,
  })
  @IsNumber()
  @Min(0)
  price: number;
}
