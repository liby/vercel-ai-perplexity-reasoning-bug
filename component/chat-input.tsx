'use client';

import { useState } from 'react';

interface ChatInputProps {
  status: string;
  onSubmit: (text: string) => void;
}

export default function ChatInput({ status, onSubmit }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status !== 'submitted' && status !== 'streaming') {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="fixed bottom-0 w-full max-w-md p-4 bg-white">
      <div className="flex space-x-2">
        <input
          className="flex-1 p-2 border border-gray-300 rounded-md"
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.target.value)}
          disabled={status === 'submitted' || status === 'streaming'}
        />
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-500 rounded-md disabled:opacity-50"
          disabled={status === 'submitted' || status === 'streaming'}
        >
          Send
        </button>
      </div>
    </form>
  );
}