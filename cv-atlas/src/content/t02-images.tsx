import { T, Tex } from '@/components/ui/tex'
import {
  Aside,
  BigIdea,
  Concept,
  Deeper,
  Figure,
  FormulaCard,
  KeyList,
  Pitfall,
  Rule,
  Section,
  WhyCare,
  Worked,
} from '@/components/learn/primitives'
import { HomogeneousLab, TransformLab } from '@/components/viz/transforms'
import type { DrillSpec } from '@/components/learn/drill'
import type { TopicMeta } from './types'

export const meta: TopicMeta = {
  id: 'images',
  n: 2,
  title: 'Digital images and 2D transformations',
  kicker:
    'A picture is a function on a grid. Adding a third coordinate to a 2D point turns every geometric transformation into one matrix multiply.',
  lectures: ['L02 Digital Images', 'L02 notebook'],
  exercises: ['Sheet 1, Ex 1–3'],
  minutes: 30,
  stage: 'images',
  sections: [
    { id: 'image', title: 'What an image actually is' },
    { id: 'quantisation', title: 'Two kinds of quantisation' },
    { id: 'homogeneous', title: 'Homogeneous coordinates' },
    { id: 'hierarchy', title: 'The transformation hierarchy' },
    { id: 'warping', title: 'Warping in practice' },
  ],
  sheet: [
    {
      name: 'Digital image',
      tex: 'f_{\\text{gray}} : \\mathbb Z^2 \\supset D \\to \\{v \\in \\mathbb Z \\mid 0 \\le v < 2^8\\}',
    },
    {
      name: 'Homogeneous point',
      tex: '\\tilde{\\mathbf x} = \\tilde w\\,(x, y, 1)^{\\mathsf T}',
      note: 'Divide by the third coordinate to get back to Euclidean. w̃ = 0 is a point at infinity.',
    },
    {
      name: 'Rotation',
      tex: 'R = \\begin{pmatrix}\\cos\\theta & -\\sin\\theta\\\\ \\sin\\theta & \\cos\\theta\\end{pmatrix}',
      note: 'Orthonormal: RᵀR = I, det R = 1.',
    },
    {
      name: 'Rigid body',
      tex: "\\tilde{\\mathbf x}' = \\begin{pmatrix} R & \\mathbf t \\\\ \\mathbf 0^{\\mathsf T} & 1\\end{pmatrix}\\tilde{\\mathbf x}",
      note: 'Preserves distances. 3 DoF in 2D.',
    },
    {
      name: 'Homography',
      tex: "x' = \\dfrac{h_{11}x + h_{12}y + h_{13}w}{h_{31}x+h_{32}y+h_{33}w}",
      note: 'Preserves straight lines only. 8 DoF.',
    },
  ],
}

export function Body() {
  return (
    <>
      <BigIdea oneLiner="An image is a function from a grid of coordinates to a set of measured values — and every geometric change you want to make to it is a 3×3 matrix.">
        <p>
          Two ideas do all the work here. First, be precise about what is discrete and what is
          continuous: the coordinates are quantised by the sensor, the intensities by the converter,
          and those are separate decisions. Second, homogeneous coordinates: by carrying one extra
          number per point, translation, rotation, scaling, shear and perspective all become the
          same operation — matrix multiply — and therefore compose by multiplying matrices.
        </p>
      </BigIdea>

      <WhyCare>
        Data augmentation is this topic, applied. Every random rotation, crop, flip and perspective
        jitter in a training pipeline is one rung on the hierarchy below, and knowing which
        invariants a rung destroys tells you which augmentations are safe for your task. Warp a
        digit by a homography and you may have changed the label; warp it rigidly and you have not.
      </WhyCare>

      <Section
        id="image"
        n={1}
        title="What an image actually is"
        lead="The definition the exam wants, in one line, plus the notation the lecture uses."
      >
        <FormulaCard
          name="An image, in general"
          note="D-dimensional coordinates, C-dimensional values."
        >
          <Tex>{'f : \\mathbb{Z}^D \\to \\mathbb{Z}^C'}</Tex>
        </FormulaCard>

        <Concept
          intuition={
            <>
              A pixel is not a little square. It is a <em>tuple</em>: a position and a value,{' '}
              <T>{'p = (\\mathbf x, \\mathbf v)'}</T>. The grid of positions is one design choice;
              the set of possible values is another.
            </>
          }
        >
          <p>
            For the usual case — a 2D grayscale image with 8-bit intensities — that specialises to
          </p>
          <Tex>
            {
              'f_{\\text{gray}} : \\mathbb Z \\times \\mathbb Z \\to \\{v \\in \\mathbb Z \\mid 0 \\le v < 2^8\\}'
            }
          </Tex>
          <p className="mt-2">
            and because the grid is finite and regular, such an image is exactly an <T>{'n'}</T>
            -dimensional array — which is why you can write it as a matrix and hand it to NumPy.
          </p>
        </Concept>

        <Worked
          title="Domain, codomain and pixel count"
          source="Sheet 1 · Exercise 1"
          question={
            <>
              An image has resolution <T>{'2048 \\times 1536'}</T> with 8-bit grayscale intensities.
              Define its domain and codomain mathematically, give the pixel count, and the number of
              intensity levels.
            </>
          }
          steps={[
            {
              label: 'Domain — the sampled coordinates',
              body: (
                <>
                  A finite, discrete grid:
                  <Tex>
                    {
                      'D = \\{0,1,\\dots,2047\\} \\times \\{0,1,\\dots,1535\\} \\subset \\mathbb Z^2'
                    }
                  </Tex>
                </>
              ),
            },
            {
              label: 'Codomain — the quantised intensities',
              body: (
                <>
                  <Tex>{'C = \\{0, 1, \\dots, 255\\} \\subset \\mathbb Z'}</Tex>
                  so the image is the map <T>{'f : D \\to C'}</T>.
                </>
              ),
            },
            {
              label: 'Pixel count',
              body: <Tex>{'2048 \\times 1536 = 3{,}145{,}728 \\approx 3.1\\text{ MP}'}</Tex>,
            },
            {
              label: 'Intensity levels',
              body: (
                <>
                  <T>{'2^8 = 256'}</T> distinct values per pixel.
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'f : \\{0..2047\\}\\times\\{0..1535\\} \\to \\{0..255\\}'}</T>; 3 145 728 pixels;
              256 intensity levels each. (Total raw size: ~3.1 MB for one channel.)
            </>
          }
        />
      </Section>

      <Section
        id="quantisation"
        n={2}
        title="Two kinds of quantisation"
        lead="They happen at different places in the camera, and they degrade the image in completely different ways."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[16px] border border-hairline bg-card p-4">
            <div className="eyebrow mb-2">Coordinates — the source domain</div>
            <p className="text-[15px] leading-relaxed">
              Fixed by the <em>physical placement of the photo diodes</em>: a 2048×1536 grid.
              Sampling the continuous image plane. Too coarse and you lose detail — and worse, you
              get aliasing, where fine structure masquerades as coarse structure that was never
              there.
            </p>
          </div>
          <div className="rounded-[16px] border border-hairline bg-card p-4">
            <div className="eyebrow mb-2">Intensities — the target domain</div>
            <p className="text-[15px] leading-relaxed">
              Fixed during <em>A/D conversion</em> (say 16 bit) and again during processing (say
              conversion to 8-bit JPEG). Too coarse and you get banding in smooth gradients, and you
              lose the ability to distinguish nearby brightness levels at all.
            </p>
          </div>
        </div>

        <Rule>
          Quantising the <em>coordinates</em> is sampling — it decides which points in space you
          measure. Quantising the <em>intensities</em> is rounding — it decides how finely you can
          report each measurement. They are independent: you can have a huge image with 1-bit
          values, or a 4×4 image with 32-bit floats.
        </Rule>
      </Section>

      <Section
        id="homogeneous"
        n={3}
        title="Homogeneous coordinates"
        lead="Carry one extra number, and translation becomes a matrix multiply like everything else."
      >
        <Concept
          intuition={
            <>
              A 2D point becomes a <em>ray</em> through the origin in 3D. Every point on that ray is
              the same 2D point; you recover it by sliding down to the plane{' '}
              <T>{'\\tilde w = 1'}</T>. Rays that never reach that plane — the ones with{' '}
              <T>{'\\tilde w = 0'}</T> — are directions, points at infinity.
            </>
          }
        >
          <Tex>
            {
              '\\mathbf x = (x, y)^{\\mathsf T} \\;\\longleftrightarrow\\; \\tilde{\\mathbf x} = (\\tilde x, \\tilde y, \\tilde w)^{\\mathsf T} = \\tilde w\\,(x, y, 1)^{\\mathsf T}'
            }
          </Tex>
        </Concept>

        <Figure caption="Drag the scale. The same Euclidean point has infinitely many homogeneous representatives; only w̃ = 0 has none.">
          <HomogeneousLab />
        </Figure>

        <Worked
          title="Two representatives of one point"
          source="Sheet 1 · Exercise 2"
          question={
            <>
              Write <T>{'\\mathbf x = (4, 2)^{\\mathsf T}'}</T> in homogeneous coordinates, show
              that <T>{'\\tilde{\\mathbf x}_1 = (4,2,1)'}</T> and{' '}
              <T>{'\\tilde{\\mathbf x}_2 = (8,4,2)'}</T> are the same point, and say what{' '}
              <T>{'\\tilde w = 0'}</T> means.
            </>
          }
          steps={[
            {
              label: 'The canonical lift',
              body: (
                <>
                  Append a 1: <T>{'\\tilde{\\mathbf x} = (4, 2, 1)^{\\mathsf T}'}</T>.
                </>
              ),
            },
            {
              label: 'Normalise both by dividing by the third coordinate',
              body: <Tex>{'\\frac{1}{1}(4,2) = (4,2), \\qquad \\frac{1}{2}(8,4) = (4,2)'}</Tex>,
            },
            {
              label: 'Why they are equal',
              body: (
                <>
                  <T>{'\\tilde{\\mathbf x}_2 = 2\\,\\tilde{\\mathbf x}_1'}</T>: homogeneous
                  coordinates are only defined up to a non-zero scale, so scalar multiples are the
                  same point.
                </>
              ),
            },
            {
              label: 'The w̃ = 0 case',
              body: (
                <>
                  Dividing by zero is impossible — the ray is parallel to the plane{' '}
                  <T>{'\\tilde w = 1'}</T> and never meets it. Such a point has no Euclidean
                  counterpart; it is a <em>point at infinity</em>, encoding a pure direction. Two
                  parallel lines meet at one.
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'(4,2,1)'}</T>; the two are equal because they differ by the non-zero scale 2;{' '}
              <T>{'\\tilde w = 0'}</T> is a point at infinity — a direction, not a location.
            </>
          }
        />

        <Aside title="Why bother">
          In Euclidean coordinates, rotation is <T>{"\\mathbf x' = R\\mathbf x"}</T> but translation
          is <T>{"\\mathbf x' = \\mathbf x + \\mathbf t"}</T> — a multiply and an add, which do not
          compose neatly. In homogeneous coordinates both are multiplies, so a chain of twenty
          transformations collapses into <em>one</em> matrix you compute once. Perspective
          projection, which is a division, also becomes a multiply followed by one normalisation at
          the very end.
        </Aside>
      </Section>

      <Section
        id="hierarchy"
        n={4}
        title="The transformation hierarchy"
        lead="Five rungs. Each adds degrees of freedom and gives up an invariant. Know both columns."
      >
        <Figure caption="Each rung unlocks more sliders. Watch what survives: the house stops being rigid, then stops being similar, then its parallel walls stop being parallel.">
          <TransformLab />
        </Figure>

        <KeyList
          title="The table to memorise"
          items={[
            {
              k: 'Translation — 2 DoF',
              v: 'Preserves orientation, lengths, angles, parallels, straight lines. Matrix: [I | t].',
            },
            {
              k: 'Rigid / Euclidean — 3 DoF',
              v: 'Rotation + translation. Preserves lengths (hence angles, parallels, lines). Matrix: [R | t].',
            },
            {
              k: 'Similarity — 4 DoF',
              v: 'Adds a uniform scale s. Preserves angles and shape, not size. Matrix: [sR | t].',
            },
            {
              k: 'Affine — 6 DoF',
              v: 'Unconstrained top two rows, so shear is allowed. Preserves parallel lines; angles are gone.',
            },
            {
              k: 'Projective / homography — 8 DoF',
              v: 'Full 3×3 (up to scale). Preserves straight lines only. Requires homogeneous coordinates and a final division.',
            },
          ]}
        />

        <FormulaCard
          name="The perspective case, written out"
          note="Note the division — this is the only rung that is not linear in Euclidean coordinates."
        >
          <Tex>
            {
              "x' = \\frac{h_{11}x + h_{12}y + h_{13}w}{h_{31}x + h_{32}y + h_{33}w}, \\qquad y' = \\frac{h_{21}x + h_{22}y + h_{23}w}{h_{31}x + h_{32}y + h_{33}w}"
            }
          </Tex>
        </FormulaCard>

        <Worked
          title="Rotate by 90°, then translate"
          source="Sheet 1 · Exercise 3"
          question={
            <>
              Take <T>{'\\mathbf x = (1,2)^{\\mathsf T}'}</T>, rotate by{' '}
              <T>{'\\theta = 90^\\circ'}</T> about the origin, then translate by{' '}
              <T>{'\\mathbf t = (3,1)^{\\mathsf T}'}</T>. Give <T>{'R'}</T>, the result, the
              homogeneous matrix, and explain why distances are preserved.
            </>
          }
          steps={[
            {
              label: 'The rotation matrix',
              body: (
                <>
                  <Tex>
                    {
                      'R = \\begin{pmatrix}\\cos 90^\\circ & -\\sin 90^\\circ\\\\ \\sin 90^\\circ & \\cos 90^\\circ\\end{pmatrix} = \\begin{pmatrix}0 & -1\\\\ 1 & 0\\end{pmatrix}'
                    }
                  </Tex>
                </>
              ),
            },
            {
              label: 'Rotate',
              body: (
                <Tex>
                  {
                    'R\\mathbf x = \\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}\\begin{pmatrix}1\\\\2\\end{pmatrix} = \\begin{pmatrix}0\\cdot1 + (-1)\\cdot 2\\\\ 1\\cdot 1 + 0\\cdot 2\\end{pmatrix} = \\begin{pmatrix}-2\\\\1\\end{pmatrix}'
                  }
                </Tex>
              ),
            },
            {
              label: 'Translate',
              body: (
                <Tex>
                  {
                    "\\mathbf x' = R\\mathbf x + \\mathbf t = \\begin{pmatrix}-2\\\\1\\end{pmatrix} + \\begin{pmatrix}3\\\\1\\end{pmatrix} = \\begin{pmatrix}1\\\\2\\end{pmatrix}"
                  }
                </Tex>
              ),
            },
            {
              label: 'In homogeneous form',
              body: (
                <Tex>
                  {
                    'A = \\begin{pmatrix} R & \\mathbf t\\\\ \\mathbf 0^{\\mathsf T} & 1\\end{pmatrix} = \\begin{pmatrix}0 & -1 & 3\\\\ 1 & 0 & 1\\\\ 0 & 0 & 1\\end{pmatrix}'
                  }
                </Tex>
              ),
            },
            {
              label: 'Why distances survive',
              body: (
                <>
                  <T>{'R'}</T> is orthonormal, so <T>{'R^{\\mathsf T}R = I'}</T> and{' '}
                  <T>
                    {
                      '\\lVert R\\mathbf u\\rVert^2 = \\mathbf u^{\\mathsf T}R^{\\mathsf T}R\\mathbf u = \\lVert \\mathbf u\\rVert^2'
                    }
                  </T>
                  . For two points, the translation cancels in the difference:{' '}
                  <T>{"\\mathbf x' - \\mathbf y' = R(\\mathbf x - \\mathbf y)"}</T>, whose length is
                  unchanged.
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'R = \\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}'}</T>,{' '}
              <T>{"\\mathbf x' = (1,2)^{\\mathsf T}"}</T> (the point happens to land back on
              itself), homogeneous matrix{' '}
              <T>{'\\begin{pmatrix}0&-1&3\\\\1&0&1\\\\0&0&1\\end{pmatrix}'}</T>. Distances are
              preserved because the linear part is orthonormal and translation cancels in
              differences.
            </>
          }
        />

        <Pitfall>
          <T>{'R\\mathbf x + \\mathbf t'}</T> is <em>not</em> the same as{' '}
          <T>{'R(\\mathbf x + \\mathbf t)'}</T>. Rotate first, then translate — the homogeneous
          matrix <T>{'\\begin{pmatrix}R & \\mathbf t\\\\ \\mathbf 0 & 1\\end{pmatrix}'}</T> encodes
          exactly that order. Swapping them gives <T>{'R\\mathbf x + R\\mathbf t'}</T>, a different
          point.
        </Pitfall>
      </Section>

      <Section
        id="warping"
        n={5}
        title="Warping in practice"
        lead="The notebook's two questions, and why they matter more than they look."
      >
        <Concept
          title="Why the warped image has speckles"
          intuition={
            <>
              If you loop over <em>input</em> pixels and push each one to its rounded output
              location, several inputs can land on the same output pixel while other output pixels
              get nothing at all. The ones that get nothing stay black — those are the speckles.
            </>
          }
        >
          <p>
            The fix is to run the loop the other way. For each <em>output</em> pixel, apply the{' '}
            <em>inverse</em> transformation to find where it came from in the input, and read that
            value — interpolating, since the source location will not be an integer. Every output
            pixel gets written exactly once, so there are no holes. This is called{' '}
            <em>inverse (backward) warping</em>, and it is what every real implementation does.
          </p>
        </Concept>

        <Deeper label="The other notebook question: why is a grayscale array shown in colour?">
          Because <code className="font-mono text-[0.9em]">imshow</code> applies a default colormap
          (viridis) to a single-channel array. The data is grayscale; the display is not. Pass{' '}
          <code className="font-mono text-[0.9em]">cmap=&apos;gray&apos;</code> — and also{' '}
          <code className="font-mono text-[0.9em]">vmin=0, vmax=255</code>, otherwise the colormap
          is rescaled to the array&apos;s own min and max and two images become incomparable. That
          autoscaling is a genuinely common source of &ldquo;my filter did nothing / my filter did
          everything&rdquo; confusion.
        </Deeper>

        <Rule>
          Forward warping scatters and leaves holes. Backward warping gathers and never does. When
          asked &ldquo;why the speckles&rdquo;, the answer is: forward mapping with rounding is
          neither injective nor surjective on the pixel grid.
        </Rule>
      </Section>
    </>
  )
}

export const drills: DrillSpec[] = [
  {
    id: 'img-d1',
    topicId: 'images',
    source: 'Sheet 1 · Ex 1.4',
    kind: 'explain',
    prompt: (
      <>
        Explain the difference between quantisation of coordinates and quantisation of intensities.
      </>
    ),
    answer: (
      <>
        <strong>Coordinates</strong> are quantised by <em>sampling</em>: the sensor has a finite
        grid of photo diodes (e.g. 2048×1536), so the continuous image plane is measured only at
        those positions. Consequence of too-coarse sampling: lost detail and aliasing.
        <br />
        <br />
        <strong>Intensities</strong> are quantised by <em>rounding</em> during A/D conversion (e.g.
        16 bit) and during later processing (e.g. saving as 8-bit JPEG). Consequence of too-coarse
        quantisation: banding, and an inability to distinguish nearby brightness values.
        <br />
        <br />
        They are independent choices — one affects the domain of <T>{'f'}</T>, the other its
        codomain.
      </>
    ),
  },
  {
    id: 'img-d2',
    topicId: 'images',
    source: 'Sheet 1 · Ex 2.3',
    kind: 'explain',
    prompt: (
      <>
        What is the geometric meaning of a homogeneous point with third coordinate{' '}
        <T>{'\\tilde w = 0'}</T>?
      </>
    ),
    answer: (
      <>
        It is a <em>point at infinity</em> — an ideal point. Normalising means dividing by{' '}
        <T>{'\\tilde w'}</T>, which is impossible here: geometrically, the ray through the origin in{' '}
        <T>{'\\mathbb R^3'}</T> is parallel to the plane <T>{'\\tilde w = 1'}</T> and never meets
        it. Such a point encodes a pure <em>direction</em> rather than a location. Families of
        parallel lines meet there, which is exactly what makes perspective vanishing points
        expressible — and why the epipole of a rectified stereo pair &ldquo;is at infinity&rdquo;.
      </>
    ),
  },
  {
    id: 'img-d3',
    topicId: 'images',
    source: 'Sheet 1 · Ex 3',
    kind: 'compute',
    prompt: (
      <>
        Rotate <T>{'(1,2)^{\\mathsf T}'}</T> by 90° about the origin and then translate by{' '}
        <T>{'(3,1)^{\\mathsf T}'}</T>. Give the result and the 3×3 homogeneous matrix.
      </>
    ),
    hint: (
      <>
        <T>{'\\cos 90^\\circ = 0'}</T>, <T>{'\\sin 90^\\circ = 1'}</T>. Rotate first.
      </>
    ),
    answer: (
      <>
        <T>{'R = \\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}'}</T>, so{' '}
        <T>{'R\\mathbf x = (-2, 1)^{\\mathsf T}'}</T> and{' '}
        <T>{"\\mathbf x' = (-2,1)^{\\mathsf T} + (3,1)^{\\mathsf T} = (1,2)^{\\mathsf T}"}</T>.
        <br />
        <br />
        Homogeneous form:{' '}
        <T>{'\\begin{pmatrix}0 & -1 & 3\\\\ 1 & 0 & 1\\\\ 0 & 0 & 1\\end{pmatrix}'}</T>. It
        preserves distances because <T>{'R'}</T> is orthonormal (<T>{'R^{\\mathsf T}R = I'}</T>) and
        translation cancels when you subtract two transformed points.
      </>
    ),
  },
  {
    id: 'img-d4',
    topicId: 'images',
    source: 'L02',
    kind: 'choose',
    prompt: <>Which transformation preserves parallel lines but not angles?</>,
    options: ['Rigid body', 'Similarity', 'Affine', 'Projective'],
    correct: 2,
    answer: (
      <>
        <strong>Affine.</strong> Its top two rows are unconstrained, which allows shear — so angles
        change — but the bottom row is still <T>{'(0,0,1)'}</T>, so there is no perspective division
        and parallel lines stay parallel. Rigid and similarity preserve angles too (more than
        asked); projective preserves only straight lines (less than asked).
      </>
    ),
  },
  {
    id: 'img-d5',
    topicId: 'images',
    source: 'L02 notebook',
    kind: 'explain',
    prompt: <>Why does a naively warped image contain black speckles, and how do you fix it?</>,
    answer: (
      <>
        The naive implementation is <em>forward</em> warping: loop over input pixels, apply{' '}
        <T>{'A'}</T>, round to the nearest integer output location, copy the value. Rounding is not
        a bijection on the grid — two inputs can collide onto one output while other outputs receive
        nothing. The untouched outputs stay at their initial value (black): the speckles.
        <br />
        <br />
        Fix: <em>backward</em> warping. Loop over output pixels, apply <T>{'A^{-1}'}</T> to find the
        source location, and interpolate (bilinear) the input there. Every output is written exactly
        once, so no holes appear.
      </>
    ),
  },
]
