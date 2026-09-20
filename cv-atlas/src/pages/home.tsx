import * as React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Clock, Dumbbell, RotateCcw, ScrollText } from 'lucide-react'
import { ALL_DRILLS, TOPICS, TOTAL_MINUTES } from '@/content'
import { PipelineMap } from '@/components/viz/pipeline'
import { Button } from '@/components/ui/button'
import { useAllProgress, useDrills, resetProgress } from '@/lib/store'
import { href } from '@/lib/router'
import { cn, pad2 } from '@/lib/utils'

function useOverallProgress() {
  const read = useAllProgress()
  const { drills } = useDrills()
  const totalSections = TOPICS.reduce((s, t) => s + t.sections.length, 0)
  const doneSections = TOPICS.reduce(
    (s, t) => s + (read[t.id] ?? []).filter((id) => t.sections.some((x) => x.id === id)).length,
    0,
  )
  const gotIt = Object.values(drills).filter((v) => v === 'got-it').length
  const shaky = Object.values(drills).filter((v) => v === 'shaky').length
  return { totalSections, doneSections, gotIt, shaky, totalDrills: ALL_DRILLS.length }
}

/**
 * Where to send someone who clicks the primary CTA: the first topic that
 * still has unread sections, so the button is "continue" rather than
 * "start over" once any progress exists.
 */
function useResumePoint() {
  const read = useAllProgress()
  const started = TOPICS.some((t) => (read[t.id] ?? []).length > 0)
  const next =
    TOPICS.find((t) => (read[t.id] ?? []).length < t.sections.length) ?? TOPICS[TOPICS.length - 1]
  return { id: next.id, n: next.n, title: next.title, started }
}

export function HomePage() {
  const p = useOverallProgress()
  const read = useAllProgress()
  const resume = useResumePoint()
  const reduce = useReducedMotion()
  const pct = p.totalSections ? Math.round((p.doneSections / p.totalSections) * 100) : 0

  React.useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-20 sm:px-6">
      {/* hero */}
      <section className="py-12 sm:py-16 lg:py-20">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="eyebrow mb-5">Computer Vision · HHU · Summer 2026</div>
          <h1 className="max-w-[18ch] font-display text-[40px] leading-[1.03] tracking-tight text-balance sm:text-[58px] lg:text-[68px]">
            Recovering the 3D world from flat pictures.
          </h1>
          <p className="mt-6 max-w-[58ch] text-[18px] leading-relaxed text-muted-foreground">
            Thirteen topics, built the way the material actually connects — big idea first, then a
            worked exercise, then the one sentence worth memorising. Everything here is traced back
            to a specific lecture slide or exercise sheet.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="primary" size="lg" asChild>
              <a href={href(`/t/${resume.id}`)}>
                {resume.started ? 'Pick up where you left off' : 'Start at the beginning'}
                <ArrowRight />
              </a>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <a href={href('/drills')}>
                <Dumbbell /> Jump to the drills
              </a>
            </Button>
          </div>
          {resume.started ? (
            <p className="mt-3 font-mono text-[12px] text-muted-foreground">
              {pad2(resume.n)} · {resume.title}
            </p>
          ) : null}
        </motion.div>
      </section>

      {/* progress strip */}
      <section className="mb-14 grid gap-3 sm:grid-cols-3">
        {[
          {
            label: 'Sections read',
            value: `${p.doneSections} / ${p.totalSections}`,
            sub: `${pct}% of the atlas`,
            bar: pct,
          },
          {
            label: 'Drills marked “got it”',
            value: `${p.gotIt} / ${p.totalDrills}`,
            sub: p.shaky ? `${p.shaky} still shaky` : 'nothing flagged shaky',
            bar: p.totalDrills ? (p.gotIt / p.totalDrills) * 100 : 0,
          },
          {
            label: 'Estimated reading time',
            value: `${Math.round(TOTAL_MINUTES / 60)} h ${TOTAL_MINUTES % 60} m`,
            sub: 'first pass, without the drills',
            bar: null,
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.35 }}
            className="rounded-[16px] border border-hairline bg-card px-4 py-3.5"
          >
            <div className="eyebrow">{s.label}</div>
            <div className="mt-1 font-mono text-[22px] tabular-nums">{s.value}</div>
            <div className="mt-0.5 text-[12.5px] text-muted-foreground">{s.sub}</div>
            {s.bar !== null ? (
              <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-[var(--field-edge)]">
                <motion.div
                  className="h-full bg-foreground/60"
                  initial={{ width: 0 }}
                  animate={{ width: `${s.bar}%` }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            ) : null}
          </motion.div>
        ))}
      </section>

      {/* the pipeline */}
      <section className="mb-14">
        <div className="mb-1 flex items-baseline gap-3">
          <span className="eyebrow">01 /</span>
          <h2 className="font-display text-[26px] leading-tight sm:text-[32px]">
            The spine of the course
          </h2>
        </div>
        <p className="mt-3 mb-6 max-w-[62ch] text-[16px] leading-relaxed text-muted-foreground">
          Almost every lecture from week 5 onwards is one box in this chain. When you feel lost in a
          derivation, find the box it belongs to — the question it is answering is always &ldquo;how
          do I get to the next arrow?&rdquo;
        </p>
        <PipelineMap />
      </section>

      {/* topics */}
      <section>
        <div className="mb-1 flex items-baseline gap-3">
          <span className="eyebrow">02 /</span>
          <h2 className="font-display text-[26px] leading-tight sm:text-[32px]">Every topic</h2>
        </div>
        <p className="mt-3 mb-6 max-w-[62ch] text-[16px] leading-relaxed text-muted-foreground">
          In order, but each one stands on its own. If you only have an evening, the starred route
          is 02 → 04 → 06 → 08 → 09 → 11.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {TOPICS.map((t, i) => {
            const doneCount = (read[t.id] ?? []).filter((id) =>
              t.sections.some((s) => s.id === id),
            ).length
            const complete = doneCount >= t.sections.length && t.sections.length > 0
            return (
              <motion.a
                key={t.id}
                href={href(`/t/${t.id}`)}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.35 }}
                className={cn(
                  'group flex flex-col rounded-[18px] border bg-card p-4 transition-all duration-150',
                  'hover:-translate-y-0.5 hover:border-foreground/20',
                  complete ? 'border-tint-3/30' : 'border-hairline',
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'font-mono text-[11px] tabular-nums',
                      complete ? 'text-tint-3' : 'text-muted-foreground',
                    )}
                  >
                    {complete ? '✓ done' : pad2(t.n)}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                    <Clock className="size-2.5" />
                    {t.minutes}m
                  </span>
                </div>
                <h3 className="font-display text-[19px] leading-tight">{t.title}</h3>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-muted-foreground">
                  {t.kicker}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[var(--field-edge)]">
                    <div
                      className={cn('h-full', complete ? 'bg-tint-3' : 'bg-foreground/40')}
                      style={{
                        width: `${t.sections.length ? (doneCount / t.sections.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {doneCount}/{t.sections.length}
                  </span>
                </div>
              </motion.a>
            )
          })}
        </div>
      </section>

      {/* footer actions */}
      <section className="mt-14 flex flex-wrap items-center gap-3 border-t border-hairline pt-8">
        <Button variant="secondary" asChild>
          <a href={href('/sheet')}>
            <ScrollText /> Formula sheet
          </a>
        </Button>
        <Button variant="secondary" asChild>
          <a href={href('/drills')}>
            <Dumbbell /> {ALL_DRILLS.length} exam drills
          </a>
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (
              confirm('Clear all reading progress, drill marks and stars? This cannot be undone.')
            )
              resetProgress()
          }}
        >
          <RotateCcw /> Reset progress
        </Button>
        <p className="w-full pt-3 text-[13px] leading-relaxed text-muted-foreground">
          Progress is stored only in this browser. Nothing is uploaded anywhere.
        </p>
      </section>
    </div>
  )
}
