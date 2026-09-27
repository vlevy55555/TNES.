import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type FavoritesState = {
  ids: string[]
  toggle: (id: string) => void
  remove: (id: string) => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((state) => ({
        ids: state.ids.includes(id)
          ? state.ids.filter((saved) => saved !== id)
          : [...state.ids, id],
      })),
      remove: (id) => set((state) => ({
        ids: state.ids.filter((saved) => saved !== id),
      })),
    }),
    { name: 'tnes-favorites', version: 1 },
  ),
)

export const useFavoritesCount = () => useFavoritesStore((state) => state.ids.length)
