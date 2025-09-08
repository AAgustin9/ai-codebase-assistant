import { streamUI } from '@ai-sdk/rsc';
import { gateway } from '@ai-sdk/gateway';
import React from 'react';

export default async function GenerativeChat({ searchParams }: { searchParams?: { q?: string } } = {}) {
  const query = searchParams?.q ?? '';
  let content = null;
  if (query) {
    const result = await streamUI({
      model: gateway('openai/gpt-4o'),
      system: 'You are a helpful assistant.',
      prompt: query,
      text: ({ content }: { content: string; delta: string; done: boolean }) => <p className="my-2">{content}</p>,
    });
    content = result.value;
  }

  return (
    <div className="h-full flex flex-col">
      <form method="GET" className="flex mb-4">
        <input
          name="q"
          defaultValue={query}
          placeholder="Enter your message"
          className="flex-1 px-4 py-2 rounded-l bg-gray-700 text-white"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
        >
          Send
        </button>
      </form>
      <div className="prose prose-invert overflow-auto">
        {content}
      </div>
    </div>
  );
}
