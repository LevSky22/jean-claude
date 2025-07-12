import { ReactNode } from 'react'

interface ChatLayoutProps {
  children: ReactNode
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div 
      className="font-sans text-base antialiased flex flex-col h-full bg-gradient-to-b from-gray-50/50 to-white overflow-hidden"
      role="application"
      aria-label="Jean-Claude - French AI Assistant"
    >
      {children}
    </div>
  )
}
