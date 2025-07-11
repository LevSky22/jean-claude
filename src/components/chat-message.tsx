import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

interface ChatMessageProps {
  message: string
  isBot: boolean
  isStreaming?: boolean
  streamingSpeed?: number
}

export default function ChatMessage({
  message,
  isBot,
  isStreaming = false,
  streamingSpeed = 30,
}: ChatMessageProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(!isStreaming)
  const messageRef = useRef<HTMLDivElement>(null)
  const lastAnnouncedRef = useRef('')

  useEffect(() => {
    if (isStreaming && isBot) {
      setDisplayedText('')
      setIsComplete(false)
      lastAnnouncedRef.current = ''

      let index = 0
      const interval = setInterval(() => {
        if (index < message.length) {
          setDisplayedText((prev) => {
            const newText = prev + message[index]
            // Announce complete sentences to screen readers
            const lastSentenceEnd = newText.lastIndexOf('.')
            if (lastSentenceEnd > lastAnnouncedRef.current.length) {
              lastAnnouncedRef.current = newText.substring(0, lastSentenceEnd + 1)
            }
            return newText
          })
          index++
        } else {
          clearInterval(interval)
          setIsComplete(true)
        }
      }, streamingSpeed)

      return () => clearInterval(interval)
    } else {
      setDisplayedText(message)
      setIsComplete(true)
    }
  }, [message, isBot, isStreaming, streamingSpeed])

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [displayedText])

  return (
    <article
      ref={messageRef}
      className={cn(
        'py-2 px-4 md:py-3 md:px-5 rounded-2xl max-w-[85%] md:max-w-[75%] shadow-sm hover:shadow-md transition-all duration-200',
        isBot
          ? 'bg-gray-100 text-gray-800 self-start rounded-tl-none'
          : 'bg-[#0055A4] text-white self-end rounded-tr-none'
      )}
      role="article"
      aria-label={isBot ? 'Message from Jean-Claude' : 'Your message'}
      aria-live={isBot && isStreaming ? 'polite' : undefined}
      aria-atomic="false"
      tabIndex={-1}
    >
      <div className="prose prose-sm max-w-none break-words">
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
        {isBot && isStreaming && !isComplete && (
          <span 
            className="inline-block w-1 h-4 ml-0.5 bg-gray-400 animate-pulse"
            aria-label="Typing"
            role="status"
          ></span>
        )}
      </div>
    </article>
  )
}
