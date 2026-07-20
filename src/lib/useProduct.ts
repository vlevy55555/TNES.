import { useEffect, useState } from 'react'
import { getProduct, type ShopProduct } from './shopify'

// React bindings for the Shopify catalogue. Kept out of shopify.ts so that
// module stays React-free and its pure helpers run under plain node in the test.

/** One product, or null while loading / when the store can't be reached. */
export function useProduct(handle?: string): ShopProduct | null {
  const [product, setProduct] = useState<ShopProduct | null>(null)

  useEffect(() => {
    setProduct(null)
    if (!handle) return
    let alive = true
    getProduct(handle).then((p) => {
      if (alive) setProduct(p)
    })
    return () => {
      alive = false
    }
  }, [handle])

  return product
}

/**
 * Several products at once, keyed by handle. Used by the cart, which holds lines
 * from more than one work and re-reads prices live rather than trusting the
 * amounts captured when each line was added.
 */
export function useProducts(handles: string[]): Record<string, ShopProduct> {
  const [products, setProducts] = useState<Record<string, ShopProduct>>({})
  // handles is a fresh array each render — depend on its contents, not identity
  const key = [...new Set(handles)].sort().join(',')

  useEffect(() => {
    const wanted = key ? key.split(',') : []
    if (!wanted.length) return setProducts({})
    let alive = true
    Promise.all(wanted.map(getProduct)).then((loaded) => {
      if (!alive) return
      setProducts(
        Object.fromEntries(
          loaded.filter((p): p is ShopProduct => p !== null).map((p) => [p.handle, p]),
        ),
      )
    })
    return () => {
      alive = false
    }
  }, [key])

  return products
}
