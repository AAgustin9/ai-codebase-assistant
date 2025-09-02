/**
 * A simple mock language model provider for testing
 */
export class MockProvider {
  constructor(private readonly modelName: string = 'mock-model') {}

  id = 'mock';
  
  async doGenerate(options: any) {
    console.log('Mock provider called with prompt:', options.prompt || options.messages);
    
    return {
      text: 'This is a mock response for testing.',
      toolCalls: []
    };
  }
}
