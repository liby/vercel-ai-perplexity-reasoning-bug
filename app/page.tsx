'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import ChatInput from '@/component/chat-input';

export default function Chat() {
  const { error, status, sendMessage, messages, regenerate, stop } = useChat();

  // Track logged parts for the current message
  const loggedPartsRef = useRef<Map<string, { length: number, messageId: string }>>(new Map());

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

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(m => (
        <div key={m.id} className="whitespace-pre-wrap">
          {m.role === 'user' ? 'User: ' : 'AI: '}
          {m.parts.map(part => {
            if (part.type === 'reasoning') {
              return <span key={part.text.slice(10)} className="text-blue-500">{part.text}</span>;
            }
            if (part.type === 'text') {
              return part.text;
            }
          })}
        </div>
      ))}

      {(status === 'submitted' || status === 'streaming') && (
        <div className="mt-4 text-gray-500">
          {status === 'submitted' && <div>Loading...</div>}
          <button
            type="button"
            className="px-4 py-2 mt-4 text-blue-500 border border-blue-500 rounded-md"
            onClick={stop}
          >
            Stop
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4">
          <div className="text-red-500">An error occurred.</div>
          <button
            type="button"
            className="px-4 py-2 mt-4 text-blue-500 border border-blue-500 rounded-md"
            onClick={() => regenerate()}
          >
            Retry
          </button>
        </div>
      )}

      <ChatInput status={status} onSubmit={text => sendMessage({ text })} />
    </div>
  );
}