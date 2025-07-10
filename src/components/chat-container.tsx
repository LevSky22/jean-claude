import { useRef, useEffect } from 'react'
import ChatMessage from '@/components/chat-message'
import FleurDeLis from '@/components/fleur-de-lis'

interface Message {
  id: string
  text: string
  isBot: boolean
  isStreaming?: boolean
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

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div 
      ref={containerRef} 
      className="flex-1 overflow-y-auto px-4 py-6"
      aria-label="Historique des messages"
      role="log"
      aria-live="polite"
    >
      <div className="max-w-[720px] mx-auto flex flex-col gap-6 min-h-full">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <FleurDeLis className="w-64 h-64" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#0055A4] mb-4">
              Oh là là ! Jean-Claude attend vos questions…
            </h2>
            <p className="text-gray-600 max-w-md">
              Posez une question à Jean-Claude, votre assistant virtuel
              français. Toutes vos conversations restent privées dans votre
              navigateur.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isBot={message.isBot}
              isStreaming={message.isStreaming && isStreaming}
            />
          ))
        )}
      </div>
    </div>
  )
}
