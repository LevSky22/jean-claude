import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

interface ChatMessageProps {
  message: string
  isBot: boolean
  isStreaming?: boolean
}

export default function ChatMessage({
  message,
  isBot,
  isStreaming = false,
}: ChatMessageProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(!isStreaming)
  const [showCursor, setShowCursor] = useState(false)
  const messageRef = useRef<HTMLDivElement>(null)

  // Simple streaming animation - just display the text directly during streaming
  useEffect(() => {
    if (isStreaming && isBot) {
      // For streaming messages, display the text directly with cursor
      setDisplayedText(message || '')
      setShowCursor(true)
      setIsComplete(false)
    } else {
      // For non-streaming messages, display immediately
      setDisplayedText(message || '')
      setShowCursor(false)
      setIsComplete(true)
    }
  }, [message, isBot, isStreaming])

  // Removed scrollIntoView - handled by ChatContainer

  return (
    <article
      ref={messageRef}
      className={cn(
        'relative max-w-[75%] md:max-w-[65%] animate-in slide-in-from-bottom-2 fade-in-0 duration-300',
        isBot ? 'self-start slide-in-from-left-2' : 'self-end slide-in-from-right-2'
      )}
      role="article"
      aria-label={isBot ? 'Message from Jean-Claude' : 'Your message'}
      aria-live={isBot && isStreaming ? 'polite' : undefined}
      aria-atomic="false"
      tabIndex={-1}
    >
      {/* Message bubble */}
      <div className={cn(
        'px-4 py-2 rounded-[1.25rem] relative z-10',
        isBot
          ? 'bg-[#e5e5ea] text-black rounded-bl-md'
          : 'bg-[#0055A4] text-white rounded-br-md',
        isBot && isStreaming && !isComplete && 'shadow-lg transform-gpu',
        isBot && showCursor && 'ring-1 ring-blue-200 ring-opacity-50',
        isBot && showCursor && 'animate-[breathe_3s_ease-in-out_infinite]'
      )}
    >
      {/* Message bubble tail - much more subtle */}
      <div className={cn(
        'absolute bottom-1 w-2 h-2 transform rotate-45',
        isBot
          ? 'left-[-4px] bg-[#e5e5ea]'
          : 'right-[-4px] bg-[#0055A4]'
      )}></div>
      
      <div className="prose prose-sm max-w-none break-words font-sans leading-tight">
        {isBot ? (
          <ReactMarkdown
            components={{
              p: ({ children }) => {
                // Convert string children to handle action formatting
                const processedChildren = React.Children.map(children, (child) => {
                  if (typeof child === 'string') {
                    // Split by action patterns like *action*
                    const parts = child.split(/(\*[^*]+\*)/g)
                    return parts.map((part, index) => {
                      if (part.match(/^\*[^*]+\*$/)) {
                        // This is an action, render it on its own line
                        return (
                          <React.Fragment key={index}>
                            <br />
                            <em className="block text-center my-2 text-gray-600">{part.slice(1, -1)}</em>
                            <br />
                          </React.Fragment>
                        )
                      }
                      return part.trim() ? <span key={index}>{part}</span> : null
                    })
                  }
                  return child
                })
                return <p className="mb-2 last:mb-0">{processedChildren}</p>
              },
              em: ({ children }) => <em className="italic font-medium">{children}</em>,
              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
              code: ({ children }) => <code className="px-1 py-0.5 bg-gray-200 rounded text-sm font-mono">{children}</code>,
              ul: ({ children }) => <ul className="ml-4 list-disc">{children}</ul>,
              ol: ({ children }) => <ol className="ml-4 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic">{children}</blockquote>,
            }}
          >
            {displayedText}
          </ReactMarkdown>
        ) : (
          <p className="whitespace-pre-wrap">{displayedText}</p>
        )}
        
        {/* Enhanced streaming cursor */}
        {isBot && showCursor && (
          <span 
            className="inline-block w-0.5 h-4 bg-gray-600 ml-0.5 animate-pulse"
            style={{ 
              animation: 'blink 1s infinite',
              animationTimingFunction: 'ease-in-out'
            }}
            aria-hidden="true"
          />
        )}
        
        {isBot && isStreaming && !isComplete && !showCursor && (
          <span 
            className="inline-flex items-center ml-1 gap-0.5"
            aria-label="Jean-Claude is typing"
            role="status"
          >
            <span className="w-1 h-1 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1 h-1 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1 h-1 bg-gray-600 rounded-full animate-bounce"></span>
          </span>
        )}
      </div>
    </div>
    </article>
  )
}
