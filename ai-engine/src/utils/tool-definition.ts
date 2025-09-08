import { z } from 'zod';
import { tool } from 'ai';

/**
 * Creates a properly formatted tool definition for the Vercel AI SDK v5
 * @param name Tool name
 * @param description Tool description
 * @param parameters JSON schema for the tool parameters
 * @param execute Function to execute when the tool is called
 * @returns A tool definition object
 */
export function createTool(name: string, description: string, parameters: object, execute?: Function) {
  // Convert JSON schema to Zod schema
  const zodSchema = convertJsonSchemaToZod(parameters);
  
  return {
    [name]: tool({
      description,
      parameters: zodSchema,
    } as any)
  };
}

/**
 * Converts a JSON schema to a Zod schema
 */
function convertJsonSchemaToZod(jsonSchema: any): z.ZodSchema {
  if (jsonSchema.type === 'object' && jsonSchema.properties) {
    const shape: Record<string, z.ZodSchema> = {};
    
    for (const [key, prop] of Object.entries(jsonSchema.properties)) {
      const propSchema = prop as any;
      let zodType: z.ZodSchema;
      
      switch (propSchema.type) {
        case 'string':
          zodType = z.string();
          break;
        case 'number':
          zodType = z.number();
          break;
        case 'boolean':
          zodType = z.boolean();
          break;
        case 'object':
          zodType = z.object({});
          break;
        default:
          zodType = z.any();
      }
      
      if (propSchema.description) {
        zodType = zodType.describe(propSchema.description);
      }
      
      shape[key] = zodType;
    }
    
    return z.object(shape);
  }
  
  return z.any();
}

/**
 * Creates a tool set from multiple tool definitions
 * @param tools Array of tool definitions created with createTool
 * @returns A tool set object compatible with Vercel AI SDK
 */
export function createToolSet(...tools: Record<string, any>[]) {
  return Object.assign({}, ...tools);
}
