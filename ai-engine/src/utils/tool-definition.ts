// Removed Zod import; using plain JSON schema parameters
import { jsonSchema } from '@ai-sdk/provider-utils';

/**
 * Creates a properly formatted tool definition for the Vercel AI SDK
 * @param name Tool name
 * @param description Tool description
 * @param parameters Zod schema for the tool parameters
 * @returns A tool definition object
 */
export function createTool(name: string, description: string, parameters: object) {
  return {
    [name]: {
      description,
      // Use JSON schema directly for tool parameters
      parameters: parameters,
    }
  };
}

/**
 * Creates a tool set from multiple tool definitions
 * @param tools Array of tool definitions created with createTool
 * @returns A tool set object compatible with Vercel AI SDK
 */
export function createToolSet(...tools: Record<string, any>[]) {
  return Object.assign({}, ...tools);
}
