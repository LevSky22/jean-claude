import ChatHeader from '@/components/chat-header'
import ChatContainer from '@/components/chat-container'
import ChatInput from '@/components/chat-input'
import ChatSidebar from '@/components/chat-sidebar'
import OfflineBanner from '@/components/offline-banner'
import RateLimitToast from '@/components/rate-limit-toast'
import { ExportReminder } from '@/components/export-reminder'
import SkipNav from '@/components/skip-nav'
import { useChat } from '@/hooks/useChat'

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
        <div role="alert" className="fixed bottom-4 left-4 right-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
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
    </>
  )
}
