import { useMemo } from 'react'
import katex from 'katex'
import { cn } from '@/lib/utils'

const MACROS = {
  '\\R': '\\mathbb{R}',
  '\\Z': '\\mathbb{Z}',
  '\\N': '\\mathbb{N}',
  '\\x': '\\mathbf{x}',
  '\\X': '\\mathbf{X}',
  '\\T': '^{\\mathsf{T}}',
  '\\skew': '[#1]_{\\times}',
  '\\norm': '\\left\\lVert #1 \\right\\rVert',
  '\\abs': '\\left\\lvert #1 \\right\\rvert',
  '\\argmin': '\\operatorname*{arg\\,min}',
  '\\argmax': '\\operatorname*{arg\\,max}',
}

function render(tex: string, display: boolean) {
  try {
    return katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: false,
      macros: MACROS,
      trust: false,
    })
  } catch {
    return `<code>${tex}</code>`
  }
}

/** Inline maths. Use inside a sentence. */
export function T({ children, className }: { children: string; className?: string }) {
  const html = useMemo(() => render(children, false), [children])
  return (
    <span
      className={cn('inline-block align-middle', className)}
      // KaTeX output, generated locally from literal strings in this repo.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/** A display equation on its own line. */
export function Tex({
  children,
  className,
  label,
}: {
  children: string
  className?: string
  label?: string
}) {
  const html = useMemo(() => render(children, true), [children])
  return (
    <div className={cn('my-3 flex items-center gap-3', className)}>
      <div
        className="min-w-0 flex-1 overflow-x-auto py-1"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {label ? <span className="eyebrow shrink-0 tabular-nums opacity-60">{label}</span> : null}
    </div>
  )
}
