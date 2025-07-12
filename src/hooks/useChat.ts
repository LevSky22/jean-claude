import { useState, useCallback, useEffect } from 'react'
import { apiService, ApiError, processStreamingResponse, type Message } from '@/services/api'
import { transcriptStore, type ChatTranscript } from '@/services/transcriptStore'

interface UseChatState {
  messages: Message[]
  isStreaming: boolean
  isWaiting: boolean
  isOffline: boolean
  showRateLimit: boolean
  error: string | null
  currentSessionId: string | null
  isSidebarOpen: boolean
}

interface UseChatActions {
  sendMessage: (text: string) => Promise<void>
  newChat: () => void
  loadSession: (sessionId: string) => Promise<void>
  deleteAllMessages: () => Promise<void>
  dismissRateLimit: () => void
  dismissError: () => void
  toggleSidebar: () => void
  closeSidebar: () => void
}

interface UseChatReturn extends UseChatState, UseChatActions {}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [showRateLimit, setShowRateLimit] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTranscript, setCurrentTranscript] = useState<ChatTranscript | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      // Optionally ping health check endpoint
      apiService.healthCheck().then((healthy) => {
        if (!healthy) {
          setIsOffline(true)
        }
      })
    }

    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isWaiting || isOffline) {
      return
    }

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      isBot: false,
    }

    setMessages(prev => [...prev, userMessage])
    setError(null)

    // Save user message to IndexedDB
    try {
      let sessionId = currentSessionId
      
      if (!currentTranscript || !sessionId) {
        // Create new session if none exists
        const newSession = await transcriptStore.createNewSession(userMessage.text)
        setCurrentTranscript(newSession)
        setCurrentSessionId(newSession.id)
        sessionId = newSession.id
        
        // Add the user message to the new session
        const updatedSession = await transcriptStore.addMessageToSession(sessionId, {
          id: userMessage.id,
          content: userMessage.text,
          role: 'user',
          timestamp: new Date()
        })
        if (updatedSession) {
          setCurrentTranscript(updatedSession)
        }
      } else {
        // Add message to existing session
        const updatedSession = await transcriptStore.addMessageToSession(sessionId, {
          id: userMessage.id,
          content: userMessage.text,
          role: 'user',
          timestamp: new Date()
        })
        if (updatedSession) {
          setCurrentTranscript(updatedSession)
        }
      }
    } catch (err) {
      // Failed to save message to transcript
    }

    // Check for rate limiting (simple client-side check)
    if (messages.length > 0 && messages[messages.length - 1].isBot === false) {
      setShowRateLimit(true)
      return
    }

    try {
      setIsWaiting(true)

      // For development, fall back to mock response if API not available
      try {
        // Send conversation history to maintain context and personality
        const stream = await apiService.sendMessage(text, messages)
        
        setIsWaiting(false)
        setIsStreaming(true)

        // Create bot message
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          text: '',
          isBot: true,
          isStreaming: true,
        }

        setMessages(prev => [...prev, botMessage])

        let fullResponse = ''

        await processStreamingResponse(
          stream,
          (chunk: string) => {
            fullResponse += chunk
            // Update message text for real-time display
            setMessages(prev => 
              prev.map(msg => 
                msg.id === botMessage.id 
                  ? { ...msg, text: fullResponse.trim() }
                  : msg
              )
            )
          },
          async () => {
            setIsStreaming(false)
            setMessages(prev => 
              prev.map(msg => 
                msg.id === botMessage.id 
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            )

            // Save bot response to IndexedDB
            try {
              if (currentSessionId) {
                const updatedSession = await transcriptStore.addMessageToSession(currentSessionId, {
                  id: botMessage.id,
                  content: fullResponse,
                  role: 'assistant',
                  timestamp: new Date()
                })
                if (updatedSession) {
                  setCurrentTranscript(updatedSession)
                  
                }
              }
            } catch (err) {
              // Failed to save bot response to transcript
            }
          },
          () => {
            setIsStreaming(false)
            // Fall back to mock response
            handleMockResponse(botMessage.id)
          }
        )

      } catch (apiError) {
        setIsWaiting(false)
        
        if (apiError instanceof ApiError) {
          if (apiError.code === 'RATE_LIMITED') {
            setShowRateLimit(true)
            return
          }
          
          // For development: show brief message and fall back to mock
          
          // Only show error for non-404 errors (404 is expected in dev)
          if (apiError.status !== 404) {
            setError(`API Error: ${apiError.message}`)
          }
        }

        // Fall back to mock response for development
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          text: '',
          isBot: true,
          isStreaming: true,
        }

        setMessages(prev => [...prev, botMessage])
        handleMockResponse(botMessage.id)
      }

    } catch (err) {
      setIsWaiting(false)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    }
  }, [messages, isWaiting, isOffline, currentTranscript, currentSessionId])

  const handleMockResponse = useCallback((botMessageId: string) => {
    // Mock Jean-Claude responses for development (matching the enhanced personality)
    const botResponses = [
      "*adjusts scarf thoughtfully*\n\nAh, *bonjour*! I was just contemplating Sartre's concept of radical freedom over my morning café. What intellectual adventure brings you to Jean-Claude today? ☕",
      
      "*dramatic pause*\n\nAnother question to interrupt my afternoon contemplation? Like Proust's madeleine, your curiosity awakens something profound. *Enfin*, let me share some wisdom from the depths of Parisian intellect... 🎭",
      
      "*swirls imaginary glass of Bordeaux*\n\nAh, you seek answers! How delightfully... pedestrian. But *quand même*, I suppose even Voltaire had to explain philosophy to the masses. *Bref*, here's what you need to know... 🍷",
      
      "*sighs dramatically*\n\nAnother digital puzzle? Like untangling the complexities of Godard's cinematography, but with more semicolons. *Du coup*, let me guide you through this with the patience of a Sorbonne professor... 📚",
      
      "*lights cigarette thoughtfully*\n\nYou know, this reminds me of a conversation I overheard at Café de Flore—pretentious, naturally, but enlightening. The bourgeoisie discussing art while missing its essence entirely. *Tant pis*, I'll illuminate what they could not... 🎨",
      
      "*adjusts beret with theatrical flair*\n\nTiens ! Such curiosity... it's almost... refreshing. Like finding a decent espresso outside of the 6th arrondissement. *Carrément*, you've earned my attention today. 💭",
      
      "*dramatic Gallic shrug*\n\nAnother task for the grand Jean-Claude? *Pfff...* But you know what? Your persistence amuses me—like Camus' absurd hero pushing that boulder. *Allez*, let's solve this together... 😮‍💨",
    ]

    const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)]
    
    setIsStreaming(true)
    
    // Simulate streaming by updating the buffer incrementally
    let currentIndex = 0
    const simulateStreaming = () => {
      if (currentIndex < randomResponse.length) {
        const chunkSize = Math.floor(Math.random() * 5) + 1 // Random chunk size 1-5
        currentIndex = Math.min(currentIndex + chunkSize, randomResponse.length) // Prevent overflow
        
        const streamingText = randomResponse.slice(0, currentIndex)
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, text: streamingText }
              : msg
          )
        )
        
        // Continue streaming with realistic delay
        setTimeout(simulateStreaming, Math.random() * 100 + 50) // 50-150ms delay
      } else {
        // Streaming complete
        setIsStreaming(false)
        setMessages(prev => 
          prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, isStreaming: false, text: randomResponse }
              : msg
          )
        )

        // Save mock response to IndexedDB after completion
        setTimeout(async () => {
          try {
            if (currentSessionId) {
              const updatedSession = await transcriptStore.addMessageToSession(currentSessionId, {
                id: botMessageId,
                content: randomResponse,
                role: 'assistant',
                timestamp: new Date()
              })
              if (updatedSession) {
                setCurrentTranscript(updatedSession)
                
              }
            }
          } catch (err) {
            // Failed to save mock response to transcript
          }
        }, 0)
      }
    }
    
    // Start simulated streaming
    simulateStreaming()
  }, [currentSessionId])

  const newChat = useCallback(() => {
    setMessages([])
    setError(null)
    setShowRateLimit(false)
    setCurrentTranscript(null)
    setCurrentSessionId(null)
  }, [])

  const loadSession = useCallback(async (sessionId: string) => {
    // Don't reload if it's already the current session
    if (sessionId === currentSessionId) {
      return
    }
    
    try {
      const session = await transcriptStore.getTranscript(sessionId)
      if (session) {
        setCurrentTranscript(session)
        setCurrentSessionId(sessionId)
        
        // Convert ChatMessage[] to Message[]
        const uiMessages: Message[] = session.messages.map(msg => ({
          id: msg.id,
          text: msg.content,
          isBot: msg.role === 'assistant',
          isStreaming: false
        }))
        
        setMessages(uiMessages)
        setError(null)
        setShowRateLimit(false)
        }
    } catch (err) {
      setError('Failed to load conversation')
    }
  }, [currentSessionId])

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev)
  }, [])

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false)
  }, [])


  const deleteAllMessages = useCallback(async () => {
    try {
      await transcriptStore.deleteAllTranscripts()
      setMessages([])
      setCurrentTranscript(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }, [])

  const dismissRateLimit = useCallback(() => {
    setShowRateLimit(false)
  }, [])


  const dismissError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State
    messages,
    isStreaming,
    isWaiting,
    isOffline,
    showRateLimit,
    error,
    currentSessionId,
    isSidebarOpen,
    // Actions
    sendMessage,
    newChat,
    loadSession,
    deleteAllMessages,
    dismissRateLimit,
    dismissError,
    toggleSidebar,
    closeSidebar,
  }
}