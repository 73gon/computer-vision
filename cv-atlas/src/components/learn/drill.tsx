import * as React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, CircleHelp, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useDrills } from '@/lib/store'

export type DrillSpec = {
  id: string
  topicId: string
  source: string
  /** "compute" questions want a number/short string; "explain" wants prose. */
  kind: 'compute' | 'explain' | 'choose'
  prompt: React.ReactNode
  /** For `choose`: the options; exactly one index is correct. */
  options?: string[]
  correct?: number
  /** The model answer — what a full-mark response contains. */
  answer: React.ReactNode
  /** Optional nudge before the answer. */
  hint?: React.ReactNode
}

export function Drill({ spec, index }: { spec: DrillSpec; index?: number }) {
  const { drills, set } = useDrills()
  const mark = drills[spec.id]
  const [revealed, setRevealed] = React.useState(false)
  const [hinted, setHinted] = React.useState(false)
  const [picked, setPicked] = React.useState<number | null>(null)
  const reduce = useReducedMotion()

  const isChoose = spec.kind === 'choose' && spec.options
  const showAnswer = revealed || (isChoose && picked !== null)

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[18px] border bg-card transition-colors duration-150',
        mark === 'got-it'
          ? 'border-tint-3/35'
          : mark === 'shaky'
            ? 'border-tint-2/35'
            : 'border-hairline',
      )}
    >
      <div className="px-5 py-4">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {index !== undefined ? (
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              Q{String(index).padStart(2, '0')}
            </span>
          ) : null}
          <span className="font-mono text-[11px] text-muted-foreground/70">{spec.source}</span>
          <span className="ml-auto rounded-full border border-hairline px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">
            {spec.kind}
          </span>
        </div>

        <div className="text-[15.5px] leading-relaxed">{spec.prompt}</div>

        {isChoose ? (
          <div className="mt-3.5 grid gap-2">
            {spec.options!.map((o, i) => {
              const chosen = picked === i
              const correct = spec.correct === i
              const decided = picked !== null
              return (
                <button
                  key={i}
                  disabled={decided}
                  onClick={() => setPicked(i)}
                  className={cn(
                    'flex items-start gap-3 rounded-[10px] border px-3.5 py-2.5 text-left text-[15px] leading-relaxed transition-colors duration-150',
                    !decided &&
                      'border-[var(--field-edge)]/60 bg-[var(--field-surface)] hover:bg-accent',
                    decided && correct && 'border-tint-3/50 bg-tint-3/10',
                    decided && chosen && !correct && 'border-tint-2/50 bg-tint-2/10',
                    decided && !chosen && !correct && 'border-hairline opacity-50',
                  )}
                >
                  <span className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="min-w-0 flex-1">{o}</span>
                  {decided && correct ? <Check className="mt-0.5 size-4 text-tint-3" /> : null}
                  {decided && chosen && !correct ? (
                    <X className="mt-0.5 size-4 text-tint-2" />
                  ) : null}
                </button>
              )
            })}
          </div>
        ) : null}

        {spec.hint && !showAnswer ? (
          hinted ? (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-[10px] border border-hairline bg-muted/50 px-3.5 py-2.5 text-[14.5px] leading-relaxed text-muted-foreground"
            >
              {spec.hint}
            </motion.div>
          ) : null
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!showAnswer ? (
            <>
              {spec.hint && !hinted ? (
                <Button variant="ghost" size="sm" onClick={() => setHinted(true)}>
                  <CircleHelp /> Nudge me
                </Button>
              ) : null}
              {!isChoose ? (
                <Button variant="secondary" size="sm" onClick={() => setRevealed(true)}>
                  Show model answer
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button
                variant={mark === 'got-it' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => set(spec.id, mark === 'got-it' ? null : 'got-it')}
              >
                <Check /> Got it
              </Button>
              <Button
                variant={mark === 'shaky' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => set(spec.id, mark === 'shaky' ? null : 'shaky')}
              >
                Still shaky
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRevealed(false)
                  setPicked(null)
                  setHinted(false)
                }}
              >
                <RotateCcw /> Reset
              </Button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {showAnswer ? (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-hairline bg-muted/30"
          >
            <div className="px-5 py-4">
              <div className="eyebrow mb-2">What a full-mark answer contains</div>
              <div className="text-[15.5px] leading-relaxed">{spec.answer}</div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
