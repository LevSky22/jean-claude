import { ReactNode } from 'react'

interface ChatLayoutProps {
  children: ReactNode
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div 
      className="min-h-screen font-sans text-base antialiased flex flex-col h-screen bg-gradient-to-b from-gray-50/50 to-white"
      role="application"
      aria-label="Jean-Claude - Assistant IA français"
    >
      {children}
    </div>
  )
}
