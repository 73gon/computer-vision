import { T, Tex } from '@/components/ui/tex'
import {
  Aside,
  BigIdea,
  Concept,
  Deeper,
  Figure,
  KeyList,
  Pitfall,
  Rule,
  Section,
  WhyCare,
  Worked,
} from '@/components/learn/primitives'
import { EpipolarLab } from '@/components/viz/camera'
import type { DrillSpec } from '@/components/learn/drill'
import type { TopicMeta } from './types'

export const meta: TopicMeta = {
  id: 'epipolar',
  n: 6,
  title: 'Epipolar geometry and triangulation',
  kicker:
    'Two cameras looking at one point are not independent. That constraint collapses the search for a match from a whole image to a single line — and then lets you recover the 3D point.',
  lectures: ['L05, L06 Epipolar geometry', 'L06 notebook (8-point)'],
  exercises: ['Sheet 5, Ex 1–3'],
  minutes: 45,
  stage: 'poses',
  sections: [
    { id: 'setup', title: 'The setup and the vocabulary' },
    { id: 'essential', title: 'The essential matrix' },
    { id: 'properties', title: 'Properties of E' },
    { id: 'fundamental', title: 'The fundamental matrix' },
    { id: 'eightpoint', title: 'Estimating F: the 8-point algorithm' },
    { id: 'triangulation', title: 'Triangulation' },
  ],
  sheet: [
    {
      name: 'Epipolar constraint (normalised)',
      tex: "\\mathbf x^{\\mathsf T} E\\, \\mathbf x' = 0, \\qquad E = [\\mathbf t]_\\times R",
      note: 'x in the left image, x′ in the right (lecture convention).',
    },
    {
      name: 'Epipolar lines',
      tex: "\\mathbf l = E\\,\\mathbf x' \\ \\text{(left)}, \\qquad \\mathbf l' = E^{\\mathsf T}\\mathbf x \\ \\text{(right)}",
    },
    {
      name: 'Epipoles',
      tex: "E\\,\\mathbf e' = \\mathbf 0, \\qquad E^{\\mathsf T}\\mathbf e = \\mathbf 0, \\qquad \\mathbf t^{\\mathsf T}E = \\mathbf 0",
    },
    {
      name: 'Fundamental matrix',
      tex: "F = K^{-\\mathsf T}[\\mathbf t]_\\times R\\,K'^{-1}, \\qquad \\mathbf p^{\\mathsf T}F\\,\\mathbf p' = 0",
    },
    {
      name: 'Skew-symmetric matrix',
      tex: '[\\mathbf t]_\\times = \\begin{pmatrix}0 & -t_3 & t_2\\\\ t_3 & 0 & -t_1\\\\ -t_2 & t_1 & 0\\end{pmatrix}',
      note: 'Rank 2, with t in its null space.',
    },
    {
      name: 'Triangulation constraint',
      tex: '\\mathbf x \\times P\\mathbf X = \\mathbf 0',
      note: 'Two independent equations per camera; the third row is a linear combination of the first two.',
    },
  ],
}

export function Body() {
  return (
    <>
      <BigIdea oneLiner="If two cameras see the same point, then the two camera centres and that point lie in one plane — and writing that single geometric fact algebraically gives you the essential matrix.">
        <p>
          Everything in this topic is that one sentence, unpacked. The plane is the{' '}
          <em>epipolar plane</em>; where it cuts each image is the <em>epipolar line</em>; the
          matrix that maps a point in one image to its line in the other is <T>{'E'}</T> (for
          calibrated cameras) or <T>{'F'}</T> (for raw pixels).
        </p>
      </BigIdea>

      <WhyCare>
        This is the cheapest and strongest prior in the whole course, and it costs no learning at
        all. Before any matching network runs, epipolar geometry has already thrown away 99.9% of
        the candidate correspondences — a search over <T>{'N^2'}</T> pixel pairs becomes a search
        over <T>{'N \\cdot \\sqrt N'}</T>. Modern learned stereo still uses it: that is exactly what
        &ldquo;cost volume along the epipolar line&rdquo; means.
      </WhyCare>

      <Section
        id="setup"
        n={1}
        title="The setup and the vocabulary"
        lead="Six words. Learn them precisely — half the marks in this topic are for using them correctly."
      >
        <KeyList
          items={[
            {
              k: <T>{"\\mathbf o, \\mathbf o'"}</T>,
              v: 'The two projection centres (camera centres).',
            },
            {
              k: <T>{"\\mathbf x, \\mathbf x'"}</T>,
              v: 'The images of the same 3D point X^W in the two views.',
            },
            {
              k: <T>{'\\mathbf t'}</T>,
              v: 'The stereo basis (baseline) — the vector from o to o′.',
            },
            {
              k: 'Epipolar plane',
              v: 'The plane through o, o′ and X^W. One per 3D point; they all contain the baseline.',
            },
            {
              k: <T>{"\\mathbf e, \\mathbf e'"}</T>,
              v: "The epipoles: the image of one camera's centre in the other camera's image. Every epipolar line passes through it.",
            },
            {
              k: <T>{"\\mathbf l, \\mathbf l'"}</T>,
              v: 'Epipolar lines — where the epipolar plane cuts each image plane. The line l′ contains every possible match for x.',
            },
          ]}
        />

        <Figure caption="Move the point in the left image and its epipolar line sweeps the right image. Turn the convergence to zero and the epipole goes to infinity, which makes every epipolar line horizontal — that is rectification.">
          <EpipolarLab />
        </Figure>

        <Concept
          title="The canonical setup"
          intuition={
            <>
              To keep the algebra clean, put the world origin at the left camera and assume both
              cameras are already calibrated, so <T>{"K = K' = I"}</T>.
            </>
          }
        >
          <p>
            The right camera is shifted by <T>{'\\mathbf t'}</T> and rotated, so a world point
            appears there as <T>{'R^{\\mathsf T}(\\mathbf X^W - \\mathbf t)'}</T>. The two
            projection matrices are
          </p>
          <Tex>{"P = [\\,I \\mid \\mathbf 0\\,], \\qquad P' = [\\,R \\mid -R\\mathbf t\\,]"}</Tex>
        </Concept>
      </Section>

      <Section
        id="essential"
        n={2}
        title="The essential matrix"
        lead="Three vectors are coplanar exactly when one is perpendicular to the cross product of the other two. Write that down and you have E."
      >
        <Worked
          title="Derive E from coplanarity"
          source="L06 · The essential matrix"
          question={<>Build the epipolar constraint in the left camera's coordinate system.</>}
          steps={[
            {
              label: 'Put everything in the left camera frame',
              body: (
                <>
                  <T>{'\\mathbf x'}</T> is already there. The right image point{' '}
                  <T>{"\\mathbf x'"}</T> lives in the right camera&rsquo;s frame, so rotate it:{' '}
                  <T>{"R\\,\\mathbf x'"}</T> is the same viewing direction expressed on the left.
                </>
              ),
            },
            {
              label: 'The epipolar plane is spanned by t and R x′',
              body: (
                <>
                  Its normal is therefore the cross product{' '}
                  <T>{"[\\mathbf t]_\\times (R\\,\\mathbf x')"}</T>.
                </>
              ),
            },
            {
              label: 'x lies in that plane',
              body: (
                <>
                  A vector lying in a plane is orthogonal to the plane&rsquo;s normal, so its dot
                  product with the normal vanishes:
                  <Tex>
                    {"\\mathbf x^{\\mathsf T}\\,[\\mathbf t]_\\times\\, R\\, \\mathbf x' = 0"}
                  </Tex>
                </>
              ),
            },
            {
              label: 'Name the middle',
              body: (
                <Tex>
                  {
                    "E = [\\mathbf t]_\\times R \\qquad \\Longrightarrow \\qquad \\mathbf x^{\\mathsf T} E\\, \\mathbf x' = 0"
                  }
                </Tex>
              ),
            },
          ]}
          answer={
            <>
              <T>{'E = [\\mathbf t]_\\times R'}</T> with the epipolar condition{' '}
              <T>{"\\mathbf x^{\\mathsf T} E \\mathbf x' = 0"}</T>. The derivation is one geometric
              statement — <em>o, o′ and X are coplanar</em> — written as a triple product.
            </>
          }
        />

        <Rule tag="What the constraint means geometrically">
          <T>{"\\mathbf x^{\\mathsf T}E\\mathbf x' = 0"}</T> says: the ray through{' '}
          <T>{'\\mathbf x'}</T>, the ray through <T>{"\\mathbf x'"}</T> and the baseline{' '}
          <T>{'\\mathbf t'}</T> all lie in one plane — equivalently,{' '}
          <em>the two rays actually intersect</em> in 3D. It is the algebraic test for &ldquo;could
          these two image points be pictures of the same world point?&rdquo;
        </Rule>

        <Pitfall title="The convention trap — read this before the exam">
          The lecture writes <T>{"\\mathbf x^{\\mathsf T}E\\mathbf x' = 0"}</T> with{' '}
          <T>{'\\mathbf x'}</T> on the <em>left</em>. Many textbooks (and Exercise sheet 5) write{' '}
          <T>{"\\mathbf x'^{\\mathsf T}E\\mathbf x = 0"}</T>, with the primed point first. These
          differ by a transpose:{' '}
          <T>
            {
              "(\\mathbf x^{\\mathsf T}E\\mathbf x')^{\\mathsf T} = \\mathbf x'^{\\mathsf T}E^{\\mathsf T}\\mathbf x"
            }
          </T>
          , so one convention&rsquo;s <T>{'E'}</T> is the other&rsquo;s <T>{'E^{\\mathsf T}'}</T>.
          <br />
          <br />
          Neither is wrong; what matters is being <em>consistent</em>. State your convention in one
          line at the top of the answer — &ldquo;x in the first image, x′ in the second, E = [t]×R
          for P = [I|0], P′ = [R|−Rt]&rdquo; — and every sign and transpose afterwards follows.
        </Pitfall>

        <Concept
          title="The role of the skew-symmetric matrix"
          intuition={
            <>
              A cross product is a linear function of one argument, so it can be written as a
              matrix. <T>{'[\\mathbf t]_\\times'}</T> is that matrix, and it is what turns a
              geometric statement about a plane into linear algebra.
            </>
          }
        >
          <Tex>
            {
              '[\\mathbf t]_\\times = \\begin{pmatrix}0 & -t_3 & t_2\\\\ t_3 & 0 & -t_1\\\\ -t_2 & t_1 & 0\\end{pmatrix}, \\qquad \\mathbf t\\times \\mathbf v = [\\mathbf t]_\\times \\mathbf v'
            }
          </Tex>
          <p className="mt-2">
            Two properties matter downstream. It is <em>skew-symmetric</em>, so{' '}
            <T>{'[\\mathbf t]_\\times^{\\mathsf T} = -[\\mathbf t]_\\times'}</T>. And it is{' '}
            <em>singular</em>:{' '}
            <T>{'[\\mathbf t]_\\times \\mathbf t = \\mathbf t\\times\\mathbf t = \\mathbf 0'}</T>,
            so it has rank 2 with <T>{'\\mathbf t'}</T> spanning its null space.
          </p>
        </Concept>
      </Section>

      <Section
        id="properties"
        n={3}
        title="Properties of E"
        lead="Lines, epipoles, rank — all three follow from the definition in a line or two each."
      >
        <Worked
          title="Epipolar lines and epipoles"
          source="Sheet 5 · Exercise 2.3"
          question={
            <>
              Show that <T>{"E\\,\\mathbf e' = \\mathbf 0"}</T>, and explain what{' '}
              <T>{"\\mathbf e'"}</T> is.
            </>
          }
          steps={[
            {
              label: 'Read the constraint as a line equation',
              body: (
                <>
                  A point <T>{'\\mathbf x'}</T> lies on a line <T>{'\\mathbf l'}</T> iff{' '}
                  <T>{'\\mathbf l^{\\mathsf T}\\mathbf x = 0'}</T>. Comparing with{' '}
                  <T>{"\\mathbf x^{\\mathsf T}(E\\mathbf x') = 0"}</T> identifies
                  <Tex>
                    {
                      "\\mathbf l = E\\,\\mathbf x' \\quad\\text{(in the left image)}, \\qquad \\mathbf l' = E^{\\mathsf T}\\mathbf x \\quad\\text{(in the right)}"
                    }
                  </Tex>
                </>
              ),
            },
            {
              label: 'The epipole lies on every epipolar line',
              body: (
                <>
                  Every epipolar plane contains the baseline, so every epipolar line in the right
                  image passes through <T>{"\\mathbf e'"}</T>, the image of the left camera centre.
                  Likewise every left epipolar line passes through <T>{'\\mathbf e'}</T>.
                </>
              ),
            },
            {
              label: 'Therefore E maps the epipole to zero',
              body: (
                <>
                  <T>{"E\\mathbf e'"}</T> would be the epipolar line in the left image corresponding
                  to <T>{"\\mathbf e'"}</T> — but <T>{"\\mathbf e'"}</T> lies on <em>all</em> of
                  them, so no single line is determined. The only consistent value is the zero
                  vector:
                  <Tex>
                    {"E\\,\\mathbf e' = \\mathbf 0, \\qquad E^{\\mathsf T}\\mathbf e = \\mathbf 0"}
                  </Tex>
                </>
              ),
            },
            {
              label: 'And t is the left null vector',
              body: (
                <>
                  <T>
                    {
                      '\\mathbf t^{\\mathsf T}E = \\mathbf t^{\\mathsf T}[\\mathbf t]_\\times R = \\mathbf 0'
                    }
                  </T>{' '}
                  because{' '}
                  <T>
                    {
                      '\\mathbf t^{\\mathsf T}[\\mathbf t]_\\times = (\\mathbf t\\times\\mathbf t)^{\\mathsf T} = \\mathbf 0'
                    }
                  </T>
                  . So the baseline direction is in the null space of <T>{'E^{\\mathsf T}'}</T> —
                  and since the epipole <em>is</em> the projection of the baseline direction, this
                  is the same statement.
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{"\\mathbf e'"}</T> is the <strong>epipole</strong> — the projection of the left
              camera&rsquo;s centre into the right image. All epipolar lines meet there, so it maps
              to no line at all: <T>{"E\\mathbf e' = \\mathbf 0"}</T>. Equivalently, the epipole
              spans the null space of <T>{'E'}</T>.
            </>
          }
        />

        <Rule tag="Why E has rank 2">
          <T>{'E = [\\mathbf t]_\\times R'}</T>. <T>{'R'}</T> is a rotation, so it is full rank and
          cannot lower anything. <T>{'[\\mathbf t]_\\times'}</T> is skew-symmetric and singular
          (every skew-symmetric <T>{'3\\times3'}</T> matrix is, since{' '}
          <T>{'\\det A = \\det A^{\\mathsf T} = \\det(-A) = -\\det A'}</T> forces{' '}
          <T>{'\\det A = 0'}</T>), with exactly a one-dimensional null space spanned by{' '}
          <T>{'\\mathbf t'}</T>. So <T>{'\\operatorname{rank}[\\mathbf t]_\\times = 2'}</T> and
          therefore <T>{'\\operatorname{rank} E = 2'}</T>.
          <br />
          <br />
          The practical consequence: <T>{'\\det E = 0'}</T>, and any estimate of <T>{'E'}</T> or{' '}
          <T>{'F'}</T> must be forced to satisfy it, or the &ldquo;epipolar lines&rdquo; it produces
          will not meet at a single epipole.
        </Rule>

        <Deeper label="Degrees of freedom, and why E has five not six">
          <T>{'R'}</T> has 3 and <T>{'\\mathbf t'}</T> has 3, so six — but <T>{'E'}</T> is only
          defined up to scale (scale <T>{'\\mathbf t'}</T> and the constraint{' '}
          <T>{"\\mathbf x^{\\mathsf T}E\\mathbf x' = 0"}</T> is unchanged), which removes one.{' '}
          <strong>E has 5 degrees of freedom.</strong> That lost scale is the baseline length, and
          it is the same global scale ambiguity that structure from motion runs into: from images
          alone you recover the shape of the scene and the <em>direction</em> of the translation,
          never its magnitude in metres.
        </Deeper>
      </Section>

      <Section
        id="fundamental"
        n={4}
        title="The fundamental matrix"
        lead="The same geometry, in raw pixels, for cameras you have not calibrated."
      >
        <Worked
          title="Derive F from E"
          source="Sheet 5 · Exercise 3.1"
          question={
            <>
              Let <T>{"\\mathbf p, \\mathbf p'"}</T> be corresponding <em>pixel</em> coordinates.
              Derive <T>{"\\mathbf p^{\\mathsf T}F\\mathbf p' = 0"}</T>.
            </>
          }
          steps={[
            {
              label: 'Convert pixels to normalised camera coordinates',
              body: (
                <Tex>
                  {"\\mathbf x = K^{-1}\\mathbf p, \\qquad \\mathbf x' = K'^{-1}\\mathbf p'"}
                </Tex>
              ),
            },
            {
              label: 'Substitute into the epipolar constraint',
              body: (
                <Tex>
                  {
                    "\\mathbf x^{\\mathsf T}E\\,\\mathbf x' = (K^{-1}\\mathbf p)^{\\mathsf T} E\\, K'^{-1}\\mathbf p' = \\mathbf p^{\\mathsf T} K^{-\\mathsf T} E\\, K'^{-1}\\mathbf p'"
                  }
                </Tex>
              ),
            },
            {
              label: 'Collect the middle into one matrix',
              body: (
                <Tex>
                  {
                    "F = K^{-\\mathsf T} E\\, K'^{-1} = K^{-\\mathsf T}[\\mathbf t]_\\times R\\, K'^{-1} \\quad\\Longrightarrow\\quad \\mathbf p^{\\mathsf T}F\\,\\mathbf p' = 0"
                  }
                </Tex>
              ),
            },
          ]}
          answer={
            <>
              <T>{"F = K^{-\\mathsf T}[\\mathbf t]_\\times R K'^{-1}"}</T>, satisfying{' '}
              <T>{"\\mathbf p^{\\mathsf T}F\\mathbf p' = 0"}</T>. The transpose appears because{' '}
              <T>{'(K^{-1}\\mathbf p)^{\\mathsf T} = \\mathbf p^{\\mathsf T}K^{-\\mathsf T}'}</T>.
            </>
          }
        />

        <KeyList
          title="E versus F — the comparison the exercise asks for"
          items={[
            {
              k: 'What they act on',
              v: 'E acts on normalised (calibrated) image coordinates; F acts on raw pixel coordinates.',
            },
            {
              k: 'What you must know',
              v: 'E requires the intrinsics K, K′ to be known. F requires nothing — it can be estimated from image correspondences alone.',
            },
            {
              k: 'Degrees of freedom',
              v: 'E has 5 (R and t, minus overall scale). F has 7 (nine entries, minus scale, minus the rank-2 constraint).',
            },
            {
              k: 'What you get out',
              v: 'E decomposes into R and t (up to scale and a four-fold sign ambiguity), so it gives metric structure. F alone gives only a projective reconstruction.',
            },
            {
              k: 'Shared properties',
              v: 'Both are rank 2, both are defined only up to scale, both map points in one image to lines in the other.',
            },
          ]}
        />

        <Rule tag="What l′ = Fᵀp means, in practice">
          Given a point in one image, you do not search the other image for its match — you search a{' '}
          <em>line</em>. With a 1000×1000 image that is a million candidates reduced to a thousand,
          with no learning and no assumptions about appearance. This is the single most useful
          consequence of the whole topic.
        </Rule>
      </Section>

      <Section
        id="eightpoint"
        n={5}
        title="Estimating F: the 8-point algorithm"
        lead="Rewrite the bilinear constraint as a linear one in the nine unknowns, then take the null space."
      >
        <Worked
          title="Turn the constraint into a linear system"
          source="L06 · Compute F from corresponding points"
          question={
            <>
              From <T>{"\\mathbf p^{\\mathsf T}F\\mathbf p' = 0"}</T> with{' '}
              <T>{'\\mathbf p = (u, v, 1)'}</T> and <T>{"\\mathbf p' = (u', v', 1)"}</T>, build a
              linear system in the entries of <T>{'F'}</T>.
            </>
          }
          steps={[
            {
              label: 'Expand the quadratic form',
              body: (
                <>
                  Every term is one entry of <T>{'F'}</T> times a product of one coordinate from
                  each image:
                  <Tex>
                    {
                      "u u' f_{11} + u v' f_{12} + u f_{13} + v u' f_{21} + v v' f_{22} + v f_{23} + u' f_{31} + v' f_{32} + f_{33} = 0"
                    }
                  </Tex>
                </>
              ),
            },
            {
              label: 'Read it as a dot product',
              body: (
                <>
                  Stack the nine entries of <T>{'F'}</T> into a vector{' '}
                  <T>{'\\mathbf f \\in \\mathbb R^9'}</T>; the coefficients form one row of a design
                  matrix:
                  <Tex>
                    {
                      "\\big[\\,u u' \\;\\; u v' \\;\\; u \\;\\; v u' \\;\\; v v' \\;\\; v \\;\\; u' \\;\\; v' \\;\\; 1\\,\\big]\\; \\mathbf f = 0"
                    }
                  </Tex>
                </>
              ),
            },
            {
              label: 'Stack N correspondences',
              body: (
                <>
                  <T>{'A \\mathbf f = \\mathbf 0'}</T> with{' '}
                  <T>{'A \\in \\mathbb R^{N\\times 9}'}</T>. Since <T>{'F'}</T> is only defined up
                  to scale there are 8 unknowns — hence <em>eight</em> points.
                </>
              ),
            },
            {
              label: 'Solve by SVD',
              body: (
                <>
                  With noise, <T>{'A\\mathbf f = \\mathbf 0'}</T> has no exact solution, so minimise{' '}
                  <T>{'\\lVert A\\mathbf f\\rVert'}</T> subject to{' '}
                  <T>{'\\lVert\\mathbf f\\rVert = 1'}</T>. The answer is the right singular vector
                  of <T>{'A = USV^{\\mathsf T}'}</T> belonging to the <em>smallest</em> singular
                  value — the last column of <T>{'V'}</T>.
                </>
              ),
            },
          ]}
          answer={
            <>
              Build the <T>{'N\\times9'}</T> matrix <T>{'A'}</T> from the products of corresponding
              coordinates, take the SVD, and read <T>{'F'}</T> off the column of <T>{'V'}</T>{' '}
              belonging to the smallest singular value.
            </>
          }
        />

        <Rule tag="The normalised 8-point algorithm — all six steps">
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            <li>
              <strong>Normalise</strong> the point correspondences.
            </li>
            <li>
              Construct the <T>{'M\\times9'}</T> design matrix <T>{'A'}</T>.
            </li>
            <li>
              Compute the SVD of <T>{'A'}</T>.
            </li>
            <li>
              Take <T>{'F'}</T> from the column of <T>{'V'}</T> for the smallest singular value.
            </li>
            <li>
              <strong>Enforce the rank constraint</strong> <T>{'r = 2'}</T>.
            </li>
            <li>
              <strong>Un-normalise</strong> <T>{'F'}</T>.
            </li>
          </ol>
        </Rule>

        <Concept
          title="Why steps 1 and 5 are not optional"
          intuition={
            <>
              Both are corrections for things the plain linear solve gets wrong, and both are worth
              marks.
            </>
          }
        >
          <p className="mb-3">
            <strong>Normalisation.</strong> Raw pixel coordinates are around 1000, so entries of{' '}
            <T>{'A'}</T> range from 1 to <T>{'10^6'}</T>. The matrix is horribly conditioned and the
            smallest singular vector is dominated by numerical noise. Hartley&rsquo;s fix: translate
            each point set so its centroid is at the origin and scale so the mean distance from the
            origin is <T>{'\\sqrt 2'}</T>, via a similarity <T>{'T'}</T>. Solve, then undo with{' '}
            <T>{"F = T^{\\mathsf T}\\hat F\\,T'"}</T>. The notebook shows this making a large
            difference to the Sampson error.
          </p>
          <p>
            <strong>Rank enforcement.</strong> The linear solve does not know that{' '}
            <T>{'\\det F = 0'}</T>, so the estimate has rank 3 and its &ldquo;epipolar lines&rdquo;
            do not meet at a common point. Fix it by taking the SVD{' '}
            <T>{'F = U\\Sigma V^{\\mathsf T}'}</T>, setting the smallest singular value to zero, and
            recomposing. This is the closest rank-2 matrix in Frobenius norm.
          </p>
        </Concept>

        <Aside title="RANSAC, from the notebook">
          Even after the ratio test, some matches are wrong, and a single gross outlier wrecks a
          least-squares fit. RANSAC repeats: sample 8 matches at random, estimate <T>{'F'}</T>,
          count how many of <em>all</em> matches are consistent with it (Sampson error below a
          threshold). Keep the model with the most inliers, then re-estimate using all of them. The
          key idea is that a model fitted to outliers agrees with almost nothing, while one fitted
          to inliers agrees with all of them.
        </Aside>
      </Section>

      <Section
        id="triangulation"
        n={6}
        title="Triangulation"
        lead="Two rays, one point — except that with noise they never quite meet, so you solve for the point that comes closest."
      >
        <Worked
          title="Why not just use the pseudoinverse?"
          source="Sheet 5 · Exercise 1.1"
          question={
            <>
              Given <T>{'\\mathbf x_1 \\simeq P_1\\mathbf X'}</T>, why can we not simply compute{' '}
              <T>{'\\mathbf X = P_1^{+}\\mathbf x_1'}</T>?
            </>
          }
          steps={[
            {
              label: 'Count the dimensions',
              body: (
                <>
                  <T>{'P_1'}</T> is <T>{'3\\times4'}</T>: it maps a 4-vector to a 3-vector, so it
                  has a one-dimensional null space and cannot be inverted. Its pseudoinverse returns{' '}
                  <em>one particular point</em> on the viewing ray, chosen by a minimum-norm
                  criterion that has nothing to do with the scene.
                </>
              ),
            },
            {
              label: 'The deeper reason: the unknown scale',
              body: (
                <>
                  The relation is <T>{'\\lambda\\,\\mathbf x_1 = P_1\\mathbf X'}</T> — an equality
                  only up to an unknown scale <T>{'\\lambda'}</T>, which differs for every point.
                  Treating <T>{'\\mathbf x_1 = P_1 \\mathbf X'}</T> as an equation quietly fixes{' '}
                  <T>{'\\lambda = 1'}</T>, which is simply false.
                </>
              ),
            },
            {
              label: 'And one camera is not enough anyway',
              body: (
                <>
                  One view gives two independent constraints on three unknowns. The problem is
                  underdetermined until a second camera supplies two more.
                </>
              ),
            },
          ]}
          answer={
            <>
              Because <T>{'P_1'}</T> is not invertible (it is <T>{'3\\times4'}</T>, with a
              one-dimensional null space = the viewing ray), and because the projection holds only
              up to an unknown per-point scale <T>{'\\lambda'}</T>. The pseudoinverse would silently
              pick an arbitrary point on the correct ray.
            </>
          }
        />

        <Concept
          title="Eliminating the scale with a cross product"
          intuition={
            <>
              <T>{'\\lambda \\mathbf x = P\\mathbf X'}</T> says the two vectors are{' '}
              <em>parallel</em>. Two vectors are parallel exactly when their cross product vanishes
              — and that statement contains no <T>{'\\lambda'}</T>.
            </>
          }
        >
          <Tex>{'\\mathbf x \\times (P\\mathbf X) = \\mathbf 0'}</Tex>
          <p className="mt-2">
            This looks like three equations, but only <strong>two are independent</strong>: the
            third row of a cross product is always a linear combination of the first two. So{' '}
            <em>one point observation in one camera gives two constraints</em>. Two cameras give
            four, which over-determines the three unknowns <T>{'(X, Y, Z)'}</T> — exactly what you
            want with noisy data.
          </p>
        </Concept>

        <Worked
          title="Triangulate a point by hand"
          source="Sheet 5 · Exercise 1.2–1.4"
          question={
            <>
              <T>{'P_1 = [\\,I \\mid \\mathbf 0\\,]'}</T> and{' '}
              <T>{'P_2 = [\\,I \\mid (-2,0,0)^{\\mathsf T}]'}</T>. The point is seen at{' '}
              <T>{'\\mathbf x_1 = (1,2,1)'}</T> and <T>{'\\mathbf x_2 = (0,2,1)'}</T>. Find{' '}
              <T>{'(X,Y,Z)'}</T>.
            </>
          }
          steps={[
            {
              label: 'Write out P₁X',
              body: (
                <>
                  <T>{'P_1 = \\begin{pmatrix}1&0&0&0\\\\0&1&0&0\\\\0&0&1&0\\end{pmatrix}'}</T>, so
                  with <T>{'\\mathbf X = (X,Y,Z,1)^{\\mathsf T}'}</T>:
                  <Tex>{'P_1\\mathbf X = (X,\\; Y,\\; Z)^{\\mathsf T}'}</Tex>
                </>
              ),
            },
            {
              label: 'Camera 1: the first two independent equations',
              body: (
                <>
                  Collinearity of <T>{'(1,2,1)'}</T> and <T>{'(X,Y,Z)'}</T> means their ratios
                  agree. Cross-multiplying the first and third, then the second and third
                  components:
                  <Tex>{'X\\cdot 1 - 1\\cdot Z = 0 \\;\\Rightarrow\\; X = Z'}</Tex>
                  <Tex>{'Y\\cdot 1 - 2\\cdot Z = 0 \\;\\Rightarrow\\; Y = 2Z'}</Tex>
                </>
              ),
            },
            {
              label: 'Write out P₂X',
              body: (
                <>
                  <T>{'P_2 = \\begin{pmatrix}1&0&0&-2\\\\0&1&0&0\\\\0&0&1&0\\end{pmatrix}'}</T>, so
                  <Tex>{'P_2\\mathbf X = (X-2,\\; Y,\\; Z)^{\\mathsf T}'}</Tex>
                </>
              ),
            },
            {
              label: 'Camera 2: two more equations',
              body: (
                <>
                  Collinearity with <T>{'\\mathbf x_2 = (0,2,1)'}</T>:
                  <Tex>{'(X-2)\\cdot 1 - 0\\cdot Z = 0 \\;\\Rightarrow\\; X = 2'}</Tex>
                  <Tex>{'Y\\cdot 1 - 2\\cdot Z = 0 \\;\\Rightarrow\\; Y = 2Z'}</Tex>
                </>
              ),
            },
            {
              label: 'Solve',
              body: (
                <>
                  From camera 2, <T>{'X = 2'}</T>. From camera 1, <T>{'Z = X = 2'}</T>. Then{' '}
                  <T>{'Y = 2Z = 4'}</T>.
                </>
              ),
            },
            {
              label: 'Sanity check',
              body: (
                <>
                  <T>{'P_1\\mathbf X = (2,4,2) \\simeq (1,2,1)'}</T> ✓ and{' '}
                  <T>{'P_2\\mathbf X = (0,4,2) \\simeq (0,2,1)'}</T> ✓ — both up to scale, as
                  required.
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'(X, Y, Z) = (2, 4, 2)'}</T>. The disparity here is <T>{'1 - 0 = 1'}</T> with
              baseline 2 and &ldquo;focal length&rdquo; 1, and indeed{' '}
              <T>{'z = fb/d = 1\\cdot 2/1 = 2'}</T> — the stereo formula, arrived at the long way
              round.
            </>
          }
        />

        <Aside title="With real data the rays miss">
          Four equations, three unknowns, noisy measurements: the system is inconsistent and the two
          rays pass near each other without meeting. So you do not solve it, you minimise —{' '}
          <T>{'\\min \\lVert A\\mathbf X\\rVert'}</T> subject to{' '}
          <T>{'\\lVert\\mathbf X\\rVert = 1'}</T>, again via SVD. Note this minimises an{' '}
          <em>algebraic</em> error, which is not the same as the reprojection error; the proper fix
          is to refine the result by non-linear least squares, which is precisely what bundle
          adjustment does in the next topic.
        </Aside>
      </Section>
    </>
  )
}

export const drills: DrillSpec[] = [
  {
    id: 'epi-d1',
    topicId: 'epipolar',
    source: 'Sheet 5 · Ex 2.1',
    kind: 'explain',
    prompt: (
      <>
        Explain the geometric meaning of the epipolar constraint{' '}
        <T>{"\\mathbf x^{\\mathsf T}E\\mathbf x' = 0"}</T>.
      </>
    ),
    answer: (
      <>
        It states that the two camera centres and the observed 3D point are{' '}
        <strong>coplanar</strong>. Concretely: the ray from the left centre through{' '}
        <T>{'\\mathbf x'}</T>, the ray from the right centre through <T>{"\\mathbf x'"}</T>, and the
        baseline <T>{'\\mathbf t'}</T> all lie in one plane — the epipolar plane. Equivalently, the
        two rays actually <em>intersect</em> in 3D, which is the condition for the two image points
        to be pictures of the same world point.
        <br />
        <br />
        Algebraically it is a triple product:{' '}
        <T>{"\\mathbf x\\cdot(\\mathbf t\\times R\\mathbf x')"}</T>, and a triple product vanishing
        is exactly the test for three vectors being coplanar. Its practical consequence is that{' '}
        <T>{"E\\mathbf x'"}</T> is a <em>line</em> in the other image, so matching becomes a 1D
        search.
      </>
    ),
  },
  {
    id: 'epi-d2',
    topicId: 'epipolar',
    source: 'Sheet 5 · Ex 2.2',
    kind: 'explain',
    prompt: (
      <>
        What is the role of the skew-symmetric matrix <T>{'[\\mathbf t]_\\times'}</T>?
      </>
    ),
    answer: (
      <>
        It expresses the cross product as a matrix, so that a geometric coplanarity statement
        becomes linear algebra:{' '}
        <T>{'\\mathbf t\\times\\mathbf v = [\\mathbf t]_\\times\\mathbf v'}</T> with
        <Tex>
          {
            '[\\mathbf t]_\\times = \\begin{pmatrix}0&-t_3&t_2\\\\t_3&0&-t_1\\\\-t_2&t_1&0\\end{pmatrix}'
          }
        </Tex>
        In the derivation of <T>{'E'}</T> it computes the <em>normal of the epipolar plane</em>,{' '}
        <T>{"[\\mathbf t]_\\times(R\\mathbf x')"}</T>, so that &ldquo;x lies in the plane&rdquo; can
        be written as a dot product equalling zero.
        <br />
        <br />
        Two structural consequences: it is skew-symmetric (
        <T>{'[\\mathbf t]_\\times^{\\mathsf T} = -[\\mathbf t]_\\times'}</T>), and it is singular
        with <T>{'\\mathbf t'}</T> in its null space (
        <T>{'[\\mathbf t]_\\times\\mathbf t = \\mathbf t\\times\\mathbf t = \\mathbf 0'}</T>) —
        which is the reason <T>{'E'}</T> has rank 2.
      </>
    ),
  },
  {
    id: 'epi-d3',
    topicId: 'epipolar',
    source: 'Sheet 5 · Ex 2.4',
    kind: 'explain',
    prompt: (
      <>Why does the essential matrix have rank 2? State the consequence for estimating it.</>
    ),
    answer: (
      <>
        <T>{'E = [\\mathbf t]_\\times R'}</T>. A rotation <T>{'R'}</T> is orthogonal, hence full
        rank, so it cannot reduce the rank of a product. Every skew-symmetric <T>{'3\\times3'}</T>{' '}
        matrix is singular — <T>{'\\det A = \\det A^{\\mathsf T} = \\det(-A) = (-1)^3\\det A'}</T>{' '}
        forces <T>{'\\det A = 0'}</T> — and <T>{'[\\mathbf t]_\\times'}</T> has exactly a
        one-dimensional null space spanned by <T>{'\\mathbf t'}</T>. So it has rank 2, and therefore
        so does <T>{'E'}</T>.
        <br />
        <br />
        <strong>Consequence:</strong> the linear 8-point solve does not know about{' '}
        <T>{'\\det F = 0'}</T> and returns a rank-3 estimate, whose epipolar lines fail to meet at a
        single epipole. You must project it back: take the SVD, set the smallest singular value to
        zero, recompose. That is the closest rank-2 matrix in Frobenius norm.
      </>
    ),
  },
  {
    id: 'epi-d4',
    topicId: 'epipolar',
    source: 'Sheet 5 · Ex 3.3–3.4',
    kind: 'explain',
    prompt: (
      <>
        What is the geometric interpretation of <T>{"\\mathbf l = F\\mathbf p'"}</T>, and how does{' '}
        <T>{'F'}</T> differ from <T>{'E'}</T> in terms of what you must know about the cameras?
      </>
    ),
    answer: (
      <>
        <strong>The line.</strong> <T>{"F\\mathbf p'"}</T> is the <em>epipolar line</em> in the
        other image: the set of all pixels that could possibly correspond to <T>{"\\mathbf p'"}</T>.
        It is the projection of the viewing ray through <T>{"\\mathbf p'"}</T>. So matching reduces
        from a 2D image search to a 1D line search, and all such lines pass through the epipole.
        <br />
        <br />
        <strong>The difference.</strong> <T>{'E'}</T> operates on <em>normalised</em> coordinates
        and therefore requires the intrinsics <T>{"K, K'"}</T> to be known — it is the{' '}
        <em>calibrated</em> case. <T>{"F = K^{-\\mathsf T}EK'^{-1}"}</T> operates on raw{' '}
        <em>pixels</em> and needs no calibration at all; it can be estimated from correspondences
        alone. The price: <T>{'E'}</T> has 5 DoF and decomposes into <T>{'R'}</T> and{' '}
        <T>{'\\mathbf t'}</T> (metric structure up to scale), while <T>{'F'}</T> has 7 DoF and gives
        only a projective reconstruction.
      </>
    ),
  },
  {
    id: 'epi-d5',
    topicId: 'epipolar',
    source: 'Sheet 5 · Ex 1.4',
    kind: 'compute',
    prompt: (
      <>
        With <T>{'P_1 = [I \\mid \\mathbf 0]'}</T>, <T>{'P_2 = [I \\mid (-2,0,0)^{\\mathsf T}]'}</T>
        , <T>{'\\mathbf x_1 = (1,2,1)'}</T> and <T>{'\\mathbf x_2 = (0,2,1)'}</T>, find the
        Cartesian 3D point.
      </>
    ),
    hint: (
      <>
        Use <T>{'\\mathbf x \\times P\\mathbf X = \\mathbf 0'}</T> and take two independent rows per
        camera.
      </>
    ),
    answer: (
      <>
        <T>{'P_1\\mathbf X = (X, Y, Z)'}</T>, collinear with <T>{'(1,2,1)'}</T>, gives{' '}
        <T>{'X = Z'}</T> and <T>{'Y = 2Z'}</T>.
        <br />
        <T>{'P_2\\mathbf X = (X-2, Y, Z)'}</T>, collinear with <T>{'(0,2,1)'}</T>, gives{' '}
        <T>{'X - 2 = 0'}</T> and <T>{'Y = 2Z'}</T>.
        <br />
        <br />
        So <T>{'X = 2'}</T>, <T>{'Z = X = 2'}</T>, <T>{'Y = 4'}</T>:{' '}
        <strong>
          <T>{'(X,Y,Z) = (2,4,2)'}</T>
        </strong>
        .
        <br />
        <br />
        Check: <T>{'P_1\\mathbf X = (2,4,2) \\simeq (1,2,1)'}</T> ✓,{' '}
        <T>{'P_2\\mathbf X = (0,4,2) \\simeq (0,2,1)'}</T> ✓. Note it agrees with{' '}
        <T>{'z = fb/d = 1\\cdot2/1 = 2'}</T>.
      </>
    ),
  },
  {
    id: 'epi-d6',
    topicId: 'epipolar',
    source: 'L06 · 8-point algorithm',
    kind: 'explain',
    prompt: (
      <>
        List the steps of the normalised 8-point algorithm and explain why normalisation and rank
        enforcement are needed.
      </>
    ),
    answer: (
      <>
        <strong>Steps:</strong> (1) normalise the correspondences; (2) build the{' '}
        <T>{'M\\times9'}</T> design matrix <T>{'A'}</T>; (3) take the SVD of <T>{'A'}</T>; (4) read{' '}
        <T>{'F'}</T> from the column of <T>{'V'}</T> for the smallest singular value; (5) enforce
        rank 2; (6) un-normalise.
        <br />
        <br />
        <strong>Normalisation</strong> (Hartley): raw pixel coordinates are ~10³, so entries of{' '}
        <T>{'A'}</T> span 1 to 10⁶ and the matrix is badly conditioned — the smallest singular
        vector is then dominated by numerical error. Translating each point set to have its centroid
        at the origin and scaling so the mean distance is <T>{'\\sqrt2'}</T> fixes the conditioning;
        undo with <T>{"F = T^{\\mathsf T}\\hat FT'"}</T>.
        <br />
        <br />
        <strong>Rank enforcement:</strong> the linear solve cannot express <T>{'\\det F = 0'}</T>,
        so the raw estimate has rank 3 and its epipolar lines do not intersect in a single epipole.
        Setting the smallest singular value of <T>{'F'}</T> to zero gives the nearest rank-2 matrix.
      </>
    ),
  },
]
