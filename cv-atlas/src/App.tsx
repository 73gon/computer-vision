import { motion, useReducedMotion } from 'motion/react'
import { Shell } from '@/components/layout/shell'
import { HomePage } from '@/pages/home'
import { TopicPage } from '@/pages/topic'
import { DrillsPage } from '@/pages/drills'
import { SheetPage } from '@/pages/sheet'
import { useRoute } from '@/lib/router'
import { useTheme } from '@/lib/store'

export default function App() {
  const route = useRoute()
  const reduce = useReducedMotion()
  useTheme() // applies the persisted theme class to <html>

  /**
   * The key remounts the page on navigation, so the entrance animation
   * replays. Deliberately no AnimatePresence: an exit animation there
   * gates the next page behind the previous one finishing, and a single
   * stalled exit would swallow every later navigation.
   */
  const key = route.name === 'topic' ? `topic:${route.id}` : route.name

  return (
    <Shell>
      <motion.div
        key={key}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        {route.name === 'home' ? <HomePage /> : null}
        {route.name === 'topic' ? <TopicPage id={route.id} section={route.section} /> : null}
        {route.name === 'drills' ? <DrillsPage /> : null}
        {route.name === 'sheet' ? <SheetPage /> : null}
      </motion.div>
    </Shell>
  )
}
