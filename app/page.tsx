'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import ChatInput from '@/components/chat-input';

export default function Chat() {
  const { error, status, sendMessage, messages, regenerate, stop } = useChat();

  // Track logged parts for the current message
  const loggedPartsRef = useRef<Map<string, { length: number, messageId: string }>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        // During streaming, log parts when they appear or change significantly
        if (status === 'streaming') {
          lastMessage.parts.forEach((part, index) => {
            const partKey = `${lastMessage.id}-${part.type}-${index}`;
            
            // Get content preview - unified approach
            let content = '';
            let currentLength = 0;
            
            if ('text' in part && part.text) {
              content = part.text;
              currentLength = content.length;
            } else if ('url' in part && part.url) {
              content = part.url;
              currentLength = 1; // Static content
            }
            
            const contentPreview = content ? content.substring(0, 20).replace(/\n/g, '\\n') : '(empty)';
            const lastRecord = loggedPartsRef.current.get(partKey);
            const lastLength = lastRecord ? lastRecord.length : -1;
            
            // Log if:
            // 1. First time seeing this part (no record exists)
            // 2. Part was empty and now has content
            // 3. Content has grown by at least 100 chars (to reduce noise)
            const shouldLog = !lastRecord || 
                            (lastLength === 0 && currentLength > 0) ||
                            (currentLength - lastLength >= 100);
            
            if (shouldLog) {
              console.log(`[Client] ${status} - ${part.type} - ${contentPreview}...`);
              loggedPartsRef.current.set(partKey, { length: currentLength, messageId: lastMessage.id });
            }
          });
        }
        
        // Log final state
        if (status === 'ready') {
          const partTypes = lastMessage.parts.map(part => part.type);
          console.log('[Client] Final message parts:', partTypes);
          
          // Clean up old message logs
          const currentMessageId = lastMessage.id;
          for (const [key, value] of loggedPartsRef.current.entries()) {
            if (value.messageId !== currentMessageId) {
              loggedPartsRef.current.delete(key);
            }
          }
        }
      }
    }
  }, [messages, status]);

  console.log('[app/page.tsx:71] messages:', messages);
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col w-full max-w-md mx-auto h-[100dvh]" style={{ paddingBottom: '40px' }}>
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
              m.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {m.parts.map(part => {
                if (part.type === 'reasoning') {
                  return <span key={part.text.slice(10)} className="text-blue-300 italic">{part.text}</span>;
                }
                if (part.type === 'text') {
                  return part.text;
                }
              })}
            </div>
          </div>
        ))}
        
        {status === 'submitted' && (
          <div className="text-gray-500">Loading...</div>
        )}

        {error && (
          <div className="text-center">
            <div className="text-red-500 mb-2">An error occurred.</div>
            <button
              type="button"
              className="px-4 py-2 text-blue-500 border border-blue-500 rounded-md hover:bg-blue-50"
              onClick={() => regenerate()}
            >
              Retry
            </button>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <ChatInput 
        status={status} 
        onSubmit={text => sendMessage({ text })} 
        onStop={stop}
      />
    </div>
  );
}