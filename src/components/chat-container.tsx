import { useRef, useEffect, useState } from 'react'
import ChatMessage from '@/components/chat-message'
import FleurDeLis from '@/components/fleur-de-lis'
import { LiveAnnouncer } from '@/components/live-announcer'

interface Message {
  id: string
  text: string
  isBot: boolean
  isStreaming?: boolean
  streamingBuffer?: string
}

interface ChatContainerProps {
  messages: Message[]
  isStreaming?: boolean
}

export default function ChatContainer({
  messages,
  isStreaming = false,
}: ChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [liveMessage, setLiveMessage] = useState('')
  const lastMessageCountRef = useRef(0)

  useEffect(() => {
    if (containerRef.current) {
      // Use requestAnimationFrame to ensure layout is complete
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      })
    }
  }, [messages])

  // Announce new messages to screen readers
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      const newMessage = messages[messages.length - 1]
      if (newMessage && newMessage.isBot) {
        setLiveMessage('Jean-Claude has responded')
      } else if (newMessage && !newMessage.isBot) {
        setLiveMessage('Your message has been sent')
      }
    }
    lastMessageCountRef.current = messages.length
  }, [messages])

  return (
    <section 
      ref={containerRef} 
      className="h-full overflow-y-auto px-4 py-6 bg-white focus:outline-none focus:ring-2 focus:ring-[#0055A4] focus:ring-inset"
      aria-label="Message history"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      tabIndex={0}
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="max-w-[600px] mx-auto flex flex-col gap-2 flex-1">
        {messages.length === 0 ? (
          <header className="flex-1 flex flex-col items-center justify-center text-center p-6 relative" role="banner">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none" aria-hidden="true">
              <FleurDeLis className="w-64 h-64" aria-hidden="true" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#0055A4] mb-4">
              Oh mon dieu... You are already annoying me... 
              <br />Go on, ask your questions!
            </h2>
            <p className="text-gray-600 max-w-md">
              Meet Jean-Claude, your charmingly dramatic Parisian that moonlights as an AI chatbot. 🥖
            </p>
          </header>
        ) : (
          <div role="group" aria-label="Conversation messages" className="flex flex-col space-y-1">
            {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isBot={message.isBot}
              isStreaming={message.isStreaming && isStreaming}
            />
            ))}
          </div>
        )}
      </div>
      
      {/* Live announcer for screen readers */}
      <LiveAnnouncer message={liveMessage} politeness="polite" />
    </section>
  )
}
