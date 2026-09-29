import { create } from 'zustand'
import { trackAnalyticsEvent } from '../analytics/clarity'

/**
 * The contact panel is opened from places that do not know about each other —
 * the footer on every page, a work's inquiry link, the moments chapter that is
 * currently on view. One store, so any of them can raise it and pass along what
 * the message is about.
 */
type ContactStore = {
  open: boolean
  /** prefills the subject field, e.g. `works on view — east hampton` */
  subject: string
  /** prefills the message, e.g. the works and sizes on a gallery wall */
  body: string
  openContact: (subject?: string, body?: string) => void
  closeContact: () => void
}

export const useContactStore = create<ContactStore>((set) => ({
  open: false,
  subject: '',
  body: '',
  openContact: (subject = '', body = '') => {
    trackAnalyticsEvent('inquiry_opened')
    set({ open: true, subject, body })
  },
  closeContact: () => set({ open: false }),
}))
