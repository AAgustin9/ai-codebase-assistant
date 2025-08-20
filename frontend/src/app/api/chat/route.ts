import { NextRequest } from "next/server";
import { OpenAIStream, StreamingTextResponse } from "ai";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const stream = await OpenAIStream({
    model: "gpt-3.5-turbo",
    messages,
  });
  return new StreamingTextResponse(stream);
}
