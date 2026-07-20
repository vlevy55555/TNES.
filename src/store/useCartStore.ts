import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// The cart is keyed on the Shopify variant id — the only identifier that pins a
// specific purchasable thing. Keying on artwork+size would be wrong here: these
// products carry two options (Size AND Frame) and the frame changes the price
// ($185 Black vs $210 Gun Metal), so size alone doesn't identify what's bought.
//
// Deliberately NOT stored: price. Amounts are read live from the Storefront API
// wherever the cart renders, so a cart left open overnight can't quote a price
// Shopify no longer honours. `label` is display-only, a fallback for when the
// store is unreachable and we still owe the buyer a readable line.

export type CartLine = {
  variantId: string
  artworkId: string
  /** Shopify product handle — how the cart re-reads live pricing */
  handle: string
  /** e.g. "12x18 / Black" — display fallback only, never used for pricing */
  label: string
  qty: number
}

type CartState = {
  items: Record<string, CartLine>
  open: boolean
  add: (line: Omit<CartLine, 'qty'>, qty?: number) => void
  setQty: (variantId: string, qty: number) => void
  remove: (variantId: string) => void
  clear: () => void
  setOpen: (open: boolean) => void
}

// Shopify rejects absurd line quantities and a made-to-order print has no
// realistic case for more; cap so a stuck "+" can't build an unfillable order.
const MAX_QTY = 20
const clampQty = (n: number) => Math.min(MAX_QTY, Math.max(1, Math.floor(n) || 1))

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: {},
      open: false,

      add: (line, qty = 1) =>
        set((s) => {
          const prev = s.items[line.variantId]?.qty ?? 0
          return {
            items: {
              ...s.items,
              [line.variantId]: { ...line, qty: clampQty(prev + qty) },
            },
          }
        }),

      setQty: (variantId, qty) =>
        set((s) => {
          if (!s.items[variantId]) return s
          const items = { ...s.items }
          if (qty <= 0) delete items[variantId]
          else items[variantId] = { ...items[variantId], qty: clampQty(qty) }
          return { items }
        }),

      remove: (variantId) =>
        set((s) => {
          const items = { ...s.items }
          delete items[variantId]
          return { items }
        }),

      clear: () => set({ items: {} }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: 'tnes-cart',
      version: 1,
      // `open` is view state — a reload must not reopen the drawer
      partialize: (s) => ({ items: s.items }),
    },
  ),
)

/** Summed quantity for the header badge — derived, never stored. */
export const useCartCount = () =>
  useCartStore((s) => Object.values(s.items).reduce((n, l) => n + l.qty, 0))
