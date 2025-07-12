import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

interface ChatHeaderProps {
  onToggleSidebar: () => void
  isSidebarOpen: boolean
}

export default function ChatHeader({
  onToggleSidebar,
  isSidebarOpen,
}: ChatHeaderProps) {
  return (
    <header 
      className="h-[60px] px-4 md:px-6 flex items-center justify-center border-b border-gray-100 bg-white relative"
      role="banner"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleSidebar}
        className="absolute left-4 h-8 w-8 p-0 text-[#0055A4] hover:text-[#0055A4] hover:bg-blue-50 hover:shadow-sm hover:scale-105 active:scale-100 transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
        aria-label={isSidebarOpen ? "Fermer le menu des conversations" : "Ouvrir le menu des conversations"}
        aria-expanded={isSidebarOpen}
        aria-haspopup="true"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>
      
      <Link 
        to="/chat" 
        className="flex items-center gap-2 focus:outline-none rounded-md"
        aria-label="Retour à l'accueil de Jean-Claude"
      >
        <img 
          src="/fleur-de-lis.png" 
          alt="" 
          className="h-6 w-6" 
          aria-hidden="true" 
        />

        <h1 className="font-serif text-[22px] md:text-[28px] font-bold text-[#0055A4] select-text">
          Jean-Claude
        </h1>
      </Link>
    </header>
  )
}
