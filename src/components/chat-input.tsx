import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SendIcon } from 'lucide-react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isWaiting?: boolean
  disabled?: boolean
}

export default function ChatInput({
  onSendMessage,
  isWaiting = false,
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isWaiting && !disabled) {
      onSendMessage(message)
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [message])

  return (
    <section 
      className="sticky bottom-0 w-full bg-white py-4 px-4 border-t border-gray-100"
      aria-label="Zone de saisie de message"
    >
      <form
        onSubmit={handleSubmit}
        className="max-w-[720px] mx-auto flex items-end gap-2"
        role="form"
        aria-label="Formulaire d'envoi de message"
      >
        <div className="flex-1">
          <label htmlFor="chat-message-input" className="sr-only">
            Message à Jean-Claude
          </label>
          <Textarea
            id="chat-message-input"
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tapez votre question (ou une plainte élégante)…"
            className="min-h-[50px] max-h-[150px] rounded-full px-4 py-3 resize-none border-gray-200 focus-visible:ring-[#0055A4] focus-visible:ring-2"
            disabled={disabled}
            aria-describedby={disabled ? "input-disabled-help" : undefined}
            aria-invalid={false}
          />
          {disabled && (
            <div id="input-disabled-help" className="sr-only">
              La saisie est désactivée car vous êtes hors ligne
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={!message.trim() || isWaiting || disabled}
          className={`rounded-full h-[50px] w-[50px] p-0 bg-[#0055A4] hover:bg-[#EF4135] transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-100 active:shadow-md focus:ring-2 focus:ring-[#0055A4] focus:ring-offset-2`}
          aria-label={isWaiting ? "Envoi en cours..." : "Envoyer le message"}
          aria-describedby="send-button-help"
        >
          {isWaiting ? (
            <div className="flex items-center justify-center gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"></div>
            </div>
          ) : (
            <SendIcon className="h-5 w-5" aria-hidden="true" />
          )}
        </Button>
        <div id="send-button-help" className="sr-only">
          Appuyez sur Entrée ou cliquez pour envoyer votre message
        </div>
      </form>
    </section>
  )
}
