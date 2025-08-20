'use client';

import React, { useState, useRef, useEffect } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

export default function ManualChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, userMessage] }),
    });

    if (!response.ok || !response.body) {
      console.error('Error in response:', response.statusText);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let partialContent = '';
    let buffer = '';

    // Add empty assistant message placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      if (value) {
        buffer += decoder.decode(value);
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (part.startsWith('data: ')) {
            const d = part.replace(/^data: /, '').trim();
            if (d === '[DONE]') {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(d);
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                partialContent += token;
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = { role: 'assistant', content: partialContent };
                  return newMsgs;
                });
              }
            } catch (err) {
              console.error('Error parsing SSE data:', err);
            }
          }
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#3a3430]">
      <div className="flex-1 overflow-y-auto space-y-4 mb-2 px-4 py-2 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center py-10 text-white/80">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-[#ab947e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-lg font-medium">Ask me anything about your codebase!</p>
            <p className="text-sm mt-2 text-white/60">I'll help you understand and navigate your code.</p>
          </div>
        )}
        {messages.map((message, idx) => (
          <div key={idx} className={message.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block p-4 rounded-2xl max-w-[85%] shadow-sm ${
              message.role === 'user' 
                ? 'bg-[#8a7968] text-white' 
                : 'bg-[#3c3530] text-white border border-[#5d4e45]'
            }`}>
              {message.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="mx-6 mb-6 flex items-center gap-2 bg-[#5d4e45] p-3 rounded-full shadow-md border border-[#6f5e53]/30">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 bg-transparent rounded-full px-4 py-3 focus:outline-none text-white placeholder:text-white/60"
          placeholder="Type your message..."
        />
        <button type="submit" className="p-3 bg-[#8a7968] rounded-full hover:bg-[#6f5e53] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ab947e]/50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
      <footer className="pb-4 text-center text-sm text-white/60">
        <p>The model can give wrong answers, please verify responses</p>
      </footer>
    </div>
  );
}
