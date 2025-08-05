'use client';

import { useState } from 'react';

interface ChatInputProps {
  status: string;
  onSubmit: (text: string) => void;
  onStop: () => void;
}

export default function ChatInput({ status, onSubmit, onStop }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status !== 'submitted' && status !== 'streaming') {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t bg-white p-4">
      <div className="flex gap-2">
        <input
          className="flex-1 p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.target.value)}
          disabled={status === 'submitted' || status === 'streaming'}
        />
        <button
          type={status === 'submitted' || status === 'streaming' ? 'button' : 'submit'}
          className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={!input.trim() && status !== 'submitted' && status !== 'streaming'}
          onClick={status === 'submitted' || status === 'streaming' ? onStop : undefined}
        >
          {status === 'submitted' || status === 'streaming' ? 'Stop' : 'Send'}
        </button>
      </div>
    </form>
  );
}