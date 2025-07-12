import { useRef, useEffect, useState } from 'react'
import ChatMessage from '@/components/chat-message'
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
      className="h-full overflow-y-auto px-4 py-6 bg-white focus:outline-none"
      aria-label="Message history"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      tabIndex={0}
      style={{ overscrollBehavior: 'contain' }}
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-6">
          <header role="banner">
            <h2 className="font-serif text-2xl font-bold text-[#0055A4] mb-4 select-text">
              Oh mon dieu... Another pesky tourist... 
              <br />Go on, ask your questions!
            </h2>
            <p className="text-gray-600 max-w-md select-text">
              Meet Jean-Claude, your charmingly dramatic Parisian that moonlights as an AI chatbot. 🥖
            </p>
          </header>
        </div>
      ) : (
        <div className="max-w-[600px] mx-auto flex flex-col gap-2">
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
        </div>
      )}
      
      {/* Live announcer for screen readers */}
      <LiveAnnouncer message={liveMessage} politeness="polite" />
    </section>
  )
}
