import * as React from 'react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ *
 *  Shared bits for the interactive figures: a labelled slider, a
 *  segmented switch, and an SVG frame that inherits the theme colours.
 * ------------------------------------------------------------------ */

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  format,
  className,
  tint,
}: {
  label: React.ReactNode
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  unit?: string
  format?: (v: number) => string
  className?: string
  tint?: string
}) {
  const id = React.useId()
  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="font-mono text-[11px] tracking-wider uppercase text-muted-foreground"
        >
          {label}
        </label>
        <span
          className="font-mono text-[12px] tabular-nums"
          style={tint ? { color: tint } : undefined}
        >
          {format ? format(value) : value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ep-range w-full"
        style={tint ? ({ '--thumb': tint } as React.CSSProperties) : undefined}
      />
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label?: string
}) {
  return (
    <div className="min-w-0">
      {label ? (
        <div className="mb-1.5 font-mono text-[11px] tracking-wider uppercase text-muted-foreground">
          {label}
        </div>
      ) : null}
      <div className="inline-flex flex-wrap gap-1 rounded-[12px] border border-hairline bg-muted/50 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={cn(
              'rounded-[8px] px-2.5 py-1.5 font-mono text-[11px] tracking-wide uppercase transition-colors duration-150',
              value === o.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Controls({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  return (
    <div
      className={cn(
        'mt-4 grid gap-x-6 gap-y-4 border-t border-hairline pt-4',
        cols === 1 && 'sm:grid-cols-1',
        cols === 2 && 'sm:grid-cols-2',
        cols === 3 && 'sm:grid-cols-3',
      )}
    >
      {children}
    </div>
  )
}

export function Readout({
  items,
}: {
  items: { label: React.ReactNode; value: React.ReactNode; tint?: string }[]
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-hairline pt-3.5">
      {items.map((it, i) => (
        <div key={i} className="min-w-0">
          <div className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">
            {it.label}
          </div>
          <div
            className="font-mono text-[15px] tabular-nums"
            style={it.tint ? { color: it.tint } : undefined}
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Theme-aware SVG canvas. Children draw in the given viewBox units. */
export function Canvas({
  w,
  h,
  children,
  className,
  ...rest
}: {
  w: number
  h: number
  children: React.ReactNode
  className?: string
} & Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height' | 'viewBox'>) {
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn('block w-full', className)}
      style={{ maxHeight: `${h * 1.2}px` }}
      role="img"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const INK = 'currentColor'

export function Grid({
  w,
  h,
  step = 20,
  opacity = 0.09,
}: {
  w: number
  h: number
  step?: number
  opacity?: number
}) {
  const lines: React.ReactNode[] = []
  for (let x = 0; x <= w; x += step) lines.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={h} />)
  for (let y = 0; y <= h; y += step)
    lines.push(<line key={`h${y}`} x1={0} y1={y} x2={w} y2={h === y ? y : y} />)
  return (
    <g stroke="currentColor" strokeWidth={0.5} opacity={opacity}>
      {lines}
    </g>
  )
}

/** A small caption drawn inside an SVG. */
export function Tag({
  x,
  y,
  children,
  anchor = 'start',
  tint,
  size = 10,
}: {
  x: number
  y: number
  children: React.ReactNode
  anchor?: 'start' | 'middle' | 'end'
  tint?: string
  size?: number
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={size}
      fontFamily="var(--font-mono)"
      fill={tint ?? 'currentColor'}
      opacity={tint ? 1 : 0.65}
    >
      {children}
    </text>
  )
}

export const TINT = {
  one: 'var(--tint-1)',
  two: 'var(--tint-2)',
  three: 'var(--tint-3)',
  four: 'var(--tint-4)',
} as const
