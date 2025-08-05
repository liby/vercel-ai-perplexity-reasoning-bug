# Perplexity Reasoning Model Streaming Order Issue

This repository demonstrates an unexpected streaming order behavior when using Perplexity's `sonar-reasoning-pro` model with the Vercel AI SDK's `extractReasoningMiddleware`.

## Issue Description

When using `extractReasoningMiddleware` with Perplexity's reasoning model, an empty text part appears early in the client, resulting in an unexpected final message structure:

**Expected behavior (as seen with Claude models):**
- Server streams: text-delta only (reasoning extracted and streamed separately)
- Server final content: `['reasoning', 'text']`
- Client receives: `['step-start', 'reasoning', 'text']`
- Display order: reasoning first, then text

**Actual behavior (Perplexity):**
- Server streams: source → reasoning-delta → text-delta
- Server final content: `['source', 'source', 'source', 'source', 'source', 'text', 'reasoning']`
- Client receives: `['step-start', 'text' (empty), 'reasoning']`
- The empty text part appears early in the client
- Text content fills in later but position remains unchanged
- Final structure: `['step-start', 'text', 'reasoning']`
- Display order: text first, then reasoning (not as expected)

## Reproduction Logs

Server-side streaming order:
```
[Server] Streaming chunk type: source
[Server] Streaming chunk type: reasoning-delta
[Server] Streaming chunk type: text-delta
```

Client-side receives:
```
[Client] streaming - step-start - (empty)...
[Client] streaming - text - (empty)...
[Client] streaming - reasoning - (empty)...
[Client] streaming - reasoning - \nOkay...
[Client] streaming - text - \n\n**Hello**...
[Client] Final message parts: ['step-start', 'text', 'reasoning']
```

## Setup

1. Clone this repository
2. Copy `.env.local.example` to `.env.local` and add your Perplexity API key:
   ```
   PERPLEXITY_API_KEY=your_api_key_here
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Run the development server:
   ```bash
   pnpm dev
   ```
5. Open browser console to see the streaming logs

## Technical Details

### Observed Differences

**Claude models:**
- No source chunks
- Server streams only text-delta
- Client maintains expected order: `['step-start', 'reasoning', 'text']`

**Perplexity models:**
- Includes source chunks before reasoning
- Client creates empty text part early
- Results in unexpected order: `['step-start', 'text', 'reasoning']`

### Possible Cause (Speculation)

The issue might occur because:
1. Perplexity sends `source` chunks before reasoning content
2. These source chunks may trigger creation of an empty text part in the client
3. Once created, this text part maintains its position in the array
4. When actual text content arrives later, it fills the existing empty part
5. This results in text appearing before reasoning in the final structure

## Related Resources

- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs)
- [Perplexity API Documentation](https://docs.perplexity.ai/)
- [extractReasoningMiddleware Documentation](https://ai-sdk.dev/docs/reference/ai-sdk-core/extract-reasoning-middleware)
