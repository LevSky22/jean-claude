import { useState, useCallback, useEffect } from 'react'
import { apiService, ApiError, processStreamingResponse, type Message } from '@/services/api'
import { transcriptStore, type ChatTranscript } from '@/services/transcriptStore'

interface UseChatState {
  messages: Message[]
  isStreaming: boolean
  isWaiting: boolean
  isOffline: boolean
  showRateLimit: boolean
  showExportReminder: boolean
  error: string | null
  currentSessionId: string | null
  isSidebarOpen: boolean
}

interface UseChatActions {
  sendMessage: (text: string) => Promise<void>
  newChat: () => void
  loadSession: (sessionId: string) => Promise<void>
  exportMessages: () => Promise<void>
  deleteAllMessages: () => Promise<void>
  dismissRateLimit: () => void
  dismissExportReminder: () => void
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
  const [showExportReminder, setShowExportReminder] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTranscript, setCurrentTranscript] = useState<ChatTranscript | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
    console.log('sendMessage called with:', text)
    if (!text.trim() || isWaiting || isOffline) {
      console.log('sendMessage early return:', { text: text.trim(), isWaiting, isOffline })
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
      console.error('Failed to save message to transcript:', err)
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
            console.log('Received chunk:', chunk)
            fullResponse += chunk
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
                  
                  // Check for export reminder (every 10 messages)
                  const totalMessages = updatedSession.messages.length
                  if (totalMessages > 0 && totalMessages % 10 === 0) {
                    setShowExportReminder(true)
                  }
                }
              }
            } catch (err) {
              console.error('Failed to save bot response to transcript:', err)
            }
          },
          (streamError: Error) => {
            console.error('Streaming error:', streamError)
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
          console.warn(`API unavailable (${apiError.status}): falling back to mock responses`)
          
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
  }, [messages, isWaiting, isOffline, currentTranscript])

  const handleMockResponse = useCallback((botMessageId: string) => {
    // Mock Jean-Claude responses for development (matching the personality from docs/jeanclaude.md)
    const botResponses = [
      "Oh là là ! Another question—mon café grows cold, bof. But enfin, I shall assist you anyway. *dramatic Gallic sigh*",
      "Euh... ben écoute, that's quite the puzzle, hein? Like trying to explain Proust to a pigeon. But du coup, let me enlighten you...",
      "Dis donc ! You really want to challenge Jean-Claude today? Très bien, I accept—though my cigarette protests this interruption.",
      "Mince alors ! Such curiosity... it reminds me of a conversation I overheard at Café de Flore—pretentious, naturally, but enlightening. Bref...",
      "Pff... another task for the grand Jean-Claude. *eye roll* But quand même, I suppose I can spare a moment from my existential brooding.",
      "Tiens ! That's actually intriguing—unlike most requests I receive. Bon, consider yourself fortunate that I'm in a generous mood today.",
      "Hein ? You seek wisdom from moi? Ouf ! Well, I suppose someone must illuminate the masses. Du coup, here's what you need to know...",
    ]

    const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)]
    
    setIsStreaming(true)
    
    // Set the full text immediately - ChatMessage component handles animation
    setMessages(prev => 
      prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: randomResponse }
          : msg
      )
    )
    
    // Simulate response completion after a delay
    setTimeout(() => {
      setIsStreaming(false)
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, isStreaming: false }
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
              
              // Check for export reminder (every 10 messages)
              const totalMessages = updatedSession.messages.length
              if (totalMessages > 0 && totalMessages % 10 === 0) {
                setShowExportReminder(true)
              }
            }
          }
        } catch (err) {
          console.error('Failed to save mock response to transcript:', err)
        }
      }, 0)
    }, randomResponse.length * 30) // Delay based on text length
  }, [currentSessionId])

  const newChat = useCallback(() => {
    setMessages([])
    setError(null)
    setShowRateLimit(false)
    setShowExportReminder(false)
    setCurrentTranscript(null)
    setCurrentSessionId(null)
  }, [])

  const loadSession = useCallback(async (sessionId: string) => {
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
        setShowExportReminder(false)
      }
    } catch (err) {
      console.error('Failed to load session:', err)
      setError('Failed to load conversation')
    }
  }, [])

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev)
  }, [])

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false)
  }, [])

  const exportMessages = useCallback(async () => {
    try {
      await transcriptStore.downloadTranscriptsAsMarkdown()
      setShowExportReminder(false) // Hide reminder after export
      console.log('Conversations exported successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }, [])

  const deleteAllMessages = useCallback(async () => {
    try {
      await transcriptStore.deleteAllTranscripts()
      setMessages([])
      setCurrentTranscript(null)
      setShowExportReminder(false)
      console.log('All conversations deleted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }, [])

  const dismissRateLimit = useCallback(() => {
    setShowRateLimit(false)
  }, [])

  const dismissExportReminder = useCallback(() => {
    setShowExportReminder(false)
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
    showExportReminder,
    error,
    currentSessionId,
    isSidebarOpen,
    // Actions
    sendMessage,
    newChat,
    loadSession,
    exportMessages,
    deleteAllMessages,
    dismissRateLimit,
    dismissExportReminder,
    dismissError,
    toggleSidebar,
    closeSidebar,
  }
}