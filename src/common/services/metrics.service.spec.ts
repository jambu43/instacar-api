import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService, MetricData } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trackUserAction', () => {
    it('should track a user action', () => {
      const metricData: MetricData = {
        userId: 1,
        action: 'test_action',
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 100,
        timestamp: new Date(),
      };

      service.trackUserAction(metricData);
      const metrics = service.getMetrics();
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toEqual(metricData);
    });

    it('should limit metrics to 1000 entries', () => {
      const metricData: MetricData = {
        action: 'test_action',
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 100,
        timestamp: new Date(),
      };

      // Ajouter plus de 1000 métriques
      for (let i = 0; i < 1100; i++) {
        service.trackUserAction({ ...metricData, userId: i });
      }

      const metrics = service.getMetrics();
      expect(metrics.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('getMetrics', () => {
    beforeEach(() => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      service.trackUserAction({
        action: 'action1',
        endpoint: '/api/test1',
        method: 'GET',
        statusCode: 200,
        responseTime: 100,
        timestamp: now,
      });

      service.trackUserAction({
        action: 'action2',
        endpoint: '/api/test2',
        method: 'POST',
        statusCode: 201,
        responseTime: 150,
        timestamp: oneHourAgo,
      });

      service.trackUserAction({
        action: 'action1',
        endpoint: '/api/test1',
        method: 'GET',
        statusCode: 200,
        responseTime: 120,
        timestamp: twoHoursAgo,
      });
    });

    it('should return all metrics without filters', () => {
      const metrics = service.getMetrics();
      expect(metrics).toHaveLength(3);
    });

    it('should filter by start date', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const metrics = service.getMetrics(oneHourAgo);
      // Vérifier que nous avons au moins les métriques récentes
      expect(metrics.length).toBeGreaterThanOrEqual(1);
      // Vérifier que toutes les métriques sont après la date de filtrage
      metrics.forEach(metric => {
        expect(metric.timestamp.getTime()).toBeGreaterThanOrEqual(oneHourAgo.getTime());
      });
    });

    it('should filter by action', () => {
      const metrics = service.getMetrics(undefined, undefined, 'action1');
      expect(metrics).toHaveLength(2);
    });
  });

  describe('getMetricsSummary', () => {
    beforeEach(() => {
      service.trackUserAction({
        action: 'test_action',
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 100,
        timestamp: new Date(),
      });

      service.trackUserAction({
        action: 'test_action',
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 200,
        timestamp: new Date(),
      });

      service.trackUserAction({
        action: 'test_action',
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 500,
        responseTime: 300,
        timestamp: new Date(),
      });
    });

    it('should calculate correct summary', () => {
      const summary = service.getMetricsSummary();

      expect(summary.totalRequests).toBe(3);
      expect(summary.averageResponseTime).toBe(200);
      expect(summary.successRate).toBe((2 / 3) * 100);
      expect(summary.topEndpoints).toHaveLength(1);
      expect(summary.topEndpoints[0].endpoint).toBe('/api/test');
      expect(summary.topEndpoints[0].count).toBe(3);
    });

    it('should handle empty metrics', () => {
      service.clearMetrics();
      const summary = service.getMetricsSummary();

      expect(summary.totalRequests).toBe(0);
      expect(summary.averageResponseTime).toBe(0);
      expect(summary.successRate).toBe(0);
      expect(summary.topEndpoints).toHaveLength(0);
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      service.trackUserAction({
        action: 'test_action',
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 100,
        timestamp: new Date(),
      });

      expect(service.getMetrics()).toHaveLength(1);

      service.clearMetrics();
      expect(service.getMetrics()).toHaveLength(0);
    });
  });
}); 