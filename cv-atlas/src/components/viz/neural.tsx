import * as React from 'react'
import { Canvas, Controls, Readout, Slider, Tag, TINT } from './kit'
import { cn, round } from '@/lib/utils'

/* ================================================================== *
 *  Plane sweep: hypothesise a depth, warp the neighbours onto it,
 *  measure how well they agree. The cost profile is the answer.
 * ================================================================== */

const PLANES = [1, 2, 3, 4, 5]
const COSTS = [0.81, 0.42, 0.18, 0.37, 0.64]

export function PlaneSweepLab() {
  const [sel, setSel] = React.useState(2)
  const best = COSTS.indexOf(Math.min(...COSTS))

  const W = 440
  const H = 250

  // Camera positions in the little schematic.
  const ref: [number, number] = [W / 2, H - 34]
  const nb1: [number, number] = [W / 2 - 96, H - 34]
  const nb2: [number, number] = [W / 2 + 96, H - 34]

  const planeY = (i: number) => 32 + (4 - i) * 30

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-[1fr_190px]">
        <Canvas
          w={W}
          h={H}
          aria-label="Plane sweep stereo: candidate depth planes in front of the reference camera"
        >
          {/* the swept planes */}
          {PLANES.map((z, i) => (
            <g key={z}>
              <line
                className="ep-anim"
                x1={40}
                x2={W - 40}
                y1={planeY(i)}
                y2={planeY(i)}
                stroke={i === sel ? TINT.three : 'currentColor'}
                strokeWidth={i === sel ? 2.5 : 1.25}
                strokeDasharray={i === sel ? undefined : '4 4'}
                opacity={i === sel ? 1 : 0.22}
              />
              <Tag x={34} y={planeY(i) + 4} anchor="end" tint={i === sel ? TINT.three : undefined}>
                {z} m
              </Tag>
            </g>
          ))}

          {/* rays from all three cameras to the selected plane */}
          {[nb1, ref, nb2].map((c, k) => (
            <line
              key={k}
              className="ep-anim"
              x1={c[0]}
              y1={c[1]}
              x2={W / 2}
              y2={planeY(sel)}
              stroke={k === 1 ? TINT.one : TINT.two}
              strokeWidth={1.5}
              opacity={k === 1 ? 0.9 : 0.55}
            />
          ))}

          <circle className="ep-anim" cx={W / 2} cy={planeY(sel)} r={5.5} fill={TINT.three} />

          {/* cameras */}
          {[
            { p: nb1, label: 'neighbour', tint: TINT.two },
            { p: ref, label: 'reference', tint: TINT.one },
            { p: nb2, label: 'neighbour', tint: TINT.two },
          ].map((c, i) => (
            <g key={i}>
              <path
                d={`M${c.p[0] - 11} ${c.p[1] + 9} L${c.p[0] + 11} ${c.p[1] + 9} L${c.p[0] + 7} ${
                  c.p[1] - 7
                } L${c.p[0] - 7} ${c.p[1] - 7} Z`}
                fill="none"
                stroke={c.tint}
                strokeWidth={1.75}
              />
              <Tag x={c.p[0]} y={c.p[1] + 24} anchor="middle" tint={c.tint}>
                {c.label}
              </Tag>
            </g>
          ))}
        </Canvas>

        <div>
          <div className="eyebrow mb-2">cost profile C(z)</div>
          <div className="space-y-1.5">
            {PLANES.map((z, i) => (
              <button
                key={z}
                onClick={() => setSel(i)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left transition-colors duration-150',
                  i === sel ? 'bg-accent' : 'hover:bg-accent/60',
                )}
              >
                <span className="w-8 shrink-0 font-mono text-[11px] text-muted-foreground">
                  {z} m
                </span>
                <span className="relative h-4 min-w-0 flex-1 overflow-hidden rounded-[3px] bg-[var(--field-surface)]">
                  <span
                    className="absolute inset-y-0 left-0 rounded-[3px] transition-all duration-300"
                    style={{
                      width: `${COSTS[i] * 100}%`,
                      background: i === best ? TINT.three : 'var(--muted-foreground)',
                    }}
                  />
                </span>
                <span
                  className="w-9 shrink-0 text-right font-mono text-[11px] tabular-nums"
                  style={{ color: i === best ? TINT.three : undefined }}
                >
                  {COSTS[i]}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-[10px] border border-hairline bg-[var(--field-surface)] px-3 py-2 text-[13.5px]">
            argmin at{' '}
            <span className="font-mono" style={{ color: TINT.three }}>
              z = {PLANES[best]} m
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
        At the wrong depth the reprojected neighbours disagree and the patch looks blurred, so the
        cost is high. At the right depth they land on top of each other and the cost drops. Do this
        for every pixel and you have a cost volume of width × height × planes — the same object a
        cost volume in block matching is, only indexed by <em>depth</em> instead of disparity, which
        is what lets it handle arbitrary camera poses.
      </p>
    </div>
  )
}

/* ================================================================== *
 *  Volume rendering along a ray: density → alpha → weights → colour.
 * ================================================================== */

type Sample = { sigma: number; c: number } // c is a greyscale stand-in for RGB

export function VolumeRenderLab() {
  const [sigmas, setSigmas] = React.useState<number[]>([
    0.02, 0.03, 0.05, 0.9, 1.6, 0.6, 0.08, 0.05, 1.2, 0.3,
  ])
  const [delta, setDelta] = React.useState(0.6)

  const colours = React.useMemo(() => [0.2, 0.25, 0.3, 0.42, 0.85, 0.7, 0.4, 0.35, 0.55, 0.45], [])
  const samples: Sample[] = sigmas.map((s, i) => ({ sigma: s, c: colours[i] }))

  // alpha_i = 1 - exp(-sigma_i * delta_i); T_i = prod_{j<i} (1 - alpha_j)
  const alphas = samples.map((s) => 1 - Math.exp(-s.sigma * delta))
  const T: number[] = []
  let acc = 1
  for (let i = 0; i < alphas.length; i++) {
    T.push(acc)
    acc *= 1 - alphas[i]
  }
  const weights = alphas.map((a, i) => T[i] * a)
  const colour = weights.reduce((s, w, i) => s + w * samples[i].c, 0)
  const opacityTotal = weights.reduce((a, b) => a + b, 0)

  const W = 440
  const H = 210
  const padL = 30
  const bw = (W - padL - 20) / samples.length

  const bump = (i: number, dv: number) =>
    setSigmas((s) => s.map((v, k) => (k === i ? Math.max(0, Math.min(2.5, v + dv)) : v)))

  return (
    <div>
      <Canvas
        w={W}
        h={H}
        aria-label="Volume rendering along a ray: density, transmittance and weights"
      >
        <Tag x={padL} y={12}>
          density σ (click a bar to raise it, shift-click to lower)
        </Tag>
        {samples.map((s, i) => (
          <g key={i}>
            <rect
              x={padL + i * bw + 1}
              y={20}
              width={bw - 2}
              height={48}
              fill="currentColor"
              fillOpacity={0.05}
              style={{ cursor: 'pointer' }}
              onClick={(e) => bump(i, e.shiftKey ? -0.3 : 0.3)}
            />
            <rect
              className="ep-anim"
              x={padL + i * bw + 1}
              y={68 - (s.sigma / 2.5) * 48}
              width={bw - 2}
              height={(s.sigma / 2.5) * 48}
              fill={TINT.four}
              opacity={0.85}
              style={{ pointerEvents: 'none' }}
              rx={1}
            />
          </g>
        ))}

        <Tag x={padL} y={88}>
          transmittance T (how much light still gets through)
        </Tag>
        <path
          d={T.map((t, i) => `${i ? 'L' : 'M'}${padL + (i + 0.5) * bw},${140 - t * 44}`).join(' ')}
          fill="none"
          stroke={TINT.one}
          strokeWidth={2}
        />
        {T.map((t, i) => (
          <circle
            key={i}
            className="ep-anim"
            cx={padL + (i + 0.5) * bw}
            cy={140 - t * 44}
            r={2.5}
            fill={TINT.one}
          />
        ))}

        <Tag x={padL} y={162}>
          weight wᵢ = Tᵢ · αᵢ
        </Tag>
        {weights.map((w, i) => (
          <rect
            key={i}
            className="ep-anim"
            x={padL + i * bw + 1}
            y={200 - w * 32}
            width={bw - 2}
            height={w * 32}
            fill={TINT.three}
            rx={1}
          />
        ))}
        <line x1={padL} y1={200} x2={W - 20} y2={200} stroke="currentColor" opacity={0.18} />
      </Canvas>

      <Controls cols={1}>
        <Slider
          label="sample spacing δ"
          value={delta}
          onChange={setDelta}
          min={0.1}
          max={2}
          step={0.05}
          tint={TINT.four}
        />
      </Controls>

      <Readout
        items={[
          { label: 'Rendered colour Ĉ', value: round(colour, 4), tint: TINT.three },
          { label: 'Accumulated opacity Σw', value: round(opacityTotal, 4) },
          { label: 'Light left at the end', value: round(acc, 4), tint: TINT.one },
        ]}
      />

      <div className="mt-3 flex items-center gap-3">
        <span className="eyebrow">rendered pixel</span>
        <div
          className="h-8 w-20 rounded-[6px] border border-hairline transition-colors duration-200"
          style={{
            background: `rgb(${Math.round(colour * 255)}, ${Math.round(
              colour * 255,
            )}, ${Math.round(colour * 255)})`,
          }}
        />
      </div>

      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
        Raise the density of an early sample and watch the transmittance collapse: everything behind
        it stops contributing, because its weight is multiplied by whatever light survived. That
        product is what makes the renderer handle occlusion correctly <em>and</em> stay
        differentiable — a hard z-buffer test would have zero gradient, but this soft accumulation
        gives every sample a gradient to learn from. That is the trick that makes NeRF trainable at
        all.
      </p>
    </div>
  )
}

/* ================================================================== *
 *  Positional encoding: why a plain MLP cannot fit a high-frequency
 *  signal, and what γ(p) does about it.
 * ================================================================== */

export function PositionalEncodingLab() {
  const [L, setL] = React.useState(4)

  const W = 440
  const H = 200
  const padL = 28
  const N = 220

  const xs = React.useMemo(() => Array.from({ length: N }, (_, i) => i / (N - 1)), [])
  const bands = Array.from({ length: L }, (_, k) => k)
  const sx = (t: number) => padL + t * (W - padL - 16)

  return (
    <div>
      <Canvas w={W} h={H} aria-label="Positional encoding bands">
        <Tag x={padL} y={12}>
          γ(p) = ( sin(2⁰πp), cos(2⁰πp), …, sin(2^(L−1)πp), cos(2^(L−1)πp) )
        </Tag>
        {bands.map((k) => {
          const y0 = 34 + k * ((H - 54) / Math.max(L, 1))
          const amp = Math.min(14, (H - 60) / Math.max(L, 1) / 2.4)
          const d = xs
            .map((t, i) => `${i ? 'L' : 'M'}${sx(t)},${y0 - Math.sin(2 ** k * Math.PI * t) * amp}`)
            .join(' ')
          return (
            <g key={k}>
              <path
                d={d}
                fill="none"
                stroke={TINT.four}
                strokeWidth={1.5}
                opacity={0.4 + (0.6 * (k + 1)) / L}
              />
              <Tag x={padL - 6} y={y0 + 4} anchor="end">
                2^{k}
              </Tag>
            </g>
          )
        })}
      </Canvas>

      <Controls cols={1}>
        <Slider
          label="number of bands L"
          value={L}
          onChange={setL}
          min={1}
          max={10}
          tint={TINT.four}
        />
      </Controls>

      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
        A coordinate MLP fed raw <span className="font-mono">(x, y, z)</span> is heavily biased
        towards smooth functions — it will happily learn the blurry average of a scene and refuse to
        learn the detail. Stacking sinusoids at geometrically increasing frequencies hands the
        network coordinates that already <em>differ sharply</em> between nearby points, so a
        low-frequency-biased network can represent a high-frequency function. Raise L and you buy
        detail; raise it too far and you buy aliasing and noise.
      </p>
    </div>
  )
}
