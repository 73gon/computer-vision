import * as React from 'react'
import { Canvas, Controls, Readout, Segmented, Slider, Tag, TINT } from './kit'
import { round } from '@/lib/utils'

/* ================================================================== *
 *  The 2D transformation hierarchy, as one continuous object.
 *  Each rung *adds* degrees of freedom; each rung *loses* an invariant.
 * ================================================================== */

type Kind = 'translation' | 'rigid' | 'similarity' | 'affine' | 'projective'

const KIND_INFO: Record<Kind, { dof: number; keeps: string }> = {
  translation: { dof: 2, keeps: 'orientation, lengths, angles, parallels, straight lines' },
  rigid: { dof: 3, keeps: 'lengths, angles, parallels, straight lines' },
  similarity: { dof: 4, keeps: 'angles (shape), parallels, straight lines' },
  affine: { dof: 6, keeps: 'parallels, straight lines' },
  projective: { dof: 8, keeps: 'straight lines only' },
}

/** The unit "house" — asymmetric on purpose so flips and shears are visible. */
const HOUSE: [number, number][] = [
  [0, 0],
  [1, 0],
  [1, 0.7],
  [0.5, 1.1],
  [0, 0.7],
]

function apply(H: number[][], p: [number, number]): [number, number] {
  const [x, y] = p
  const w = H[2][0] * x + H[2][1] * y + H[2][2]
  return [(H[0][0] * x + H[0][1] * y + H[0][2]) / w, (H[1][0] * x + H[1][1] * y + H[1][2]) / w]
}

export function TransformLab() {
  const [kind, setKind] = React.useState<Kind>('rigid')
  const [tx, setTx] = React.useState(1.2)
  const [ty, setTy] = React.useState(0.4)
  const [deg, setDeg] = React.useState(25)
  const [s, setS] = React.useState(1)
  const [shear, setShear] = React.useState(0.35)
  const [h31, setH31] = React.useState(-0.18)

  const th = (deg * Math.PI) / 180
  const c = Math.cos(th)
  const sn = Math.sin(th)

  const H = React.useMemo<number[][]>(() => {
    switch (kind) {
      case 'translation':
        return [
          [1, 0, tx],
          [0, 1, ty],
          [0, 0, 1],
        ]
      case 'rigid':
        return [
          [c, -sn, tx],
          [sn, c, ty],
          [0, 0, 1],
        ]
      case 'similarity':
        return [
          [s * c, -s * sn, tx],
          [s * sn, s * c, ty],
          [0, 0, 1],
        ]
      case 'affine':
        return [
          [s * c, -s * sn + shear, tx],
          [s * sn, s * c, ty],
          [0, 0, 1],
        ]
      case 'projective':
        return [
          [s * c, -s * sn + shear, tx],
          [s * sn, s * c, ty],
          [h31, 0.05, 1],
        ]
    }
  }, [kind, tx, ty, c, sn, s, shear, h31])

  const W = 460
  const Hgt = 230
  const U = 62 // pixels per unit
  const ox = 90
  const oy = Hgt - 60
  const toPx = ([x, y]: [number, number]): [number, number] => [ox + x * U, oy - y * U]

  const src = HOUSE.map(toPx)
  const dst = HOUSE.map((p) => toPx(apply(H, p)))
  const poly = (pts: [number, number][]) => pts.map((p) => p.join(',')).join(' ')

  const info = KIND_INFO[kind]

  return (
    <div>
      <Canvas w={W} h={Hgt} aria-label="2D transformation hierarchy">
        {/* axes */}
        <g stroke="currentColor" opacity={0.18} strokeWidth={1}>
          <line x1={20} y1={oy} x2={W - 12} y2={oy} />
          <line x1={ox} y1={18} x2={ox} y2={Hgt - 12} />
        </g>
        <Tag x={W - 14} y={oy + 14} anchor="end">
          x
        </Tag>
        <Tag x={ox - 8} y={26} anchor="end">
          y
        </Tag>

        {/* source */}
        <polygon
          points={poly(src)}
          fill="currentColor"
          fillOpacity={0.06}
          stroke="currentColor"
          strokeOpacity={0.45}
          strokeDasharray="3 3"
          strokeWidth={1.5}
        />
        <Tag x={src[0][0] - 4} y={src[0][1] + 15} anchor="middle">
          original
        </Tag>

        {/* transformed */}
        <polygon
          points={poly(dst)}
          fill={TINT.one}
          fillOpacity={0.16}
          stroke={TINT.one}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* correspondence hints on two corners keep the mapping legible */}
        {[0, 3].map((i) => (
          <line
            key={i}
            className="ep-anim"
            x1={src[i][0]}
            y1={src[i][1]}
            x2={dst[i][0]}
            y2={dst[i][1]}
            stroke={TINT.one}
            strokeOpacity={0.35}
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        ))}
      </Canvas>

      <div className="mt-3">
        <Segmented
          label="Transformation"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'translation', label: 'Translate' },
            { value: 'rigid', label: 'Rigid' },
            { value: 'similarity', label: 'Similarity' },
            { value: 'affine', label: 'Affine' },
            { value: 'projective', label: 'Projective' },
          ]}
        />
      </div>

      <Controls cols={3}>
        <Slider label="tx" value={tx} onChange={setTx} min={-0.5} max={3} step={0.05} />
        <Slider label="ty" value={ty} onChange={setTy} min={-1} max={1.5} step={0.05} />
        <Slider
          label="θ"
          value={deg}
          onChange={setDeg}
          min={-180}
          max={180}
          unit="°"
          className={kind === 'translation' ? 'pointer-events-none opacity-30' : ''}
        />
        <Slider
          label="scale s"
          value={s}
          onChange={setS}
          min={0.3}
          max={2}
          step={0.05}
          className={
            kind === 'translation' || kind === 'rigid' ? 'pointer-events-none opacity-30' : ''
          }
        />
        <Slider
          label="shear"
          value={shear}
          onChange={setShear}
          min={-0.8}
          max={0.8}
          step={0.02}
          className={
            kind === 'affine' || kind === 'projective' ? '' : 'pointer-events-none opacity-30'
          }
        />
        <Slider
          label="h₃₁ (perspective)"
          value={h31}
          onChange={setH31}
          min={-0.4}
          max={0.25}
          step={0.01}
          className={kind === 'projective' ? '' : 'pointer-events-none opacity-30'}
        />
      </Controls>

      <Readout
        items={[
          { label: 'Degrees of freedom', value: info.dof },
          { label: 'Still preserved', value: info.keeps },
        ]}
      />

      <div className="mt-4 overflow-x-auto rounded-[10px] border border-hairline bg-[var(--field-surface)] p-3">
        <table className="font-mono text-[12px] tabular-nums">
          <tbody>
            {H.map((row, i) => (
              <tr key={i}>
                {row.map((v, j) => (
                  <td
                    key={j}
                    className="px-3 py-0.5 text-right"
                    style={{
                      color:
                        i === 2 && j < 2 && v !== 0
                          ? 'var(--tint-2)'
                          : j === 2 && i < 2
                            ? 'var(--tint-1)'
                            : undefined,
                    }}
                  >
                    {round(v, 3)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ================================================================== *
 *  Homogeneous coordinates: one Euclidean point, infinitely many
 *  homogeneous representatives — and what happens as w → 0.
 * ================================================================== */

export function HomogeneousLab() {
  const [w, setW] = React.useState(1)
  const x = 3
  const y = 2

  const W = 420
  const H = 220
  const U = 34
  const ox = 60
  const oy = H - 40

  // The ray through the origin in (x̃, ỹ, w̃); we draw the (x̃, w̃) slice.
  const px = ox + x * w * U * 0.9
  const py = oy - w * U * 1.6

  const nearInfinity = w < 0.16

  return (
    <div>
      <Canvas w={W} h={H} aria-label="Homogeneous coordinates: the ray and the w = 1 slice">
        <g stroke="currentColor" opacity={0.18} strokeWidth={1}>
          <line x1={26} y1={oy} x2={W - 14} y2={oy} />
          <line x1={ox} y1={16} x2={ox} y2={H - 14} />
        </g>
        <Tag x={W - 16} y={oy + 14} anchor="end">
          x̃
        </Tag>
        <Tag x={ox - 8} y={24} anchor="end">
          w̃
        </Tag>

        {/* the w = 1 image plane */}
        <line
          x1={26}
          y1={oy - U * 1.6}
          x2={W - 14}
          y2={oy - U * 1.6}
          stroke={TINT.three}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          opacity={0.8}
        />
        <Tag x={W - 16} y={oy - U * 1.6 - 7} anchor="end" tint={TINT.three}>
          w̃ = 1 — the Euclidean plane
        </Tag>

        {/* the ray of equivalent representatives */}
        <line
          x1={ox}
          y1={oy}
          x2={ox + x * 3.2 * U * 0.9}
          y2={oy - 3.2 * U * 1.6}
          stroke={TINT.one}
          strokeWidth={1.25}
          opacity={0.45}
        />

        {/* representatives at several scales */}
        {[0.5, 1, 1.5, 2, 2.5].map((k) => (
          <circle
            key={k}
            cx={ox + x * k * U * 0.9}
            cy={oy - k * U * 1.6}
            r={2.5}
            fill={TINT.one}
            opacity={0.35}
          />
        ))}

        {/* its projection onto w = 1 */}
        <line
          className="ep-anim"
          x1={px}
          y1={py}
          x2={ox + x * U * 0.9}
          y2={oy - U * 1.6}
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="2 3"
          opacity={0.4}
        />
        <circle cx={ox + x * U * 0.9} cy={oy - U * 1.6} r={4} fill={TINT.three} />

        {/* the live point */}
        <circle
          className="ep-anim"
          cx={px}
          cy={py}
          r={5.5}
          fill={nearInfinity ? TINT.two : TINT.one}
        />

        <g className="ep-anim" transform={`translate(${px}, ${py})`}>
          <Tag x={10} y={-6} tint={nearInfinity ? TINT.two : TINT.one}>
            {`(${round(x * w, 2)}, ${round(y * w, 2)}, ${round(w, 2)})`}
          </Tag>
        </g>

        {nearInfinity ? (
          <Tag x={W / 2} y={H - 10} anchor="middle" tint={TINT.two}>
            w̃ → 0 : the ray never meets w̃ = 1 — a point at infinity (a pure direction)
          </Tag>
        ) : null}
      </Canvas>

      <Controls cols={1}>
        <Slider
          label="scale w̃"
          value={w}
          onChange={setW}
          min={0}
          max={3}
          step={0.01}
          tint={nearInfinity ? TINT.two : TINT.one}
        />
      </Controls>

      <Readout
        items={[
          {
            label: 'Homogeneous',
            value: `(${round(x * w, 2)}, ${round(y * w, 2)}, ${round(w, 2)})`,
          },
          {
            label: 'Euclidean (÷ w̃)',
            value: nearInfinity ? 'undefined — direction (3, 2)' : `(${x}, ${y})`,
            tint: nearInfinity ? TINT.two : TINT.three,
          },
        ]}
      />
    </div>
  )
}
