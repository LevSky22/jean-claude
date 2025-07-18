import { useEffect, useRef } from 'react'

interface LiveAnnouncerProps {
  message: string
  politeness?: 'polite' | 'assertive'
  clearOnUnmount?: boolean
}

/**
 * A component that announces messages to screen readers using ARIA live regions.
 * Place this component where you want to announce dynamic content changes.
 */
export function LiveAnnouncer({ 
  message, 
  politeness = 'polite',
  clearOnUnmount = true 
}: LiveAnnouncerProps) {
  const announcerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (announcerRef.current && message) {
      // Clear and re-set the message to ensure it's announced
      announcerRef.current.textContent = ''
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message
        }
      }, 100)
    }
  }, [message])

  useEffect(() => {
    return () => {
      const element = announcerRef.current
      if (clearOnUnmount && element) {
        element.textContent = ''
      }
    }
  }, [clearOnUnmount])

  return (
    <div
      ref={announcerRef}
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    />
  )
}

