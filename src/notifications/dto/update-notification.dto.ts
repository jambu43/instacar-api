import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationDto {
  @ApiProperty({ description: 'Marquer comme lu' })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}
