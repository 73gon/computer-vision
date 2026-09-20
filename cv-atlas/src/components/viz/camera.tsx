import * as React from 'react'
import { Canvas, Controls, Readout, Slider, Tag, TINT } from './kit'
import { round } from '@/lib/utils'

/* ================================================================== *
 *  Pinhole projection: one 3D point, similar triangles, and the
 *  information that never comes back.
 * ================================================================== */

export function PinholeLab() {
  const [x, setX] = React.useState(2)
  const [z, setZ] = React.useState(6)
  const [d, setD] = React.useState(2)

  const W = 460
  const H = 250
  const ox = 120 // centre of projection, in screen px
  const oy = H / 2
  const U = 34 // px per world unit

  const xp = (-d * x) / z // projected coordinate on the plane at z = −d
  const planeX = ox - d * U

  const px = ox + z * U * 0.9
  const py = oy - x * U
  const projY = oy - xp * U

  // Extend the ray a little past the image plane, so it reads as a ray.
  const rayEndX = planeX - 44
  const rayEndY = oy + ((rayEndX - ox) / (px - ox)) * (py - oy)

  return (
    <div>
      <Canvas w={W} h={H} aria-label="Pinhole camera projecting a 3D point onto the image plane">
        {/* optical axis */}
        <line x1={20} y1={oy} x2={W - 12} y2={oy} stroke="currentColor" opacity={0.18} />
        <Tag x={W - 14} y={oy + 14} anchor="end">
          z
        </Tag>

        {/* image plane at z = -d */}
        <line
          className="ep-anim"
          x1={planeX}
          y1={30}
          x2={planeX}
          y2={H - 30}
          stroke={TINT.three}
          strokeWidth={2}
        />
        <g className="ep-anim" transform={`translate(${planeX}, 0)`}>
          <Tag x={-6} y={26} anchor="end" tint={TINT.three}>
            image plane, z = −d
          </Tag>
        </g>

        {/* the ray — every point on it maps to the same pixel */}
        <line
          className="ep-anim"
          x1={px}
          y1={py}
          x2={rayEndX}
          y2={rayEndY}
          stroke={TINT.one}
          strokeWidth={1.25}
          strokeDasharray="3 3"
          opacity={0.55}
        />

        {/* other points on the same ray — the lost dimension, made visible */}
        {[0.45, 0.7, 1.35, 1.8].map((k) => (
          <circle
            key={k}
            className="ep-anim"
            cx={ox + z * k * U * 0.9}
            cy={oy - x * k * U}
            r={3}
            fill={TINT.one}
            opacity={0.3}
          />
        ))}

        {/* similar-triangle guides */}
        <line
          className="ep-anim"
          x1={ox}
          y1={oy}
          x2={px}
          y2={oy}
          stroke={TINT.one}
          strokeWidth={1}
          opacity={0.35}
        />
        <line
          className="ep-anim"
          x1={px}
          y1={oy}
          x2={px}
          y2={py}
          stroke={TINT.one}
          strokeWidth={1}
          opacity={0.35}
        />

        {/* centre of projection */}
        <circle cx={ox} cy={oy} r={4.5} fill="currentColor" />
        <Tag x={ox + 8} y={oy + 16}>
          COP
        </Tag>

        {/* the point and its projection */}
        <circle className="ep-anim" cx={px} cy={py} r={6} fill={TINT.one} />
        <circle className="ep-anim" cx={planeX} cy={projY} r={5} fill={TINT.three} />

        <g className="ep-anim" transform={`translate(${px}, ${py})`}>
          <Tag x={10} y={-8} tint={TINT.one}>
            P = (x, z)
          </Tag>
        </g>
        <g className="ep-anim" transform={`translate(${(ox + px) / 2}, ${oy})`}>
          <Tag x={0} y={-5} anchor="middle" tint={TINT.one}>
            z
          </Tag>
        </g>
        <g className="ep-anim" transform={`translate(${px}, ${(oy + py) / 2})`}>
          <Tag x={6} y={0} tint={TINT.one}>
            x
          </Tag>
        </g>
        <g className="ep-anim" transform={`translate(${(ox + planeX) / 2}, ${oy})`}>
          <Tag x={0} y={14} anchor="middle" tint={TINT.three}>
            d
          </Tag>
        </g>
        <g className="ep-anim" transform={`translate(${planeX}, ${(oy + projY) / 2})`}>
          <Tag x={-8} y={0} anchor="end" tint={TINT.three}>
            x′
          </Tag>
        </g>
      </Canvas>

      <Controls cols={3}>
        <Slider
          label="x (height)"
          value={x}
          onChange={setX}
          min={-3}
          max={3}
          step={0.1}
          tint={TINT.one}
        />
        <Slider
          label="z (depth)"
          value={z}
          onChange={setZ}
          min={1.2}
          max={9}
          step={0.1}
          tint={TINT.one}
        />
        <Slider
          label="d (focal)"
          value={d}
          onChange={setD}
          min={0.6}
          max={2.6}
          step={0.05}
          tint={TINT.three}
        />
      </Controls>

      <Readout
        items={[
          { label: 'x′ = −d·x/z', value: round(xp, 3), tint: TINT.three },
          { label: 'Similar triangles', value: `x/z = ${round(x / z, 3)} = −x′/d` },
        ]}
      />

      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
        The faded dots sit on the same ray. They have completely different depths and they all land
        on the <em>same</em> image point. That is the information the projection throws away, and it
        is why a single image can never determine a scene: you would need a second ray, from a
        second viewpoint, to pin the point down. Everything in the rest of this course is a way of
        getting that second ray.
      </p>
    </div>
  )
}

/* ================================================================== *
 *  Epipolar geometry: move a point in the left image, watch its
 *  epipolar line sweep the right image.
 * ================================================================== */

export function EpipolarLab() {
  const [py, setPy] = React.useState(0.35)
  const [converge, setConverge] = React.useState(0.25)

  const IW = 190
  const IH = 140
  const GAP = 30
  const W = IW * 2 + GAP
  const H = IH + 78

  // The epipole in the right image moves with the convergence angle:
  // parallel cameras ⇒ epipole at infinity ⇒ horizontal epipolar lines.
  const ex = IW + GAP + IW * (0.5 + converge * 2.2)
  const ey = 26 + IH * 0.5

  // The epipolar line passes through the epipole and the corresponding height.
  const anchorX = IW + GAP + IW * 0.55
  const anchorY = 26 + IH * py

  const dx = anchorX - ex
  const dy = anchorY - ey
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len

  const clipId = React.useId()

  return (
    <div>
      <Canvas
        w={W}
        h={H}
        aria-label="A point in the left image and its epipolar line in the right image"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={IW + GAP} y={26} width={IW} height={IH} rx={4} />
          </clipPath>
        </defs>

        {/* left image */}
        <rect
          x={0}
          y={26}
          width={IW}
          height={IH}
          rx={4}
          fill="currentColor"
          fillOpacity={0.05}
          stroke="currentColor"
          strokeOpacity={0.2}
        />
        <Tag x={0} y={18} tint={TINT.one}>
          left image
        </Tag>
        <circle className="ep-anim" cx={IW * 0.55} cy={26 + IH * py} r={5.5} fill={TINT.one} />
        <g className="ep-anim" transform={`translate(0, ${26 + IH * py})`}>
          <Tag x={IW * 0.55 + 10} y={-6} tint={TINT.one}>
            x
          </Tag>
        </g>

        {/* right image */}
        <rect
          x={IW + GAP}
          y={26}
          width={IW}
          height={IH}
          rx={4}
          fill="currentColor"
          fillOpacity={0.05}
          stroke="currentColor"
          strokeOpacity={0.2}
        />
        <Tag x={IW + GAP} y={18} tint={TINT.two}>
          right image
        </Tag>

        <g clipPath={`url(#${clipId})`}>
          {/* the whole pencil of epipolar lines, faint */}
          {[0.15, 0.3, 0.5, 0.7, 0.85].map((t) => {
            const ax = IW + GAP + IW * 0.55
            const ay = 26 + IH * t
            const ddx = ax - ex
            const ddy = ay - ey
            const l = Math.hypot(ddx, ddy) || 1
            return (
              <line
                key={t}
                className="ep-anim"
                x1={ex - (ddx / l) * 400}
                y1={ey - (ddy / l) * 400}
                x2={ex + (ddx / l) * 400}
                y2={ey + (ddy / l) * 400}
                stroke={TINT.two}
                strokeWidth={1}
                opacity={0.18}
              />
            )
          })}

          <line
            className="ep-anim"
            x1={ex - ux * 400}
            y1={ey - uy * 400}
            x2={ex + ux * 400}
            y2={ey + uy * 400}
            stroke={TINT.two}
            strokeWidth={2}
          />

          {/* candidate correspondences live only on this line */}
          {[-40, 0, 40].map((k) => (
            <circle
              key={k}
              className="ep-anim"
              cx={anchorX + ux * k}
              cy={anchorY + uy * k}
              r={3.5}
              fill={TINT.two}
              opacity={0.55}
            />
          ))}
        </g>

        {/* the epipole, when it is inside the frame */}
        {ex < IW + GAP + IW + 30 && ex > IW + GAP - 30 ? (
          <>
            <circle className="ep-anim" cx={ex} cy={ey} r={4} fill={TINT.four} />
            <g className="ep-anim" transform={`translate(${ex}, ${ey})`}>
              <Tag x={8} y={-6} tint={TINT.four}>
                e′
              </Tag>
            </g>
          </>
        ) : null}

        <Tag x={W / 2} y={H - 8} anchor="middle">
          {Math.abs(converge) < 0.02
            ? 'parallel cameras → epipole at infinity → epipolar lines are horizontal scanlines'
            : 'the search for the match collapses from a 2D image to a 1D line'}
        </Tag>
      </Canvas>

      <Controls cols={2}>
        <Slider
          label="point height"
          value={py}
          onChange={setPy}
          min={0.1}
          max={0.9}
          step={0.01}
          tint={TINT.one}
        />
        <Slider
          label="convergence"
          value={converge}
          onChange={setConverge}
          min={-0.3}
          max={0.6}
          step={0.01}
          tint={TINT.four}
        />
      </Controls>

      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
        Drag <em>convergence</em> to zero and every epipolar line becomes horizontal. That is
        rectification, and it is why the whole dense-stereo chapter can assume &ldquo;search along
        the same row&rdquo;. All the epipolar lines in one image meet at the epipole — the image of
        the other camera&rsquo;s centre.
      </p>
    </div>
  )
}
