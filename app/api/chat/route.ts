import { anthropic, AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { perplexity } from '@ai-sdk/perplexity';
import {
  convertToModelMessages,
  extractReasoningMiddleware,
  streamText,
  UIMessage,
  wrapLanguageModel,
} from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Track the last chunk type to avoid logging consecutive duplicates
  let lastChunkType: string | null = null;

  const result = streamText({
    // model: anthropic('claude-sonnet-4-20250514'),
    // providerOptions: {
    //   anthropic: {
    //     thinking: { type: 'enabled', budgetTokens: 12000 },
    //   } satisfies AnthropicProviderOptions,
    // },
    model: wrapLanguageModel({
      model: perplexity('sonar-reasoning-pro'),
      middleware: [
        extractReasoningMiddleware({ 
          tagName: 'think',
        }),
      ],
    }),
    system: 'You are a helpful assistant.',
    messages: convertToModelMessages(messages),
    onChunk: ({ chunk }) => {
      if (chunk.type !== lastChunkType) {
        console.log('[Server] Streaming chunk type:', chunk.type);
      }
      lastChunkType = chunk.type;
    },
    onFinish: async (event) => {
      // Log content parts from the step result
      const contentTypes = event.content.map(part => part.type);
      console.log('[Server] Content parts:', contentTypes);
      console.log('[Server] Full event:', event);
    },
  });

  return result.toUIMessageStreamResponse();
}