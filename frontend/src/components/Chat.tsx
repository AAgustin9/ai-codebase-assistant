'use client';

import { useRef, useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Define our own Message type since we're not using @vercel/ai
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: any[];
};

// GitHub tool response types
type FileEntry = {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
  size?: number;
  url?: string;
};

type FileContent = {
  content: string;
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
};

type FileWriteResult = {
  content: {
    name: string;
    path: string;
    sha: string;
  };
  commit: {
    sha: string;
    html_url: string;
  };
};

// Tool call result components
const FileTree = ({ files }: { files: FileEntry[] }) => {
  if (!files || !Array.isArray(files)) {
    return (
      <div className="bg-gray-800 rounded-md p-4 text-white">
        <h3 className="text-lg font-semibold mb-2">Repository Files</h3>
        <p className="text-gray-400">No files found or invalid data format</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-md p-4 text-white">
      <h3 className="text-lg font-semibold mb-2">Repository Files ({files.length} items)</h3>
      <ul className="space-y-1">
        {files.map((file, index) => (
          <li key={file.path || index} className="flex items-center">
            <span className="mr-2">
              {file.type === 'dir' ? '📁' : '📄'}
            </span>
            <span>{file.name}</span>
            {file.size && file.size > 0 && (
              <span className="ml-2 text-sm text-gray-400">({file.size} bytes)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const FileViewer = ({ file }: { file: FileContent }) => {
  // Detect language from file extension
  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      py: 'python',
      rb: 'ruby',
      go: 'go',
      java: 'java',
      php: 'php',
      cs: 'csharp',
      css: 'css',
      html: 'html',
      json: 'json',
      md: 'markdown',
    };
    return langMap[ext || ''] || 'plaintext';
  };

  const language = getLanguage(file.name);

  return (
    <div className="bg-gray-800 rounded-md overflow-hidden">
      <div className="bg-gray-900 px-4 py-2 text-white flex justify-between items-center">
        <span>{file.path}</span>
        <span className="text-xs text-gray-400">{file.size} bytes</span>
      </div>
      <SyntaxHighlighter language={language} style={vscDarkPlus} showLineNumbers>
        {file.content}
      </SyntaxHighlighter>
    </div>
  );
};

const FileWriteConfirmation = ({ result }: { result: FileWriteResult }) => {
  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
      <p className="font-bold">File saved successfully!</p>
      <p>Path: {result.content.path}</p>
      <p>
        <a 
          href={result.commit.html_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          View commit
        </a>
      </p>
    </div>
  );
};

// Function to render tool call results
const renderToolCallResult = (message: Message) => {
  if (!message.role || message.role !== 'assistant' || !message.toolCalls) {
    return null;
  }

  return message.toolCalls.map((toolCall: any, index: number) => {
    // Handle our GitHub integration format: { toolName, result, error }
    const toolName = toolCall.toolName || toolCall.function?.name;
    const result = toolCall.result || toolCall.output;
    
    console.log(`[CHAT] Rendering tool call ${index}:`, { toolName, result, toolCall });
    
    if (toolCall.error) {
      return (
        <div key={`tool-error-${index}`} className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2">
          <strong>Tool Error ({toolName}):</strong> {toolCall.error}
        </div>
      );
    }
    
    switch (toolName) {
      case 'listFiles':
        return <FileTree key={`tool-${index}`} files={result} />;
      case 'readFile':
        return <FileViewer key={`tool-${index}`} file={result} />;
      case 'writeFile':
        return <FileWriteConfirmation key={`tool-${index}`} result={result} />;
      default:
        return (
          <div key={`tool-${index}`} className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-2">
            <strong>Tool Result ({toolName}):</strong> {JSON.stringify(result, null, 2)}
          </div>
        );
    }
  });
};

// Main Chat component
export default function Chat() {
  const [modelSelection, setModelSelection] = useState<string>('gpt-4o');
  //const [apiKey, setApiKey] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Custom implementation of message handling
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    console.log('[CHAT] Submitting new message');
    
    // Add user message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');
    
    console.log(`[CHAT] User message added, model: ${modelSelection}, input length: ${input.length}`);

    try {
      console.log('[CHAT] Sending request to API route');
      // Call internal Next.js API route to avoid CORS and simplify config
      const response = await fetch(`/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          //'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          prompt: input,
          model: modelSelection,
        }),
      });

      console.log(`[CHAT] API response status: ${response.status}`);

      if (!response.ok) {
        // Handle non-JSON error responses
        let errorMessage = 'Failed to get response';
        const contentType = response.headers.get('content-type') || '';
        console.log(`[CHAT] Error response content type: ${contentType}`);
        
        if (contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
            console.error('[CHAT] JSON error response:', errorData);
          } catch (e) {
            console.error('[CHAT] Failed to parse JSON error:', e);
            /* ignore JSON parse errors */
          }
        } else {
          try {
            errorMessage = await response.text();
            console.error('[CHAT] Text error response:', errorMessage.substring(0, 200) + '...');
          } catch (e) {
            console.error('[CHAT] Failed to parse text error:', e);
            /* ignore text parse errors */
          }
        }
        throw new Error(errorMessage);
      }
      
      // Parse JSON response
      let data;
      try {
        data = await response.json();
        console.log('[CHAT] Successfully parsed API response');
      } catch (e) {
        console.error('[CHAT] Failed to parse API response:', e);
        throw new Error('Invalid JSON response from server');
      }
      
      // Add assistant response to the chat
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.text || 'No response received',
        toolCalls: data.toolCalls
      };
      console.log('[CHAT] Adding assistant response to chat:', {
        contentLength: assistantMessage.content.length,
        hasToolCalls: !!assistantMessage.toolCalls?.length
      });
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      // Add error message
      console.error('[CHAT] Error handling message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${error.message || 'Something went wrong'}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      console.log('[CHAT] Request completed');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full w-full mx-auto bg-gray-900 rounded-xl shadow-lg overflow-hidden">
  
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar px-2 sm:px-3 min-h-0">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-400 text-center px-4">
              Ask something about a GitHub repository<br />
              <span className="text-xs text-gray-500">
                Example: "Show me the files in the src directory of the react repository"
              </span>
            </p>
          </div>
        )}
  
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${message.role === "user" ? "text-right" : "text-left"} animate-fade-in`}
          >
            <div
              className={`inline-block px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl max-w-[95%] sm:max-w-[85%] shadow-md overflow-hidden ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800 border border-gray-200"
              }`}
            >
              <div className="prose prose-sm max-w-none break-words overflow-hidden">
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
  
            {message.role === "assistant" && message.toolCalls && (
              <div className="mt-2 space-y-2 text-left">
                {renderToolCallResult(message)}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
  
             {/* Input form */}
       <form onSubmit={handleSubmit} className="flex w-full max-w-5xl mx-auto rounded-lg overflow-hidden border border-gray-700 shadow-md">
        <input
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
          className="flex-1 bg-gray-800 text-white px-3 sm:px-4 py-2 text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
          placeholder="Ask something..."
        />
        <button
          type="submit"
          className={`px-4 sm:px-5 py-2 text-sm font-medium ${
            isLoading
              ? "bg-gray-600 text-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Thinking..." : "Send"}
        </button>
      </form>
    </div>
  );
}
