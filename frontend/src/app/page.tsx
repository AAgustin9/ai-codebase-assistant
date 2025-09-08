'use client';

import { useState } from 'react';
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import Chat from '@/components/Chat';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'analytics'>('chat');

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="py-3 px-4 sm:px-6 flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-700 shadow-md bg-gray-800 gap-3">
        <h1 className="text-xl font-semibold text-blue-400">AI Codebase Assistant</h1>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Tabs */}
          <div className="flex rounded-md overflow-hidden border border-gray-700 shadow-sm">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>
      </header>
  
      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'chat' ? (
          <div className="flex-1 p-2 sm:p-4 overflow-hidden">
            <Chat />
          </div>
        ) : (
          <div className="flex-1 p-2 sm:p-4 overflow-y-auto custom-scrollbar">
            <AnalyticsDashboard />
          </div>
        )}
      </main>
  
      {/* Footer */}
      <footer className="border-t border-gray-700 py-3 px-4 sm:px-6 text-center text-gray-500 text-xs bg-gray-800">
        AI Codebase Assistant
      </footer>
    </div>
  );  
}
