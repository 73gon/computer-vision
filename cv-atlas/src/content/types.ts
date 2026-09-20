import type { ComponentType } from 'react'
import type { DrillSpec } from '@/components/learn/drill'

export type SectionMeta = { id: string; title: string }

export type TopicMeta = {
  id: string
  /** Display number in the atlas, 00 … 12. */
  n: number
  title: string
  /** One line, plain language, shown on the card. */
  kicker: string
  /** Where this comes from in the course. */
  lectures: string[]
  exercises: string[]
  minutes: number
  /** Which pipeline stage this topic serves, if any. */
  stage?: string
  sections: SectionMeta[]
  /** Formula-sheet rows contributed by this topic. */
  sheet: SheetRow[]
}

export type SheetRow = {
  name: string
  /** KaTeX source. */
  tex: string
  note?: string
}

export type Topic = TopicMeta & {
  Body: ComponentType
  drills: DrillSpec[]
}
