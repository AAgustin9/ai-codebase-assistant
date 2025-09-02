/**
 * Interface for AI service that handles interactions with LLMs
 */
export interface IAiService {
  /**
   * Generates text using the specified LLM
   * @param prompt The prompt to send to the LLM
   * @param options Optional configuration for the LLM
   * @returns The generated text response
   */
  generateText(prompt: string, options?: Record<string, any>): Promise<string>;

  /**
   * Generates text with tool usage capabilities
   * @param prompt The prompt to send to the LLM
   * @param tools Array of tools available to the LLM
   * @param options Optional configuration for the LLM
   * @returns The generated text response and any tool calls made
   */
  generateTextWithTools(
    prompt: string,
    tools: any[],
    options?: Record<string, any>
  ): Promise<{
    text: string;
    toolCalls: any[];
  }>;
}
