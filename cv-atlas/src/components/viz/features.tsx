import * as React from 'react'
import { Canvas, Controls, Readout, Segmented, Slider, Tag, TINT } from './kit'
import { round } from '@/lib/utils'

/* ================================================================== *
 *  Gradient: magnitude and orientation from (gx, gy).
 *  Exercise 3.1 lives here — gx = 3, gy = 4 is the default.
 * ================================================================== */

export function GradientCompass() {
  const [gx, setGx] = React.useState(3)
  const [gy, setGy] = React.useState(4)

  const mag = Math.hypot(gx, gy)
  const theta = Math.atan2(gy, gx)
  const deg = (theta * 180) / Math.PI

  const W = 400
  const H = 230
  const ox = 130
  const oy = H / 2
  const U = 18

  // The edge runs perpendicular to the gradient.
  const ex = Math.cos(theta + Math.PI / 2)
  const ey = Math.sin(theta + Math.PI / 2)

  return (
    <div>
      <Canvas w={W} h={H} aria-label="Gradient magnitude and orientation">
        {/* intensity ramp oriented along the gradient, so the edge is visible */}
        <defs>
          <linearGradient
            id="gradramp"
            x1={ox - Math.cos(theta) * 60}
            y1={oy + Math.sin(theta) * 60}
            x2={ox + Math.cos(theta) * 60}
            y2={oy - Math.sin(theta) * 60}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#1b1b1b" />
            <stop offset="45%" stopColor="#1b1b1b" />
            <stop offset="55%" stopColor="#e6e6e6" />
            <stop offset="100%" stopColor="#e6e6e6" />
          </linearGradient>
          <marker id="gradhead" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 z" fill={TINT.two} />
          </marker>
        </defs>
        <circle cx={ox} cy={oy} r={72} fill="url(#gradramp)" />
        <circle cx={ox} cy={oy} r={72} fill="none" stroke="currentColor" strokeOpacity={0.2} />

        {/* the edge direction */}
        <line
          className="ep-anim"
          x1={ox - ex * 72}
          y1={oy + ey * 72}
          x2={ox + ex * 72}
          y2={oy - ey * 72}
          stroke={TINT.three}
          strokeWidth={2}
          strokeDasharray="5 4"
        />

        {/* the gradient vector */}
        <line
          className="ep-anim"
          x1={ox}
          y1={oy}
          x2={ox + gx * U}
          y2={oy - gy * U}
          stroke={TINT.two}
          strokeWidth={2.5}
          markerEnd="url(#gradhead)"
        />

        {/* angle arc */}
        <path
          d={`M ${ox + 34} ${oy} A 34 34 0 0 ${deg >= 0 ? 0 : 1} ${ox + Math.cos(theta) * 34} ${
            oy - Math.sin(theta) * 34
          }`}
          fill="none"
          stroke={TINT.two}
          strokeOpacity={0.5}
          strokeWidth={1.25}
        />

        <g className="ep-anim" transform={`translate(${ox + gx * U}, ${oy - gy * U})`}>
          <Tag x={8} y={-4} tint={TINT.two}>
            ∇f
          </Tag>
        </g>
        <g className="ep-anim" transform={`translate(${ox + ex * 78}, ${oy - ey * 78})`}>
          <Tag x={0} y={0} tint={TINT.three}>
            edge
          </Tag>
        </g>

        <g transform={`translate(${W - 150}, 30)`}>
          <Tag x={0} y={0}>
            magnitude
          </Tag>
          <text x={0} y={22} fontSize={19} fontFamily="var(--font-mono)" fill="currentColor">
            {round(mag, 3)}
          </text>
          <Tag x={0} y={52}>
            orientation
          </Tag>
          <text x={0} y={74} fontSize={19} fontFamily="var(--font-mono)" fill="currentColor">
            {round(deg, 2)}°
          </text>
          <Tag x={0} y={96}>
            = {round(theta, 4)} rad
          </Tag>
        </g>
      </Canvas>

      <Controls cols={2}>
        <Slider
          label="gₓ"
          value={gx}
          onChange={setGx}
          min={-6}
          max={6}
          step={0.5}
          tint={TINT.two}
        />
        <Slider
          label="g_y"
          value={gy}
          onChange={setGy}
          min={-6}
          max={6}
          step={0.5}
          tint={TINT.two}
        />
      </Controls>

      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
        The gradient always points <em>across</em> the edge, towards increasing brightness. The edge
        itself runs perpendicular to it — which is exactly why non-maximum suppression compares a
        pixel against its two neighbours <em>along the gradient</em>, not along the edge.
      </p>
    </div>
  )
}

/* ================================================================== *
 *  Non-maximum suppression: a fat ridge becomes a one-pixel line.
 * ================================================================== */

export function NMSDemo() {
  const [on, setOn] = React.useState(true)
  const N = 21
  const profile = React.useMemo(
    () => Array.from({ length: N }, (_, i) => Math.exp(-((i - 10) ** 2) / 14)),
    [],
  )
  const suppressed = profile.map((v, i) => {
    const l = profile[i - 1] ?? 0
    const r = profile[i + 1] ?? 0
    return v >= l && v >= r ? v : 0
  })
  const shown = on ? suppressed : profile

  const W = 420
  const H = 150
  const pad = 24
  const bw = (W - pad * 2) / N

  return (
    <div>
      <Canvas w={W} h={H} aria-label="Non-maximum suppression thinning a gradient ridge">
        <line x1={pad} y1={H - 30} x2={W - pad} y2={H - 30} stroke="currentColor" opacity={0.15} />
        {/* ghost of the original */}
        {on
          ? profile.map((v, i) => (
              <rect
                key={`g${i}`}
                x={pad + i * bw + 1}
                y={H - 30 - v * 86}
                width={bw - 2}
                height={v * 86}
                fill="currentColor"
                opacity={0.07}
                rx={1}
              />
            ))
          : null}
        {shown.map((v, i) => (
          <rect
            key={i}
            className="ep-anim"
            x={pad + i * bw + 1}
            y={H - 30 - v * 86}
            width={bw - 2}
            height={v * 86}
            fill={v > 0 ? (on ? TINT.three : TINT.one) : 'transparent'}
            opacity={0.85}
            rx={1}
          />
        ))}
        <Tag x={pad} y={16}>
          gradient magnitude along a line across the edge
        </Tag>
        <Tag x={W / 2} y={H - 10} anchor="middle" tint={on ? TINT.three : TINT.one}>
          {on ? 'after NMS — one pixel wide' : 'before NMS — the ridge is many pixels wide'}
        </Tag>
      </Canvas>
      <div className="mt-3">
        <Segmented
          value={on ? 'after' : 'before'}
          onChange={(v) => setOn(v === 'after')}
          options={[
            { value: 'before', label: 'Raw magnitude' },
            { value: 'after', label: 'After NMS' },
          ]}
        />
      </div>
    </div>
  )
}

/* ================================================================== *
 *  Scale space: the (normalised) LoG response of a blob, as a
 *  function of σ. The peak is the characteristic scale.
 * ================================================================== */

export function ScaleSpaceLab() {
  const [r, setR] = React.useState(12)
  const [sigma, setSigma] = React.useState(8)
  const [normalised, setNormalised] = React.useState(true)

  /**
   * Response of the LoG at the centre of a binary disc of radius r.
   * Up to a constant this is  (2r²/σ⁴)·exp(−r²/(2σ²))  in magnitude for the
   * raw Laplacian, and σ² times that for the scale-normalised version.
   */
  const response = React.useCallback(
    (s: number) => {
      const raw = ((2 * r * r) / s ** 4) * Math.exp(-(r * r) / (2 * s * s))
      return normalised ? raw * s * s : raw
    },
    [r, normalised],
  )

  const peak = r / Math.SQRT2 // where the normalised response is maximal

  const W = 440
  const H = 210
  const padL = 34
  const padB = 30
  const sMin = 1
  const sMax = 34
  const samples = React.useMemo(
    () => Array.from({ length: 160 }, (_, i) => sMin + ((sMax - sMin) * i) / 159),
    [],
  )
  const vals = samples.map(response)
  const vmax = Math.max(...vals)
  const sx = (s: number) => padL + ((s - sMin) / (sMax - sMin)) * (W - padL - 14)
  const sy = (v: number) => H - padB - (v / vmax) * (H - padB - 28)
  const path = samples.map((s, i) => `${i ? 'L' : 'M'}${sx(s)},${sy(vals[i])}`).join(' ')

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
        {/* the blob and the current Gaussian, to scale */}
        <Canvas w={140} h={140} aria-label="Blob of radius r with the current Gaussian overlaid">
          <rect
            x={0}
            y={0}
            width={140}
            height={140}
            fill="currentColor"
            fillOpacity={0.05}
            rx={8}
          />
          <circle
            className="ep-anim"
            cx={70}
            cy={70}
            r={r * 1.8}
            fill="currentColor"
            fillOpacity={0.55}
          />
          <circle
            className="ep-anim"
            cx={70}
            cy={70}
            r={sigma * 1.8}
            fill="none"
            stroke={TINT.four}
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          <Tag x={6} y={14}>
            blob r
          </Tag>
          <Tag x={134} y={14} anchor="end" tint={TINT.four}>
            σ
          </Tag>
        </Canvas>

        <Canvas w={W} h={H} aria-label="LoG response versus scale">
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
            σ
          </Tag>
          <Tag x={padL - 4} y={14} anchor="end">
            |response|
          </Tag>

          <path d={path} fill="none" stroke={TINT.four} strokeWidth={2} />

          {normalised ? (
            <>
              <line
                className="ep-anim"
                x1={sx(peak)}
                y1={16}
                x2={sx(peak)}
                y2={H - padB}
                stroke={TINT.three}
                strokeWidth={1.25}
                strokeDasharray="4 3"
              />
              <g className="ep-anim" transform={`translate(${sx(peak)}, 0)`}>
                <Tag x={6} y={28} tint={TINT.three}>
                  σ = r/√2 = {round(peak, 2)}
                </Tag>
              </g>
            </>
          ) : null}

          <circle
            className="ep-anim"
            cx={sx(sigma)}
            cy={sy(response(sigma))}
            r={5}
            fill={TINT.four}
          />
        </Canvas>
      </div>

      <Controls cols={2}>
        <Slider label="blob radius r" value={r} onChange={setR} min={4} max={26} step={0.5} />
        <Slider
          label="scale σ"
          value={sigma}
          onChange={setSigma}
          min={1}
          max={34}
          step={0.25}
          tint={TINT.four}
        />
      </Controls>

      <div className="mt-3">
        <Segmented
          label="Operator"
          value={normalised ? 'norm' : 'raw'}
          onChange={(v) => setNormalised(v === 'norm')}
          options={[
            { value: 'raw', label: 'Plain ∇²G' },
            { value: 'norm', label: 'Scale-normalised σ²∇²G' },
          ]}
        />
      </div>

      <Readout
        items={[
          {
            label: 'Characteristic scale',
            value: `σ* = r/√2 ≈ ${round(peak, 2)}`,
            tint: TINT.three,
          },
          { label: 'Current σ', value: round(sigma, 2), tint: TINT.four },
        ]}
      />

      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
        Switch to the plain Laplacian and the curve collapses monotonically — bigger σ always means
        a weaker response, so there is no peak to find and no way to compare scales. The σ² factor
        is what makes the response <em>comparable across scales</em>, and only then does a maximum
        appear at the blob&rsquo;s own size. That is the whole idea behind automatic scale
        selection.
      </p>
    </div>
  )
}

/* ================================================================== *
 *  Ratio test: why the second-best match is the useful signal.
 * ================================================================== */

export function RatioTestLab() {
  const [d1, setD1] = React.useState(0.35)
  const [d2, setD2] = React.useState(0.9)
  const [thr, setThr] = React.useState(0.75)

  const ratio = d1 / d2
  const accepted = ratio < thr

  const W = 420
  const H = 150
  const scale = (v: number) => 40 + v * (W - 90)

  return (
    <div>
      <Canvas w={W} h={H} aria-label="Ratio test: best versus second-best descriptor distance">
        <line x1={40} y1={70} x2={W - 30} y2={70} stroke="currentColor" opacity={0.2} />
        <Tag x={40} y={92}>
          0
        </Tag>
        <Tag x={W - 30} y={92} anchor="end">
          descriptor distance →
        </Tag>

        <circle cx={40} cy={70} r={5} fill="currentColor" />
        <Tag x={40} y={58} anchor="middle">
          f₁
        </Tag>

        <g className="ep-anim" transform={`translate(${scale(d1) - 40}, 0)`}>
          <line x1={40} y1={70} x2={40} y2={44} stroke={TINT.three} strokeWidth={2} />
          <circle cx={40} cy={40} r={5} fill={TINT.three} />
          <Tag x={40} y={32} anchor="middle" tint={TINT.three}>
            f₂ best
          </Tag>
        </g>

        <g className="ep-anim" transform={`translate(${scale(d2) - 40}, 0)`}>
          <line x1={40} y1={70} x2={40} y2={100} stroke={TINT.two} strokeWidth={2} />
          <circle cx={40} cy={104} r={5} fill={TINT.two} />
          <Tag x={40} y={120} anchor="middle" tint={TINT.two}>
            f₂′ runner-up
          </Tag>
        </g>

        <Tag x={W / 2} y={140} anchor="middle" tint={accepted ? TINT.three : TINT.two}>
          {accepted
            ? `r = ${round(ratio, 3)} < ${thr} — distinctive, keep the match`
            : `r = ${round(ratio, 3)} ≥ ${thr} — ambiguous, throw it away`}
        </Tag>
      </Canvas>

      <Controls cols={3}>
        <Slider
          label="‖f₁−f₂‖"
          value={d1}
          onChange={setD1}
          min={0.02}
          max={1}
          step={0.01}
          tint={TINT.three}
        />
        <Slider
          label="‖f₁−f₂′‖"
          value={d2}
          onChange={setD2}
          min={0.02}
          max={1}
          step={0.01}
          tint={TINT.two}
        />
        <Slider label="threshold" value={thr} onChange={setThr} min={0.4} max={1} step={0.01} />
      </Controls>

      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
        Notice you can drag both distances to be <em>large</em> and still accept the match. That is
        the point: the absolute distance depends on lighting, blur and the descriptor&rsquo;s scale,
        but the <em>ratio</em> asks a question that is invariant to all of that — &ldquo;is this
        match clearly better than the next one?&rdquo; Lowe&rsquo;s 0.75–0.8 is the usual cut.
      </p>
    </div>
  )
}

/* ================================================================== *
 *  Laplacian on the 3×3 patch from Exercise sheet 3.
 * ================================================================== */

export function LaplacianPatch() {
  const [centre, setCentre] = React.useState(120)
  const patch = [
    [80, 80, 80],
    [80, centre, 80],
    [80, 80, 80],
  ]
  const response = 80 + 80 + 80 + 80 - 4 * centre

  const CELL = 46

  return (
    <div>
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <div className="eyebrow mb-2">image patch I</div>
          <Canvas w={CELL * 3 + 2} h={CELL * 3 + 2} aria-label="3 by 3 image patch">
            {patch.map((row, y) =>
              row.map((v, x) => {
                const g = Math.round((v / 255) * 255)
                return (
                  <g key={`${y}-${x}`}>
                    <rect
                      className="ep-anim"
                      x={x * CELL + 1}
                      y={y * CELL + 1}
                      width={CELL - 2}
                      height={CELL - 2}
                      fill={`rgb(${g},${g},${g})`}
                      stroke="currentColor"
                      strokeOpacity={0.25}
                    />
                    <text
                      x={x * CELL + CELL / 2}
                      y={y * CELL + CELL / 2 + 4}
                      textAnchor="middle"
                      fontSize={13}
                      fontFamily="var(--font-mono)"
                      fill={g > 140 ? '#111' : '#eee'}
                    >
                      {v}
                    </text>
                  </g>
                )
              }),
            )}
          </Canvas>
        </div>

        <div className="font-display text-3xl opacity-40">∗</div>

        <div>
          <div className="eyebrow mb-2">kernel D</div>
          <Canvas w={CELL * 3 + 2} h={CELL * 3 + 2} aria-label="Discrete Laplacian kernel">
            {[
              [0, 1, 0],
              [1, -4, 1],
              [0, 1, 0],
            ].map((row, y) =>
              row.map((v, x) => (
                <g key={`${y}-${x}`}>
                  <rect
                    x={x * CELL + 1}
                    y={y * CELL + 1}
                    width={CELL - 2}
                    height={CELL - 2}
                    fill="currentColor"
                    fillOpacity={v === 0 ? 0.03 : 0.08}
                    stroke="currentColor"
                    strokeOpacity={0.25}
                  />
                  <text
                    x={x * CELL + CELL / 2}
                    y={y * CELL + CELL / 2 + 4}
                    textAnchor="middle"
                    fontSize={14}
                    fontFamily="var(--font-mono)"
                    fill={v < 0 ? TINT.two : v > 0 ? TINT.one : 'currentColor'}
                    opacity={v === 0 ? 0.35 : 1}
                  >
                    {v}
                  </text>
                </g>
              )),
            )}
          </Canvas>
        </div>

        <div className="font-display text-3xl opacity-40">=</div>

        <div>
          <div className="eyebrow mb-2">centre response</div>
          <div
            className="font-mono text-4xl tabular-nums transition-colors duration-200"
            style={{ color: response < 0 ? TINT.two : response > 0 ? TINT.one : undefined }}
          >
            {response}
          </div>
        </div>
      </div>

      <Controls cols={1}>
        <Slider label="centre pixel" value={centre} onChange={setCentre} min={0} max={255} />
      </Controls>

      <p className="mt-3 font-mono text-[13px] text-muted-foreground">
        80 + 80 + 80 + 80 − 4·{centre} = 320 − {4 * centre} = {response}
      </p>
      <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
        Slide the centre to 80 and the response is exactly 0 — a flat patch has no curvature. Push
        it brighter and the response goes strongly negative; darker and it goes positive. The
        Laplacian is measuring <em>how far this pixel sits from the average of its neighbours</em>,
        which is why an isolated dot lights it up far more than a straight edge does.
      </p>
    </div>
  )
}
