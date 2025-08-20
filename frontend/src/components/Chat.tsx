'use client';

import { useChat } from "@vercel/ai/react";
import { useRef, useEffect } from 'react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({ api: '/api/chat' });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full max-w-xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={message.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block p-2 rounded-lg ${
              message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
            }`}>
              {message.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex">
        <input
          value={input}
          onChange={handleInputChange}
          className="flex-1 border rounded-l px-4 py-2"
          placeholder="Type your message..."
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-r">
          Send
        </button>
      </form>
    </div>
  );
}
