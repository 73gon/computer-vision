import { useCallback, useEffect, useSyncExternalStore } from 'react'

/* ------------------------------------------------------------------ *
 *  Tiny persisted store. Everything lives in localStorage so progress
 *  survives a reload; nothing leaves the browser.
 * ------------------------------------------------------------------ */

const KEY = 'cv-atlas:v1'

type State = {
  theme: 'dark' | 'light'
  /** topicId -> sectionId[] that have been marked read */
  read: Record<string, string[]>
  /** drillId -> 'got-it' | 'shaky' */
  drills: Record<string, 'got-it' | 'shaky'>
  /** topicId[] starred for the final sprint */
  starred: string[]
}

const DEFAULT: State = { theme: 'dark', read: {}, drills: {}, starred: [] }

/** Shared empty array so selectors stay referentially stable. */
const EMPTY: string[] = []

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<State>) }
  } catch {
    // Private mode, blocked storage, or corrupt JSON — start fresh.
    return DEFAULT
  }
}

let state: State = typeof localStorage === 'undefined' ? DEFAULT : load()
const listeners = new Set<() => void>()

function commit(next: State) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* the app still works, it just forgets */
  }
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function getSnapshot() {
  return state
}

/**
 * `state` is replaced wholesale on every commit, so the whole object is a
 * valid immutable snapshot. Components read the slice they need during
 * render — no per-selector subscription, and no re-subscribe loop.
 */
function useStore(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/* --- theme --------------------------------------------------------- */

export function useTheme() {
  const theme = useStore().theme
  useEffect(() => {
    const el = document.documentElement
    el.classList.toggle('dark', theme === 'dark')
    el.classList.toggle('light', theme === 'light')
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#121212' : '#fcfcfc')
  }, [theme])
  const toggle = useCallback(
    () => commit({ ...state, theme: state.theme === 'dark' ? 'light' : 'dark' }),
    [],
  )
  return { theme, toggle }
}

/* --- reading progress ---------------------------------------------- */

export function useRead(topicId: string) {
  const read = useStore().read[topicId] ?? EMPTY
  const mark = useCallback(
    (sectionId: string, on: boolean) => {
      const cur = new Set(state.read[topicId] ?? [])
      if (on) cur.add(sectionId)
      else cur.delete(sectionId)
      commit({ ...state, read: { ...state.read, [topicId]: [...cur] } })
    },
    [topicId],
  )
  return { read, mark }
}

export function useAllProgress() {
  return useStore().read
}

export function useDrills() {
  const drills = useStore().drills
  const set = useCallback((id: string, v: 'got-it' | 'shaky' | null) => {
    const next = { ...state.drills }
    if (v === null) delete next[id]
    else next[id] = v
    commit({ ...state, drills: next })
  }, [])
  return { drills, set }
}

export function useStarred() {
  const starred = useStore().starred
  const toggle = useCallback((id: string) => {
    const set = new Set(state.starred)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    commit({ ...state, starred: [...set] })
  }, [])
  return { starred, toggle }
}

export function resetProgress() {
  commit({ ...state, read: {}, drills: {}, starred: [] })
}
