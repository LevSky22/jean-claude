import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ChatLayout from '@/components/chat-layout'
import ChatPage from '@/pages/ChatPage'

function App() {
  return (
    <Router>
      <ChatLayout>
        <Routes>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/" element={<Navigate to="/chat" replace />} />
        </Routes>
      </ChatLayout>
    </Router>
  )
}

export default App
