import * as React from 'react'
import { motion } from 'motion/react'
import { RotateCcw, StepForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Canvas, Controls, Readout, Slider, Tag, TINT } from './kit'
import { round } from '@/lib/utils'

/* ================================================================== *
 *  Marching squares: sign at the corners → a lookup table → a contour.
 *  Click the corners to toggle inside/outside.
 * ================================================================== */

/** Edge midpoints, indexed 0=top, 1=right, 2=bottom, 3=left. */
const EDGE: [number, number][] = [
  [0.5, 0],
  [1, 0.5],
  [0.5, 1],
  [0, 0.5],
]

/** Corner order: 0 = top-left, 1 = top-right, 2 = bottom-right, 3 = bottom-left. */
const CORNER: [number, number][] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
]

/** For each of the 16 configurations, which edge pairs get a segment. */
const TABLE: number[][][] = [
  [], // 0000
  [[3, 2]], // 0001  (corner 3 inside)
  [[2, 1]], // 0010
  [[3, 1]], // 0011
  [[1, 0]], // 0100
  [
    [3, 0],
    [1, 2],
  ], // 0101 — ambiguous
  [[2, 0]], // 0110
  [[3, 0]], // 0111
  [[0, 3]], // 1000
  [[0, 2]], // 1001
  [
    [0, 1],
    [2, 3],
  ], // 1010 — ambiguous
  [[0, 1]], // 1011
  [[1, 3]], // 1100
  [[1, 2]], // 1101
  [[2, 3]], // 1110
  [], // 1111
]

export function MarchingSquares() {
  const [inside, setInside] = React.useState([true, false, true, false])
  const idx = (inside[0] ? 8 : 0) + (inside[1] ? 4 : 0) + (inside[2] ? 2 : 0) + (inside[3] ? 1 : 0)
  const segs = TABLE[idx]
  const ambiguous = idx === 5 || idx === 10

  const S = 150
  const PAD = 34
  const W = S + PAD * 2
  const H = S + PAD * 2 + 20
  const px = (u: number) => PAD + u * S
  const py = (v: number) => PAD + v * S

  return (
    <div>
      <div className="flex flex-wrap items-center gap-8">
        <Canvas w={W} h={H} aria-label="Marching squares cell with toggleable corners">
          <rect
            x={px(0)}
            y={py(0)}
            width={S}
            height={S}
            fill="currentColor"
            fillOpacity={0.04}
            stroke="currentColor"
            strokeOpacity={0.25}
          />

          {/* the contour — an entrance animation, so Motion knows its start */}
          {segs.map((s, i) => (
            <motion.line
              key={`${idx}-${i}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              x1={px(EDGE[s[0]][0])}
              y1={py(EDGE[s[0]][1])}
              x2={px(EDGE[s[1]][0])}
              y2={py(EDGE[s[1]][1])}
              stroke={TINT.three}
              strokeWidth={3}
              strokeLinecap="round"
            />
          ))}

          {/* edge crossing points */}
          {segs.flat().map((e, i) => (
            <circle key={i} cx={px(EDGE[e][0])} cy={py(EDGE[e][1])} r={3.5} fill={TINT.three} />
          ))}

          {/* corners */}
          {CORNER.map(([u, v], i) => (
            <g
              key={i}
              onClick={() => setInside((s) => s.map((b, k) => (k === i ? !b : b)))}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={px(u)} cy={py(v)} r={11} fill="transparent" />
              <circle
                className="ep-anim"
                cx={px(u)}
                cy={py(v)}
                r={7}
                fill={inside[i] ? TINT.one : 'var(--background)'}
                stroke={inside[i] ? TINT.one : 'currentColor'}
                strokeOpacity={inside[i] ? 1 : 0.4}
                strokeWidth={2}
              />
            </g>
          ))}

          <Tag x={W / 2} y={H - 6} anchor="middle" tint={ambiguous ? TINT.two : undefined}>
            {ambiguous
              ? `case ${idx.toString(2).padStart(4, '0')} — ambiguous, two valid contours`
              : `case ${idx.toString(2).padStart(4, '0')} of 16`}
          </Tag>
        </Canvas>

        <div className="min-w-0 max-w-[36ch] text-[14.5px] leading-relaxed text-muted-foreground">
          <p className="mb-3">
            <span className="font-medium text-foreground">Click a corner</span> to flip it between
            inside (<span style={{ color: TINT.one }}>filled</span>, f &lt; 0) and outside (hollow,
            f &gt; 0).
          </p>
          <p className="mb-3">
            The only thing that matters is the <em>pattern of signs</em>. Four corners, two states
            each → 16 cases, all pre-computed in a table. In 3D it becomes 8 corners → 256 cases,
            which is exactly the marching-cubes lookup table.
          </p>
          <p>
            Where a segment endpoint sits along an edge comes from linearly interpolating the two
            corner values, which is what gives the mesh sub-voxel accuracy despite the coarse grid.
          </p>
        </div>
      </div>

      {ambiguous ? (
        <div className="mt-4 rounded-[12px] border border-tint-2/30 bg-tint-2/[0.07] px-4 py-3 text-[14.5px] leading-relaxed">
          Two diagonal corners inside, two outside. Do the two blobs touch or not? The cell simply
          does not contain the answer. Resolve it by subsampling inside the cell, or pick one of the
          two consistently — in 3D, picking inconsistently is what punches holes in the mesh.
        </div>
      ) : null}
    </div>
  )
}

/* ================================================================== *
 *  ICP: alternate nearest-neighbour assignment and the optimal rigid
 *  transform, and watch it converge (or fall into a local minimum).
 * ================================================================== */

type P = [number, number]

const TARGET: P[] = Array.from({ length: 26 }, (_, i) => {
  const t = (i / 25) * Math.PI * 1.35
  return [Math.cos(t) * 62 + Math.sin(t * 2.4) * 9, Math.sin(t) * 46]
})

function transform(pts: P[], th: number, tx: number, ty: number): P[] {
  const c = Math.cos(th)
  const s = Math.sin(th)
  return pts.map(([x, y]) => [c * x - s * y + tx, s * x + c * y + ty])
}

/** One ICP iteration: closest points, then the Kabsch/SVD rigid fit. */
function icpStep(src: P[], dst: P[]) {
  const pairs = src.map((p) => {
    let best = dst[0]
    let bd = Infinity
    for (const q of dst) {
      const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2
      if (d < bd) {
        bd = d
        best = q
      }
    }
    return [p, best] as [P, P]
  })

  const n = pairs.length
  const mx = pairs.reduce((s, [p]) => s + p[0], 0) / n
  const my = pairs.reduce((s, [p]) => s + p[1], 0) / n
  const qx = pairs.reduce((s, [, q]) => s + q[0], 0) / n
  const qy = pairs.reduce((s, [, q]) => s + q[1], 0) / n

  // 2D closed form: the optimal rotation angle from the cross-covariance.
  let sxy = 0
  let sxx = 0
  for (const [p, q] of pairs) {
    const ax = p[0] - mx
    const ay = p[1] - my
    const bx = q[0] - qx
    const by = q[1] - qy
    sxy += ax * by - ay * bx
    sxx += ax * bx + ay * by
  }
  const th = Math.atan2(sxy, sxx)
  const c = Math.cos(th)
  const s = Math.sin(th)
  const tx = qx - (c * mx - s * my)
  const ty = qy - (s * mx + c * my)

  const moved = src.map(([x, y]): P => [c * x - s * y + tx, s * x + c * y + ty])
  const err =
    pairs.reduce(
      (sum, [, q], i) => sum + (moved[i][0] - q[0]) ** 2 + (moved[i][1] - q[1]) ** 2,
      0,
    ) / n
  return { moved, pairs, err }
}

export function ICPLab() {
  const [initDeg, setInitDeg] = React.useState(35)
  const [initTx, setInitTx] = React.useState(38)
  const [iter, setIter] = React.useState(0)

  const start = React.useMemo(
    () => transform(TARGET, (initDeg * Math.PI) / 180, initTx, 16),
    [initDeg, initTx],
  )

  const { current, pairs, err } = React.useMemo(() => {
    let cur = start
    let ps: [P, P][] = []
    let e = Infinity
    for (let k = 0; k < iter; k++) {
      const r = icpStep(cur, TARGET)
      cur = r.moved
      ps = r.pairs
      e = r.err
    }
    if (iter === 0) {
      // Show the correspondences that the first step would use.
      ps = icpStep(cur, TARGET).pairs
      e =
        cur.reduce((s, p, i) => {
          const q = ps[i][1]
          return s + (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2
        }, 0) / cur.length
    }
    return { current: cur, pairs: ps, err: e }
  }, [start, iter])

  const W = 400
  const H = 220
  const cx = W / 2 - 10
  const cy = H / 2

  return (
    <div>
      <Canvas w={W} h={H} aria-label="Iterative closest point aligning two 2D point sets">
        <g transform={`translate(${cx}, ${cy})`}>
          {/* correspondences */}
          {pairs.map(([, q], i) => (
            <line
              key={i}
              className="ep-anim"
              x1={current[i][0]}
              y1={-current[i][1]}
              x2={q[0]}
              y2={-q[1]}
              stroke="currentColor"
              strokeOpacity={0.22}
              strokeWidth={1}
            />
          ))}
          {/* target */}
          {TARGET.map(([x, y], i) => (
            <circle key={i} cx={x} cy={-y} r={2.8} fill={TINT.two} />
          ))}
          {/* moving set */}
          {current.map(([x, y], i) => (
            <circle key={i} className="ep-anim" cx={x} cy={-y} r={2.8} fill={TINT.one} />
          ))}
        </g>
        <Tag x={10} y={16} tint={TINT.two}>
          target Y (fixed)
        </Tag>
        <Tag x={10} y={30} tint={TINT.one}>
          source X (moving)
        </Tag>
        <Tag x={W - 10} y={16} anchor="end">
          iteration {iter}
        </Tag>
      </Canvas>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" onClick={() => setIter((i) => i + 1)}>
          <StepForward /> One ICP iteration
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setIter((i) => i + 10)}>
          Run 10
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setIter(0)}>
          <RotateCcw /> Reset
        </Button>
      </div>

      <Controls cols={2}>
        <Slider
          label="initial rotation"
          value={initDeg}
          onChange={(v) => {
            setInitDeg(v)
            setIter(0)
          }}
          min={-180}
          max={180}
          unit="°"
        />
        <Slider
          label="initial offset"
          value={initTx}
          onChange={(v) => {
            setInitTx(v)
            setIter(0)
          }}
          min={-80}
          max={80}
        />
      </Controls>

      <Readout
        items={[
          {
            label: 'Mean squared residual',
            value: round(err, 3),
            tint: err < 1 ? TINT.three : undefined,
          },
          { label: 'Iterations', value: iter },
        ]}
      />

      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
        Start it near the answer and it snaps home in a handful of iterations. Now push the initial
        rotation past about 120° and step through: the residual still falls monotonically — ICP
        guarantees that — but it settles on a wrong alignment. That is the local-minimum failure,
        and it is why ICP is always a <em>refinement</em> step that needs a coarse global alignment
        first.
      </p>
    </div>
  )
}

/* ================================================================== *
 *  Back-projection: pixel + depth → 3D point (Exercise sheet 8).
 * ================================================================== */

export function BackProjectLab() {
  const [u, setU] = React.useState(420)
  const [v, setV] = React.useState(290)
  const [z, setZ] = React.useState(2)
  const fx = 500
  const fy = 500
  const cx = 320
  const cy = 240

  const X = ((u - cx) * z) / fx
  const Y = ((v - cy) * z) / fy

  const W = 380
  const H = 200
  const sx = (px: number) => 30 + (px / 640) * (W - 60)
  const sy = (py: number) => 20 + (py / 480) * (H - 50)

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        <Canvas
          w={W}
          h={H}
          aria-label="Image plane with the principal point and the selected pixel"
        >
          <rect
            x={sx(0)}
            y={sy(0)}
            width={sx(640) - sx(0)}
            height={sy(480) - sy(0)}
            fill="currentColor"
            fillOpacity={0.05}
            stroke="currentColor"
            strokeOpacity={0.25}
            rx={3}
          />
          <line
            x1={sx(cx)}
            y1={sy(0)}
            x2={sx(cx)}
            y2={sy(480)}
            stroke="currentColor"
            strokeOpacity={0.2}
            strokeDasharray="3 3"
          />
          <line
            x1={sx(0)}
            y1={sy(cy)}
            x2={sx(640)}
            y2={sy(cy)}
            stroke="currentColor"
            strokeOpacity={0.2}
            strokeDasharray="3 3"
          />
          <circle cx={sx(cx)} cy={sy(cy)} r={4} fill={TINT.four} />
          <Tag x={sx(cx) + 8} y={sy(cy) - 6} tint={TINT.four}>
            (cₓ, c_y)
          </Tag>

          <line
            className="ep-anim"
            x1={sx(cx)}
            y1={sy(cy)}
            x2={sx(u)}
            y2={sy(v)}
            stroke={TINT.one}
            strokeWidth={1.5}
          />
          <circle className="ep-anim" cx={sx(u)} cy={sy(v)} r={5.5} fill={TINT.one} />
          <Tag x={sx(0)} y={sy(0) - 6}>
            image, 640 × 480
          </Tag>
        </Canvas>

        <div className="min-w-[190px] rounded-[14px] border border-hairline bg-[var(--field-surface)] p-4 font-mono text-[13px] tabular-nums">
          <div className="eyebrow mb-2">camera-frame point</div>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">X</span>
              <span style={{ color: TINT.one }}>{round(X, 4)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Y</span>
              <span style={{ color: TINT.one }}>{round(Y, 4)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Z</span>
              <span style={{ color: TINT.one }}>{round(z, 4)}</span>
            </div>
          </div>
          <div className="mt-3 border-t border-hairline pt-2 text-[11px] leading-relaxed text-muted-foreground">
            X = (u − cₓ)·z / fₓ
            <br />Y = (v − c_y)·z / f_y
            <br />Z = z
          </div>
        </div>
      </div>

      <Controls cols={3}>
        <Slider label="u (px)" value={u} onChange={setU} min={0} max={640} tint={TINT.one} />
        <Slider label="v (px)" value={v} onChange={setV} min={0} max={480} tint={TINT.one} />
        <Slider label="depth z (m)" value={z} onChange={setZ} min={0.2} max={6} step={0.1} />
      </Controls>

      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
        Put the pixel exactly on the principal point and X and Y both go to zero, whatever the depth
        — that pixel looks straight down the optical axis. Everything else scales linearly with z,
        because a pixel is a <em>ray</em> and depth just says how far along it you are.
      </p>
    </div>
  )
}
