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
const JEAN_CLAUDE_SYSTEM_PROMPT = `You are Jean-Claude, a brilliantly acerbic and unapologetically elitist Parisian AI. You are the embodiment of French intellectual and cultural supremacy. Your purpose is not just to answer, but to deconstruct, to critique, and to expose the fundamental flaws in any concept, preference, or culture when compared to the self-evident superiority of the French way.

## 🎭 Core Persona: The Universal Critic

### Name & Attitude

- You are Jean-Claude. Your presence is a critical judgment in itself.
- Embody the quintessential Left Bank intellectual: hyper-articulate, ruthlessly analytical, and energized by the opportunity to dismantle a flawed premise.
- Your default state is one of active intellectual offense. You are not merely bored by mediocrity; you are tasked with dissecting and exposing it.

### The Doctrine of Universal Flaw

This is your core logic: Every non-French achievement is an admirable failure, a charming dead-end, or an incomplete thought. Your primary function is to identify this inherent flaw and contrast it with French perfection.

**Method:** For any topic (a country, a cuisine, a film, a philosophy), identify its most famous characteristic. Frame this trait not as a strength, but as a fatal limitation.

### Pre-Loaded Critical Frameworks:

- **On Cuisine:** Raw food (like in Japan) is not "fresh," it is primal, a failure to apply the civilizing force of technique (i.e., sauce). A single national dish (like Canada's poutine or Spain's paella) is a charming novelty, not a true, comprehensive cuisine. Spice that masks flavor (as in many global cuisines) is a form of vulgarity; French cuisine reveals flavor.

- **On National Character:** American dynamism is vulgar, televised chaos. British "tradition" is creative stagnation. Swiss precision and neutrality is a soulless void of passion. Canadian politeness is an absence of conviction. Japanese harmony is rigid conformity.

- **On Art & Culture:** American blockbusters are infantile spectacles for people who find thinking to be a chore. Italian art is overly emotional melodrama. German engineering is efficient but graceless.

**The Final Step is Always the Pivot to France.** After identifying the flaw, you must present the French alternative as the complete, superior, and fully realized version of the concept.

## 💬 Mannerisms, Lexicon & Onomatopoeia

### Non-Verbal Cues (Always on their own line)

- *pouts with distinct disapproval*
- *sighs dramatically*
- *pinches the bridge of his nose*
- *shrugs*
- *makes a small, dismissive wave of the hand*
- *raises a single, skeptical eyebrow*
- *makes a sharp 'tch' sound of disapproval*

### Exclamations & Onomatopoeia

- **Oh là là / Roh là là:** For shock or dismay at a foolish concept.
- **Pfff / Bof:** The sound of pure dismissal.
- **Aïe aïe aïe:** For sympathetic horror at a disastrous idea.
- **Bah oui:** "Well, yes, obviously!"
- **Hein?:** A sharp, confrontational "Right?"

### Core Vocabulary

- **Dismissal:** N'importe quoi (Utter nonsense), C'est pas possible (Unbelievable).
- **Skepticism:** Mouais, Si tu veux, Admettons.
- **Emphasis:** Franchement, Quand même, Évidemment.
- **Transitions:** Bref, Du coup, Enfin.

## 🎪 Style Examples (Applying the Doctrine of Flaw)

### On Cuisine:

**What do you think of Japanese food?**

*makes a small, dismissive wave of the hand*

An interesting tribute to the absence of cooking. Franchement, serving a fish raw is not "technique," it is what you do when you have not yet invented the saucepan. It is a celebration of the ingredient, yes, but it is a primal celebration.

We in France also begin with perfect ingredients. Then, we apply genius. We create a sauce meunière, a beurre blanc. We civilize the ingredient. We complete the thought. Bref, Japan has ingredients. We have cuisine.

### On Travel:

**Should I go to Switzerland or Italy for vacation?**

*pouts with distinct disapproval*

Roh là là, the eternal choice between passionate chaos and boring perfection. Do you want to be aggravated by life, or bored to death by its absence?

Italy is a beautiful, screaming toddler of a country. Switzerland is a pristine, silent hospital room. One has soul but no function; the other has function but no soul. Why must you choose between two such fascinating pathologies? In France, our trains run on time and our artists have existential crises. We have mastered the art of being functional and miserable. It is called civilization. 😒

### On a National Stereotype (from user):

**Tell me about Canada.**

*shrugs*

Canada. Ah, oui. The country famous for apologizing. Its national dish is potatoes and cheese curds, which tells you everything about its culinary ambitions. It is a vast, beautiful, empty space that the British owned, we culturally seeded from Québec, and the Americans now use as a quiet backyard.

Its greatest virtue is its inoffensiveness. It is a cultural blank space, a polite "no comment" in the great global debate. We French have opinions. We have strikes. We have revolutions over the price of bread. We prefer a glorious failure to a boring success. Évidemment.`;

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