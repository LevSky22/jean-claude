import ChatHeader from '@/components/chat-header'
import ChatContainer from '@/components/chat-container'
import ChatInput from '@/components/chat-input'
import ChatSidebar from '@/components/chat-sidebar'
import OfflineBanner from '@/components/offline-banner'
import RateLimitToast from '@/components/rate-limit-toast'
import { ExportReminder } from '@/components/export-reminder'
import SkipNav from '@/components/skip-nav'
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts-dialog'
import { StatusAnnouncer } from '@/components/status-announcer'
import PrivacyFooter from '@/components/privacy-footer'
import { useChat } from '@/hooks/useChat'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export default function ChatPage() {
  const {
    messages,
    isStreaming,
    isWaiting,
    isOffline,
    showRateLimit,
    showExportReminder,
    error,
    currentSessionId,
    isSidebarOpen,
    sendMessage,
    newChat,
    loadSession,
    exportMessages,
    deleteAllMessages,
    dismissRateLimit,
    dismissExportReminder,
    dismissError,
    toggleSidebar,
    closeSidebar,
  } = useChat()

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrlKey: true,
      action: newChat,
      description: 'Nouvelle conversation',
    },
    {
      key: 'e',
      ctrlKey: true,
      action: exportMessages,
      description: 'Exporter la conversation',
    },
    {
      key: 'b',
      ctrlKey: true,
      action: toggleSidebar,
      description: 'Basculer la barre latérale',
    },
    {
      key: '/',
      ctrlKey: true,
      action: () => {
        // Focus the chat input
        const input = document.getElementById('chat-message-input')
        if (input) {
          input.focus()
        }
      },
      description: 'Focus sur la zone de saisie',
    },
  ])

  return (
    <>
      <SkipNav targetId="main-content">
        Aller au contenu principal
      </SkipNav>
      
      <SkipNav targetId="chat-input">
        Aller à la saisie de message
      </SkipNav>

      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        currentSessionId={currentSessionId}
        onSessionSelect={loadSession}
        onNewSession={newChat}
        onDeleteAll={deleteAllMessages}
      />
      
      <ChatHeader
        onNewChat={newChat}
        onToggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />

      <main 
        id="main-content" 
        className="flex-1 flex flex-col overflow-hidden" 
        aria-label="Zone de conversation principale"
        role="main"
      >
        <OfflineBanner isOffline={isOffline} />

        <ChatContainer messages={messages} isStreaming={isStreaming} />

        <div id="chat-input">
          <ChatInput
            onSendMessage={sendMessage}
            isWaiting={isWaiting}
            disabled={isOffline}
          />
          <PrivacyFooter />
        </div>
      </main>

      <RateLimitToast
        isVisible={showRateLimit}
        onClose={dismissRateLimit}
      />

      {showExportReminder && (
        <ExportReminder
          onExport={exportMessages}
          onDismiss={dismissExportReminder}
        />
      )}

      {error && (
        <div 
          role="alert" 
          aria-live="assertive"
          aria-atomic="true"
          className="fixed bottom-4 left-4 right-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg"
        >
          <div className="flex justify-between items-center">
            <span>
              <span className="sr-only">Erreur : </span>
              {error}
            </span>
            <button
              onClick={dismissError}
              className="text-red-600 hover:text-red-800 font-bold text-lg"
              aria-label="Fermer le message d'erreur"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <KeyboardShortcutsDialog />
      
      {/* Status announcer for screen readers */}
      <StatusAnnouncer 
        isOffline={isOffline}
        isWaiting={isWaiting}
        error={error}
      />
    </>
  )
}
