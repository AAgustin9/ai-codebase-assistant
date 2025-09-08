import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Backend configuration
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://127.0.0.1:3003';
    const apiKey = process.env.API_GATEWAY_API_KEY || process.env.NEXT_PUBLIC_API_KEY || '9c3df73475615810c7b20ab4ec0dbb495949e80301edc1bedf8c4cb93e0e5593';

    if (!apiGatewayUrl) {
      return NextResponse.json(
        { error: 'API Gateway URL is not configured' },
        { status: 500 }
      );
    }

    // Build target URL
    const target = `${apiGatewayUrl}/api/v1/analytics/costs?start_date=${encodeURIComponent(startDate || '')}&end_date=${encodeURIComponent(endDate || '')}`;

    const response = await fetch(target, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) {
      if (contentType.includes('application/json')) {
        const err = await response.json();
        return NextResponse.json({ error: err.error || err.message || 'Failed to fetch cost analytics' }, { status: response.status });
      } else {
        const text = await response.text();
        return NextResponse.json({ error: text || 'Failed to fetch cost analytics' }, { status: response.status });
      }
    }

    if (!contentType.includes('application/json')) {
      const text = await response.text();
      return NextResponse.json({ error: text || 'Unexpected response from API Gateway' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unexpected error while fetching cost analytics' },
      { status: 500 }
    );
  }
}
