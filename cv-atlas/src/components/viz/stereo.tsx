import * as React from 'react'
import { Canvas, Controls, Readout, Slider, Tag, TINT } from './kit'
import { round } from '@/lib/utils'

/* ================================================================== *
 *  Disparity ↔ depth. The hyperbola is the whole story: precision
 *  falls off as z², which is why stereo is great up close and hopeless
 *  far away.
 * ================================================================== */

export function DisparityDepthLab() {
  const [f, setF] = React.useState(800)
  const [b, setB] = React.useState(0.2)
  const [d, setD] = React.useState(40)

  const z = (f * b) / d
  /** Depth error for a ±1 px disparity error — the practical number. */
  const dz = (z * z) / (f * b)

  const W = 440
  const H = 210
  const padL = 44
  const padB = 32
  const dMin = 4
  const dMax = 160
  const zMax = (f * b) / dMin

  const sx = (dd: number) => padL + ((dd - dMin) / (dMax - dMin)) * (W - padL - 14)
  const sy = (zz: number) => H - padB - (Math.min(zz, zMax) / zMax) * (H - padB - 24)

  const curve = React.useMemo(() => {
    const pts: string[] = []
    for (let i = 0; i <= 140; i++) {
      const dd = dMin + ((dMax - dMin) * i) / 140
      pts.push(`${i ? 'L' : 'M'}${sx(dd)},${sy((f * b) / dd)}`)
    }
    return pts.join(' ')
    // sx/sy close over f and b, which is exactly what we want to re-run on.
  }, [f, b, zMax])

  return (
    <div>
      <Canvas w={W} h={H} aria-label="Depth as a function of disparity">
        <line
          x1={padL}
          y1={H - padB}
          x2={W - 10}
          y2={H - padB}
          stroke="currentColor"
          opacity={0.2}
        />
        <line x1={padL} y1={16} x2={padL} y2={H - padB} stroke="currentColor" opacity={0.2} />
        <Tag x={W - 12} y={H - padB + 16} anchor="end">
          disparity d (px)
        </Tag>
        <Tag x={padL - 6} y={14} anchor="end">
          depth z (m)
        </Tag>

        {/* the region under the curve, to give the hyperbola some weight */}
        <path
          d={`${curve} L ${sx(dMax)},${H - padB} L ${sx(dMin)},${H - padB} Z`}
          fill={TINT.one}
          opacity={0.06}
        />
        <path d={curve} fill="none" stroke={TINT.one} strokeWidth={2} />

        <g className="ep-anim" transform={`translate(${sx(d)}, ${sy(z)})`}>
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={H - padB - sy(z)}
            stroke={TINT.three}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <line
            x1={0}
            y1={0}
            x2={padL - sx(d)}
            y2={0}
            stroke={TINT.three}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <circle r={5.5} fill={TINT.three} />
        </g>

        <g transform={`translate(${W - 150}, 26)`}>
          <Tag x={0} y={0}>
            z = f·b / d
          </Tag>
          <text x={0} y={24} fontSize={20} fontFamily="var(--font-mono)" fill={TINT.three}>
            {round(z, 3)} m
          </text>
          <Tag x={0} y={46}>
            ±1 px of disparity
          </Tag>
          <text
            x={0}
            y={66}
            fontSize={14}
            fontFamily="var(--font-mono)"
            fill="currentColor"
            opacity={0.75}
          >
            ≈ ±{round(dz, 3)} m
          </text>
        </g>
      </Canvas>

      <Controls cols={3}>
        <Slider label="focal f (px)" value={f} onChange={setF} min={200} max={1600} step={10} />
        <Slider label="baseline b (m)" value={b} onChange={setB} min={0.02} max={1} step={0.01} />
        <Slider
          label="disparity d (px)"
          value={d}
          onChange={setD}
          min={dMin}
          max={dMax}
          step={1}
          tint={TINT.three}
        />
      </Controls>

      <Readout
        items={[
          { label: 'f · b', value: round(f * b, 2) },
          { label: 'depth z', value: `${round(z, 3)} m`, tint: TINT.three },
          { label: 'z² / (f·b)', value: `${round(dz, 4)} m per px` },
        ]}
      />

      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
        Set d = 40, f = 800, b = 0.2 and you get the exercise-sheet answer, 4 m. Now drag d down
        towards 4: the depth explodes and the ±1 px uncertainty explodes with it, quadratically.
        Widening the baseline pushes that wall further out — but a wider baseline also means more
        occlusion and more perspective distortion between the views, so matching gets harder. That
        trade-off is the central design decision in any stereo rig.
      </p>
    </div>
  )
}

/* ================================================================== *
 *  Block matching along a scanline, with the failure modes built in.
 * ================================================================== */

type SceneKey = 'textured' | 'textureless' | 'repetitive'

const SCENES: Record<SceneKey, { label: string; make: (n: number) => number[]; note: string }> = {
  textured: {
    label: 'Rich texture',
    make: (n) =>
      Array.from(
        { length: n },
        (_, i) =>
          0.5 + 0.34 * Math.sin(i * 0.9) + 0.14 * Math.sin(i * 2.7 + 1) + 0.08 * Math.sin(i * 5.1),
      ),
    note: 'One sharp, unambiguous minimum. Block matching is easy here.',
  },
  textureless: {
    label: 'Textureless',
    make: (n) => Array.from({ length: n }, (_, i) => 0.5 + 0.015 * Math.sin(i * 0.4)),
    note: 'The cost curve is almost flat — every disparity fits about as well. The winner is noise.',
  },
  repetitive: {
    label: 'Repetitive',
    make: (n) => Array.from({ length: n }, (_, i) => 0.5 + 0.32 * Math.sin(i * 1.05)),
    note: 'Several minima of almost equal depth. The winner-takes-all pick is a coin flip between them.',
  },
}

const N = 64
const DMAX = 24
const TRUE_D = 9
const CENTRE = 26

export function BlockMatchLab() {
  const [scene, setScene] = React.useState<SceneKey>('textured')
  const [win, setWin] = React.useState(5)

  const left = React.useMemo(() => SCENES[scene].make(N), [scene])
  const right = React.useMemo(() => {
    // The right image is the left, shifted by the true disparity, plus noise.
    let seed = 7
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return (seed / 0x7fffffff - 0.5) * 0.06
    }
    return Array.from({ length: N }, (_, i) => (left[i + TRUE_D] ?? left[N - 1]) + rnd())
  }, [left])

  const cost = React.useMemo(() => {
    const half = Math.floor(win / 2)
    const out: number[] = []
    for (let d = 0; d < DMAX; d++) {
      let s = 0
      for (let k = -half; k <= half; k++) {
        const li = Math.min(N - 1, Math.max(0, CENTRE + d + k))
        const ri = Math.min(N - 1, Math.max(0, CENTRE + k))
        s += (left[li] - right[ri]) ** 2
      }
      out.push(s / win)
    }
    return out
  }, [left, right, win])

  const best = cost.indexOf(Math.min(...cost))
  const cmax = Math.max(...cost) || 1

  const W = 440
  const H = 230
  const sig = (arr: number[], y0: number, h: number, colour: string) => {
    const pad = 24
    const step = (W - pad * 2) / (arr.length - 1)
    return (
      <path
        d={arr.map((v, i) => `${i ? 'L' : 'M'}${pad + i * step},${y0 + h - v * h}`).join(' ')}
        fill="none"
        stroke={colour}
        strokeWidth={1.75}
      />
    )
  }
  const bw = (W - 48) / DMAX

  return (
    <div>
      <Canvas w={W} h={H} aria-label="Block matching cost along one scanline">
        <Tag x={24} y={12} tint={TINT.one}>
          left scanline
        </Tag>
        {sig(left, 16, 34, TINT.one)}
        <Tag x={24} y={72} tint={TINT.two}>
          right scanline
        </Tag>
        {sig(right, 76, 34, TINT.two)}

        <Tag x={24} y={134}>
          matching cost vs disparity (SSD over a {win}-px window)
        </Tag>
        <g transform="translate(0, 140)">
          <line x1={24} y1={62} x2={W - 24} y2={62} stroke="currentColor" opacity={0.18} />
          {cost.map((c, i) => {
            const h = (c / cmax) * 54
            return (
              <rect
                key={i}
                className="ep-anim"
                x={24 + i * bw + 1}
                y={62 - h}
                width={bw - 2}
                height={h}
                fill={i === best ? TINT.three : 'currentColor'}
                fillOpacity={i === best ? 0.95 : 0.25}
                rx={1}
              />
            )
          })}
          <line
            x1={24 + (TRUE_D + 0.5) * bw}
            y1={0}
            x2={24 + (TRUE_D + 0.5) * bw}
            y2={62}
            stroke={TINT.four}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          <Tag x={24 + (TRUE_D + 0.5) * bw + 5} y={12} tint={TINT.four}>
            true d = {TRUE_D}
          </Tag>
          <Tag x={W - 24} y={78} anchor="end" tint={best === TRUE_D ? TINT.three : TINT.two}>
            winner-takes-all picks d = {best}
            {best === TRUE_D ? ' ✓' : ' ✗'}
          </Tag>
        </g>
      </Canvas>

      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(SCENES) as SceneKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setScene(k)}
            aria-pressed={scene === k}
            className={
              'rounded-[10px] border px-3 py-1.5 font-mono text-[11px] tracking-wide uppercase transition-colors duration-150 ' +
              (scene === k
                ? 'border-transparent bg-primary text-primary-foreground'
                : 'border-hairline text-muted-foreground hover:bg-accent hover:text-foreground')
            }
          >
            {SCENES[k].label}
          </button>
        ))}
      </div>

      <Controls cols={1}>
        <Slider
          label="window size"
          value={win}
          onChange={setWin}
          min={1}
          max={15}
          step={2}
          unit=" px"
        />
      </Controls>

      <Readout
        items={[
          { label: 'Picked disparity', value: best, tint: best === TRUE_D ? TINT.three : TINT.two },
          { label: 'Cost gap to runner-up', value: round(gap(cost, best), 4) },
        ]}
      />

      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
        {SCENES[scene].note} Widening the window flattens the noise but smears the answer across
        depth discontinuities — the classic bleeding artefact. Neither window size fixes the flat or
        periodic cases, and <em>that</em> is the argument for adding a smoothness prior.
      </p>
    </div>
  )
}

function gap(cost: number[], best: number) {
  const sorted = cost.map((c, i) => ({ c, i })).sort((a, b) => a.c - b.c)
  const second = sorted.find((s) => Math.abs(s.i - best) > 1)
  return second ? second.c - cost[best] : 0
}
