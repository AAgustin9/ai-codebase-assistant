import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from '../controllers/ai.controller';
import { AiService } from '../services/ai.service';
import { GitHubService } from '../services/github.service';
import { ConfigService } from '@nestjs/config';

// Mock services
const mockAiService = {
  generateText: jest.fn(),
  generateTextWithTools: jest.fn(),
};

const mockGitHubService = {
  getRepositoryInfo: jest.fn(),
  listFiles: jest.fn(),
  getFileContent: jest.fn(),
  createIssue: jest.fn(),
  listIssues: jest.fn(),
  getIssue: jest.fn(),
  createPullRequest: jest.fn(),
  getPullRequest: jest.fn(),
  listPullRequests: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('AiController', () => {
  let controller: AiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        { provide: AiService, useValue: mockAiService },
        { provide: GitHubService, useValue: mockGitHubService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateText', () => {
    it('should call aiService.generateText with the correct parameters', async () => {
      // Arrange
      const dto = {
        prompt: 'Test prompt',
        options: { model: 'test-model' },
      };
      mockAiService.generateText.mockResolvedValue('Generated text');

      // Act
      const result = await controller.generateText(dto);

      // Assert
      expect(mockAiService.generateText).toHaveBeenCalledWith(dto.prompt, dto.options);
      expect(result).toEqual({ result: 'Generated text' });
    });

    it('should handle errors from aiService.generateText', async () => {
      // Arrange
      const dto = {
        prompt: 'Test prompt',
        options: {},
      };
      mockAiService.generateText.mockRejectedValue(new Error('Test error'));

      // Act & Assert
      await expect(controller.generateText(dto)).rejects.toThrow();
    });
  });

  describe('generateTextWithTools', () => {
    it('should call aiService.generateTextWithTools with the correct parameters', async () => {
      // Arrange
      const dto = {
        prompt: 'Test prompt',
        options: { model: 'test-model' },
      };
      mockAiService.generateTextWithTools.mockResolvedValue({
        text: 'Generated text',
        toolCalls: [],
      });

      // Act
      const result = await controller.generateTextWithTools(dto);

      // Assert
      expect(mockAiService.generateTextWithTools).toHaveBeenCalled();
      expect(result).toEqual({
        text: 'Generated text',
        toolCalls: [],
      });
    });

    it('should handle errors from aiService.generateTextWithTools', async () => {
      // Arrange
      const dto = {
        prompt: 'Test prompt',
        options: {},
      };
      mockAiService.generateTextWithTools.mockRejectedValue(new Error('Test error'));

      // Act & Assert
      await expect(controller.generateTextWithTools(dto)).rejects.toThrow();
    });
  });
});
