import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let mockExecutionContext: ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimitGuard],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
  });

  beforeEach(() => {
    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          ip: '127.0.0.1',
          route: { path: '/api/test' },
          path: '/api/test',
          method: 'POST',
        }),
      }),
    } as ExecutionContext;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow first request', () => {
      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should allow multiple requests within limit', () => {
      // Première requête
      expect(guard.canActivate(mockExecutionContext)).toBe(true);
      
      // 4 autres requêtes (total: 5)
      for (let i = 0; i < 4; i++) {
        expect(guard.canActivate(mockExecutionContext)).toBe(true);
      }
    });

    it('should block requests after limit exceeded', () => {
      // 5 requêtes autorisées
      for (let i = 0; i < 5; i++) {
        expect(guard.canActivate(mockExecutionContext)).toBe(true);
      }

      // 6ème requête devrait être bloquée
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(HttpException);
    });

    it('should use different keys for different IPs', () => {
      const mockContext1 = {
        switchToHttp: () => ({
          getRequest: () => ({
            ip: '127.0.0.1',
            route: { path: '/api/test' },
            path: '/api/test',
            method: 'POST',
          }),
        }),
      } as ExecutionContext;

      const mockContext2 = {
        switchToHttp: () => ({
          getRequest: () => ({
            ip: '192.168.1.1',
            route: { path: '/api/test' },
            path: '/api/test',
            method: 'POST',
          }),
        }),
      } as ExecutionContext;

      // 5 requêtes pour IP 1
      for (let i = 0; i < 5; i++) {
        expect(guard.canActivate(mockContext1)).toBe(true);
      }

      // IP 2 devrait encore pouvoir faire des requêtes
      expect(guard.canActivate(mockContext2)).toBe(true);
    });

    it('should use different keys for different endpoints', () => {
      const mockContext1 = {
        switchToHttp: () => ({
          getRequest: () => ({
            ip: '127.0.0.1',
            route: { path: '/api/test1' },
            path: '/api/test1',
            method: 'POST',
          }),
        }),
      } as ExecutionContext;

      const mockContext2 = {
        switchToHttp: () => ({
          getRequest: () => ({
            ip: '127.0.0.1',
            route: { path: '/api/test2' },
            path: '/api/test2',
            method: 'POST',
          }),
        }),
      } as ExecutionContext;

      // 5 requêtes pour endpoint 1
      for (let i = 0; i < 5; i++) {
        expect(guard.canActivate(mockContext1)).toBe(true);
      }

      // Endpoint 2 devrait encore pouvoir recevoir des requêtes
      expect(guard.canActivate(mockContext2)).toBe(true);
    });

    it('should handle missing route path', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            ip: '127.0.0.1',
            path: '/api/test',
            method: 'POST',
          }),
        }),
      } as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should handle missing IP', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            route: { path: '/api/test' },
            path: '/api/test',
            method: 'POST',
          }),
        }),
      } as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });
  });
}); 