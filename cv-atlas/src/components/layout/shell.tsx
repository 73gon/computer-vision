import * as React from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'motion/react'
import {
  BookOpen,
  Check,
  Command,
  Dumbbell,
  Menu,
  Moon,
  ScrollText,
  Search,
  Star,
  Sun,
  X,
} from 'lucide-react'
import { cn, pad2 } from '@/lib/utils'
import { go, href, useRoute } from '@/lib/router'
import { useAllProgress, useStarred, useTheme } from '@/lib/store'
import { TOPICS } from '@/content'
import { Button } from '@/components/ui/button'

/* ------------------------------------------------------------------ *
 *  The wordmark: two brackets, the "eigenpair" motif, drawn rather
 *  than imported so it inherits the current ink colour.
 * ------------------------------------------------------------------ */

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-5', className)} aria-hidden>
      <g
        stroke="currentColor"
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        <path d="M13 5 H7 V27 H13" />
        <path d="M19 5 H25 V27 H19" />
      </g>
    </svg>
  )
}

/* --- reading-progress hairline at the very top ---------------------- */

function ScrollRail() {
  const { scrollYProgress } = useScroll()
  const x = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 })
  return (
    <motion.div
      style={{ scaleX: x }}
      className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-foreground/50"
    />
  )
}

/* --- command palette ----------------------------------------------- */

type Item = { label: string; sub: string; path: string; group: string }

function useItems(): Item[] {
  return React.useMemo(() => {
    const out: Item[] = [
      { label: 'Overview', sub: 'all topics, progress, the map', path: '/', group: 'Go to' },
      {
        label: 'Exam drills',
        sub: 'every exercise question in one place',
        path: '/drills',
        group: 'Go to',
      },
      { label: 'Formula sheet', sub: 'one page, everything', path: '/sheet', group: 'Go to' },
    ]
    for (const t of TOPICS) {
      out.push({
        label: `${pad2(t.n)} · ${t.title}`,
        sub: t.kicker,
        path: `/t/${t.id}`,
        group: 'Topics',
      })
      for (const s of t.sections) {
        out.push({
          label: s.title,
          sub: `${pad2(t.n)} · ${t.title}`,
          path: `/t/${t.id}/${s.id}`,
          group: 'Sections',
        })
      }
    }
    return out
  }, [])
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useItems()
  const [q, setQ] = React.useState('')
  const [sel, setSel] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const results = React.useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return items.slice(0, 9)
    return items
      .map((it) => {
        const hay = `${it.label} ${it.sub}`.toLowerCase()
        const i = hay.indexOf(needle)
        return { it, score: i < 0 ? Infinity : i }
      })
      .filter((r) => r.score !== Infinity)
      .sort((a, b) => a.score - b.score)
      .slice(0, 12)
      .map((r) => r.it)
  }, [q, items])

  React.useEffect(() => {
    if (open) {
      setQ('')
      setSel(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  React.useEffect(() => {
    setSel(0)
  }, [q])

  if (!open) return null

  const pick = (it: Item) => {
    go(it.path)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-background/70 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-[20px] border border-border bg-popover shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-hairline px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSel((s) => Math.min(results.length - 1, s + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSel((s) => Math.max(0, s - 1))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                if (results[sel]) pick(results[sel])
              } else if (e.key === 'Escape') {
                onClose()
              }
            }}
            placeholder="Jump to a topic, a section, the drills…"
            className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <kbd className="shrink-0 rounded border border-hairline px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            esc
          </kbd>
        </div>
        <ul className="max-h-[52vh] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-[14px] text-muted-foreground">
              Nothing matches “{q}”.
            </li>
          ) : null}
          {results.map((it, i) => (
            <li key={it.path + it.label}>
              <button
                onMouseEnter={() => setSel(i)}
                onClick={() => pick(it)}
                className={cn(
                  'flex w-full items-baseline gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors duration-100',
                  i === sel ? 'bg-accent' : '',
                )}
              >
                <span className="min-w-0 flex-1 truncate text-[14.5px]">{it.label}</span>
                <span className="shrink-0 truncate font-mono text-[11px] text-muted-foreground">
                  {it.group}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-hairline px-4 py-2.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
          <span>↑↓ move</span>
          <span>↵ open</span>
          <span>[ ] previous / next topic</span>
          <span>/ search</span>
        </div>
      </motion.div>
    </div>
  )
}

/* --- sidebar -------------------------------------------------------- */

function TopicLink({
  id,
  n,
  title,
  active,
}: {
  id: string
  n: number
  title: string
  active: boolean
}) {
  const progress = useAllProgress()
  const topic = TOPICS.find((t) => t.id === id)!
  const readCount = (progress[id] ?? []).length
  const done = readCount >= topic.sections.length && topic.sections.length > 0

  return (
    <a
      href={href(`/t/${id}`)}
      className={cn(
        'group flex items-baseline gap-2.5 rounded-[9px] px-2.5 py-[7px] transition-colors duration-150',
        active
          ? 'bg-accent text-foreground'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
      )}
    >
      <span
        className={cn(
          'shrink-0 font-mono text-[10px] tabular-nums',
          done ? 'text-tint-3' : 'opacity-50',
        )}
      >
        {done ? '✓' : pad2(n)}
      </span>
      <span className="min-w-0 flex-1 text-[13.5px] leading-snug">{title}</span>
      {readCount > 0 && !done ? (
        <span className="shrink-0 font-mono text-[9px] opacity-50">
          {readCount}/{topic.sections.length}
        </span>
      ) : null}
    </a>
  )
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const route = useRoute()
  const activeId = route.name === 'topic' ? route.id : null
  const { starred } = useStarred()

  return (
    <nav className="flex h-full flex-col" onClick={onNavigate}>
      <div className="px-3 pt-4 pb-2">
        <a
          href={href('/')}
          className="flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 transition-colors duration-150 hover:bg-accent"
        >
          <Mark />
          <span className="font-display text-[17px] leading-none">CV Atlas</span>
        </a>
      </div>

      <div className="space-y-0.5 px-3 pb-3">
        <a
          href={href('/drills')}
          className={cn(
            'flex items-center gap-2.5 rounded-[9px] px-2.5 py-[7px] text-[13.5px] transition-colors duration-150',
            route.name === 'drills'
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
          )}
        >
          <Dumbbell className="size-3.5 shrink-0" /> Exam drills
        </a>
        <a
          href={href('/sheet')}
          className={cn(
            'flex items-center gap-2.5 rounded-[9px] px-2.5 py-[7px] text-[13.5px] transition-colors duration-150',
            route.name === 'sheet'
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
          )}
        >
          <ScrollText className="size-3.5 shrink-0" /> Formula sheet
        </a>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        {starred.length ? (
          <>
            <div className="eyebrow px-2.5 pt-2 pb-1.5 flex items-center gap-1.5">
              <Star className="size-3" /> Starred
            </div>
            <div className="space-y-0.5 pb-3">
              {TOPICS.filter((t) => starred.includes(t.id)).map((t) => (
                <TopicLink
                  key={t.id}
                  id={t.id}
                  n={t.n}
                  title={t.title}
                  active={activeId === t.id}
                />
              ))}
            </div>
          </>
        ) : null}

        <div className="eyebrow px-2.5 pt-2 pb-1.5 flex items-center gap-1.5">
          <BookOpen className="size-3" /> Topics
        </div>
        <div className="space-y-0.5">
          {TOPICS.map((t) => (
            <TopicLink key={t.id} id={t.id} n={t.n} title={t.title} active={activeId === t.id} />
          ))}
        </div>
      </div>
    </nav>
  )
}

/* --- app frame ------------------------------------------------------ */

export function Shell({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme()
  const [menu, setMenu] = React.useState(false)
  const [palette, setPalette] = React.useState(false)
  const route = useRoute()
  const reduce = useReducedMotion()

  React.useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const typing = /input|textarea|select/i.test((e.target as HTMLElement)?.tagName ?? '')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((p) => !p)
        return
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '/') {
        e.preventDefault()
        setPalette(true)
      }
      // [ and ] step through the topics in order.
      if (e.key === '[' || e.key === ']') {
        const cur = route.name === 'topic' ? TOPICS.findIndex((t) => t.id === route.id) : -1
        const next =
          e.key === ']'
            ? (TOPICS[cur + 1] ?? TOPICS[0])
            : cur > 0
              ? TOPICS[cur - 1]
              : TOPICS[TOPICS.length - 1]
        if (next) {
          e.preventDefault()
          go(`/t/${next.id}`)
        }
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [route])

  // Close the mobile drawer and scroll to top on navigation.
  const key = route.name === 'topic' ? `${route.id}` : route.name
  React.useEffect(() => {
    setMenu(false)
  }, [key])

  return (
    <div className="min-h-dvh">
      <ScrollRail />

      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-hairline bg-background lg:block">
        <Sidebar />
      </aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {menu ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
              onClick={() => setMenu(false)}
            />
            <motion.aside
              initial={reduce ? false : { x: -280 }}
              animate={{ x: 0 }}
              exit={reduce ? undefined : { x: -280 }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="fixed inset-y-0 left-0 z-50 w-[272px] border-r border-border bg-background lg:hidden"
            >
              <Sidebar onNavigate={() => setMenu(false)} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      {/* top bar */}
      <header className="sticky top-0 z-20 border-b border-hairline bg-background/85 backdrop-blur-md lg:pl-[264px]">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-2 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMenu(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </Button>
          <a href={href('/')} className="flex items-center gap-2 lg:hidden">
            <Mark className="size-4" />
          </a>

          <button
            onClick={() => setPalette(true)}
            className="ml-auto flex h-9 items-center gap-2 rounded-[10px] border border-[var(--field-edge)]/60 bg-[var(--field-surface)] px-3 text-muted-foreground transition-colors duration-150 hover:bg-accent"
          >
            <Search className="size-3.5" />
            <span className="hidden text-[13px] sm:inline">Search</span>
            <kbd className="ml-1 hidden items-center gap-0.5 rounded border border-hairline px-1 py-0.5 font-mono text-[10px] sm:flex">
              <Command className="size-2.5" />K
            </kbd>
          </button>

          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>

      <main className="lg:pl-[264px]">{children}</main>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  )
}

/* --- section rail (right-hand table of contents) --------------------- */

export function SectionRail({
  sections,
  read,
  onToggle,
}: {
  sections: { id: string; title: string }[]
  read: string[]
  onToggle: (id: string, on: boolean) => void
}) {
  const [active, setActive] = React.useState<string>(sections[0]?.id ?? '')

  React.useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    )
    for (const s of sections) {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    }
    return () => obs.disconnect()
  }, [sections])

  return (
    <nav className="sticky top-20 space-y-0.5">
      <div className="eyebrow mb-2 px-2">On this page</div>
      {sections.map((s) => {
        const isRead = read.includes(s.id)
        return (
          <div key={s.id} className="group flex items-start gap-1">
            <a
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })
              }}
              className={cn(
                'min-w-0 flex-1 rounded-[7px] px-2 py-1.5 text-[12.5px] leading-snug transition-colors duration-150',
                active === s.id
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {s.title}
            </a>
            <button
              onClick={() => onToggle(s.id, !isRead)}
              aria-label={isRead ? `Mark ${s.title} unread` : `Mark ${s.title} read`}
              aria-pressed={isRead}
              className={cn(
                'mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-150',
                isRead
                  ? 'border-transparent bg-tint-3/25 text-tint-3'
                  : 'border-hairline text-transparent hover:border-foreground/30 hover:text-muted-foreground',
              )}
            >
              <Check className="size-3" />
            </button>
          </div>
        )
      })}
    </nav>
  )
}

export { X }
