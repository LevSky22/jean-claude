import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { transcriptStore, type ChatTranscript } from '@/services/transcriptStore'
import { cn } from '@/lib/utils'
import { MessageCircle, Plus, ChevronLeft, MoreVertical, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onNewSession: () => void
  onDeleteAll: () => void
  messageCount?: number
}

interface SessionItemProps {
  session: ChatTranscript
  isActive: boolean
  onClick: () => void
  onDelete: (sessionId: string) => void
}

function SessionItem({ session, isActive, onClick, onDelete }: SessionItemProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(session.id)
    setShowDeleteDialog(false)
    setShowMenu(false)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    setShowDeleteDialog(true)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMenu])

  const formatDate = (date: Date) => {
    const now = new Date()
    const sessionDate = new Date(date)
    const diffTime = now.getTime() - sessionDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return sessionDate.toLocaleDateString()
    }
  }

  return (
    <div className="relative">
      <button
        className={cn(
          'group relative p-3 rounded-lg transition-all duration-200 border w-full text-left focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
          isActive 
            ? 'bg-[#0055A4] text-white border-[#0055A4] shadow-md' 
            : 'bg-white hover:bg-gray-50 border-gray-200 hover:shadow-md hover:border-gray-300'
        )}
        onClick={(e) => {
          // Prevent clicking session while dialog is open
          if (showDeleteDialog) {
            e.preventDefault()
            e.stopPropagation()
            return
          }
          onClick()
        }}
        aria-pressed={isActive}
        aria-label={`Open conversation "${session.title}" created on ${formatDate(session.updatedAt)}`}
      >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="h-4 w-4 flex-shrink-0" />
            <h3 className={cn(
              'font-medium text-sm truncate select-text',
              isActive ? 'text-white' : 'text-gray-900'
            )}>
              {session.title}
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn(
              'text-xs',
              isActive ? 'text-blue-100' : 'text-gray-500'
            )}>
              {formatDate(session.updatedAt)}
            </span>
            <span className={cn(
              'text-xs',
              isActive ? 'text-blue-100' : 'text-gray-500'
            )}>
              {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110',
              isActive ? 'hover:bg-blue-600 text-white' : 'hover:bg-gray-200'
            )}
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
          
          {showMenu && (
            <div className="absolute top-6 right-0 z-[100] bg-white border border-gray-200 rounded-md shadow-lg">
              <button 
                className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Dialog - moved outside the menu */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this conversation?</DialogTitle>
            <DialogDescription>
              This action is irreversible. The conversation "{session.title}" will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-[#EF4135] hover:bg-[#EF4135]/90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </button>
    </div>
  )
}

export default function ChatSidebar({ 
  isOpen, 
  onClose, 
  currentSessionId, 
  onSessionSelect, 
  onNewSession,
  onDeleteAll,
  messageCount
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatTranscript[]>([])
  const [loading, setLoading] = useState(false)
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const loadSessions = async () => {
    setLoading(true)
    try {
      const allSessions = await transcriptStore.getAllTranscripts()
      setSessions(allSessions)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadSessions()
      // Focus the close button when sidebar opens for keyboard users
      setTimeout(() => closeButtonRef.current?.focus(), 100)
    }
  }, [isOpen])
  
  // Separate effect for session updates
  useEffect(() => {
    if (isOpen && currentSessionId) {
      // Only reload if we have a session and it changed
      loadSessions()
    }
  }, [currentSessionId])
  
  // Update message count without reloading all sessions
  useEffect(() => {
    if (isOpen && messageCount && currentSessionId) {
      // Just update the current session's message count
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: Array(messageCount).fill(null) } 
          : s
      ))
    }
  }, [messageCount, currentSessionId])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      if (event.key === 'Escape') {
        onClose()
        return
      }

      // Trap focus within sidebar
      if (event.key === 'Tab' && sidebarRef.current) {
        const focusableElements = sidebarRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await transcriptStore.deleteTranscript(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      
      // If we deleted the current session, switch to a new one
      if (sessionId === currentSessionId) {
        onNewSession()
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={cn(
          'fixed left-0 top-0 h-full bg-gray-50 border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out',
          'w-80 md:w-72',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="complementary"
        aria-label="Conversation menu"
        aria-modal="true"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <h2 id="sidebar-title" className="font-semibold text-gray-900 select-text">Conversations</h2>
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-label="Hide conversation menu"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          </header>

          {/* New Chat Button */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <Button
              onClick={onNewSession}
              className="w-full bg-[#0055A4] hover:bg-[#0055A4]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New conversation
            </Button>
          </div>

          {/* Sessions List */}
          <nav 
            className="flex-1 overflow-y-auto p-4" 
            aria-labelledby="sidebar-title"
            role="navigation"
          >
            {loading ? (
              <div 
                className="text-center text-gray-500 py-8"
                role="status"
                aria-live="polite"
              >
                <span aria-hidden="true">Loading...</span>
                <span className="sr-only">Loading conversations</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center text-gray-500 py-8" role="status">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
                <p className="text-sm select-text">No conversations</p>
                <p className="text-xs mt-1 select-text">Start a new conversation to see it appear here</p>
              </div>
            ) : (
              <ul className="space-y-2" role="list" aria-label="List of conversations">
                {sessions.map((session) => (
                  <li key={session.id} role="listitem">
                    <SessionItem
                      session={session}
                      isActive={session.id === currentSessionId}
                      onClick={() => onSessionSelect(session.id)}
                      onDelete={handleDeleteSession}
                    />
                  </li>
                ))}
              </ul>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-white space-y-3">
            {sessions.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  onClick={() => setShowDeleteAllDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete all conversations
                </Button>
                <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you sure?</DialogTitle>
                      <DialogDescription>
                        This action is irreversible. All your conversations with
                        Jean-Claude will be permanently deleted.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteAllDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          onDeleteAll()
                          setSessions([])
                          setShowDeleteAllDialog(false)
                        }}
                        className="bg-[#EF4135] hover:bg-[#EF4135]/90"
                      >
                        Yes, delete all
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
            
            <p className="text-xs text-gray-500 text-center select-text">
              {sessions.length} conversation{sessions.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}