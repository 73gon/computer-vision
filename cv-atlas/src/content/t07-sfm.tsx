import { T, Tex } from '@/components/ui/tex'
import {
  Aside,
  BigIdea,
  Concept,
  Deeper,
  FormulaCard,
  KeyList,
  Pitfall,
  Rule,
  Section,
  WhyCare,
  Worked,
} from '@/components/learn/primitives'
import type { DrillSpec } from '@/components/learn/drill'
import type { TopicMeta } from './types'

export const meta: TopicMeta = {
  id: 'sfm',
  n: 7,
  title: 'Structure from motion and bundle adjustment',
  kicker:
    'You need the cameras to find the points, and the points to find the cameras. Solve both at once by minimising one number: how far the predicted pixels land from the observed ones.',
  lectures: ['L07 Structure from Motion'],
  exercises: ['Sheet 6, Ex 1–2'],
  minutes: 35,
  stage: 'poses',
  sections: [
    { id: 'problem', title: 'The chicken-and-egg problem' },
    { id: 'scale', title: 'Scale ambiguity, made concrete' },
    { id: 'ba', title: 'Bundle adjustment' },
    { id: 'pipeline', title: 'The full pipeline' },
  ],
  sheet: [
    {
      name: 'Bundle adjustment objective',
      tex: 'g(\\mathbf X, R, T) = \\sum_{i=1}^{m}\\sum_{j=1}^{n} w_{ij}\\,\\big\\lVert \\pi(R_j, \\mathbf t_j, \\mathbf X_i) - \\mathbf p_{ij}\\big\\rVert^2',
      note: 'w_ij = 1 if point i is visible in camera j, else 0.',
    },
    {
      name: 'Parameter count (calibrated)',
      tex: '6n + 3m',
      note: 'n cameras × (3 rotation + 3 translation) + m points × 3.',
    },
    {
      name: 'Residual count (full visibility)',
      tex: '2\\,n\\,m',
      note: 'Each observation contributes two coordinates, u and v.',
    },
    {
      name: '1D pinhole (Exercise 6)',
      tex: 'u = \\dfrac{X - t}{Z}',
    },
  ],
}

export function Body() {
  return (
    <>
      <BigIdea oneLiner="Structure from motion computes where the cameras were and where the points are, simultaneously, by making the predicted image of every point land as close as possible to where it was actually seen.">
        <p>
          The name splits the output: <strong>structure</strong> is the 3D point positions,{' '}
          <strong>motion</strong> is the camera parameters. The input is nothing but 2D point
          correspondences. And the whole thing hangs on one scalar objective — the sum of squared
          reprojection errors.
        </p>
      </BigIdea>

      <WhyCare>
        Bundle adjustment is a non-linear least-squares problem with tens of thousands of parameters
        and a very particular sparsity pattern (each residual touches one camera and one point). It
        is solved with Levenberg–Marquardt, which is Gauss–Newton with a trust region — the same
        family as the second-order optimisers you meet in ML, and it works here for the same reason
        it fails there: the problem is small enough, and structured enough, to exploit the Hessian.
      </WhyCare>

      <Section
        id="problem"
        n={1}
        title="The chicken-and-egg problem"
        lead="Two unknowns that each need the other. The way out is to stop solving and start optimising."
      >
        <Concept
          intuition={
            <>
              Triangulation needs the camera poses. Pose estimation needs the 3D points. Neither is
              available. SfM refuses to pick one and instead treats both as unknowns in a single
              optimisation.
            </>
          }
        >
          <KeyList
            items={[
              {
                k: 'Input',
                v: 'Images with 2D points in correspondence: p_{i,j} = (u_{i,j}, v_{i,j}) — point i, seen in image j.',
              },
              {
                k: 'Output — structure',
                v: 'A 3D location X_i for each tracked point.',
              },
              {
                k: 'Output — motion',
                v: 'Camera parameters R_j, t_j for each view, and possibly K_j too if uncalibrated.',
              },
              {
                k: 'Objective',
                v: 'Minimise the reprojection error — the pixel distance between where a point is predicted to appear and where it was observed.',
              },
            ]}
          />
        </Concept>

        <Aside title="Why not just chain trifocal tensors?">
          The geometry of three views is a <T>{'3\\times3\\times3'}</T> trifocal tensor, four views
          a <T>{'3\\times3\\times3\\times3'}</T> quadrifocal tensor — and after that it stops being
          tractable. So instead of algebraic multi-view constraints, SfM solves explicitly for
          camera poses and scene geometry. This scales: the Trevi Fountain collection in the lecture
          is 466 photos and over 100 000 3D points, and &ldquo;Rome in a day&rdquo; ran ~200 000
          images on ~500 cores.
        </Aside>
      </Section>

      <Section
        id="scale"
        n={2}
        title="Scale ambiguity, made concrete"
        lead="The exercise sheet's 1D world strips the problem down to five numbers, so the ambiguity is impossible to miss."
      >
        <Worked
          title="SfM in a 1D world"
          source="Sheet 6 · Exercise 1.1–1.3"
          question={
            <>
              Cameras with a 1D sensor, projection <T>{'u = (X - t)/Z'}</T>. Camera 1 at{' '}
              <T>{'t_1 = 0'}</T>, camera 2 at unknown <T>{'t'}</T>. Point A is seen at{' '}
              <T>{'u_{1A}=2,\\ u_{2A}=1'}</T>; point B at <T>{'u_{1B}=-1,\\ u_{2B}=-2'}</T>. Set up
              the system, explain why it has no unique solution, then fix <T>{'t = 1'}</T> and
              solve.
            </>
          }
          steps={[
            {
              label: 'Write the four projection equations',
              body: (
                <Tex>
                  {
                    '\\frac{X_A}{Z_A} = 2,\\quad \\frac{X_A - t}{Z_A} = 1,\\quad \\frac{X_B}{Z_B} = -1,\\quad \\frac{X_B - t}{Z_B} = -2'
                  }
                </Tex>
              ),
            },
            {
              label: 'Count',
              body: (
                <>
                  <strong>4 equations</strong>, and <strong>5 unknowns</strong>:{' '}
                  <T>{'X_A, Z_A, X_B, Z_B'}</T> and the camera position <T>{'t'}</T>. One short.
                </>
              ),
            },
            {
              label: 'Why there is no unique solution',
              body: (
                <>
                  Scale everything by <T>{'s'}</T> — every point <em>and</em> the baseline. Then
                  <Tex>{'\\frac{sX - st}{sZ} = \\frac{X - t}{Z} = u'}</Tex>
                  so the predicted images are <em>identical</em>. A one-parameter family of scenes
                  produces exactly the same pictures. This is the{' '}
                  <strong>global scale ambiguity</strong>, the fundamental gauge freedom of
                  structure from motion: from images alone you recover shape, never absolute size.
                </>
              ),
            },
            {
              label: 'Fix the gauge: set t = 1',
              body: <>Now there are 4 equations in 4 unknowns.</>,
            },
            {
              label: 'Solve for point A — subtract the pair',
              body: (
                <>
                  <Tex>
                    {
                      '\\frac{X_A}{Z_A} - \\frac{X_A - 1}{Z_A} = \\frac{1}{Z_A} = 2 - 1 = 1 \\;\\Longrightarrow\\; Z_A = 1'
                    }
                  </Tex>
                  and then <T>{'X_A = 2 Z_A = 2'}</T>.
                </>
              ),
            },
            {
              label: 'Same trick for point B',
              body: (
                <>
                  <Tex>
                    {
                      '\\frac{1}{Z_B} = -1 - (-2) = 1 \\;\\Longrightarrow\\; Z_B = 1, \\qquad X_B = -1\\cdot Z_B = -1'
                    }
                  </Tex>
                </>
              ),
            },
          ]}
          answer={
            <>
              4 equations, 5 unknowns → underdetermined by exactly one, the global scale. With{' '}
              <T>{'t = 1'}</T>: <T>{'P_A = (2, 1)'}</T> and <T>{'P_B = (-1, 1)'}</T>.
              <br />
              <br />
              Note the shortcut: subtracting the two views of a point leaves{' '}
              <T>{'t/Z = u_1 - u_2'}</T> — the 1D version of <T>{'z = fb/d'}</T>, with the
              difference of image positions playing the role of disparity.
            </>
          }
        />

        <Rule>
          Scale ambiguity is not a defect of the algorithm, it is a property of the{' '}
          <em>information</em>. The only cures are external: measure one distance in the scene, use
          a known object size, or use a stereo rig whose baseline you measured. This is exactly why
          monocular SLAM drifts in scale and stereo SLAM does not.
        </Rule>

        <Worked
          title="Reprojection error of a guess"
          source="Sheet 6 · Exercise 1.4"
          question={
            <>
              With <T>{'t = 1'}</T>, <T>{'P_A = (2.5, 1.5)'}</T> and <T>{'P_B = (-1.5, 1.2)'}</T>,
              compute the exact sum of squared reprojection errors.
            </>
          }
          steps={[
            {
              label: 'Predict all four image coordinates',
              body: (
                <Tex>
                  {
                    '\\hat u_{1A} = \\frac{2.5}{1.5} = \\frac53, \\quad \\hat u_{2A} = \\frac{2.5-1}{1.5} = 1, \\quad \\hat u_{1B} = \\frac{-1.5}{1.2} = -\\frac54, \\quad \\hat u_{2B} = \\frac{-2.5}{1.2} = -\\frac{25}{12}'
                  }
                </Tex>
              ),
            },
            {
              label: 'Subtract the observations and square',
              body: <Tex>{'\\left(2 - \\tfrac53\\right)^2 = \\tfrac19, \\qquad (1-1)^2 = 0'}</Tex>,
            },
            {
              label: 'And for B',
              body: (
                <Tex>
                  {
                    '\\left(-1 + \\tfrac54\\right)^2 = \\tfrac1{16}, \\qquad \\left(-2 + \\tfrac{25}{12}\\right)^2 = \\left(\\tfrac1{12}\\right)^2 = \\tfrac1{144}'
                  }
                </Tex>
              ),
            },
            {
              label: 'Sum over a common denominator',
              body: (
                <Tex>
                  {
                    '\\frac19 + 0 + \\frac1{16} + \\frac1{144} = \\frac{16}{144} + \\frac{9}{144} + \\frac{1}{144} = \\frac{26}{144} = \\frac{13}{72}'
                  }
                </Tex>
              ),
            },
          ]}
          answer={
            <>
              <T>
                {
                  '\\displaystyle\\sum (u_{\\text{obs}} - u_{\\text{pred}})^2 = \\frac{13}{72} \\approx 0.1806'
                }
              </T>
              . This single number is what bundle adjustment drives towards zero — at the true
              solution <T>{'P_A=(2,1), P_B=(-1,1)'}</T> it is exactly 0.
            </>
          }
        />
      </Section>

      <Section
        id="ba"
        n={3}
        title="Bundle adjustment"
        lead="The same idea at full scale: every camera, every point, one objective."
      >
        <FormulaCard
          name="The objective"
          note="π is the projection of point X_i through camera (R_j, t_j); p_ij is where it was observed."
        >
          <Tex>
            {
              'g(\\mathbf X, R, T) = \\sum_{i=1}^{m}\\sum_{j=1}^{n} w_{ij}\\,\\Big\\lVert \\pi\\big(R_j, \\mathbf t_j, \\mathbf X_i\\big) - \\mathbf p_{ij}\\Big\\rVert^2'
            }
          </Tex>
        </FormulaCard>

        <Rule tag="The indicator variable">
          <T>{'w_{ij} = 1'}</T> if point <T>{'i'}</T> is visible in image <T>{'j'}</T>, and 0
          otherwise. It matters enormously: in a real photo collection each point appears in only a
          handful of the images, so the visibility matrix is extremely sparse. Without{' '}
          <T>{'w_{ij}'}</T> the objective would penalise a camera for not reproducing a point it
          never saw. With it, the Jacobian inherits the sparsity — which is the only reason bundle
          adjustment on 100 000 points is computable at all.
        </Rule>

        <Worked
          title="Counting parameters and residuals"
          source="Sheet 6 · Exercise 2.1–2.2"
          question={
            <>
              Given <T>{'n'}</T> calibrated cameras and <T>{'m'}</T> 3D points, how many parameters
              are optimised? If every point is visible in every camera, how many individual
              residuals are accumulated?
            </>
          }
          steps={[
            {
              label: 'Per camera',
              body: (
                <>
                  A rotation has 3 degrees of freedom (three Euler angles, or an axis–angle vector,
                  or a unit quaternion with its norm constraint) and a translation has 3. So{' '}
                  <strong>6 per camera</strong> — the intrinsics are known, since the cameras are
                  calibrated.
                </>
              ),
            },
            {
              label: 'Per point',
              body: (
                <>
                  <T>{'(X, Y, Z)'}</T>: <strong>3 per point</strong>.
                </>
              ),
            },
            {
              label: 'Total parameters',
              body: <Tex>{'6n + 3m'}</Tex>,
            },
            {
              label: 'Residuals',
              body: (
                <>
                  Each visible observation is a 2D image point, so it contributes <em>two</em>{' '}
                  coordinate values <T>{'(u, v)'}</T>, i.e. two residuals. With full visibility
                  there are <T>{'n\\,m'}</T> observations:
                  <Tex>{'2\\,n\\,m \\ \\text{residuals}'}</Tex>
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'6n + 3m'}</T> parameters and <T>{'2nm'}</T> residuals. For <T>{'n = 466'}</T> and{' '}
              <T>{'m = 100{,}000'}</T> that is about 302 796 parameters — which is why sparsity is
              not an optimisation, it is a precondition.
            </>
          }
        />

        <Concept
          title="Why it is a non-linear least squares problem"
          intuition={
            <>
              The <em>objective</em> is a sum of squares, which is the &ldquo;least squares&rdquo;
              part. The <em>model inside</em> the squares is non-linear, which is the other part.
            </>
          }
        >
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              The projection <T>{'\\pi'}</T> divides by depth: <T>{'u = f\\,X_c/Z_c + c_x'}</T> is a
              rational function of the parameters, not a linear one.
            </li>
            <li>
              Rotations are non-linear in any minimal parameterisation — sines and cosines of the
              Euler angles, or the quadratic terms of a quaternion.
            </li>
            <li>
              The unknown 3D point enters through <T>{'R_j \\mathbf X_i + \\mathbf t_j'}</T>, so
              camera and point parameters <em>multiply</em> each other. Even before the division
              this is bilinear, not linear.
            </li>
          </ul>
          <p className="mt-3">
            Consequently there is no closed form. It is solved iteratively, by linearising around
            the current estimate — Gauss–Newton, stabilised as <strong>Levenberg–Marquardt</strong>,
            which interpolates between Gauss–Newton (fast near the solution) and gradient descent
            (safe far from it).
          </p>
        </Concept>

        <Pitfall>
          Because it is non-linear and non-convex, bundle adjustment needs a{' '}
          <em>good initialisation</em> and will happily converge to a local minimum from a bad one.
          That is why SfM is incremental: solve two views, triangulate, add one camera at a time
          (resection/PnP), and re-run BA after each addition, so the optimiser never starts far from
          a solution.
        </Pitfall>

        <Deeper label="Gauge freedom, precisely">
          The objective is invariant under a global similarity transform of the whole
          reconstruction: rotate everything (3 DoF), translate everything (3 DoF), scale everything
          (1 DoF) and every predicted pixel is unchanged. So{' '}
          <strong>7 degrees of freedom are unobservable</strong> and the Hessian is rank-deficient
          by 7. Implementations handle this by fixing the first camera at the origin and fixing one
          distance (often the baseline to the second camera), or by adding a soft gauge prior.
        </Deeper>
      </Section>

      <Section
        id="pipeline"
        n={4}
        title="The full pipeline"
        lead="Where all the earlier chapters plug in."
      >
        <Rule tag="Incremental structure from motion">
          <ol className="mt-1 list-decimal space-y-1.5 pl-5">
            <li>
              <strong>Detect and match features</strong> between image pairs — SIFT plus the ratio
              test.
            </li>
            <li>
              <strong>Remove outliers</strong> and compute pairwise epipolar geometry — RANSAC on{' '}
              <T>{'F'}</T>.
            </li>
            <li>
              <strong>Link matches across images</strong> into connected components, so one physical
              point has one track through many views.
            </li>
            <li>
              <strong>Initialise from two views</strong>: decompose <T>{'E'}</T> into{' '}
              <T>{'R, \\mathbf t'}</T> and triangulate.
            </li>
            <li>
              <strong>Add cameras one at a time</strong>, positioning each from already-triangulated
              points, then triangulating the new points it sees.
            </li>
            <li>
              <strong>Run bundle adjustment</strong> after each addition, to stop error
              accumulating.
            </li>
          </ol>
        </Rule>

        <KeyList
          title="Problem size, from the lecture"
          items={[
            {
              k: 'Per camera',
              v: '6 unknowns if calibrated, more if not (focal length, distortion).',
            },
            { k: 'Per point', v: '3 unknowns.' },
            {
              k: 'Trevi Fountain',
              v: '466 photos, >100 000 3D points — a very large but very sparse optimisation.',
            },
            {
              k: 'Dubrovnik',
              v: '4 619 images from an initial 57 845; 23 hours on 352 cores.',
            },
          ]}
        />

        <Aside title="SLAM is the same problem with a clock">
          Run this on a video stream, in real time, and it is called visual SLAM. The extra
          constraints are temporal (consecutive frames are close, so matching is easy) and
          computational (you cannot afford full BA every frame — so you keep a sliding window of
          keyframes and run a global optimisation only on loop closure).
        </Aside>
      </Section>
    </>
  )
}

export const drills: DrillSpec[] = [
  {
    id: 'sfm-d1',
    topicId: 'sfm',
    source: 'Sheet 6 · Ex 1.2',
    kind: 'explain',
    prompt: (
      <>
        Why can the 1D structure-from-motion system not be solved uniquely? Name the property of SfM
        this represents.
      </>
    ),
    answer: (
      <>
        There are 4 equations (two points × two views) but 5 unknowns (
        <T>{'X_A, Z_A, X_B, Z_B, t'}</T>
        ), so the system is underdetermined by exactly one degree of freedom.
        <br />
        <br />
        That degree of freedom is the <strong>global scale ambiguity</strong>. Multiply every 3D
        coordinate <em>and</em> the camera baseline by the same <T>{'s'}</T>:
        <Tex>{'\\frac{sX - st}{sZ} = \\frac{X-t}{Z} = u'}</Tex>
        The predicted images are byte-for-byte identical, so no image measurement can distinguish
        them. From images alone SfM recovers the <em>shape</em> of the scene and the{' '}
        <em>direction</em> of the translation, never the absolute size. Resolving it needs external
        information: one measured distance, a known object, or a calibrated stereo baseline.
      </>
    ),
  },
  {
    id: 'sfm-d2',
    topicId: 'sfm',
    source: 'Sheet 6 · Ex 1.3',
    kind: 'compute',
    prompt: (
      <>
        Fix <T>{'t = 1'}</T> and solve for both points, given{' '}
        <T>{'u_{1A}=2, u_{2A}=1, u_{1B}=-1, u_{2B}=-2'}</T>.
      </>
    ),
    hint: <>Subtract the two equations for one point — the X cancels and leaves 1/Z.</>,
    answer: (
      <>
        For A: <T>{'X_A/Z_A = 2'}</T> and <T>{'(X_A-1)/Z_A = 1'}</T>. Subtracting,{' '}
        <T>{'1/Z_A = 1'}</T>, so <T>{'Z_A = 1'}</T> and <T>{'X_A = 2'}</T>.
        <br />
        For B: <T>{'X_B/Z_B = -1'}</T> and <T>{'(X_B-1)/Z_B = -2'}</T>. Subtracting,{' '}
        <T>{'1/Z_B = 1'}</T>, so <T>{'Z_B = 1'}</T> and <T>{'X_B = -1'}</T>.
        <br />
        <br />
        <strong>
          <T>{'P_A = (2, 1)'}</T>, <T>{'P_B = (-1, 1)'}</T>
        </strong>
        . The subtraction trick is worth noticing: it gives <T>{'t/Z = u_1 - u_2'}</T>, which is{' '}
        <T>{'z = fb/d'}</T> in one dimension.
      </>
    ),
  },
  {
    id: 'sfm-d3',
    topicId: 'sfm',
    source: 'Sheet 6 · Ex 1.4',
    kind: 'compute',
    prompt: (
      <>
        With <T>{'t=1'}</T>, <T>{'P_A=(2.5,1.5)'}</T>, <T>{'P_B=(-1.5,1.2)'}</T>, compute the exact
        sum of squared reprojection errors.
      </>
    ),
    answer: (
      <>
        Predictions: <T>{'\\hat u_{1A}=2.5/1.5=5/3'}</T>, <T>{'\\hat u_{2A}=1.5/1.5=1'}</T>,{' '}
        <T>{'\\hat u_{1B}=-1.5/1.2=-5/4'}</T>, <T>{'\\hat u_{2B}=-2.5/1.2=-25/12'}</T>.
        <br />
        <br />
        Squared errors: <T>{'(2-5/3)^2 = 1/9'}</T>; <T>{'(1-1)^2 = 0'}</T>;{' '}
        <T>{'(-1+5/4)^2 = 1/16'}</T>; <T>{'(-2+25/12)^2 = 1/144'}</T>.
        <br />
        <br />
        <Tex>
          {
            '\\frac{16}{144} + 0 + \\frac{9}{144} + \\frac{1}{144} = \\frac{26}{144} = \\frac{13}{72} \\approx 0.1806'
          }
        </Tex>
      </>
    ),
  },
  {
    id: 'sfm-d4',
    topicId: 'sfm',
    source: 'Sheet 6 · Ex 2.1–2.2',
    kind: 'compute',
    prompt: (
      <>
        For <T>{'n'}</T> calibrated cameras and <T>{'m'}</T> 3D points, give the number of
        parameters and, assuming full visibility, the number of residuals.
      </>
    ),
    answer: (
      <>
        <strong>Parameters:</strong> each camera&rsquo;s extrinsics are a rotation (3 DoF) and a
        translation (3 DoF) = 6; each point is <T>{'(X,Y,Z)'}</T> = 3. Total <T>{'\\;6n + 3m'}</T>.
        <br />
        <br />
        <strong>Residuals:</strong> every observation is a 2D image point and so contributes two
        coordinate values. With every point visible in every camera there are <T>{'nm'}</T>{' '}
        observations, hence <T>{'\\;2nm'}</T> residuals.
        <br />
        <br />
        (In practice visibility is sparse, which is what the indicator <T>{'w_{ij}'}</T> encodes and
        what makes the problem tractable.)
      </>
    ),
  },
  {
    id: 'sfm-d5',
    topicId: 'sfm',
    source: 'Sheet 6 · Ex 2.3–2.4',
    kind: 'explain',
    prompt: (
      <>
        Write the bundle adjustment objective, explain <T>{'w_{ij}'}</T>, and say why the problem is
        a <em>non-linear</em> least squares problem.
      </>
    ),
    answer: (
      <>
        <Tex>
          {
            'g(\\mathbf X, R, T) = \\sum_{i}\\sum_{j} w_{ij}\\,\\big\\lVert \\pi(R_j, \\mathbf t_j, \\mathbf X_i) - \\mathbf p_{ij}\\big\\rVert^2'
          }
        </Tex>
        <strong>
          <T>{'w_{ij}'}</T>
        </strong>{' '}
        is a visibility indicator: 1 if point <T>{'i'}</T> appears in image <T>{'j'}</T>, 0
        otherwise. It stops a camera being penalised for a point it never saw, and because real
        visibility is very sparse it is what makes the Jacobian sparse and the problem solvable at
        scale.
        <br />
        <br />
        <strong>Why non-linear:</strong> the objective is a sum of squares (&ldquo;least
        squares&rdquo;), but the model inside is not linear in the parameters. The projection{' '}
        <T>{'\\pi'}</T> divides by depth; rotations involve sines and cosines of their parameters;
        and camera and point parameters multiply one another in{' '}
        <T>{'R_j\\mathbf X_i + \\mathbf t_j'}</T>. So there is no closed form — it is solved
        iteratively, typically with Levenberg–Marquardt, and needs a good initialisation because it
        is non-convex.
      </>
    ),
  },
]
