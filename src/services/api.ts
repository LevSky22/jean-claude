// API service layer for Jean-Claude chat application

export interface Message {
  id: string
  text: string
  isBot: boolean
  isStreaming?: boolean
  streamingBuffer?: string // For accumulating streaming chunks
}

export interface ChatResponse {
  success: boolean
  message?: string
  error?: string
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiService {
  private baseUrl = '/api'

  async sendMessage(message: string, conversationHistory: Message[] = []): Promise<ReadableStream<Uint8Array>> {
    const requestBody: { message: string; conversationHistory: Message[] } = {
      message,
      conversationHistory
    }

    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      if (response.status === 429) {
        throw new ApiError(429, 'Too many requests. Please slow down!', 'RATE_LIMITED')
      }
      throw new ApiError(
        response.status,
        `HTTP ${response.status}: ${response.statusText}`,
        'HTTP_ERROR'
      )
    }

    if (!response.body) {
      throw new ApiError(500, 'No response body received', 'NO_BODY')
    }

    return response.body
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      })
      return response.ok
    } catch {
      return false
    }
  }

  async exportMessages(messages: Message[]): Promise<string> {
    // For now, handle export locally
    // In future, could send to /api/messages/export
    const markdownContent = messages
      .map((msg) => {
        const prefix = msg.isBot ? '**Jean-Claude**: ' : '**You**: '
        return prefix + msg.text
      })
      .join('\n\n')

    return markdownContent
  }

  async deleteAllMessages(): Promise<ChatResponse> {
    // For now, handle deletion locally
    // In future, could send to DELETE /api/messages
    return { success: true, message: 'All messages deleted locally' }
  }
}

export const apiService = new ApiService()

// Utility function to process streaming response
export async function processStreamingResponse(
  stream: ReadableStream<Uint8Array>,
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        onComplete()
        break
      }

      buffer += decoder.decode(value, { stream: true })
      
      // Process complete lines from buffer
      const lines = buffer.split('\n')
      // Keep the last incomplete line in buffer
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            onComplete()
            return
          }
          if (data === '') {
            // Empty data line, skip
            continue
          }
          try {
            const parsed = JSON.parse(data)
            // Only extract content from delta (streaming) or message (non-streaming)
            if (parsed.choices?.[0]?.delta?.content) {
              onChunk(parsed.choices[0].delta.content)
            } else if (parsed.choices?.[0]?.message?.content) {
              // Handle non-streaming response format
              onChunk(parsed.choices[0].message.content)
            }
            // All other JSON data is metadata and should be ignored
          } catch (parseError) {
            // If JSON parsing fails, it might be a malformed chunk - ignore it
            console.log('Invalid JSON in stream, ignoring:', data.substring(0, 100))
          }
        }
        // Don't process non-data lines - they're SSE metadata
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Stream processing failed'))
  } finally {
    reader.releaseLock()
  }
}