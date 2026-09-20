import * as React from 'react'
import { Canvas, Controls, Readout, Segmented, Slider, Tag, TINT } from './kit'
import { cn, round } from '@/lib/utils'

/* ================================================================== *
 *  Nearest neighbour vs a linear boundary, on the exercise's own data.
 * ================================================================== */

const TRAIN: { p: [number, number]; c: 'cat' | 'dog' | 'toaster' }[] = [
  { p: [1, 1], c: 'cat' },
  { p: [2, 1], c: 'cat' },
  { p: [5, 4], c: 'dog' },
  { p: [6, 5], c: 'dog' },
  { p: [1, 5], c: 'toaster' },
]

const CLASS_TINT: Record<string, string> = {
  cat: TINT.one,
  dog: TINT.two,
  toaster: TINT.four,
}

export function NearestNeighbourLab() {
  const [tx, setTx] = React.useState(3)
  const [ty, setTy] = React.useState(2)
  const [showCells, setShowCells] = React.useState(true)

  const dists = TRAIN.map((t) => ({ ...t, d: Math.hypot(tx - t.p[0], ty - t.p[1]) }))
  const nearest = dists.reduce((a, b) => (b.d < a.d ? b : a))

  const W = 320
  const H = 260
  const pad = 30
  const sx = (x: number) => pad + (x / 7) * (W - pad * 2)
  const sy = (y: number) => H - pad - (y / 6) * (H - pad * 2)

  // A coarse Voronoi raster makes "memorise everything" tangible.
  const cells = React.useMemo(() => {
    if (!showCells) return []
    const out: { x: number; y: number; c: string }[] = []
    const step = 0.2
    for (let x = 0; x <= 7; x += step)
      for (let y = 0; y <= 6; y += step) {
        let best = TRAIN[0]
        let bd = Infinity
        for (const t of TRAIN) {
          const d = (x - t.p[0]) ** 2 + (y - t.p[1]) ** 2
          if (d < bd) {
            bd = d
            best = t
          }
        }
        out.push({ x, y, c: best.c })
      }
    return out
  }, [showCells])

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
        <Canvas w={W} h={H} aria-label="Nearest-neighbour decision regions in a 2D feature space">
          {cells.map((c, i) => (
            <rect
              key={i}
              x={sx(c.x) - 4.5}
              y={sy(c.y) - 4.5}
              width={9}
              height={9}
              fill={CLASS_TINT[c.c]}
              opacity={0.1}
            />
          ))}
          <line
            x1={pad}
            y1={H - pad}
            x2={W - pad}
            y2={H - pad}
            stroke="currentColor"
            opacity={0.2}
          />
          <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="currentColor" opacity={0.2} />

          {/* distance spokes */}
          {dists.map((t, i) => (
            <line
              key={i}
              className="ep-anim"
              x1={sx(tx)}
              y1={sy(ty)}
              x2={sx(t.p[0])}
              y2={sy(t.p[1])}
              stroke={t === nearest ? TINT.three : 'currentColor'}
              strokeOpacity={t === nearest ? 0.9 : 0.2}
              strokeWidth={t === nearest ? 2 : 1}
              strokeDasharray={t === nearest ? undefined : '2 3'}
            />
          ))}

          {TRAIN.map((t, i) => (
            <g key={i}>
              <circle cx={sx(t.p[0])} cy={sy(t.p[1])} r={6} fill={CLASS_TINT[t.c]} />
              <Tag x={sx(t.p[0]) + 9} y={sy(t.p[1]) + 4} tint={CLASS_TINT[t.c]}>
                {t.c}
              </Tag>
            </g>
          ))}

          <g className="ep-anim" transform={`translate(${sx(tx)}, ${sy(ty)})`}>
            <rect
              x={-6}
              y={-6}
              width={12}
              height={12}
              fill="var(--background)"
              stroke="currentColor"
              strokeWidth={2}
            />
          </g>
          <Tag x={pad} y={16}>
            feature space
          </Tag>
        </Canvas>

        <div className="min-w-0">
          <div className="eyebrow mb-2">distances from the test point</div>
          <table className="w-full font-mono text-[13px] tabular-nums">
            <tbody>
              {dists.map((t, i) => (
                <tr key={i} className={t === nearest ? '' : 'opacity-60'}>
                  <td className="py-1 pr-3">
                    ({t.p[0]}, {t.p[1]})
                  </td>
                  <td className="py-1 pr-3" style={{ color: CLASS_TINT[t.c] }}>
                    {t.c}
                  </td>
                  <td
                    className="py-1 text-right"
                    style={{ color: t === nearest ? TINT.three : undefined }}
                  >
                    {round(t.d, 4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 rounded-[10px] border border-hairline bg-[var(--field-surface)] px-3 py-2 text-[14px]">
            Predicted:{' '}
            <span className="font-mono" style={{ color: CLASS_TINT[nearest.c] }}>
              {nearest.c}
            </span>
          </div>
        </div>
      </div>

      <Controls cols={3}>
        <Slider label="test x₁" value={tx} onChange={setTx} min={0} max={7} step={0.1} />
        <Slider label="test x₂" value={ty} onChange={setTy} min={0} max={6} step={0.1} />
        <div className="flex items-end">
          <Segmented
            value={showCells ? 'on' : 'off'}
            onChange={(v) => setShowCells(v === 'on')}
            options={[
              { value: 'on', label: 'Show regions' },
              { value: 'off', label: 'Hide' },
            ]}
          />
        </div>
      </Controls>

      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
        The decision boundary is whatever the data happens to carve out — jagged, and defined by
        every single stored example. Nothing is learned at training time; all the work (and all the
        memory) lands at test time. That is precisely the wrong way round for a deployed system.
      </p>
    </div>
  )
}

/* ================================================================== *
 *  Linear classifier on the exercise's W, b, x — plus the two losses.
 * ================================================================== */

export function LinearClassifierLab() {
  const [x1, setX1] = React.useState(2)
  const [x2, setX2] = React.useState(1)
  const [trueClass, setTrueClass] = React.useState(0)

  const W = [
    [1, 0],
    [0, 2],
    [-1, 1],
  ]
  const b = [0, -1, 2]
  const names = ['cat', 'dog', 'toaster']
  const s = W.map((row, i) => row[0] * x1 + row[1] * x2 + b[i])
  const pred = s.indexOf(Math.max(...s))

  // Softmax (numerically stable) and the multiclass SVM hinge.
  const m = Math.max(...s)
  const exps = s.map((v) => Math.exp(v - m))
  const Z = exps.reduce((a, c) => a + c, 0)
  const probs = exps.map((e) => e / Z)
  const softmaxLoss = -Math.log(probs[trueClass])
  const svmLoss = s.reduce(
    (acc, sj, j) => (j === trueClass ? acc : acc + Math.max(0, sj - s[trueClass] + 1)),
    0,
  )

  const smax = Math.max(...s.map(Math.abs), 1)

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        <div>
          <div className="eyebrow mb-3">class scores s = Wx + b</div>
          <div className="space-y-2.5">
            {s.map((v, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-16 shrink-0 font-mono text-[12px]"
                  style={{ color: CLASS_TINT[names[i]] }}
                >
                  {names[i]}
                </div>
                <div className="relative h-7 min-w-0 flex-1 rounded-[6px] bg-[var(--field-surface)]">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--field-edge)]" />
                  <div
                    className="absolute inset-y-1 rounded-[4px] transition-all duration-200"
                    style={{
                      left: v >= 0 ? '50%' : `${50 - (Math.abs(v) / smax) * 48}%`,
                      width: `${(Math.abs(v) / smax) * 48}%`,
                      background: CLASS_TINT[names[i]],
                      opacity: i === pred ? 1 : 0.4,
                    }}
                  />
                </div>
                <div className="w-14 shrink-0 text-right font-mono text-[13px] tabular-nums">
                  {round(v, 2)}
                </div>
                <div className="w-16 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                  {round(probs[i] * 100, 1)}%
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[10px] border border-hairline bg-[var(--field-surface)] px-3.5 py-2.5 text-[14px]">
            Predicted:{' '}
            <span className="font-mono" style={{ color: CLASS_TINT[names[pred]] }}>
              {names[pred]}
            </span>
            {s.filter((v) => v === s[pred]).length > 1 ? (
              <span className="ml-2 text-[12px] text-muted-foreground">(tie on the runner-up)</span>
            ) : null}
          </div>
        </div>

        <div className="min-w-[180px] rounded-[14px] border border-hairline bg-[var(--field-surface)] p-4">
          <div className="eyebrow mb-2">loss, if the truth is</div>
          <Segmented
            value={String(trueClass)}
            onChange={(v) => setTrueClass(Number(v))}
            options={names.map((n, i) => ({ value: String(i), label: n }))}
          />
          <dl className="mt-3 space-y-1.5 font-mono text-[13px] tabular-nums">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">SVM hinge</dt>
              <dd style={{ color: svmLoss === 0 ? TINT.three : undefined }}>{round(svmLoss, 3)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Softmax</dt>
              <dd>{round(softmaxLoss, 3)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <Controls cols={2}>
        <Slider label="x₁" value={x1} onChange={setX1} min={-3} max={5} step={0.25} />
        <Slider label="x₂" value={x2} onChange={setX2} min={-3} max={5} step={0.25} />
      </Controls>

      <div className="mt-4 overflow-x-auto rounded-[10px] border border-hairline bg-[var(--field-surface)] p-3 font-mono text-[12px] tabular-nums">
        <span className="text-muted-foreground">W =</span> [[1, 0], [0, 2], [−1, 1]]{'   '}
        <span className="text-muted-foreground">b =</span> (0, −1, 2)ᵀ{'   '}
        <span className="text-muted-foreground">x =</span> ({x1}, {x2})ᵀ
      </div>

      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
        The hinge loss hits exactly zero as soon as the correct class leads by a margin of 1 — it
        then stops caring. The softmax loss never quite reaches zero; it always wants a little more
        confidence. That difference is the whole of &ldquo;max-margin vs probabilistic&rdquo;.
      </p>
    </div>
  )
}

/* ================================================================== *
 *  IoU — drag the prediction box against the ground truth.
 * ================================================================== */

export function IoULab() {
  const [px, setPx] = React.useState(120)
  const [py, setPy] = React.useState(60)
  const [pw, setPw] = React.useState(110)
  const [ph, setPh] = React.useState(80)

  const gt = { x: 100, y: 50, w: 120, h: 90 }
  const ix = Math.max(gt.x, px)
  const iy = Math.max(gt.y, py)
  const ax = Math.min(gt.x + gt.w, px + pw)
  const ay = Math.min(gt.y + gt.h, py + ph)
  const iw = Math.max(0, ax - ix)
  const ih = Math.max(0, ay - iy)
  const inter = iw * ih
  const union = gt.w * gt.h + pw * ph - inter
  const iou = union > 0 ? inter / union : 0
  const hit = iou > 0.5

  const W = 360
  const H = 210

  return (
    <div>
      <Canvas
        w={W}
        h={H}
        aria-label="Intersection over union between a predicted and a ground-truth box"
      >
        <rect x={0} y={0} width={W} height={H} fill="currentColor" fillOpacity={0.04} rx={6} />
        <rect
          x={gt.x}
          y={gt.y}
          width={gt.w}
          height={gt.h}
          fill="none"
          stroke={TINT.three}
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <Tag x={gt.x} y={gt.y - 6} tint={TINT.three}>
          ground truth
        </Tag>

        {inter > 0 ? (
          <rect
            className="ep-anim"
            x={ix}
            y={iy}
            width={iw}
            height={ih}
            fill={hit ? TINT.three : TINT.two}
            opacity={0.25}
          />
        ) : null}

        <rect
          className="ep-anim"
          x={px}
          y={py}
          width={pw}
          height={ph}
          fill="none"
          stroke={TINT.one}
          strokeWidth={2}
        />
        <g className="ep-anim" transform={`translate(${px}, ${py})`}>
          <Tag x={0} y={-6} tint={TINT.one}>
            prediction
          </Tag>
        </g>

        <g transform={`translate(${W - 96}, 20)`}>
          <Tag x={0} y={0}>
            IoU
          </Tag>
          <text
            x={0}
            y={26}
            fontSize={24}
            fontFamily="var(--font-mono)"
            fill={hit ? TINT.three : TINT.two}
          >
            {round(iou, 3)}
          </text>
          <Tag x={0} y={46} tint={hit ? TINT.three : TINT.two}>
            {hit ? 'counts as a hit' : 'below 0.5 — a miss'}
          </Tag>
        </g>
      </Canvas>

      <Controls cols={2}>
        <Slider label="box x" value={px} onChange={setPx} min={20} max={260} />
        <Slider label="box y" value={py} onChange={setPy} min={10} max={150} />
        <Slider label="box width" value={pw} onChange={setPw} min={30} max={200} />
        <Slider label="box height" value={ph} onChange={setPh} min={30} max={150} />
      </Controls>

      <Readout
        items={[
          { label: 'Intersection', value: inter },
          { label: 'Union', value: union },
          { label: 'IoU', value: round(iou, 4), tint: hit ? TINT.three : TINT.two },
        ]}
      />
    </div>
  )
}

/* ================================================================== *
 *  Precision / recall as the detector threshold moves.
 * ================================================================== */

/** A fixed, plausible ranked detection list: score + whether it is a true positive. */
const DETS = [
  { s: 0.97, tp: true },
  { s: 0.93, tp: true },
  { s: 0.88, tp: false },
  { s: 0.83, tp: true },
  { s: 0.79, tp: true },
  { s: 0.71, tp: false },
  { s: 0.66, tp: true },
  { s: 0.58, tp: false },
  { s: 0.52, tp: false },
  { s: 0.44, tp: true },
  { s: 0.36, tp: false },
  { s: 0.22, tp: false },
]
const N_GT = 7

export function PrecisionRecallLab() {
  const [thr, setThr] = React.useState(0.6)
  const kept = DETS.filter((d) => d.s >= thr)
  const tp = kept.filter((d) => d.tp).length
  const precision = kept.length ? tp / kept.length : 1
  const recall = tp / N_GT

  const curve = React.useMemo(() => {
    let seen = 0
    let hits = 0
    return DETS.map((d) => {
      seen++
      if (d.tp) hits++
      return { p: hits / seen, r: hits / N_GT }
    })
  }, [])

  const W = 400
  const H = 200
  const pad = 36
  const sx = (r: number) => pad + r * (W - pad - 16)
  const sy = (p: number) => H - pad - p * (H - pad - 18)

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        <Canvas w={W} h={H} aria-label="Precision-recall curve">
          <line
            x1={pad}
            y1={H - pad}
            x2={W - 16}
            y2={H - pad}
            stroke="currentColor"
            opacity={0.2}
          />
          <line x1={pad} y1={14} x2={pad} y2={H - pad} stroke="currentColor" opacity={0.2} />
          <Tag x={W - 16} y={H - pad + 16} anchor="end">
            recall
          </Tag>
          <Tag x={pad - 6} y={14} anchor="end">
            precision
          </Tag>

          <path
            d={curve.map((c, i) => `${i ? 'L' : 'M'}${sx(c.r)},${sy(c.p)}`).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.35}
            strokeWidth={1.5}
          />
          {curve.map((c, i) => (
            <circle key={i} cx={sx(c.r)} cy={sy(c.p)} r={2.5} fill="currentColor" opacity={0.35} />
          ))}

          <circle className="ep-anim" cx={sx(recall)} cy={sy(precision)} r={6} fill={TINT.three} />
        </Canvas>

        <div className="min-w-[180px]">
          <div className="eyebrow mb-2">ranked detections</div>
          <div className="space-y-1">
            {DETS.map((d, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-2 rounded-[6px] px-2 py-1 font-mono text-[11px] tabular-nums transition-opacity duration-150',
                  d.s >= thr ? 'bg-[var(--field-surface)]' : 'opacity-30',
                )}
              >
                <span className="w-9">{d.s.toFixed(2)}</span>
                <span style={{ color: d.tp ? TINT.three : TINT.two }}>{d.tp ? 'TP' : 'FP'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Controls cols={1}>
        <Slider
          label="score threshold"
          value={thr}
          onChange={setThr}
          min={0.2}
          max={1}
          step={0.01}
          tint={TINT.three}
        />
      </Controls>

      <Readout
        items={[
          { label: 'Detections kept', value: kept.length },
          { label: 'Precision', value: round(precision, 3) },
          { label: 'Recall', value: round(recall, 3) },
        ]}
      />

      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
        The threshold is not part of the model — it is a dial you turn after the fact, and it trades
        one number for the other. That is why you cannot report a single precision or recall and
        call a detector good: average precision integrates over the whole curve, so the threshold
        drops out of the comparison entirely.
      </p>
    </div>
  )
}
