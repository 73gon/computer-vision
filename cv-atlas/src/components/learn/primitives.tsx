import * as React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  Brain,
  ChevronDown,
  Compass,
  Lightbulb,
  ListChecks,
  Pin,
  Sigma,
  TriangleAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/* ================================================================== *
 *  The page rhythm, top-down:
 *    BigIdea  → what this is, in one breath
 *    WhyCare  → the machine-learning hook
 *    Concept  → intuition first, then the formalism
 *    Worked   → an exam-shaped example, one step at a time
 *    Rule     → the sentence to carry into the exam
 *    Pitfall  → the trap that eats marks
 * ================================================================== */

export function BigIdea({ children, oneLiner }: { oneLiner: string; children?: React.ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[20px] border border-hairline bg-card px-5 py-6 sm:px-8 sm:py-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground/[0.035] via-transparent to-transparent" />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <Compass className="size-3.5 text-muted-foreground" />
          <span className="eyebrow">The 30-second version</span>
        </div>
        <p className="font-display text-[26px] leading-[1.15] tracking-tight text-balance sm:text-[34px]">
          {oneLiner}
        </p>
        {children ? (
          <div className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
        ) : null}
      </div>
    </motion.section>
  )
}

export function WhyCare({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 flex gap-3 rounded-[14px] border border-tint-1/25 bg-tint-1/[0.06] px-4 py-3.5">
      <Brain className="mt-0.5 size-4 shrink-0 text-tint-1" />
      <div className="min-w-0 text-[15px] leading-relaxed">
        <span className="eyebrow mr-2 text-tint-1">Why an ML person should care</span>
        <div className="mt-1.5 text-foreground/85">{children}</div>
      </div>
    </div>
  )
}

/* --- section container with a stable anchor id --------------------- */

export const SectionCtx = React.createContext<string>('')

export function Section({
  id,
  n,
  title,
  lead,
  children,
}: {
  id: string
  n: number
  title: string
  lead?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <SectionCtx.Provider value={id}>
      <section id={id} className="scroll-mt-24 border-t border-hairline pt-10">
        <div className="mb-1 flex items-baseline gap-3">
          <span className="eyebrow tabular-nums">{String(n).padStart(2, '0')} /</span>
          <h2 className="font-display text-[24px] leading-tight sm:text-[30px]">{title}</h2>
        </div>
        {lead ? (
          <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-muted-foreground">
            {lead}
          </p>
        ) : null}
        <div className="mt-6 space-y-5">{children}</div>
      </section>
    </SectionCtx.Provider>
  )
}

/* --- intuition → formalism ----------------------------------------- */

export function Concept({
  title,
  intuition,
  children,
}: {
  title?: string
  intuition?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="max-w-[68ch]">
      {title ? (
        <h3 className="mb-2 font-sans text-[15px] font-semibold tracking-tight">{title}</h3>
      ) : null}
      {intuition ? (
        <div className="mb-3 border-l-2 border-foreground/15 pl-4 text-[16px] leading-relaxed">
          {intuition}
        </div>
      ) : null}
      {children ? <div className="text-[15.5px] leading-relaxed">{children}</div> : null}
    </div>
  )
}

/* --- progressive disclosure ---------------------------------------- */

export function Deeper({
  label = 'Go one level deeper',
  children,
}: {
  label?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const reduce = useReducedMotion()
  return (
    <div className="my-4 overflow-hidden rounded-[14px] border border-hairline bg-muted/40">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-accent"
      >
        <span className="font-mono text-[12px] tracking-wider uppercase text-muted-foreground">
          {label}
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="body"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-hairline px-4 py-4 text-[15px] leading-relaxed">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/* --- the sentence you carry into the exam -------------------------- */

export function Rule({ children, tag }: { children: React.ReactNode; tag?: string }) {
  return (
    <div className="my-5 rounded-[14px] border border-foreground/15 bg-foreground/[0.04] px-4 py-3.5">
      <div className="mb-1.5 flex items-center gap-2">
        <Pin className="size-3.5 text-foreground/70" />
        <span className="eyebrow text-foreground/70">{tag ?? 'Remember this'}</span>
      </div>
      <div className="text-[15.5px] leading-relaxed font-medium">{children}</div>
    </div>
  )
}

export function Pitfall({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="my-5 rounded-[14px] border border-tint-2/30 bg-tint-2/[0.07] px-4 py-3.5">
      <div className="mb-1.5 flex items-center gap-2">
        <TriangleAlert className="size-3.5 text-tint-2" />
        <span className="eyebrow text-tint-2">{title ?? 'Exam trap'}</span>
      </div>
      <div className="text-[15.5px] leading-relaxed">{children}</div>
    </div>
  )
}

export function Aside({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="my-5 rounded-[14px] border border-hairline bg-muted/50 px-4 py-3.5">
      <div className="mb-1.5 flex items-center gap-2">
        <Lightbulb className="size-3.5 text-muted-foreground" />
        <span className="eyebrow">{title ?? 'Worth knowing'}</span>
      </div>
      <div className="text-[15px] leading-relaxed text-foreground/85">{children}</div>
    </div>
  )
}

/* --- worked example: reveal one step at a time ---------------------- */

export function Worked({
  title,
  source,
  question,
  steps,
  answer,
}: {
  title: string
  source?: string
  question: React.ReactNode
  steps: { label: string; body: React.ReactNode }[]
  answer?: React.ReactNode
}) {
  const [shown, setShown] = React.useState(0)
  const reduce = useReducedMotion()
  const done = shown >= steps.length

  return (
    <div className="my-6 overflow-hidden rounded-[20px] border border-hairline bg-card">
      <div className="border-b border-hairline px-5 py-4">
        <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="eyebrow">Worked example</span>
          {source ? (
            <span className="font-mono text-[11px] text-muted-foreground/70">{source}</span>
          ) : null}
        </div>
        <h3 className="font-sans text-[16px] font-semibold tracking-tight">{title}</h3>
        <div className="mt-2.5 text-[15px] leading-relaxed text-foreground/85">{question}</div>
      </div>

      <div className="px-5 py-4">
        <ol className="space-y-0">
          <AnimatePresence initial={false}>
            {steps.slice(0, shown).map((s, i) => (
              <motion.li
                key={i}
                initial={reduce ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="relative pb-5 pl-8 last:pb-0"
              >
                <span className="absolute left-0 top-0.5 flex size-5 items-center justify-center rounded-full border border-hairline bg-muted font-mono text-[10px] tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                {i < shown - 1 || !done ? (
                  <span className="absolute left-[9px] top-6 bottom-0 w-px bg-hairline" />
                ) : null}
                <div className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
                  {s.label}
                </div>
                <div className="mt-1.5 text-[15.5px] leading-relaxed">{s.body}</div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>

        {!done ? (
          <Button
            variant={shown === 0 ? 'primary' : 'secondary'}
            size="sm"
            className="mt-1"
            onClick={() => setShown((s) => s + 1)}
          >
            {shown === 0 ? 'Try it first — then reveal step 1' : `Reveal step ${shown + 1}`}
          </Button>
        ) : null}

        {done && answer ? (
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 rounded-[12px] border border-tint-3/30 bg-tint-3/[0.08] px-4 py-3"
          >
            <div className="eyebrow mb-1 text-tint-3">Answer</div>
            <div className="text-[15.5px] leading-relaxed">{answer}</div>
          </motion.div>
        ) : null}

        {done ? (
          <button
            onClick={() => setShown(0)}
            className="mt-3 font-mono text-[11px] tracking-wider text-muted-foreground uppercase underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Hide steps and retry
          </button>
        ) : null}
      </div>
    </div>
  )
}

/* --- figure shell --------------------------------------------------- */

export function Figure({
  caption,
  children,
  className,
  bleed,
}: {
  caption?: React.ReactNode
  children: React.ReactNode
  className?: string
  bleed?: boolean
}) {
  return (
    <figure className={cn('my-6', className)}>
      <div
        className={cn(
          'overflow-hidden rounded-[16px] border border-hairline bg-card',
          bleed ? '' : 'p-4 sm:p-5',
        )}
      >
        {children}
      </div>
      {caption ? (
        <figcaption className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

/* --- compact reference list ----------------------------------------- */

export function KeyList({
  title,
  items,
}: {
  title?: string
  items: { k: React.ReactNode; v: React.ReactNode }[]
}) {
  return (
    <div className="my-5 overflow-hidden rounded-[14px] border border-hairline">
      {title ? (
        <div className="flex items-center gap-2 border-b border-hairline bg-muted/50 px-4 py-2.5">
          <ListChecks className="size-3.5 text-muted-foreground" />
          <span className="eyebrow">{title}</span>
        </div>
      ) : null}
      <dl className="divide-y divide-[color:var(--hairline)]">
        {items.map((it, i) => (
          <div key={i} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-4">
            <dt className="text-[14.5px] font-medium">{it.k}</dt>
            <dd className="text-[14.5px] leading-relaxed text-muted-foreground">{it.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function FormulaCard({
  name,
  children,
  note,
}: {
  name: string
  children: React.ReactNode
  note?: React.ReactNode
}) {
  return (
    <div className="rounded-[14px] border border-hairline bg-card px-4 py-3.5">
      <div className="mb-1 flex items-center gap-2">
        <Sigma className="size-3.5 text-muted-foreground" />
        <span className="eyebrow">{name}</span>
      </div>
      <div className="overflow-x-auto">{children}</div>
      {note ? (
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{note}</p>
      ) : null}
    </div>
  )
}
