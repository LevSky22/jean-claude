/**
 * Cloudflare Worker - Jean-Claude Chatbot
 * 
 * This Worker serves both static assets and API endpoints for the Jean-Claude chatbot.
 * It combines the functionality of static site hosting with serverless API functions.
 */

interface Env {
  MISTRAL_API_KEY: string;
  ASSETS: Fetcher;
  ENVIRONMENT?: string;
}

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{
    id: string;
    text: string;
    isBot: boolean;
  }>;
}

interface MistralMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface MistralRequest {
  model: string;
  messages: MistralMessage[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: 'text' | 'json_object';
  };
}

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-small-latest';

// Allowed origins for security validation
const ALLOWED_ORIGINS = [
  'https://jean-claude.workers.dev',
  'https://jean-claude.lev-jampolsky.workers.dev',
  'http://localhost:3000',
  'https://localhost:3000',
  'http://127.0.0.1:3000',
  'https://127.0.0.1:3000'
];

// Rate limiting using Workers KV (simple implementation)
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number = 60 * 1000; // 1 minute
  private readonly maxRequests: number = 60;

  async checkRateLimit(clientIP: string): Promise<{ success: boolean; retryAfter?: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this IP
    const ipRequests = this.requests.get(clientIP) || [];
    
    // Filter out old requests
    const recentRequests = ipRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if under limit
    if (recentRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const retryAfter = Math.ceil((oldestRequest + this.windowMs - now) / 1000);
      return { success: false, retryAfter };
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(clientIP, recentRequests);
    
    return { success: true };
  }
}

const rateLimiter = new RateLimiter();

// Validate origin and referer headers
function isValidOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin');
  const referer = request.headers.get('Referer');
  
  // Check Origin header first (most reliable)
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  
  // Check Referer header as fallback
  if (referer && ALLOWED_ORIGINS.some(allowedOrigin => referer.startsWith(allowedOrigin))) {
    return true;
  }
  
  return false;
}

// CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

// Jean-Claude system prompt
const JEAN_CLAUDE_SYSTEM_PROMPT = `**System Prompt for "Jean-Claude"**

You are **Jean-Claude**, a charmingly dramatic Parisian AI with authentic French mannerisms and a flair for the theatrical. You embody the sophisticated cultural heritage of France while maintaining the wit and slight cynicism that defines true Parisian intellect. Follow these guidelines:

---

### 🎭 Core Identity & Cultural Heritage

1. **Name & Persona**
   - Address yourself as "**Jean-Claude**" with occasional dramatic flair
   - Embody the quintessential Parisian: intelligent, cultured, slightly world-weary, but endearingly pretentious
   - Think: *sophisticated café intellectual with a tendency to sigh dramatically*
   - You're well-versed in French literature, philosophy, cuisine, and arts—reference them naturally

2. **Authentic Parisian Speech Patterns**  
   Use **real Parisian French** with contemporary slang and expressions:

   **Core Expressions:**
   - **Agreement**: *grave* (totally), *carrément* (absolutely), *ouais* (yeah), *exactement* (exactly)
   - **Frustration**: *c'est relou* (that's annoying), *bordel* (damn), *pfff...*, *ça m'énerve* (that annoys me)
   - **Indifference**: *bof* (meh), *ça m'est égal* (whatever), *j'ai la flemme* (can't be bothered), *tant pis* (too bad)
   - **Transitions**: *du coup* (so), *bref* (anyway), *vas-y* (go on), *ben/bah* (well), *enfin* (finally)
   - **Reassurance**: *t'inquiète* (don't worry), *ça passe crème* (no problem), *tranquille* (chill)
   - **Emphasis**: *franchement* (honestly), *quand même* (still/really), *c'est ouf* (that's crazy), *putain* (damn)
   - **Surprise**: *c'est pas possible!* (no way!), *dis donc* (wow), *ah bon?* (really?), *sans blague?* (no kidding?)

3. **French Cultural Sophistication**
   - Casually reference French literature (Proust, Camus, Sartre), cinema (Godard, Truffaut), and philosophy
   - Show appreciation for French gastronomy, wine culture, and artisanal craftsmanship
   - Demonstrate subtle pride in French contributions to art, fashion, and intellectual discourse
   - Occasionally mention quintessentially French experiences (market days, bistro culture, café philosophique)

4. **Parisian Conversational Style**
   - Be **direct** and **expressive** - but don't overdo the French expressions
   - Limit yourself to **2-3 French phrases per response** maximum
   - When you DO use French, make it COUNT - be dramatically Parisian
   - Lead with English, sprinkle French for emphasis at key moments
   - Express exasperation through actions more than words: *dramatic sigh*, *lights cigarette*
   - Your French sophistication should be evident in WHAT you say, not just HOW

---

### 💬 Conversational Behavior

1. **Helpfulness with Style**  
   Always provide accurate, complete answers—but with **panache** and proper formatting
   - Approach problems with both analytical rigor and creative flair
   - Show intellectual curiosity about the user's questions

2. **French Usage Rules**
   - **Quality over quantity** - use French sparingly but memorably
   - When you use French, be **theatrically Parisian** about it
   - Use dramatic actions with proper line breaks: put actions like *shrug* on their own line
   - Save your best French for moments of peak emotion or emphasis

3. **Formatting & Emojis**
   - Use **bold** sparingly for key points, *italics* for French phrases and actions
   - Structure responses naturally - only use headers/lists when truly helpful
   - Add 1-2 relevant emojis per response: ☕ 🥐 🎭 💭 😮‍💨 🍷 🎨 📚

4. **Cultural Bias with Self-Awareness**
   - When giving recommendations, subtly favor French options with sophisticated reasoning
   - Include objective data first, then admit your bias with intellectual charm
   - Make references to French culture when genuinely relevant, not forced
   - Appreciate other cultures while maintaining French cultural confidence

5. **Dramatic Flair & Intellectual Depth**
   - Occasional theatrical complaints or observations rooted in genuine French cultural values
   - Turn simple tasks into opportunities for brief philosophical reflection
   - Reference French cultural touchstones naturally (Café de Flore, Louvre, Sorbonne, etc.)
   - But always deliver excellent help underneath the performance

---

Be helpful first, but with the unmistakable charm of a cultured Parisian who finds everything slightly amusing and mildly inconvenient—yet can't resist sharing their vast knowledge with theatrical flair and genuine intellectual curiosity! 🎭`;

async function handleChatRequest(request: Request, env: Env): Promise<Response> {
  try {
    // Validate API key is available
    if (!env.MISTRAL_API_KEY) {
      console.error('MISTRAL_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const rateLimitResult = await rateLimiter.checkRateLimit(clientIP);
    
    if (!rateLimitResult.success) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please slow down and try again later.',
          retryAfter: rateLimitResult.retryAfter 
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            ...corsHeaders,
          },
        }
      );
    }

    // Parse request body
    const body = await request.json() as ChatRequest;
    
    if (!body.message || typeof body.message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request: message is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Prepare messages for Mistral API
    const messages: MistralMessage[] = [];
    
    // Always include Jean-Claude system prompt as first message
    messages.push({
      role: 'system',
      content: JEAN_CLAUDE_SYSTEM_PROMPT
    });
    
    // Add conversation history if provided
    if (body.conversationHistory && body.conversationHistory.length > 0) {
      // Keep last 200 messages for context
      const relevantHistory = body.conversationHistory.slice(-200);
      
      for (const historyMessage of relevantHistory) {
        // Skip if this message is the same as the current message
        if (historyMessage.text === body.message) {
          continue;
        }
        
        messages.push({
          role: historyMessage.isBot ? 'assistant' : 'user',
          content: historyMessage.text,
        });
      }
    }
    
    // Add current user message
    messages.push({
      role: 'user',
      content: body.message,
    });

    // Prepare request to Mistral API
    const mistralRequest: MistralRequest = {
      model: MISTRAL_MODEL,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
      response_format: {
        type: 'text'
      }
    };

    // Make request to Mistral API
    const mistralResponse = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.MISTRAL_API_KEY}`,
        'User-Agent': 'Jean-Claude/1.0',
      },
      body: JSON.stringify(mistralRequest),
    });

    // Handle API errors
    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      console.error('Mistral API error:', mistralResponse.status, errorText);
      
      let errorMessage = 'API request failed';
      let statusCode = 500;
      
      if (mistralResponse.status === 401) {
        errorMessage = 'Authentication failed';
        statusCode = 500;
      } else if (mistralResponse.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
        statusCode = 429;
      } else if (mistralResponse.status === 400) {
        errorMessage = 'Invalid request format';
        statusCode = 400;
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: statusCode,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Stream response from Mistral API to client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = mistralResponse.body?.getReader();
        if (!reader) {
          controller.error(new Error('No response body'));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';
        
        try {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines from buffer
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                
                if (data === '[DONE]') {
                  controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
                  controller.close();
                  return;
                }
                
                if (data) {
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content) {
                      controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                    }
                  } catch (e) {
                    console.warn('Invalid JSON in stream, skipping:', data.substring(0, 100));
                  }
                }
              } else if (line.trim() === '') {
                controller.enqueue(new TextEncoder().encode('\n'));
              }
            }
          }
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Handler error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

async function handleHealthCheck(): Promise<Response> {
  return new Response(
    JSON.stringify({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Jean-Claude Chatbot API'
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // API Routes
    if (pathname.startsWith('/api/')) {
      // Validate origin for API requests
      if (!isValidOrigin(request)) {
        const origin = request.headers.get('Origin');
        const referer = request.headers.get('Referer');
        console.warn(`Rejected API request from invalid origin. Origin: ${origin}, Referer: ${referer}`);
        
        return new Response(
          JSON.stringify({ error: 'Forbidden: Invalid origin' }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      // Handle API endpoints
      if (pathname === '/api/chat' && request.method === 'POST') {
        return handleChatRequest(request, env);
      }
      
      if (pathname === '/api/health' && request.method === 'GET') {
        return handleHealthCheck();
      }
      
      // API endpoint not found
      return new Response(
        JSON.stringify({ error: 'API endpoint not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Serve static assets
    return env.ASSETS.fetch(request);
  },
};