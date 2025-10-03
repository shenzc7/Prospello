import { useEffect } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  description: string
  action: () => void
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = !!shortcut.ctrl === event.ctrlKey
        const altMatches = !!shortcut.alt === event.altKey
        const shiftMatches = !!shortcut.shift === event.shiftKey

        return keyMatches && ctrlMatches && altMatches && shiftMatches
      })

      if (matchingShortcut) {
        event.preventDefault()
        matchingShortcut.action()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// Predefined shortcuts for the OKR application
export const okrKeyboardShortcuts: KeyboardShortcut[] = [
  {
    key: 'n',
    ctrl: true,
    description: 'Create new objective',
    action: () => {
      // This will be implemented per page
    }
  },
  {
    key: 'f',
    ctrl: true,
    description: 'Focus search input',
    action: () => {
      const searchInput = document.querySelector('input[placeholder*="search"], input[data-testid*="search"]') as HTMLInputElement
      searchInput?.focus()
    }
  },
  {
    key: 'Escape',
    description: 'Clear selection / close dialogs',
    action: () => {
      // This will be implemented per component
    }
  },
  {
    key: 'a',
    ctrl: true,
    description: 'Select all items',
    action: () => {
      // This will be implemented per component
    }
  }
]
