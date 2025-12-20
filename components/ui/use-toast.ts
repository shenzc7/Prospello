'use client'

import { toast as sonnerToast, type ExternalToast } from 'sonner'

/**
 * Minimal shim to mirror shadcn's useToast API for existing calls.
 * Sonner handles rendering; see `components/ui/toaster.tsx` for the host.
 */
export function useToast() {
  return { toast: sonnerToast }
}

export const toast = sonnerToast
export type ToastOptions = ExternalToast















