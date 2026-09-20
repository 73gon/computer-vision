import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Controls, Readout, Slider, TINT } from './kit'
import { cn, round } from '@/lib/utils'

/* ================================================================== *
 *  Disparity Space Image — Exercise sheet 7, Exercise 1.
 *  Rows are right-image positions j, columns are left positions i,
 *  d = i − j, and only 0 ≤ d ≤ 2 is admissible.
 * ================================================================== */

const MATCHES: [number, number][] = [
  [1, 1],
  [2, 1],
  [3, 2],
  [4, 3],
  [5, 3],
  [6, 4],
]

export function DSIGrid() {
  const [dmax, setDmax] = React.useState(2)
  const [showMatches, setShowMatches] = React.useState(true)
  const N = 6

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="border-collapse font-mono text-[12px] tabular-nums">
          <thead>
            <tr>
              <th className="px-2 py-1 text-right font-normal text-muted-foreground">j \ i</th>
              {Array.from({ length: N }, (_, k) => (
                <th
                  key={k}
                  className="w-11 px-1 py-1 text-center font-normal"
                  style={{ color: TINT.one }}
                >
                  {k + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: N }, (_, r) => {
              const j = r + 1
              return (
                <tr key={j}>
                  <th className="px-2 py-1 text-right font-normal" style={{ color: TINT.two }}>
                    {j}
                  </th>
                  {Array.from({ length: N }, (_, c) => {
                    const i = c + 1
                    const d = i - j
                    const tooLow = d < 0
                    const tooHigh = d > dmax
                    const invalid = tooLow || tooHigh
                    const isMatch = showMatches && MATCHES.some(([mi, mj]) => mi === i && mj === j)
                    return (
                      <td key={i} className="p-0.5">
                        <motion.div
                          layout
                          className={cn(
                            'flex h-10 w-11 flex-col items-center justify-center rounded-[6px] border text-[11px]',
                            invalid
                              ? 'border-transparent bg-[color-mix(in_oklab,var(--tint-2)_16%,transparent)] text-muted-foreground/45'
                              : 'border-hairline bg-[var(--field-surface)]',
                            isMatch && 'border-transparent',
                          )}
                          style={
                            isMatch
                              ? {
                                  background: 'color-mix(in oklab, var(--tint-3) 26%, transparent)',
                                  borderColor: 'var(--tint-3)',
                                }
                              : undefined
                          }
                          title={
                            invalid
                              ? tooLow
                                ? `d = ${d} < 0 — the match would be behind the camera`
                                : `d = ${d} > ${dmax} — outside the disparity range`
                              : `d = ${d}`
                          }
                        >
                          <span className={invalid ? '' : 'text-foreground'}>
                            {invalid ? '×' : `d=${d}`}
                          </span>
                          {isMatch ? (
                            <span className="text-[9px]" style={{ color: TINT.three }}>
                              match
                            </span>
                          ) : null}
                        </motion.div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Controls cols={2}>
        <Slider label="max disparity" value={dmax} onChange={setDmax} min={0} max={5} />
        <div className="flex items-end">
          <Button
            size="sm"
            variant={showMatches ? 'primary' : 'secondary'}
            onClick={() => setShowMatches((s) => !s)}
          >
            {showMatches ? 'Hide' : 'Show'} the six given matches
          </Button>
        </div>
      </Controls>

      <Readout
        items={[
          { label: 'Columns i', value: 'left-image pixel', tint: TINT.one },
          { label: 'Rows j', value: 'right-image pixel', tint: TINT.two },
          { label: 'Admissible band', value: `0 ≤ i − j ≤ ${dmax}` },
        ]}
      />

      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
        Everything outside the diagonal band is struck out before any matching happens — that is the
        disparity range doing its work. Notice that the six given matches form a staircase that only
        ever moves right or down-right: it never doubles back. That is the ordering constraint, and
        it is the reason the whole scanline can be solved as a shortest path.
      </p>
    </div>
  )
}

/* ================================================================== *
 *  Dynamic programming — Exercise sheet 7, Exercise 2.
 *  D(i,j) = C(i,j) + min(D(i−1,j), D(i,j−1), D(i−1,j−1))
 * ================================================================== */

const COST = [
  [1, 4, 6, 8],
  [3, 2, 5, 7],
  [6, 3, 2, 4],
  [9, 6, 3, 1],
]

function solveDP(C: number[][]) {
  const n = C.length
  const m = C[0].length
  const D: number[][] = Array.from({ length: n }, () => Array(m).fill(0))
  const from: (string | null)[][] = Array.from({ length: n }, () => Array(m).fill(null))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (i === 0 && j === 0) {
        D[i][j] = C[i][j]
        continue
      }
      const cand: { v: number; k: string }[] = []
      if (i > 0 && j > 0) cand.push({ v: D[i - 1][j - 1], k: 'diag' })
      if (i > 0) cand.push({ v: D[i - 1][j], k: 'down' })
      if (j > 0) cand.push({ v: D[i][j - 1], k: 'right' })
      cand.sort((a, b) => a.v - b.v)
      D[i][j] = C[i][j] + cand[0].v
      from[i][j] = cand[0].k
    }
  }
  // Backtrack from the bottom-right.
  const path: [number, number][] = []
  let i = n - 1
  let j = m - 1
  path.push([i, j])
  while (i !== 0 || j !== 0) {
    const k = from[i][j]
    if (k === 'diag') {
      i--
      j--
    } else if (k === 'down') i--
    else j--
    path.push([i, j])
  }
  path.reverse()
  return { D, path, total: D[n - 1][m - 1] }
}

export function DPTable() {
  const { D, path, total } = React.useMemo(() => solveDP(COST), [])
  const n = COST.length
  const m = COST[0].length
  const [step, setStep] = React.useState(0) // 0..n*m, then path
  const [playing, setPlaying] = React.useState(false)
  const filled = step

  React.useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      setStep((s) => {
        if (s >= n * m) {
          setPlaying(false)
          return n * m
        }
        return s + 1
      })
    }, 380)
    return () => clearInterval(t)
  }, [playing, n, m])

  const done = filled >= n * m
  const inPath = (i: number, j: number) => done && path.some(([a, b]) => a === i && b === j)
  const cur = filled < n * m ? { i: Math.floor(filled / m), j: filled % m } : null

  return (
    <div>
      <div className="flex flex-wrap items-start gap-8">
        <div>
          <div className="eyebrow mb-2">cost matrix C</div>
          <table className="border-collapse font-mono text-[13px] tabular-nums">
            <tbody>
              {COST.map((row, i) => (
                <tr key={i}>
                  {row.map((v, j) => (
                    <td key={j} className="p-0.5">
                      <div
                        className={cn(
                          'flex size-11 items-center justify-center rounded-[6px] border border-hairline',
                          cur && cur.i === i && cur.j === j
                            ? 'bg-[color-mix(in_oklab,var(--tint-3)_26%,transparent)]'
                            : 'bg-[var(--field-surface)]',
                        )}
                      >
                        {v}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className="eyebrow mb-2">accumulated D</div>
          <table className="border-collapse font-mono text-[13px] tabular-nums">
            <tbody>
              {D.map((row, i) => (
                <tr key={i}>
                  {row.map((v, j) => {
                    const shown = i * m + j < filled
                    const active = cur && cur.i === i && cur.j === j
                    return (
                      <td key={j} className="p-0.5">
                        <motion.div
                          animate={{
                            scale: active ? 1.08 : 1,
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 22,
                          }}
                          className={cn(
                            'flex size-11 items-center justify-center rounded-[6px] border',
                            shown ? 'border-hairline' : 'border-dashed border-hairline',
                            inPath(i, j) ? 'border-transparent font-semibold' : '',
                          )}
                          style={
                            inPath(i, j)
                              ? {
                                  background: 'color-mix(in oklab, var(--tint-3) 24%, transparent)',
                                  borderColor: 'var(--tint-3)',
                                }
                              : shown
                                ? { background: 'var(--field-surface)' }
                                : undefined
                          }
                        >
                          <AnimatePresence mode="wait">
                            {shown ? (
                              <motion.span
                                key="v"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.18 }}
                              >
                                {v}
                              </motion.span>
                            ) : (
                              <span className="text-muted-foreground/30">·</span>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={playing ? 'secondary' : 'primary'}
          onClick={() => {
            if (done) setStep(0)
            setPlaying((p) => !p)
          }}
        >
          {playing ? <Pause /> : <Play />}
          {playing ? 'Pause' : done ? 'Replay the fill' : 'Fill the table'}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setPlaying(false)
            setStep((s) => Math.min(n * m, s + 1))
          }}
        >
          Step
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setPlaying(false)
            setStep(0)
          }}
        >
          <RotateCcw />
        </Button>
      </div>

      {cur ? (
        <p className="mt-3 font-mono text-[13px] text-muted-foreground">
          D({cur.i + 1},{cur.j + 1}) = C({cur.i + 1},{cur.j + 1}) + min(reachable predecessors) ={' '}
          {COST[cur.i][cur.j]} + {D[cur.i][cur.j] - COST[cur.i][cur.j]} ={' '}
          <span className="text-foreground">{D[cur.i][cur.j]}</span>
        </p>
      ) : null}

      {done ? (
        <Readout
          items={[
            { label: 'Minimum path cost', value: total, tint: TINT.three },
            {
              label: 'One optimal path',
              value: path.map(([i, j]) => `(${i + 1},${j + 1})`).join(' → '),
            },
            { label: 'All moves', value: 'diagonal — every step is a match' },
          ]}
        />
      ) : null}
    </div>
  )
}

/* ================================================================== *
 *  The 4-pixel MRF from Exercise sheet 7, Exercise 3, with λ live.
 *  Data costs are exactly the sheet's table.
 * ================================================================== */

const DATA = [
  [0, 2, 4],
  [1, 0, 3],
  [3, 0, 1],
  [4, 2, 0],
]

function energy(D: number[], lambda: number) {
  const data = D.reduce((s, d, i) => s + DATA[i][d], 0)
  const smooth = D.slice(0, 3).reduce((s, d, i) => s + (d === D[i + 1] ? 0 : 1), 0)
  return { data, smooth, total: data + lambda * smooth }
}

function bestAssignments(lambda: number) {
  let best = Infinity
  let winners: number[][] = []
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++)
      for (let c = 0; c < 3; c++)
        for (let d = 0; d < 3; d++) {
          const E = energy([a, b, c, d], lambda).total
          if (E < best - 1e-9) {
            best = E
            winners = [[a, b, c, d]]
          } else if (Math.abs(E - best) < 1e-9) winners.push([a, b, c, d])
        }
  return { best, winners }
}

export function MRFLab() {
  const [D, setD] = React.useState<number[]>([0, 1, 1, 2])
  const [lambda, setLambda] = React.useState(2)

  const e = energy(D, lambda)
  const opt = React.useMemo(() => bestAssignments(lambda), [lambda])
  const isOptimal = opt.winners.some((w) => w.every((v, i) => v === D[i]))

  const presets: { label: string; D: number[] }[] = [
    { label: 'Data-driven (0,1,1,2)', D: [0, 1, 1, 2] },
    { label: 'Constant (1,1,1,1)', D: [1, 1, 1, 1] },
  ]

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        <div>
          <div className="eyebrow mb-2">choose a disparity for each pixel</div>
          <div className="flex flex-wrap gap-3">
            {D.map((d, i) => (
              <div key={i} className="rounded-[12px] border border-hairline bg-card p-2.5">
                <div className="mb-1.5 text-center font-mono text-[11px] text-muted-foreground">
                  d{i + 1}
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map((v) => (
                    <button
                      key={v}
                      onClick={() => setD((cur) => cur.map((x, k) => (k === i ? v : x)))}
                      aria-pressed={d === v}
                      className={cn(
                        'flex size-9 flex-col items-center justify-center rounded-[7px] border font-mono text-[12px] transition-colors duration-150',
                        d === v
                          ? 'border-transparent bg-primary text-primary-foreground'
                          : 'border-hairline text-muted-foreground hover:bg-accent',
                      )}
                      title={`data cost ${DATA[i][v]}`}
                    >
                      {v}
                      <span className="text-[9px] opacity-60">{DATA[i][v]}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {presets.map((p) => (
              <Button key={p.label} size="sm" variant="secondary" onClick={() => setD(p.D)}>
                {p.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setD(opt.winners[0])}>
              Jump to an optimum
            </Button>
          </div>
        </div>

        <div className="min-w-[190px] rounded-[14px] border border-hairline bg-[var(--field-surface)] p-4">
          <div className="eyebrow mb-2">energy</div>
          <dl className="space-y-1.5 font-mono text-[13px] tabular-nums">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Σ ψ_data</dt>
              <dd>{e.data}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Σ ψ_smooth</dt>
              <dd>{e.smooth}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">λ · smooth</dt>
              <dd>{round(lambda * e.smooth, 2)}</dd>
            </div>
            <div className="mt-2 flex justify-between gap-4 border-t border-hairline pt-2 text-[16px]">
              <dt>E(D)</dt>
              <dd style={{ color: isOptimal ? TINT.three : undefined }}>{round(e.total, 2)}</dd>
            </div>
          </dl>
          <div
            className="mt-2 font-mono text-[11px]"
            style={{
              color: isOptimal ? TINT.three : 'var(--muted-foreground)',
            }}
          >
            {isOptimal ? 'this is a global optimum' : `optimum is ${round(opt.best, 2)}`}
          </div>
        </div>
      </div>

      <Controls cols={1}>
        <Slider
          label="λ (smoothness weight)"
          value={lambda}
          onChange={setLambda}
          min={0}
          max={6}
          step={0.1}
          tint={TINT.two}
        />
      </Controls>

      <div className="mt-3 rounded-[12px] border border-hairline bg-muted/40 px-4 py-3 text-[14.5px] leading-relaxed">
        <span className="eyebrow mr-2">Watch the crossover</span>
        <p className="mt-1.5 text-muted-foreground">
          At λ &lt; 2 the data-driven labelling (0,1,1,2) wins outright — it pays nothing in data
          cost. At λ &gt; 2 the constant labelling (1,1,1,1) wins — it pays nothing in smoothness.
          At exactly λ = 2, which is the value the exercise gives you, both cost 4 and{' '}
          <em>neither is preferred</em>. The sheet is showing you the tipping point on purpose.
        </p>
      </div>
    </div>
  )
}
