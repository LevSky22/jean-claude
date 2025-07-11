import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Plus, Menu } from 'lucide-react'
import FleurDeLis from '@/components/fleur-de-lis'

interface ChatHeaderProps {
  onNewChat: () => void
  onToggleSidebar: () => void
  isSidebarOpen: boolean
}

export default function ChatHeader({
  onNewChat: _onNewChat,
  onToggleSidebar,
  isSidebarOpen,
}: ChatHeaderProps) {
  return (
    <header 
      className="h-[60px] px-4 md:px-6 flex items-center justify-between border-b border-gray-100 bg-white"
      role="banner"
    >
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="h-8 w-8 p-0 text-[#0055A4] hover:text-[#0055A4] hover:bg-blue-50 hover:shadow-sm hover:scale-105 active:scale-100 transition-all duration-200 focus:ring-2 focus:ring-[#0055A4] focus:ring-offset-2"
          aria-label={isSidebarOpen ? "Fermer le menu des conversations" : "Ouvrir le menu des conversations"}
          aria-expanded={isSidebarOpen}
          aria-haspopup="true"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
        
        <Link 
          to="/chat" 
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0055A4] focus:ring-offset-2 rounded-md"
          aria-label="Retour à l'accueil de Jean-Claude"
        >
          <FleurDeLis className="h-6 w-6" aria-hidden="true" />

          <h1 className="font-serif text-[22px] md:text-[28px] font-bold text-[#0055A4]">
            Jean-Claude
          </h1>
        </Link>
      </div>

      <nav aria-label="Actions principales">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="hidden md:flex items-center gap-1 text-[#0055A4] hover:text-[#0055A4] hover:bg-blue-50 hover:shadow-sm hover:scale-105 active:scale-100 transition-all duration-200 focus:ring-2 focus:ring-[#0055A4] focus:ring-offset-2"
          aria-label="Ouvrir les conversations"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>New Chat</span>
        </Button>
      </nav>
    </header>
  )
}
