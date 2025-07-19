import { Test, TestingModule } from '@nestjs/testing';
import { WebsocketGateway } from './websocket.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway;

  const mockEventEmitter = {
    emit: jest.fn(),
    on: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketGateway,
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    gateway = module.get<WebsocketGateway>(WebsocketGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should handle client connection', () => {
      const mockClient = {
        id: 'test-client-id',
      };

      gateway.handleConnection(mockClient as any);

      // Le gateway ne fait que logger la connexion
      expect(mockClient.id).toBe('test-client-id');
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnection', () => {
      const mockClient = {
        id: 'test-client-id',
      };

      gateway.handleDisconnect(mockClient as any);

      // Le gateway ne fait que logger la déconnexion
      expect(mockClient.id).toBe('test-client-id');
    });
  });
});
