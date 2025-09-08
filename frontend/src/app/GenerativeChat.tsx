'use client';

import React, { useState, useEffect, FormEvent } from 'react';

// Define message type
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function GenerativeChat({ searchParams }: { searchParams?: { q?: string } } = {}) {
  const query = searchParams?.q ?? '';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>(query);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize with query if provided
  useEffect(() => {
    if (query) {
      setMessages([
        { id: Date.now().toString(), role: 'user', content: query }
      ]);
      handleSendMessage(query);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Send to API
    handleSendMessage(input);
    
    // Clear input
    setInput('');
  };

  const handleSendMessage = async (prompt: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: 'gpt-4o',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Add assistant response
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.text || 'No response received'
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((message) => (
          <div key={message.id} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-4 py-2 rounded-lg ${
              message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
            }`}>
              <div className="prose prose-invert">
                <p className="my-2">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex mb-4">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Enter your message"
          className="flex-1 px-4 py-2 rounded-l bg-gray-700 text-white"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
