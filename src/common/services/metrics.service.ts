import { Injectable, Logger } from '@nestjs/common';

export interface MetricData {
  userId?: number;
  action: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private metrics: MetricData[] = [];

  trackUserAction(metricData: MetricData): void {
    // En production, envoyer vers un service comme DataDog, Sentry, ou une base de données
    this.metrics.push(metricData);

    // Log pour le développement
    this.logger.log(
      `Metric: ${metricData.action} - ${metricData.endpoint} - ${metricData.statusCode} - ${metricData.responseTime}ms`,
    );

    // Limiter la taille du cache en mémoire
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  getMetrics(startDate?: Date, endDate?: Date, action?: string): MetricData[] {
    let filteredMetrics = this.metrics;

    if (startDate) {
      filteredMetrics = filteredMetrics.filter((m) => m.timestamp >= startDate);
    }

    if (endDate) {
      filteredMetrics = filteredMetrics.filter((m) => m.timestamp <= endDate);
    }

    if (action) {
      filteredMetrics = filteredMetrics.filter((m) => m.action === action);
    }

    return filteredMetrics;
  }

  getMetricsSummary(): {
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
  } {
    const totalRequests = this.metrics.length;
    const successfulRequests = this.metrics.filter(
      (m) => m.statusCode >= 200 && m.statusCode < 300,
    ).length;
    const averageResponseTime =
      totalRequests > 0
        ? this.metrics.reduce((sum, m) => sum + m.responseTime, 0) /
          totalRequests
        : 0;

    // Top endpoints
    const endpointCounts = this.metrics.reduce(
      (acc, m) => {
        acc[m.endpoint] = (acc[m.endpoint] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      successRate:
        totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      topEndpoints,
    };
  }

  clearMetrics(): void {
    this.metrics = [];
    this.logger.log('Metrics cleared');
  }
} 