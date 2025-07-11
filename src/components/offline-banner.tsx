import { WifiOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface OfflineBannerProps {
  isOffline: boolean
}

export default function OfflineBanner({ isOffline }: OfflineBannerProps) {
  if (!isOffline) return null

  return (
    <Alert 
      className="bg-amber-50 border-amber-200 mb-4 max-w-[720px] mx-auto" 
      role="alert"
      aria-live="assertive"
    >
      <WifiOff className="h-4 w-4 text-amber-500" aria-hidden="true" />

      <AlertDescription className="text-amber-800 font-medium">
        <span className="sr-only">Warning: </span>
        Offline: transcripts only—reconnect to chat.
      </AlertDescription>
    </Alert>
  )
}
