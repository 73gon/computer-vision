import * as React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { href } from '@/lib/router'

/* ================================================================== *
 *  The 3D reconstruction pipeline — the spine the whole course hangs
 *  off. It appears on the home page and at the top of every geometry
 *  topic, with the current stage lit.
 * ================================================================== */

export type Stage = {
  id: string
  label: string
  sub: string
  topic: string
}

export const STAGES: Stage[] = [
  {
    id: 'images',
    label: 'Input images',
    sub: 'pixels, sampling, filtering',
    topic: 'images',
  },
  {
    id: 'poses',
    label: 'Camera poses',
    sub: 'features → F/E → SfM',
    topic: 'epipolar',
  },
  {
    id: 'corr',
    label: 'Dense correspondences',
    sub: 'rectify, then match every pixel',
    topic: 'stereo',
  },
  {
    id: 'depth',
    label: 'Depth maps',
    sub: 'disparity → depth',
    topic: 'global-stereo',
  },
  {
    id: 'fusion',
    label: 'Depth-map fusion',
    sub: 'register + merge views',
    topic: 'surfaces',
  },
  {
    id: 'model',
    label: '3D model',
    sub: 'implicit field → mesh',
    topic: 'surfaces',
  },
]

export function PipelineMap({ active, compact }: { active?: string; compact?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <ol className="flex min-w-max items-stretch gap-1 px-1">
        {STAGES.map((s, i) => {
          const on = active === s.id
          return (
            <React.Fragment key={s.id}>
              {i > 0 ? (
                <li aria-hidden className="flex items-center px-0.5 text-muted-foreground/40">
                  <ArrowRight className="size-3.5" />
                </li>
              ) : null}
              <li>
                <motion.a
                  href={href(`/t/${s.topic}`)}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={cn(
                    'flex h-full flex-col justify-center rounded-[12px] border px-3 py-2.5 transition-colors duration-150',
                    compact ? 'min-w-[120px]' : 'min-w-[140px]',
                    on
                      ? 'border-foreground/30 bg-foreground/[0.06]'
                      : 'border-hairline hover:bg-accent',
                  )}
                >
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 text-[13.5px] leading-snug font-medium',
                      on ? '' : 'text-foreground/85',
                    )}
                  >
                    {s.label}
                  </span>
                  {!compact ? (
                    <span className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                      {s.sub}
                    </span>
                  ) : null}
                </motion.a>
              </li>
            </React.Fragment>
          )
        })}
      </ol>
    </div>
  )
}
