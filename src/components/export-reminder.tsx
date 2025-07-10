import { AlertTriangle, Download, X } from 'lucide-react'
import { Button } from './ui/button'

interface ExportReminderProps {
  onExport: () => void
  onDismiss: () => void
}

export function ExportReminder({ onExport, onDismiss }: ExportReminderProps) {
  return (
    <div 
      className="fixed bottom-4 right-4 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg max-w-sm animate-in slide-in-from-right-5 z-50"
      role="dialog"
      aria-labelledby="export-reminder-title"
      aria-describedby="export-reminder-description"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h3 id="export-reminder-title" className="font-semibold text-amber-800 text-sm">
            Export Reminder
          </h3>
          <p id="export-reminder-description" className="text-amber-700 text-sm mt-1">
            You've exchanged 10 messages! Consider exporting your conversation to save it locally.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button
              onClick={onExport}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              aria-label="Exporter la conversation maintenant"
            >
              <Download className="h-4 w-4 mr-1" aria-hidden="true" />
              Export Now
            </Button>
            <Button
              onClick={onDismiss}
              size="sm"
              variant="ghost"
              className="text-amber-700 hover:text-amber-800 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              aria-label="Reporter l'export à plus tard"
            >
              Later
            </Button>
          </div>
        </div>
        <Button
          onClick={onDismiss}
          size="sm"
          variant="ghost"
          className="text-amber-500 hover:text-amber-600 p-1 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          aria-label="Fermer le rappel d'export"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}