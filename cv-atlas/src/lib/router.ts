import { useSyncExternalStore } from 'react'

/**
 * Hash routing, ~40 lines instead of a dependency.
 *   #/                → home
 *   #/t/<topicId>     → a topic
 *   #/t/<id>/<sec>    → a topic, scrolled to a section
 *   #/drills          → exam drill mode
 *   #/sheet           → the one-page formula sheet
 */
export type Route =
  | { name: 'home' }
  | { name: 'topic'; id: string; section?: string }
  | { name: 'drills' }
  | { name: 'sheet' }

function parse(hash: string): Route {
  const h = hash.replace(/^#\/?/, '')
  if (h === '' || h === 'home') return { name: 'home' }
  if (h === 'drills') return { name: 'drills' }
  if (h === 'sheet') return { name: 'sheet' }
  const m = /^t\/([^/]+)(?:\/([^/]+))?$/.exec(h)
  if (m) return { name: 'topic', id: m[1], section: m[2] }
  return { name: 'home' }
}

/* ------------------------------------------------------------------ *
 *  A tiny external store over `location.hash`. Using
 *  useSyncExternalStore (rather than useState + useEffect) means every
 *  component that reads the route sees the same value in the same
 *  render, and no hash change can slip through between the first paint
 *  and the effect that would have subscribed.
 *
 *  The snapshot is cached because `parse` allocates, and
 *  useSyncExternalStore requires a referentially stable snapshot.
 * ------------------------------------------------------------------ */

let cachedHash = typeof location === 'undefined' ? '' : location.hash
let cachedRoute: Route = parse(cachedHash)

function getSnapshot(): Route {
  if (location.hash !== cachedHash) {
    cachedHash = location.hash
    cachedRoute = parse(cachedHash)
  }
  return cachedRoute
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  window.addEventListener('popstate', cb)
  return () => {
    window.removeEventListener('hashchange', cb)
    window.removeEventListener('popstate', cb)
  }
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function go(path: string) {
  if (location.hash === `#${path}`) return
  location.hash = path
}

export function href(path: string) {
  return `#${path}`
}
