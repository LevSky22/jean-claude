import ChatHeader from '@/components/chat-header'
import ChatContainer from '@/components/chat-container'
import ChatInput from '@/components/chat-input'
import ChatSidebar from '@/components/chat-sidebar'
import OfflineBanner from '@/components/offline-banner'
import RateLimitToast from '@/components/rate-limit-toast'
import SkipNav from '@/components/skip-nav'
import { StatusAnnouncer } from '@/components/status-announcer'
import PrivacyFooter from '@/components/privacy-footer'
import { useChat } from '@/hooks/useChat'

export default function ChatPage() {
  const {
    messages,
    isStreaming,
    isWaiting,
    isOffline,
    showRateLimit,
    error,
    currentSessionId,
    isSidebarOpen,
    sendMessage,
    newChat,
    loadSession,
    deleteAllMessages,
    dismissRateLimit,
    dismissError,
    toggleSidebar,
    closeSidebar,
  } = useChat()


  return (
    <div className="chat-page-grid">
      <SkipNav targetId="main-content">
        Skip to main content
      </SkipNav>
      
      <SkipNav targetId="chat-input">
        Skip to message input
      </SkipNav>

      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        currentSessionId={currentSessionId}
        onSessionSelect={loadSession}
        onNewSession={newChat}
        onDeleteAll={deleteAllMessages}
        messageCount={messages.length}
      />
      
      {/* Grid row 1: Header (auto height) */}
      <div>
        <ChatHeader
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        <OfflineBanner isOffline={isOffline} />
      </div>

      {/* Grid row 2: Chat content (1fr - takes remaining space) */}
      <main 
        id="main-content" 
        className="overflow-hidden relative" 
        aria-label="Main conversation area"
        role="main"
      >
        <ChatContainer messages={messages} isStreaming={isStreaming} />
        
        {/* Jean-Claude character image */}
        <div className="absolute bottom-0 right-6 z-10 pointer-events-none">
          <img 
            src="/jean-claude.png" 
            alt="Jean-Claude character illustration"
            className="h-40 md:h-48 w-auto opacity-90 hover:opacity-100 transition-opacity duration-300 drop-shadow-xl"
            aria-hidden="true"
          />
        </div>
      </main>

      {/* Grid row 3: Input (auto height) */}
      <div id="chat-input">
        <ChatInput
          onSendMessage={sendMessage}
          isWaiting={isWaiting}
          disabled={isOffline}
        />
        <PrivacyFooter />
      </div>

      <RateLimitToast
        isVisible={showRateLimit}
        onClose={dismissRateLimit}
      />


      {error && (
        <div 
          role="alert" 
          aria-live="assertive"
          aria-atomic="true"
          className="fixed bottom-4 left-4 right-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg"
        >
          <div className="flex justify-between items-center">
            <span>
              <span className="sr-only">Error: </span>
              {error}
            </span>
            <button
              onClick={dismissError}
              className="text-red-600 hover:text-red-800 font-bold text-lg"
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        </div>
      )}

      
      {/* Status announcer for screen readers */}
      <StatusAnnouncer 
        isOffline={isOffline}
        isWaiting={isWaiting}
        error={error}
      />
    </div>
  )
}
