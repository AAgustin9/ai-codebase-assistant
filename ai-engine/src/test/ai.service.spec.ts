import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../services/ai.service';
import * as ai from 'ai';

// Mock the ai library
jest.mock('ai', () => ({
  generateText: jest.fn(),
}));

describe('AiService', () => {
  let service: AiService;
  let mockConfigService: any;

  beforeEach(async () => {
    // Create a mock ConfigService
    mockConfigService = {
      get: jest.fn((key) => {
        if (key === 'ai.defaultModel') return 'test-model';
        if (key === 'ai.apiKey') return 'test-api-key';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateText', () => {
    it('should call generateText with the correct parameters', async () => {
      // Arrange
      const mockResult = { text: 'Generated text' };
      (ai.generateText as jest.Mock).mockResolvedValue(mockResult);

      // Act
      const result = await service.generateText('Test prompt', { temperature: 0.7 });

      // Assert
      expect(ai.generateText).toHaveBeenCalledWith({
        model: expect.anything(),
        prompt: 'Test prompt',
        temperature: 0.7,
      });
      expect(result).toBe('Generated text');
    });

    it('should use the default model if not specified', async () => {
      // Arrange
      const mockResult = { text: 'Generated text' };
      (ai.generateText as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await service.generateText('Test prompt');

      // Assert
      expect(ai.generateText).toHaveBeenCalledWith({
        model: expect.anything(),
        prompt: 'Test prompt',
      });
    });

    it('should handle errors from generateText', async () => {
      // Arrange
      (ai.generateText as jest.Mock).mockRejectedValue(new Error('API error'));

      // Act & Assert
      await expect(service.generateText('Test prompt')).rejects.toThrow('Failed to generate text: API error');
    });
  });

  describe('generateTextWithTools', () => {
    it('should call generateText with tools parameter', async () => {
      // Arrange
      const mockResult = { text: 'Generated text', toolCalls: [] };
      (ai.generateText as jest.Mock).mockResolvedValue(mockResult);
      const mockTools = [{ type: 'function', function: { name: 'testTool' } }];

      // Act
      const result = await service.generateTextWithTools('Test prompt', mockTools, { temperature: 0.7 });

      // Assert
      expect(ai.generateText).toHaveBeenCalledWith({
        model: expect.anything(),
        prompt: 'Test prompt',
        tools: mockTools,
        temperature: 0.7,
      });
      expect(result).toEqual({
        text: 'Generated text',
        toolCalls: [],
      });
    });

    it('should handle errors from generateText with tools', async () => {
      // Arrange
      (ai.generateText as jest.Mock).mockRejectedValue(new Error('API error'));
      const mockTools = [{ type: 'function', function: { name: 'testTool' } }];

      // Act & Assert
      await expect(service.generateTextWithTools('Test prompt', mockTools)).rejects.toThrow('Failed to generate text with tools: API error');
    });
  });
});
