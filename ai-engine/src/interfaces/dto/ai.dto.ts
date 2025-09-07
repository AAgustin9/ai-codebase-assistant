import { IsString, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for text generation request
 */
export class GenerateTextDto {
  @IsString()
  prompt: string;
  
  @IsOptional()
  @IsObject()
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
  @IsString()
  prompt: string;
  
  @IsOptional()
  @IsObject()
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
