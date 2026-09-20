import * as React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, Clock, Dumbbell, Star } from 'lucide-react'
import { TOPICS, TOPIC_BY_ID } from '@/content'
import { SectionRail } from '@/components/layout/shell'
import { Drill } from '@/components/learn/drill'
import { PipelineMap } from '@/components/viz/pipeline'
import { Button } from '@/components/ui/button'
import { useRead, useStarred } from '@/lib/store'
import { href } from '@/lib/router'
import { cn, pad2 } from '@/lib/utils'

export function TopicPage({ id, section }: { id: string; section?: string }) {
  const topic = TOPIC_BY_ID.get(id)
  const { read, mark } = useRead(id)
  const { starred, toggle } = useStarred()
  const reduce = useReducedMotion()

  React.useEffect(() => {
    if (section) {
      // Wait for the body to render before jumping.
      const t = setTimeout(
        () => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' }),
        60,
      )
      return () => clearTimeout(t)
    }
    window.scrollTo({ top: 0 })
  }, [id, section])

  if (!topic) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-muted-foreground">No topic with that name.</p>
        <Button variant="secondary" className="mt-4" asChild>
          <a href={href('/')}>Back to the overview</a>
        </Button>
      </div>
    )
  }

  const idx = TOPICS.findIndex((t) => t.id === id)
  const prev = TOPICS[idx - 1]
  const next = TOPICS[idx + 1]
  const isStarred = starred.includes(id)
  const { Body } = topic

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:py-12">
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_200px]">
        <article className="min-w-0">
          {/* header */}
          <motion.header
            key={id}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="eyebrow tabular-nums">{pad2(topic.n)} /</span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <Clock className="size-3" /> ~{topic.minutes} min
              </span>
              <button
                onClick={() => toggle(id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-wider uppercase transition-colors duration-150',
                  isStarred
                    ? 'border-transparent bg-foreground/10 text-foreground'
                    : 'border-hairline text-muted-foreground hover:bg-accent',
                )}
              >
                <Star className={cn('size-3', isStarred && 'fill-current')} />
                {isStarred ? 'Starred' : 'Star'}
              </button>
            </div>

            <h1 className="font-display text-[34px] leading-[1.08] tracking-tight text-balance sm:text-[46px]">
              {topic.title}
            </h1>
            <p className="mt-4 max-w-[62ch] text-[17px] leading-relaxed text-muted-foreground">
              {topic.kicker}
            </p>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11px] text-muted-foreground">
              <span>
                <span className="opacity-60">lectures ·</span> {topic.lectures.join(', ')}
              </span>
              {topic.exercises.length ? (
                <span>
                  <span className="opacity-60">exercises ·</span> {topic.exercises.join(', ')}
                </span>
              ) : null}
            </div>
          </motion.header>

          {topic.stage ? (
            <div className="mb-10">
              <div className="eyebrow mb-2.5">Where you are in the pipeline</div>
              <PipelineMap active={topic.stage} compact />
            </div>
          ) : null}

          <div className="space-y-10">
            <Body />
          </div>

          {/* drills */}
          {topic.drills.length ? (
            <section id="drills" className="mt-14 scroll-mt-24 border-t border-hairline pt-10">
              <div className="mb-1 flex items-baseline gap-3">
                <span className="eyebrow tabular-nums">{pad2(topic.sections.length + 1)} /</span>
                <h2 className="flex items-center gap-2.5 font-display text-[24px] leading-tight sm:text-[30px]">
                  Try it yourself
                </h2>
              </div>
              <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-muted-foreground">
                Straight from the exercise sheets. Answer out loud before you reveal — recognising
                an answer is not the same as producing one, and the exam only rewards the second.
              </p>
              <div className="mt-6 space-y-4">
                {topic.drills.map((d, i) => (
                  <Drill key={d.id} spec={d} index={i + 1} />
                ))}
              </div>
              <div className="mt-6">
                <Button variant="ghost" size="sm" asChild>
                  <a href={href('/drills')}>
                    <Dumbbell /> All drills, every topic
                  </a>
                </Button>
              </div>
            </section>
          ) : null}

          {/* prev / next */}
          <nav className="mt-14 grid gap-3 border-t border-hairline pt-8 sm:grid-cols-2">
            {prev ? (
              <a
                href={href(`/t/${prev.id}`)}
                className="group rounded-[16px] border border-hairline px-4 py-3.5 transition-colors duration-150 hover:bg-accent"
              >
                <div className="eyebrow mb-1 flex items-center gap-1.5">
                  <ArrowLeft className="size-3" /> Previous
                </div>
                <div className="text-[15px] leading-snug">{prev.title}</div>
              </a>
            ) : (
              <div />
            )}
            {next ? (
              <a
                href={href(`/t/${next.id}`)}
                className="group rounded-[16px] border border-hairline px-4 py-3.5 text-right transition-colors duration-150 hover:bg-accent"
              >
                <div className="eyebrow mb-1 flex items-center justify-end gap-1.5">
                  Next <ArrowRight className="size-3" />
                </div>
                <div className="text-[15px] leading-snug">{next.title}</div>
              </a>
            ) : null}
          </nav>
        </article>

        <aside className="hidden xl:block">
          <SectionRail
            sections={[...topic.sections, { id: 'drills', title: 'Try it yourself' }]}
            read={read}
            onToggle={mark}
          />
        </aside>
      </div>
    </div>
  )
}
