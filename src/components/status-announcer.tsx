import { useEffect, useState } from 'react'
import { LiveAnnouncer } from './live-announcer'

interface StatusAnnouncerProps {
  isOffline: boolean
  isWaiting: boolean
  error: string | null
}

/**
 * Announces status changes to screen readers
 */
export function StatusAnnouncer({ isOffline, isWaiting, error }: StatusAnnouncerProps) {
  const [announcement, setAnnouncement] = useState('')
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite')

  useEffect(() => {
    if (error) {
      setAnnouncement(`Error: ${error}`)
      setPoliteness('assertive')
    } else if (isOffline) {
      setAnnouncement('You are now offline. Only transcripts are available.')
      setPoliteness('assertive')
    } else if (isWaiting) {
      setAnnouncement('Jean-Claude is thinking...')
      setPoliteness('polite')
    } else {
      // Clear announcement when status returns to normal
      setAnnouncement('')
    }
  }, [isOffline, isWaiting, error])

  return <LiveAnnouncer message={announcement} politeness={politeness} />
}