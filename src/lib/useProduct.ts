import { useEffect, useState } from 'react'
import { getProduct, type ShopProduct } from './shopify'

// React bindings for the Shopify catalogue. Kept out of shopify.ts so that
// module stays React-free and its pure helpers run under plain node in the test.

export type ProductLoadState = {
  product: ShopProduct | null
  loading: boolean
}

/** One product with loading kept distinct from a completed empty response. */
export function useProductState(handle?: string): ProductLoadState {
  const [loaded, setLoaded] = useState<{ handle: string; product: ShopProduct | null } | null>(null)

  useEffect(() => {
    if (!handle) return
    let alive = true
    getProduct(handle).then((p) => {
      if (alive) setLoaded({ handle, product: p })
    })
    return () => {
      alive = false
    }
  }, [handle])

  // Route changes render before effects run. Never expose the previous work's
  // product during that render, otherwise its sizes and price flash briefly.
  const matches = !!handle && loaded?.handle === handle
  return {
    product: matches ? loaded.product : null,
    loading: !!handle && !matches,
  }
}

/** Compatibility binding for callers that only need the loaded product. */
export function useProduct(handle?: string): ShopProduct | null {
  return useProductState(handle).product
}
