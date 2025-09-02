import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log('[FRONTEND] Received chat request');
  try {
    const { prompt, model, modelApiKey } = await req.json();
    
    console.log(`[FRONTEND] Request details: model=${model}, prompt length=${prompt?.length || 0}`);
    
    // Extract the API key from the request headers (optional)
    const apiKey = req.headers.get('X-API-Key');
    
    if (!prompt) {
      console.log('[FRONTEND] Error: Prompt is missing');
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    // Prepare the payload for the API Gateway
    const payload = {
      prompt: prompt,
      model: model || 'gpt-4o',
      modelApiKey: modelApiKey, // Forward the model API key
      options: {
        temperature: 0.7
      }
    };
    
    // Check if this is a GitHub operation that needs tools
    const isGitHubOperation = prompt.toLowerCase().includes('github') && 
      (prompt.toLowerCase().includes('list files') || 
       prompt.toLowerCase().includes('read file') || 
       prompt.toLowerCase().includes('create issue') ||
       prompt.toLowerCase().includes('write file'));
    
    // Determine backend target
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL;
    const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:3001/api/v1';
    const useGateway = !!apiGatewayUrl;
    
    // Use tools endpoint for GitHub operations, regular endpoint otherwise
    const endpoint = isGitHubOperation ? 'ai/generate-with-tools' : 'ai/generate';
    const target = useGateway ? `${apiGatewayUrl}/api/v1/chat` : `${aiEngineUrl}/${endpoint}`;
    
    console.log(`[FRONTEND] GitHub operation detected: ${isGitHubOperation}`);
    console.log(`[FRONTEND] Forwarding request to: ${target}`);
    
    // Make the request to the chosen backend
    const response = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(useGateway ? { 'X-API-Key': apiKey || '' } : {}),
      },
      body: JSON.stringify(
        useGateway
          ? payload
          : {
              prompt,
              options: { model: payload.model, temperature: payload.options.temperature },
            }
      ),
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
      console.error('[FRONTEND] Backend returned error:', responseData);
      return NextResponse.json(
        { error: responseData.error || responseData.message || 'Failed to get response from backend' },
        { status: response.status }
      );
    }

    // Success: normalize ai-engine direct response shape to frontend shape
    console.log('[FRONTEND] Successfully processed request, returning data');
    if (useGateway) {
      return NextResponse.json(responseData);
    } else {
      // Handle different ai-engine endpoints
      if (isGitHubOperation) {
        // ai-engine /ai/generate-with-tools -> { text: string, toolResults: [] }
        const normalized = { 
          text: responseData?.text ?? '', 
          toolCalls: responseData?.toolResults || [] 
        };
        return NextResponse.json(normalized);
      } else {
        // ai-engine /ai/generate -> { result: string }
        const normalized = { text: responseData?.result ?? '', toolCalls: [] };
        return NextResponse.json(normalized);
      }
    }
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
