/**
 * DTO for text generation request
 */
export class GenerateTextDto {
  /**
   * The prompt to send to the LLM
   */
  prompt: string;
  
  /**
   * Optional configuration for the LLM
   */
  options?: {
    /**
     * The model to use for generation
     */
    model?: string;
    
    /**
     * The API key for the model
     */
    modelApiKey?: string;
    /**
     * Alternative OpenAI API key field
     */
    openai_api_key?: string;
    
    /**
     * Other options
     */
    [key: string]: any;
  };
}

/**
 * DTO for text generation with tools request
 */
export class GenerateTextWithToolsDto {
  /**
   * The prompt to send to the LLM
   */
  prompt: string;
  
  /**
   * Optional configuration for the LLM
   */
  options?: {
    /**
     * The model to use for generation
     */
    model?: string;
    
    /**
     * The API key for the model
     */
    modelApiKey?: string;
    
    /**
     * Other options
     */
    [key: string]: any;
  };
}
