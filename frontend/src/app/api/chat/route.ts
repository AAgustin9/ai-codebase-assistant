import { NextRequest, NextResponse } from "next/server";

// Normalize different response formats into a consistent structure
function normalizeResponse(responseData: any, toolsValue: number) {
  switch (toolsValue) {
    case 0: // Regular chat (/ai/generate)
      return {
        text: responseData.result || '',
        toolCalls: [],
        type: 'chat'
      };
    
    case 1: // List files (/github/files)
      return {
        text: `Found ${responseData.count || 0} items in ${responseData.repository || 'repository'}:`,
        toolCalls: [{
          type: 'list_files',
          data: responseData
        }],
        type: 'github_list'
      };
    
    case 2: // Read file (/github/content)
      return {
        text: `File content from ${responseData.repository || 'repository'}:`,
        toolCalls: [{
          type: 'read_file',
          data: responseData
        }],
        type: 'github_content'
      };
    
    case 3: // Write file (/github/upsert)
      return {
        text: `File ${responseData.path || 'file'} has been ${responseData.commit ? 'updated' : 'created'} in ${responseData.repository || 'repository'}.`,
        toolCalls: [{
          type: 'write_file',
          data: responseData
        }],
        type: 'github_write'
      };
    
    default:
      return {
        text: responseData.result || responseData.message || 'Response received',
        toolCalls: [],
        type: 'unknown'
      };
  }
}

export async function POST(req: NextRequest) {
  console.log('[FRONTEND] Received chat request');
  try {
    const { prompt, model } = await req.json();
    
    console.log(`[FRONTEND] Request details: model=${model}, prompt length=${prompt?.length || 0}`);
    
    if (!prompt) {
      console.log('[FRONTEND] Error: Prompt is missing');
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    // Get API Gateway URL
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3003/api/v1';
    
    if (!apiGatewayUrl) {
      console.error('[FRONTEND] Error: API Gateway URL not configured');
      return NextResponse.json(
        { error: 'API Gateway not configured' },
        { status: 500 }
      );
    }

    // Determine GitHub operation type
    let toolsValue = 0; // Default: no tools
    if (prompt.toLowerCase().includes('github')) {
      if (prompt.toLowerCase().includes('list files')) {
        toolsValue = 1; // List files
      } else if (prompt.toLowerCase().includes('read file')) {
        toolsValue = 2; // Read file
      } else if (prompt.toLowerCase().includes('write file')) {
        toolsValue = 3; // Write file
      }
    }
    
    // Prepare the payload for the API Gateway
    const payload = {
      prompt: prompt,
      model: model || 'gpt-4o',
      options: {
        temperature: 0.7,
        tools: toolsValue
      }
    };
    
    console.log(`[FRONTEND] Forwarding request to API Gateway: ${apiGatewayUrl}/chat`);
    
    // Make the request to the API Gateway
    const response = await fetch(`${apiGatewayUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[FRONTEND] API Gateway response status: ${response.status}`);
    
    // Determine response content type
    const contentType = response.headers.get('content-type') || '';
    console.log(`[FRONTEND] Response content type: ${contentType}`);
    let responseData: any;

    if (contentType.includes('application/json')) {
      try {
        responseData = await response.json();
        console.log('[FRONTEND] Successfully parsed JSON response');
      } catch (error) {
        // Malformed JSON
        console.error('[FRONTEND] Failed to parse JSON response:', error);
        return NextResponse.json(
          { error: 'Invalid JSON response from API Gateway' },
          { status: response.status }
        );
      }
    } else {
      // Non-JSON response (e.g., HTML error)
      const text = await response.text();
      console.error('[FRONTEND] Non-JSON response received:', text.substring(0, 200) + '...');
      return NextResponse.json(
        { error: text || 'Unexpected error from API Gateway' },
        { status: response.status }
      );
    }

    // Handle HTTP errors with JSON body
    if (!response.ok) {
      console.error('[FRONTEND] API Gateway returned error:', responseData);
      return NextResponse.json(
        { error: responseData.error || responseData.message || 'Failed to get response from API Gateway' },
        { status: response.status }
      );
    }

    // Success: normalize response based on tools value
    console.log('[FRONTEND] Successfully processed request, normalizing response');
    const normalizedResponse = normalizeResponse(responseData, toolsValue);
    return NextResponse.json(normalizedResponse);
  } catch (error: any) {
    console.error('[FRONTEND] Unhandled error in chat route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Handle GET requests with a JSON error
export async function GET() {
  return NextResponse.json(
    { error: 'Method GET not allowed. Use POST.' },
    { status: 405 }
  );
}
