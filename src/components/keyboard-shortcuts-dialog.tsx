import { useState, useEffect } from 'react'
import { Keyboard } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface KeyboardShortcut {
  keys: string[]
  description: string
}

const shortcuts: KeyboardShortcut[] = [
  { keys: ['Ctrl', 'N'], description: 'Nouvelle conversation' },
  { keys: ['Ctrl', 'E'], description: 'Exporter la conversation' },
  { keys: ['Ctrl', 'B'], description: 'Ouvrir/fermer la barre latérale' },
  { keys: ['Ctrl', '/'], description: 'Focus sur la zone de saisie' },
  { keys: ['Échap'], description: 'Fermer les dialogues et menus' },
  { keys: ['Tab'], description: 'Naviguer entre les éléments' },
  { keys: ['Maj', 'Tab'], description: 'Naviguer en arrière' },
  { keys: ['Entrée'], description: 'Envoyer un message (dans la zone de saisie)' },
  { keys: ['Maj', 'Entrée'], description: 'Nouvelle ligne (dans la zone de saisie)' },
]

export function KeyboardShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show dialog with Ctrl+?
      if (event.key === '?' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 text-gray-500 hover:text-gray-700"
        aria-label="Afficher les raccourcis clavier"
      >
        <Keyboard className="h-4 w-4" />
        <span className="sr-only">Raccourcis clavier</span>
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Raccourcis clavier</AlertDialogTitle>
            <AlertDialogDescription>
              Utilisez ces raccourcis pour naviguer plus rapidement
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="mt-4">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2 font-medium">Raccourci</th>
                  <th className="text-left pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {shortcuts.map((shortcut, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                        {shortcut.keys.join(' + ')}
                      </kbd>
                    </td>
                    <td className="py-2 text-gray-600">{shortcut.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <p className="mt-4 text-sm text-gray-500">
              Astuce : Appuyez sur <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Ctrl + ?</kbd> pour afficher cette aide
            </p>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}