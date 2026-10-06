import type { PostHog } from 'posthog-js'

// PostHog rides on the consent that clarity.ts keeps: nothing here runs until
// the visitor has allowed analytics, and the library is its own chunk, so a
// visitor who declines never downloads it.
const key = import.meta.env.VITE_POSTHOG_KEY?.trim()
const host = import.meta.env.VITE_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com'

export const posthogConfigured = Boolean(key)

let loading: Promise<PostHog> | undefined
let instance: PostHog | undefined

export function startPosthog() {
  if (!key || loading) return
  loading = import('posthog-js').then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: host,
      defaults: '2026-08-30',
      person_profiles: 'identified_only',
    })
    // A refusal is stored by the library itself; an earlier one would keep
    // this visitor silent even after they changed their mind.
    if (posthog.has_opted_out_capturing()) posthog.opt_in_capturing()
    instance = posthog
    return posthog
  })
  // A blocked or failed download leaves the site working and lets a later
  // consent change try again.
  loading.catch(() => { loading = undefined })
}

export function capturePosthog(name: string) {
  loading?.then((posthog) => posthog.capture(name)).catch(() => {})
}

/** Stops capture for this browser. Returns whether the library had been loaded. */
export function stopPosthog() {
  instance?.opt_out_capturing()
  return Boolean(instance)
}
