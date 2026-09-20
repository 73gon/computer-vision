import * as React from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Canvas, Controls, Segmented, Slider, Tag, TINT } from './kit'
import { round } from '@/lib/utils'

/* ================================================================== *
 *  Convolution, one output pixel at a time.
 *  The kernel is the little window; the output cell lights up as the
 *  weighted sum lands. Watching one sweep is worth three slides.
 * ================================================================== */

type KernelKey = 'box' | 'gauss' | 'laplace' | 'sharpen' | 'sobelx' | 'impulse'

const KERNELS: Record<KernelKey, { label: string; k: number[][]; div: number; note: string }> = {
  impulse: {
    label: 'δ (identity)',
    k: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    div: 1,
    note: 'The delta kernel copies the image. Every other kernel is a deviation from this.',
  },
  box: {
    label: 'Box 3×3',
    k: [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ],
    div: 9,
    note: 'Plain local average. Weights sum to 1 → flat regions survive untouched; fine detail is attenuated.',
  },
  gauss: {
    label: 'Gaussian',
    k: [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1],
    ],
    div: 16,
    note: 'A smoother low-pass than the box: no sharp cut-off in frequency, so no ringing. Separable, so cheap.',
  },
  laplace: {
    label: 'Laplacian',
    k: [
      [0, 1, 0],
      [1, -4, 1],
      [0, 1, 0],
    ],
    div: 1,
    note: 'Weights sum to 0 → flat regions give exactly 0. It measures how far a pixel sits from its neighbours’ average.',
  },
  sharpen: {
    label: 'Sharpen (γ = 1)',
    k: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
    div: 1,
    note: 'k = (1+γ)δ − γh with a cross-shaped h. Sums to 1, so constants survive, but the high-pass residual is amplified.',
  },
  sobelx: {
    label: 'Sobel ∂/∂x',
    k: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ],
    div: 1,
    note: 'Smooth in y, differentiate in x. Sums to 0: a derivative of a constant is zero.',
  },
}

/** A 12×9 test image: a step edge, a bright dot, a dark dot and a flat band. */
function makeImage(): number[][] {
  const H = 9
  const W = 12
  const img: number[][] = []
  for (let y = 0; y < H; y++) {
    const row: number[] = []
    for (let x = 0; x < W; x++) {
      let v = x < 5 ? 0.22 : 0.72 // step edge
      if (y >= 6) v = 0.45 // flat band
      row.push(v)
    }
    img.push(row)
  }
  img[2][8] = 1 // isolated bright pixel
  img[7][2] = 0.05 // isolated dark pixel
  return img
}

const IMG = makeImage()
const IH = IMG.length
const IW = IMG[0].length

function convolveAt(img: number[][], k: number[][], div: number, y: number, x: number) {
  let sum = 0
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      // Replicate padding at the border — the usual practical choice.
      const yy = Math.min(IH - 1, Math.max(0, y + i))
      const xx = Math.min(IW - 1, Math.max(0, x + j))
      sum += img[yy][xx] * k[i + 1][j + 1]
    }
  }
  return sum / div
}

export function ConvolutionLab() {
  const [key, setKey] = React.useState<KernelKey>('box')
  const [pos, setPos] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const spec = KERNELS[key]

  const total = IW * IH
  const cy = Math.floor(pos / IW)
  const cx = pos % IW

  const out = React.useMemo(() => {
    const o: number[][] = []
    for (let y = 0; y < IH; y++) {
      const row: number[] = []
      for (let x = 0; x < IW; x++) row.push(convolveAt(IMG, spec.k, spec.div, y, x))
      o.push(row)
    }
    return o
  }, [spec])

  React.useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      setPos((p) => {
        if (p + 1 >= total) {
          setPlaying(false)
          return total - 1
        }
        return p + 1
      })
    }, 55)
    return () => clearInterval(t)
  }, [playing, total])

  const CELL = 17
  const GAP = 26
  const W = IW * CELL * 2 + GAP + 12
  const H = IH * CELL + 44

  // Signed kernels get a diverging ramp; smoothing kernels a plain grey ramp.
  const signed = key === 'laplace' || key === 'sobelx'
  const shade = (v: number) => {
    if (!signed) {
      const g = Math.round(255 * Math.min(1, Math.max(0, v)))
      return `rgb(${g},${g},${g})`
    }
    const t = Math.min(1, Math.abs(v) * 1.6)
    return v >= 0
      ? `color-mix(in oklab, var(--tint-1) ${t * 100}%, #808080)`
      : `color-mix(in oklab, var(--tint-2) ${t * 100}%, #808080)`
  }

  const value = out[cy][cx]

  return (
    <div>
      <Canvas w={W} h={H} aria-label="Convolution sliding a 3×3 kernel over a small image">
        <Tag x={0} y={12}>
          input f
        </Tag>
        <Tag x={IW * CELL + GAP} y={12}>
          output g = f ∗ h
        </Tag>

        {/* input */}
        <g transform="translate(0, 26)">
          {IMG.map((row, y) =>
            row.map((v, x) => (
              <rect
                key={`${y}-${x}`}
                x={x * CELL}
                y={y * CELL}
                width={CELL - 1}
                height={CELL - 1}
                fill={shade(v)}
              />
            )),
          )}
          {/* the kernel window */}
          <rect
            className="ep-anim-fast"
            x={(cx - 1) * CELL - 1.5}
            y={(cy - 1) * CELL - 1.5}
            width={CELL * 3}
            height={CELL * 3}
            fill="none"
            stroke={TINT.three}
            strokeWidth={2}
            rx={2}
          />
        </g>

        {/* output */}
        <g transform={`translate(${IW * CELL + GAP}, 26)`}>
          {out.map((row, y) =>
            row.map((v, x) => {
              const done = y * IW + x <= pos
              return (
                <rect
                  key={`${y}-${x}`}
                  x={x * CELL}
                  y={y * CELL}
                  width={CELL - 1}
                  height={CELL - 1}
                  fill={done ? shade(v) : 'currentColor'}
                  fillOpacity={done ? 1 : 0.06}
                />
              )
            }),
          )}
          <rect
            className="ep-anim-fast"
            x={cx * CELL - 1.5}
            y={cy * CELL - 1.5}
            width={CELL + 2}
            height={CELL + 2}
            fill="none"
            stroke={TINT.three}
            strokeWidth={2}
            rx={2}
          />
        </g>
      </Canvas>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <Segmented
          label="Kernel h"
          value={key}
          onChange={(v) => {
            setKey(v)
            setPos(0)
            setPlaying(false)
          }}
          options={(Object.keys(KERNELS) as KernelKey[]).map((k) => ({
            value: k,
            label: KERNELS[k].label,
          }))}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={playing ? 'secondary' : 'primary'}
            onClick={() => {
              if (pos >= total - 1) setPos(0)
              setPlaying((p) => !p)
            }}
          >
            {playing ? <Pause /> : <Play />}
            {playing ? 'Pause' : 'Sweep'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setPos(0)
              setPlaying(false)
            }}
            aria-label="Reset the sweep"
          >
            <RotateCcw />
          </Button>
        </div>
      </div>

      <Controls cols={1}>
        <Slider
          label="output pixel"
          value={pos}
          onChange={(v) => {
            setPos(v)
            setPlaying(false)
          }}
          min={0}
          max={total - 1}
          format={() => `(y=${cy}, x=${cx})`}
          tint={TINT.three}
        />
      </Controls>

      <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="rounded-[10px] border border-hairline bg-[var(--field-surface)] p-3">
          <div className="eyebrow mb-2">h</div>
          <table className="font-mono text-[12px] tabular-nums">
            <tbody>
              {spec.k.map((r, i) => (
                <tr key={i}>
                  {r.map((v, j) => (
                    <td
                      key={j}
                      className="w-9 px-1.5 py-0.5 text-right"
                      style={{
                        color: v > 0 ? 'var(--tint-1)' : v < 0 ? 'var(--tint-2)' : undefined,
                        opacity: v === 0 ? 0.35 : 1,
                      }}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {spec.div !== 1 ? (
            <div className="mt-1.5 font-mono text-[11px] text-muted-foreground">× 1/{spec.div}</div>
          ) : null}
          <div className="mt-2 font-mono text-[11px] text-muted-foreground">
            Σh = {round(spec.k.flat().reduce((a, b) => a + b, 0) / spec.div, 3)}
          </div>
        </div>
        <div className="min-w-0 text-[14.5px] leading-relaxed text-muted-foreground">
          <p>{spec.note}</p>
          <p className="mt-2 font-mono text-[12px] text-foreground">
            g({cy},{cx}) = {round(value, 3)}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== *
 *  Sharpening as residual filtering: f + γ(f − f∗h) on a 1-D slice.
 * ================================================================== */

export function SharpenLab() {
  const [gamma, setGamma] = React.useState(1)

  const N = 60
  const f = React.useMemo(
    () =>
      Array.from({ length: N }, (_, i) => {
        if (i < 22) return 0.25
        if (i < 26) return 0.25 + ((i - 22) / 4) * 0.5 // a soft ramp edge
        return 0.75
      }),
    [],
  )
  const blur = React.useMemo(() => {
    const b: number[] = []
    for (let i = 0; i < N; i++) {
      let s = 0
      let n = 0
      for (let k = -3; k <= 3; k++) {
        const j = Math.min(N - 1, Math.max(0, i + k))
        s += f[j]
        n++
      }
      b.push(s / n)
    }
    return b
  }, [f])
  const resid = f.map((v, i) => v - blur[i])
  const sharp = f.map((v, i) => v + gamma * resid[i])

  const W = 440
  const H = 170
  const pad = 26
  const sx = (i: number) => pad + (i / (N - 1)) * (W - pad * 2)
  const sy = (v: number) => H - 24 - v * (H - 60)
  const path = (a: number[]) => a.map((v, i) => `${i ? 'L' : 'M'}${sx(i)},${sy(v)}`).join(' ')

  return (
    <div>
      <Canvas w={W} h={H} aria-label="Sharpening as the original plus a scaled high-pass residual">
        <line x1={pad} y1={sy(0)} x2={W - pad} y2={sy(0)} stroke="currentColor" opacity={0.15} />
        <path
          d={path(blur)}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.35}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <path
          d={path(f)}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.6}
          strokeWidth={1.75}
        />
        <path
          d={path(resid.map((v) => v + 0.05))}
          fill="none"
          stroke={TINT.two}
          strokeWidth={1.5}
          opacity={0.75}
        />
        <path d={path(sharp)} fill="none" stroke={TINT.one} strokeWidth={2.25} />
        <Tag x={pad} y={14}>
          f (dark) · f∗h (dashed) · residual f − f∗h
        </Tag>
        <Tag x={W - pad} y={14} anchor="end" tint={TINT.one}>
          g = f + γ(f − f∗h)
        </Tag>
      </Canvas>
      <Controls cols={1}>
        <Slider
          label="γ"
          value={gamma}
          onChange={setGamma}
          min={0}
          max={3}
          step={0.05}
          tint={TINT.one}
        />
      </Controls>
      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
        The residual is flat (zero) wherever the image is flat, and swings hard around the edge.
        Adding γ times it therefore leaves constant regions <em>exactly</em> untouched and builds an
        over/undershoot pair at the edge — the halo you see in over-sharpened photos.
      </p>
    </div>
  )
}
