import * as React from 'react'
import { motion } from 'motion/react'
import { Shuffle } from 'lucide-react'
import { TOPICS } from '@/content'
import { Drill } from '@/components/learn/drill'
import type { DrillSpec } from '@/components/learn/drill'
import { Button } from '@/components/ui/button'
import { useDrills } from '@/lib/store'
import { cn, pad2 } from '@/lib/utils'

type Filter = 'all' | 'unmarked' | 'shaky'

export function DrillsPage() {
  const { drills: marks } = useDrills()
  const [filter, setFilter] = React.useState<Filter>('all')
  const [topicFilter, setTopicFilter] = React.useState<string>('all')
  const [shuffleKey, setShuffleKey] = React.useState(0)

  React.useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  const all = React.useMemo(() => TOPICS.flatMap((t) => t.drills.map((d) => ({ d, t }))), [])

  const list = React.useMemo(() => {
    let out = all
    if (topicFilter !== 'all') out = out.filter((x) => x.t.id === topicFilter)
    if (filter === 'unmarked') out = out.filter((x) => !marks[x.d.id])
    if (filter === 'shaky') out = out.filter((x) => marks[x.d.id] === 'shaky')
    if (shuffleKey > 0) {
      // A deterministic shuffle per key, so re-renders do not reorder mid-read.
      out = [...out].sort((a, b) => hash(a.d.id + shuffleKey) - hash(b.d.id + shuffleKey))
    }
    return out
  }, [all, filter, topicFilter, marks, shuffleKey])

  const gotIt = all.filter((x) => marks[x.d.id] === 'got-it').length
  const shaky = all.filter((x) => marks[x.d.id] === 'shaky').length

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-8">
        <div className="eyebrow mb-3">Exam drills</div>
        <h1 className="font-display text-[34px] leading-[1.08] tracking-tight sm:text-[44px]">
          Every question, in one place.
        </h1>
        <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-muted-foreground">
          {all.length} questions drawn from the nine exercise sheets and the math recap. Answer out
          loud, in full sentences, before you reveal anything — the exam wants a produced answer,
          not a recognised one.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex gap-1 rounded-[12px] border border-hairline bg-muted/50 p-1">
            {(
              [
                ['all', `All ${all.length}`],
                ['unmarked', `Unmarked ${all.length - gotIt - shaky}`],
                ['shaky', `Shaky ${shaky}`],
              ] as [Filter, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                aria-pressed={filter === k}
                className={cn(
                  'rounded-[8px] px-3 py-1.5 font-mono text-[11px] tracking-wide uppercase transition-colors duration-150',
                  filter === k
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="h-9 rounded-[10px] border border-[var(--field-edge)]/60 bg-[var(--field-surface)] px-3 font-mono text-[12px]"
          >
            <option value="all">Every topic</option>
            {TOPICS.filter((t) => t.drills.length).map((t) => (
              <option key={t.id} value={t.id}>
                {pad2(t.n)} · {t.title}
              </option>
            ))}
          </select>

          <Button size="sm" variant="secondary" onClick={() => setShuffleKey((k) => k + 1)}>
            <Shuffle /> Shuffle
          </Button>
        </div>
      </header>

      {list.length === 0 ? (
        <div className="rounded-[18px] border border-hairline bg-card px-6 py-12 text-center">
          <p className="text-[15px] text-muted-foreground">
            {filter === 'shaky'
              ? 'Nothing flagged shaky. That is either very good news or a sign you have not marked anything yet.'
              : 'Nothing left in this filter.'}
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {list.map(({ d, t }, i) => (
          <motion.div
            key={d.id + shuffleKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.25), duration: 0.3 }}
          >
            <DrillWithTopic spec={d} topic={t.title} n={t.n} index={i + 1} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function DrillWithTopic({
  spec,
  topic,
  n,
  index,
}: {
  spec: DrillSpec
  topic: string
  n: number
  index: number
}) {
  return (
    <div>
      <div className="mb-1.5 px-1 font-mono text-[10px] tracking-wider uppercase text-muted-foreground/70">
        {pad2(n)} · {topic}
      </div>
      <Drill spec={spec} index={index} />
    </div>
  )
}

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
