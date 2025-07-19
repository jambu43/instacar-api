import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from '../services/metrics.service';
import { AppKeyGuard } from '../../auth/guards/app-key.guard';

@ApiTags('Metrics')
@Controller('metrics')
@UseGuards(AppKeyGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Obtenir un résumé des métriques',
    description: 'Retourne un résumé des performances de l\'API',
  })
  @ApiResponse({
    status: 200,
    description: 'Résumé des métriques',
    schema: {
      type: 'object',
      properties: {
        totalRequests: { type: 'number', example: 1250 },
        averageResponseTime: { type: 'number', example: 45.2 },
        successRate: { type: 'number', example: 98.5 },
        topEndpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string', example: '/api/auth/verify-otp' },
              count: { type: 'number', example: 450 },
            },
          },
        },
      },
    },
  })
  getMetricsSummary() {
    return this.metricsService.getMetricsSummary();
  }

  @Get('recent')
  @ApiOperation({
    summary: 'Obtenir les métriques récentes',
    description: 'Retourne les 100 dernières métriques enregistrées',
  })
  @ApiResponse({
    status: 200,
    description: 'Métriques récentes',
  })
  getRecentMetrics() {
    const metrics = this.metricsService.getMetrics();
    return metrics.slice(-100).reverse(); // Les plus récentes en premier
  }
} 