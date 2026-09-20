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
import { PinholeLab } from '@/components/viz/camera'
import { BackProjectLab } from '@/components/viz/surface'
import type { DrillSpec } from '@/components/learn/drill'
import type { TopicMeta } from './types'

export const meta: TopicMeta = {
  id: 'camera',
  n: 5,
  title: 'The camera: projection and calibration',
  kicker:
    'One division by depth turns a 3D world into a 2D picture — and destroys exactly the number you most want back.',
  lectures: ['L05 (pinhole)', 'L07 (calibration)'],
  exercises: ['Sheet 4, Ex 3', 'Sheet 8, Ex 1'],
  minutes: 30,
  stage: 'poses',
  sections: [
    { id: 'pinhole', title: 'The pinhole model' },
    { id: 'homogeneous', title: 'Projection as a matrix' },
    { id: 'lost', title: 'What the projection destroys' },
    { id: 'intrinsics', title: 'Intrinsics, extrinsics, four coordinate systems' },
    { id: 'calibration', title: 'Camera calibration' },
  ],
  sheet: [
    {
      name: 'Perspective projection',
      tex: '(x,y,z) \\mapsto \\left(-d\\,\\frac{x}{z},\\; -d\\,\\frac{y}{z}\\right)',
      note: 'Image plane at z = −d in front of the centre of projection.',
    },
    {
      name: 'As a matrix',
      tex: '\\begin{pmatrix}x\\\\y\\\\-z/d\\end{pmatrix} = \\begin{pmatrix}1&0&0&0\\\\0&1&0&0\\\\0&0&-1/d&0\\end{pmatrix}\\begin{pmatrix}x\\\\y\\\\z\\\\1\\end{pmatrix}',
    },
    {
      name: 'Intrinsics',
      tex: 'K = \\begin{pmatrix} f_x & 0 & c_x \\\\ 0 & f_y & c_y \\\\ 0 & 0 & 1\\end{pmatrix}',
    },
    {
      name: 'Full projection matrix',
      tex: 'P = K\\,[\\,R \\mid \\mathbf t\\,], \\qquad \\tilde{\\mathbf x} \\simeq P\\,\\tilde{\\mathbf X}',
    },
    {
      name: 'Back-projection with known depth',
      tex: 'X = \\frac{(u-c_x)z}{f_x}, \\quad Y = \\frac{(v-c_y)z}{f_y}, \\quad Z = z',
    },
  ],
}

export function Body() {
  return (
    <>
      <BigIdea oneLiner="Everything about a pinhole camera follows from one pair of similar triangles — and the division by z in that formula is the single reason computer vision is hard.">
        <p>
          Get the derivation from similar triangles into your hand, because every later chapter is a
          strategy for undoing that division. Two cameras (stereo), many cameras (multi-view),
          moving cameras (structure from motion), or learned priors — all of them are trying to
          recover the <T>{'z'}</T> that the projection divided away.
        </p>
      </BigIdea>

      <WhyCare>
        Perspective projection is the reason data augmentation on 3D-aware tasks is subtle. A random
        crop is a translation in the image, but it is <em>not</em> a translation of the camera — it
        changes the principal point, which changes the intrinsics your network implicitly learns.
        Networks that regress depth or pose are notoriously sensitive to exactly this, which is why
        modern monocular-depth models take intrinsics as an explicit input.
      </WhyCare>

      <Section
        id="pinhole"
        n={1}
        title="The pinhole model"
        lead="A centre of projection, an image plane, and the similar triangles between them."
      >
        <Concept
          intuition={
            <>
              Every ray of light that reaches the sensor has to pass through one point, the{' '}
              <strong>centre of projection</strong>. That point is the origin. The lecture places
              the image plane at <T>{'z = -d'}</T>, in front of the camera, which avoids the flipped
              image a physical pinhole produces.
            </>
          }
        />

        <Figure caption="Move the point. The faded dots share its viewing ray — they have different depths and project to exactly the same place.">
          <PinholeLab />
        </Figure>

        <Worked
          title="Derive the projection from similar triangles"
          source="Sheet 4 · Exercise 3.1"
          question={
            <>
              A 3D point <T>{'P = (x,y,z)'}</T> projects to <T>{"p = (x', y', -d)"}</T>. Derive{' '}
              <T>{"x' = -d\\,x/z"}</T> and <T>{"y' = -d\\,y/z"}</T>.
            </>
          }
          steps={[
            {
              label: 'Identify the two similar triangles',
              body: (
                <>
                  Both have their apex at the centre of projection. The large one is spanned by the
                  point: legs <T>{'z'}</T> (along the axis) and <T>{'x'}</T> (across). The small one
                  is spanned by its image: legs <T>{'-d'}</T> and <T>{"x'"}</T>.
                </>
              ),
            },
            {
              label: 'Equate the ratios',
              body: (
                <>
                  The two triangles share their angle at the apex, so corresponding sides are in the
                  same proportion:
                  <Tex>{"\\frac{z}{-d} = \\frac{x}{x'}"}</Tex>
                </>
              ),
            },
            {
              label: 'Solve',
              body: <Tex>{"x' = -d\\,\\frac{x}{z}"}</Tex>,
            },
            {
              label: 'Same argument in y',
              body: (
                <>
                  Nothing in the argument used the <T>{'x'}</T> axis specifically, so{' '}
                  <T>{"y' = -d\\,y/z"}</T> by the identical construction in the <T>{'y'}</T>–
                  <T>{'z'}</T> plane.
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'(x,y,z) \\mapsto (-d\\,x/z,\\; -d\\,y/z)'}</T>. The minus sign comes from the
              image plane being at negative <T>{'z'}</T>; drop it and you get the &ldquo;virtual
              image plane in front&rdquo; convention, which many books use instead.
            </>
          }
        />
      </Section>

      <Section
        id="homogeneous"
        n={2}
        title="Projection as a matrix"
        lead="A division cannot be a matrix — unless you use homogeneous coordinates and postpone it."
      >
        <FormulaCard name="Perspective projection in homogeneous coordinates">
          <Tex>
            {
              '\\begin{pmatrix} x \\\\ y \\\\ -z/d \\end{pmatrix} = \\begin{pmatrix} 1 & 0 & 0 & 0\\\\ 0 & 1 & 0 & 0\\\\ 0 & 0 & -1/d & 0\\end{pmatrix}\\begin{pmatrix} x\\\\ y\\\\ z\\\\ 1\\end{pmatrix}'
            }
          </Tex>
        </FormulaCard>

        <Concept
          title="Where the division went"
          intuition={
            <>
              The matrix produces a <em>homogeneous</em> 3-vector whose third coordinate is{' '}
              <T>{'-z/d'}</T>. Normalising — dividing by that third coordinate — is what performs
              the perspective division. So the nonlinearity has not disappeared; it has been moved
              into the final normalisation step.
            </>
          }
        >
          <Tex>
            {
              '\\begin{pmatrix}x\\\\y\\\\-z/d\\end{pmatrix} \\;\\longrightarrow\\; \\frac{1}{-z/d}\\begin{pmatrix}x\\\\y\\end{pmatrix} = \\begin{pmatrix}-d\\,x/z\\\\ -d\\,y/z\\end{pmatrix}'
            }
          </Tex>
          <p className="mt-2">
            The payoff: a chain of world → camera → image transformations is one matrix product, and
            you divide exactly once, at the very end.
          </p>
        </Concept>

        <Aside title="Depth controls everything">
          Notice that <T>{"x'"}</T> and <T>{"y'"}</T> are both inversely proportional to{' '}
          <T>{'z'}</T>. Double the depth and the projected point moves halfway towards the principal
          point; an object twice as far away appears half as large. That inverse relationship is the
          entire visual cue we call perspective, and it reappears verbatim as <T>{'z = fb/d'}</T> in
          the stereo chapter.
        </Aside>
      </Section>

      <Section
        id="lost"
        n={3}
        title="What the projection destroys"
        lead="The question the exercise sheet asks in one line, and that the whole course answers."
      >
        <Rule>
          <strong>Depth is lost.</strong> A 3D point has three degrees of freedom; its image has
          two. Every point on a viewing ray through the centre of projection maps to the{' '}
          <em>same</em> image point, so the projection is a many-to-one map and cannot be inverted.
          What survives from a single image is the <em>direction</em> to the point, not its
          distance.
        </Rule>

        <KeyList
          title="The consequences, spelled out"
          items={[
            {
              k: 'Absolute size is unknowable',
              v: 'A small near object and a large far one are literally indistinguishable — the classic forced-perspective photograph.',
            },
            {
              k: 'Angles and lengths are not preserved',
              v: 'Parallel lines converge at vanishing points; a square becomes a general quadrilateral. Only straight lines stay straight.',
            },
            {
              k: 'Occluded structure is gone',
              v: 'Not just compressed — absent. Nothing behind the visible surface reached the sensor.',
            },
            {
              k: 'The whole scene has a scale ambiguity',
              v: 'Scale the world by s and move the camera by s and the image is byte-for-byte identical. This reappears as the gauge freedom of structure from motion.',
            },
          ]}
        />

        <Pitfall>
          &ldquo;Depth is lost&rdquo; is not the same as &ldquo;nothing about depth survives&rdquo;.{' '}
          <em>Relative</em> depth cues do survive: occlusion ordering, texture gradients, known
          object sizes, shading. Monocular depth networks exploit exactly these. What is
          fundamentally unrecoverable from one image is <em>metric</em> depth in real units — hence,
          again, a scale ambiguity.
        </Pitfall>
      </Section>

      <Section
        id="intrinsics"
        n={4}
        title="Intrinsics, extrinsics, four coordinate systems"
        lead="World, camera, image, pixel. Know which one you are in, and what it costs to move between them."
      >
        <KeyList
          title="The four frames"
          items={[
            { k: 'World', v: 'Wherever you chose the origin. Metres, arbitrary orientation.' },
            {
              k: 'Camera',
              v: 'Origin at the centre of projection, z along the optical axis. Reached from world by the extrinsics (R, t).',
            },
            {
              k: 'Image',
              v: 'The normalised plane after dividing by z. Dimensionless, principal point at the origin.',
            },
            {
              k: 'Pixel',
              v: 'Integer row/column indices. Reached from image by the intrinsics K: scale by focal length in pixels, shift by the principal point.',
            },
          ]}
        />

        <FormulaCard
          name="Intrinsics"
          note="fx, fy in pixels; (cx, cy) the principal point in pixels. A skew term s sometimes sits at K₁₂ and is ~0 for real sensors."
        >
          <Tex>
            {'K = \\begin{pmatrix} f_x & 0 & c_x \\\\ 0 & f_y & c_y \\\\ 0 & 0 & 1\\end{pmatrix}'}
          </Tex>
        </FormulaCard>

        <FormulaCard name="The full camera">
          <Tex>
            {
              'P = K\\,[\\,R \\mid \\mathbf t\\,] \\in \\mathbb R^{3\\times4}, \\qquad \\tilde{\\mathbf x} \\simeq P\\,\\tilde{\\mathbf X}'
            }
          </Tex>
        </FormulaCard>

        <Figure caption="Back-projection: a pixel plus a depth gives a 3D point in the camera frame. Put the pixel on the principal point and X and Y vanish, whatever the depth.">
          <BackProjectLab />
        </Figure>

        <Worked
          title="From pixel and depth to a 3D point"
          source="Sheet 8 · Exercise 1.3–1.4"
          question={
            <>
              A calibrated camera observes pixel <T>{'(u,v)'}</T> with depth <T>{'z'}</T>. Derive{' '}
              <T>{'(X, Y, Z)'}</T> in camera coordinates, then evaluate for{' '}
              <T>{'f_x = f_y = 500'}</T>, <T>{'c_x = 320'}</T>, <T>{'c_y = 240'}</T>,{' '}
              <T>{'(u,v) = (420, 290)'}</T>, <T>{'z = 2'}</T>.
            </>
          }
          steps={[
            {
              label: 'Write the forward projection',
              body: (
                <>
                  <Tex>
                    {
                      '\\begin{pmatrix}u\\\\v\\\\1\\end{pmatrix} \\simeq K \\begin{pmatrix}X\\\\Y\\\\Z\\end{pmatrix} = \\begin{pmatrix} f_x X + c_x Z\\\\ f_y Y + c_y Z\\\\ Z\\end{pmatrix}'
                    }
                  </Tex>
                </>
              ),
            },
            {
              label: 'Normalise by the third coordinate',
              body: <Tex>{'u = f_x\\frac{X}{Z} + c_x, \\qquad v = f_y\\frac{Y}{Z} + c_y'}</Tex>,
            },
            {
              label: 'Invert, using the known depth Z = z',
              body: (
                <Tex>
                  {
                    'X = \\frac{(u - c_x)\\,z}{f_x}, \\qquad Y = \\frac{(v - c_y)\\,z}{f_y}, \\qquad Z = z'
                  }
                </Tex>
              ),
            },
            {
              label: 'Substitute the numbers',
              body: (
                <Tex>
                  {
                    'X = \\frac{(420-320)\\cdot 2}{500} = \\frac{200}{500} = 0.4, \\qquad Y = \\frac{(290-240)\\cdot 2}{500} = \\frac{100}{500} = 0.2'
                  }
                </Tex>
              ),
            },
          ]}
          answer={
            <>
              <T>{'(X, Y, Z) = (0.4,\\; 0.2,\\; 2)'}</T> metres in the camera frame. Note that the
              depth had to be <em>given</em> — a pixel alone determines only the ray{' '}
              <T>{'(0.2,\\,0.1,\\,1)^{\\mathsf T}\\,\\lambda'}</T>.
            </>
          }
        />

        <Deeper label="Why the intrinsics have that exact shape">
          <p>
            <T>{'f_x'}</T> and <T>{'f_y'}</T> differ when the sensor&rsquo;s pixels are not square:{' '}
            <T>{'f_x = f/s_x'}</T> where <T>{'f'}</T> is the focal length in millimetres and{' '}
            <T>{'s_x'}</T> the pixel width. Most modern sensors have square pixels, so{' '}
            <T>{'f_x \\approx f_y'}</T>.
          </p>
          <p className="mt-2">
            <T>{'(c_x, c_y)'}</T> is the principal point — where the optical axis meets the sensor.
            It is near the image centre but never exactly there, because the lens is never mounted
            perfectly. Getting it wrong biases every back-projected ray, which is why it is
            calibrated rather than assumed.
          </p>
          <p className="mt-2">
            Radial lens distortion does <em>not</em> fit in <T>{'K'}</T> — it is not a projective
            transformation. It is modelled separately, as a polynomial in the radius, and undone
            before anything else in the pipeline runs.
          </p>
        </Deeper>
      </Section>

      <Section
        id="calibration"
        n={5}
        title="Camera calibration"
        lead="Zhang's method, in the three steps the lecture gives."
      >
        <Rule tag="The procedure">
          <ol className="mt-1 list-decimal space-y-1.5 pl-5">
            <li>
              Capture a <em>known</em> calibration target (a checkerboard, whose geometry you know
              exactly) in several different poses.
            </li>
            <li>Detect features — the corners — in each image.</li>
            <li>
              Jointly optimise intrinsics and extrinsics: a closed-form solution initialises
              everything except the distortion parameters, then non-linear optimisation refines all
              of them by <strong>minimising reprojection error</strong>.
            </li>
          </ol>
        </Rule>

        <Concept
          title="Why a known target, and why several poses"
          intuition={
            <>
              Calibration has the same chicken-and-egg structure as everything else here: you cannot
              find the camera without knowing the 3D points, and you cannot find the 3D points
              without knowing the camera. A calibration target breaks the loop by <em>giving</em>{' '}
              you the 3D points for free.
            </>
          }
        >
          <p>
            Several poses are needed because one planar view does not constrain all the intrinsic
            parameters — a single homography has 8 degrees of freedom, which must cover both that
            view&rsquo;s pose and the intrinsics. Each additional pose adds 6 unknowns (its own{' '}
            <T>{'R, \\mathbf t'}</T>) but 8 constraints, so the intrinsics become over-determined
            and can be solved for.
          </p>
        </Concept>

        <Aside title="Calibration is not the same as pose estimation">
          Calibration gives you intrinsics <em>and</em> the extrinsics{' '}
          <em>relative to the target</em>. Point the camera at something else and those extrinsics
          are worthless — only the intrinsics carry over. That is the gap the next chapters fill:
          given the intrinsics, the relative rotation and translation between two <em>arbitrary</em>{' '}
          views is estimated from the images themselves, via the essential matrix.
        </Aside>
      </Section>
    </>
  )
}

export const drills: DrillSpec[] = [
  {
    id: 'cam-d1',
    topicId: 'camera',
    source: 'Sheet 4 · Ex 3.1–3.2',
    kind: 'compute',
    prompt: (
      <>
        Derive the pinhole projection formula from similar triangles, and write it as a matrix
        multiplication in homogeneous coordinates.
      </>
    ),
    hint: <>Two triangles sharing the apex at the centre of projection. Equate the side ratios.</>,
    answer: (
      <>
        The triangle spanned by <T>{'(x, z)'}</T> and the one spanned by <T>{"(x', -d)"}</T> share
        their apex angle, so <T>{"z/(-d) = x/x'"}</T>, giving <T>{"x' = -d\\,x/z"}</T>; the same
        construction in the <T>{'y'}</T>–<T>{'z'}</T> plane gives <T>{"y' = -d\\,y/z"}</T>.
        <br />
        <br />
        In homogeneous coordinates:
        <Tex>
          {
            '\\begin{pmatrix}x\\\\y\\\\-z/d\\end{pmatrix} = \\begin{pmatrix}1&0&0&0\\\\0&1&0&0\\\\0&0&-1/d&0\\end{pmatrix}\\begin{pmatrix}x\\\\y\\\\z\\\\1\\end{pmatrix}'
          }
        </Tex>
        The division is recovered by normalising the result by its third coordinate — which is why
        the operation can be written as a matrix at all.
      </>
    ),
  },
  {
    id: 'cam-d2',
    topicId: 'camera',
    source: 'Sheet 4 · Ex 3.3–3.4',
    kind: 'explain',
    prompt: (
      <>
        What information is lost in the projection from 3D to 2D, and how does depth <T>{'z'}</T>{' '}
        influence the projected position?
      </>
    ),
    answer: (
      <>
        <strong>What is lost:</strong> depth. A 3D point has three degrees of freedom, its image
        two. Every point on a ray through the centre of projection maps to the same image point, so
        the map is many-to-one and not invertible. From one image you recover the <em>direction</em>{' '}
        to a point, never its distance — hence also its absolute size, and hence a global scale
        ambiguity for the whole scene. Occluded structure is absent entirely.
        <br />
        <br />
        <strong>How z acts:</strong> <T>{"x' = -d\\,x/z"}</T> is <em>inversely</em> proportional to
        depth. Doubling <T>{'z'}</T> halves the displacement from the principal point, so distant
        objects appear smaller and move less between viewpoints. That inverse relationship is
        perspective, and it reappears exactly as <T>{'z = fb/d'}</T> in stereo.
      </>
    ),
  },
  {
    id: 'cam-d3',
    topicId: 'camera',
    source: 'Sheet 8 · Ex 1.4',
    kind: 'compute',
    prompt: (
      <>
        With <T>{'f_x = f_y = 500'}</T>, <T>{'c_x = 320'}</T>, <T>{'c_y = 240'}</T>, compute the 3D
        camera-frame point for pixel <T>{'(420, 290)'}</T> at depth <T>{'z = 2'}</T>.
      </>
    ),
    answer: (
      <>
        <Tex>
          {
            'X = \\frac{(420-320)\\cdot 2}{500} = 0.4, \\quad Y = \\frac{(290-240)\\cdot 2}{500} = 0.2, \\quad Z = 2'
          }
        </Tex>
        So <T>{'(X,Y,Z) = (0.4, 0.2, 2)'}</T>. The general formula is <T>{'X = (u-c_x)z/f_x'}</T>,{' '}
        <T>{'Y = (v-c_y)z/f_y'}</T>, <T>{'Z = z'}</T>, obtained by inverting{' '}
        <T>{'u = f_x X/Z + c_x'}</T>.
      </>
    ),
  },
  {
    id: 'cam-d4',
    topicId: 'camera',
    source: 'L07 · calibration',
    kind: 'explain',
    prompt: <>Describe camera calibration in three steps, and say what is being minimised.</>,
    answer: (
      <>
        <strong>1.</strong> Capture a known calibration target (checkerboard) in several distinct
        poses. <strong>2.</strong> Detect its features — the corners — in each image.{' '}
        <strong>3.</strong> Jointly optimise intrinsics and extrinsics: a closed-form solution
        initialises everything except the distortion coefficients, then non-linear optimisation
        refines all parameters.
        <br />
        <br />
        The objective is the <strong>reprojection error</strong>: project each known 3D corner
        through the current parameter estimate and sum the squared distances to where it was
        actually detected. Several poses are needed because one planar view cannot constrain all
        intrinsics — each extra pose adds 6 unknowns but 8 constraints, so the intrinsics become
        over-determined.
      </>
    ),
  },
]
