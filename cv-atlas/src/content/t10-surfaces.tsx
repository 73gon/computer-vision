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
import { ICPLab, MarchingSquares } from '@/components/viz/surface'
import { PipelineMap } from '@/components/viz/pipeline'
import type { DrillSpec } from '@/components/learn/drill'
import type { TopicMeta } from './types'

export const meta: TopicMeta = {
  id: 'surfaces',
  n: 10,
  title: 'From depth maps to surfaces',
  kicker:
    'Several noisy, incomplete point clouds go in. One watertight mesh comes out — via registration, an implicit field, and marching cubes.',
  lectures: ['L10 Surface reconstruction'],
  exercises: ['Sheet 8, Ex 1–2'],
  minutes: 35,
  stage: 'fusion',
  sections: [
    { id: 'pipeline', title: 'The pipeline, and why fusion is needed' },
    { id: 'clouds', title: 'Point clouds: what they hold and what they miss' },
    { id: 'icp', title: 'Registration with ICP' },
    { id: 'implicit', title: 'Implicit surfaces and Poisson reconstruction' },
    { id: 'marching', title: 'Marching squares and cubes' },
  ],
  sheet: [
    {
      name: 'Back-projection',
      tex: '(X, Y, Z) = \\left(\\frac{(u-c_x)z}{f_x},\\ \\frac{(v-c_y)z}{f_y},\\ z\\right)',
    },
    {
      name: 'ICP objective',
      tex: '\\min_{R, \\mathbf t} \\sum_{i=1}^{N} \\lVert R\\mathbf x_i + \\mathbf t - \\mathbf y_i\\rVert_2^2',
    },
    {
      name: 'ICP closed form',
      tex: 'C = \\sum_i (\\mathbf y_i - \\mu^Y)(\\mathbf x_i - \\mu^X)^{\\mathsf T} = U\\Sigma V^{\\mathsf T}, \\quad R = U\\tilde\\Sigma V^{\\mathsf T}, \\quad \\mathbf t = \\mu^Y - R\\mu^X',
      note: 'Σ̃ = diag(1,…,1,det(UVᵀ)) to exclude reflections.',
    },
    {
      name: 'Implicit surface',
      tex: 'S = \\{\\mathbf x : f(\\mathbf x) = 0\\}',
      note: 'f < 0 inside, f > 0 outside.',
    },
    {
      name: 'Poisson reconstruction',
      tex: '\\min_{\\chi} \\lVert \\nabla\\chi - V \\rVert \\;\\Longleftrightarrow\\; \\Delta\\chi = \\nabla\\!\\cdot V',
      note: 'χ is the indicator function; V the oriented-normal field.',
    },
  ],
}

export function Body() {
  return (
    <>
      <BigIdea oneLiner="A depth map is one camera's opinion about one side of an object. A surface is the consensus of many such opinions, turned into geometry you can render, measure or print.">
        <p>
          Three problems to solve in order. The clouds are in different coordinate frames, so they
          must be <strong>registered</strong>. They are noisy samples with no connectivity, so a{' '}
          <strong>continuous surface</strong> has to be fitted. And that surface is defined
          implicitly as a level set, so it must be <strong>meshed</strong>.
        </p>
      </BigIdea>

      <WhyCare>
        The implicit-function idea here is the direct ancestor of neural implicit representations.
        Poisson reconstruction solves for a scalar field whose zero level set is the surface;
        DeepSDF and Occupancy Networks train an MLP to output exactly such a field; NeRF (topic 12)
        replaces the hard level set with a soft density. Marching cubes is still how all of them get
        turned into a mesh.
      </WhyCare>

      <Section
        id="pipeline"
        n={1}
        title="The pipeline, and why fusion is needed"
        lead="The chain you have been following since topic 5, with the last two boxes filled in."
      >
        <Figure caption="You arrive here holding depth maps. The remaining work is fusion and surface extraction.">
          <PipelineMap active="fusion" />
        </Figure>

        <Worked
          title="Name the steps, and justify the fusion"
          source="Sheet 8 · Exercise 1.1–1.2"
          question={
            <>
              Name the main steps of the 3D reconstruction pipeline from input images to 3D model,
              and explain why depth maps from several views must be fused.
            </>
          }
          steps={[
            {
              label: 'The six stages',
              body: (
                <ol className="mt-1 list-decimal space-y-1 pl-5">
                  <li>
                    <strong>Input images</strong> — several views of the scene.
                  </li>
                  <li>
                    <strong>Camera poses</strong> — features, matching, epipolar geometry, structure
                    from motion.
                  </li>
                  <li>
                    <strong>Dense correspondences</strong> — rectify and match every pixel.
                  </li>
                  <li>
                    <strong>Depth maps</strong> — one per reference view, from <T>{'z = fb/d'}</T>.
                  </li>
                  <li>
                    <strong>Depth-map fusion</strong> — register and merge into one consistent point
                    cloud.
                  </li>
                  <li>
                    <strong>3D reconstruction</strong> — fit a surface and extract a mesh.
                  </li>
                </ol>
              ),
            },
            {
              label: 'Why fusion — coverage',
              body: (
                <>
                  A single depth map only contains what <em>that</em> camera could see. Everything
                  occluded or facing away is missing. No single view can cover a closed object; you
                  need views from all around it.
                </>
              ),
            },
            {
              label: 'Why fusion — accuracy',
              body: (
                <>
                  Depth estimates are noisy, and the noise grows as <T>{'z^2'}</T>. Where several
                  views overlap, averaging their (independent) errors reduces the variance. Views
                  also disagree at outliers, so agreement across views is a usable confidence
                  measure.
                </>
              ),
            },
            {
              label: 'Why fusion — consistency',
              body: (
                <>
                  Each depth map lives in its <em>own camera&rsquo;s</em> coordinate frame. They
                  must be transformed into a common frame (using the poses from SfM, refined by
                  ICP), otherwise you get several offset copies of the object rather than one
                  surface. Redundant points in overlaps must also be merged, or the surface fit sees
                  a thick, doubled shell.
                </>
              ),
            },
          ]}
          answer={
            <>
              Images → camera poses → dense correspondences → depth maps → depth-map fusion → 3D
              model. Fusion is needed because a single view is <em>incomplete</em> (occlusion),{' '}
              <em>noisy</em> (averaging overlapping views reduces variance and exposes outliers) and{' '}
              <em>in its own coordinate frame</em> (they must be brought into one frame and merged).
            </>
          }
        />
      </Section>

      <Section
        id="clouds"
        n={2}
        title="Point clouds: what they hold and what they miss"
        lead="The simplest possible 3D representation, and the reason it is not enough."
      >
        <KeyList
          title="A point cloud contains"
          items={[
            { k: 'Positions', v: '(X, Y, Z) for each sampled surface point. Always present.' },
            { k: 'Colour', v: 'Often, taken from the image the point was back-projected from.' },
            {
              k: 'Normals',
              v: 'Sometimes — either measured by the sensor or estimated from local neighbourhoods. Poisson reconstruction requires them.',
            },
            { k: 'Confidence / intensity', v: 'Depending on the sensor.' },
          ]}
        />

        <Rule tag="What is missing, compared with a triangle mesh">
          <strong>Connectivity — and therefore topology and surface.</strong> A mesh says which
          points are joined into faces, so it defines a continuous surface with an inside and an
          outside. A cloud is an unordered set: you cannot say whether two nearby points are on the
          same surface or on opposite sides of a thin wall, you cannot interpolate between samples,
          you cannot compute area or volume, you cannot texture-map it, and you cannot render it as
          a solid.
        </Rule>

        <Concept
          title="Why point clouds are used anyway"
          intuition={<>They are what every sensor natively produces.</>}
        >
          <p>
            Time-of-flight scanners, structured light, laser triangulation, depth-from-blur and
            stereo all output independent per-sample depth measurements. A cloud requires no
            assumptions about topology, handles arbitrary shapes, merges trivially (concatenate two
            clouds), and scales to billions of points. Surface reconstruction is the{' '}
            <em>interpretation</em> step applied afterwards — and it is where the assumptions enter.
          </p>
        </Concept>

        <Worked
          title="Triangulate five points"
          source="Sheet 8 · Exercise 2.3"
          question={
            <>
              Give a reasonable triangulation of{' '}
              <T>{'p_1=(0,0),\\ p_2=(1,0),\\ p_3=(1,1),\\ p_4=(0,1),\\ p_5=(0.5,0.5)'}</T>.
            </>
          }
          steps={[
            {
              label: 'See the structure',
              body: (
                <>Four points form the corners of a unit square; the fifth sits at its centre.</>
              ),
            },
            {
              label: 'Fan from the centre',
              body: (
                <>
                  Connect <T>{'p_5'}</T> to each corner and take consecutive corner pairs:
                  <div className="mt-1.5 font-mono text-[13px] leading-relaxed">
                    (p₁, p₂, p₅) &nbsp; (p₂, p₃, p₅) &nbsp; (p₃, p₄, p₅) &nbsp; (p₄, p₁, p₅)
                  </div>
                </>
              ),
            },
            {
              label: 'Why this one',
              body: (
                <>
                  Four triangles, no overlaps, no gaps, the square exactly covered. It is also the{' '}
                  <em>Delaunay</em> triangulation here: each triangle is right-angled and isosceles,
                  maximising the minimum angle. Delaunay is the standard choice because it avoids
                  the skinny slivers that make downstream normal and curvature estimates unstable.
                  The alternative — a single diagonal across the square, ignoring <T>{'p_5'}</T> —
                  discards a measurement, which you should not do.
                </>
              ),
            },
          ]}
          answer={
            <>
              Four triangles fanning out from the centre point:{' '}
              <T>{'(p_1,p_2,p_5), (p_2,p_3,p_5), (p_3,p_4,p_5), (p_4,p_1,p_5)'}</T> — the Delaunay
              triangulation of these five points.
            </>
          }
        />

        <Pitfall title="Why noise and missing data make this hard">
          <strong>Noise</strong> destroys the local structure the reconstruction depends on: normals
          estimated from a noisy neighbourhood point in the wrong direction, and a surface fitted to
          noisy samples is bumpy — so you must smooth, and smoothing removes genuine detail.{' '}
          <strong>Missing data</strong> (occlusion, dark or specular surfaces, grazing angles)
          leaves holes, and filling a hole means <em>inventing</em> geometry — with no way to tell a
          real hole (a handle, a window) from a measurement gap. On top of that, the correct
          topology is fundamentally ambiguous from samples alone: two surfaces closer together than
          the sample spacing cannot be separated.
        </Pitfall>
      </Section>

      <Section
        id="icp"
        n={3}
        title="Registration with ICP"
        lead="Two scans of the same object, in different frames. Align them by alternating between guessing correspondences and solving for the transform."
      >
        <Concept
          title="The chicken-and-egg problem again"
          intuition={
            <>
              With known correspondences, the optimal rigid transform has a closed form. With a
              known transform, the correspondences are just nearest neighbours. Neither is available
              — so alternate.
            </>
          }
        >
          <Rule tag="Given shapes X and Y, iterate">
            <ol className="mt-1 list-decimal space-y-1 pl-5">
              <li>
                For each <T>{'\\mathbf x_i \\in X'}</T>, find its <strong>nearest neighbour</strong>{' '}
                <T>{'\\mathbf y_i \\in Y'}</T>.
              </li>
              <li>
                Find the deformation <T>{'R, \\mathbf t'}</T> minimising{' '}
                <T>
                  {'\\sum_{i=1}^{N}\\lVert R\\mathbf x_i + \\mathbf t - \\mathbf y_i\\rVert_2^2'}
                </T>
                .
              </li>
            </ol>
          </Rule>
        </Concept>

        <Figure caption="Step it. Near the answer it converges in a few iterations; start it past about 120° and the residual still falls monotonically — into the wrong alignment.">
          <ICPLab />
        </Figure>

        <Deeper label="The closed form for step 2 (Arun et al. / Kabsch)">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Build the cross-covariance{' '}
              <T>
                {'C = \\sum_{i=1}^{N}(\\mathbf y_i - \\mu^Y)(\\mathbf x_i - \\mu^X)^{\\mathsf T}'}
              </T>{' '}
              with <T>{'\\mu^X = \\frac1N\\sum_i \\mathbf x_i'}</T> and{' '}
              <T>{'\\mu^Y = \\frac1N\\sum_i \\mathbf y_i'}</T>.
            </li>
            <li>
              Take the SVD <T>{'C = U\\Sigma V^{\\mathsf T}'}</T>.
            </li>
            <li>
              If <T>{'\\det(UV^{\\mathsf T}) = 1'}</T>, set{' '}
              <T>{'R_{\\text{opt}} = UV^{\\mathsf T}'}</T>. Otherwise use{' '}
              <T>{'R_{\\text{opt}} = U\\tilde\\Sigma V^{\\mathsf T}'}</T> with{' '}
              <T>{'\\tilde\\Sigma = \\operatorname{diag}(1,\\dots,1,-1)'}</T> — this rejects the
              reflection that raw SVD would otherwise allow.
            </li>
            <li>
              Then <T>{'\\mathbf t_{\\text{opt}} = \\mu^Y - R_{\\text{opt}}\\mu^X'}</T>: once
              rotated, align the centroids.
            </li>
          </ol>
          <p className="mt-3">
            <T>{'C'}</T> is only <T>{'3\\times3'}</T>, so the SVD is essentially free. The expensive
            part of ICP is step 1 — the nearest-neighbour search — which is why implementations use
            kd-trees, and why Voronoi cells appear in the lecture: the nearest-neighbour assignment
            <em>is</em> the Voronoi partition of the target set.
          </p>
        </Deeper>

        <Rule tag="Convergence">
          At each iteration <T>{'\\sum_i d^2(\\mathbf x_i, Y)'}</T> decreases — both steps can only
          reduce it. So ICP <strong>always converges</strong>, but only to a{' '}
          <strong>local minimum</strong>. With a good initial guess it reaches the global one. That
          is why ICP is a <em>refinement</em> step: a coarse alignment must come first, from SfM
          poses, from feature matching, or from turntable angles.
        </Rule>

        <Aside title="More stable variants">
          Plain ICP struggles with irregular sampling — a densely-sampled region dominates the sum
          and drags the alignment. Fixes include normal-space sampling (pick points so their normals
          are spread evenly), point-to-plane distance instead of point-to-point (which lets surfaces
          slide against each other and converges much faster on flat regions), and rejecting
          correspondence pairs that are too far apart or whose normals disagree.
        </Aside>
      </Section>

      <Section
        id="implicit"
        n={4}
        title="Implicit surfaces and Poisson reconstruction"
        lead="Do not fit the surface directly. Fit a function whose zero level set is the surface."
      >
        <FormulaCard
          name="Implicit surface"
          note="Example: f(x,y) = x² + y² − r² gives a circle of radius r."
        >
          <Tex>{'S = \\{\\mathbf x \\ \\text{such that}\\ f(\\mathbf x) = 0\\}'}</Tex>
        </FormulaCard>

        <Concept
          title="Why go indirect"
          intuition={
            <>
              Fitting a mesh means deciding topology — how many holes, how the pieces connect —
              before you have started. Fitting a <em>function</em> defers all of that: you solve a
              smooth, well-posed problem, and the topology falls out of the level set at the end.
            </>
          }
        >
          <p>
            The convention is <T>{'f < 0'}</T> inside the object, <T>{'f > 0'}</T> outside and{' '}
            <T>{'f = 0'}</T> on the surface. Any topology is representable by the same machinery,
            the function can be regularised (so noise is handled naturally), and holes are filled
            automatically because a smooth function has values everywhere — including where you had
            no samples.
          </p>
        </Concept>

        <Rule tag="Poisson surface reconstruction (Kazhdan, Bolitho & Hoppe 2006)">
          Goal: construct the <strong>indicator function</strong> of the solid,
          <Tex>
            {
              '\\chi_M(\\mathbf p) = \\begin{cases} 1 & \\mathbf p \\in M\\\\ 0 & \\mathbf p \\notin M\\end{cases}'
            }
          </Tex>
          The key observation: <T>{'\\nabla\\chi_M'}</T> is zero everywhere except at the surface,
          where it points along the inward normal. So the <em>oriented points</em> you measured are
          samples of the indicator&rsquo;s gradient field <T>{'V'}</T>. Solve
          <Tex>{'\\min_{\\chi} \\lVert \\nabla\\chi - V\\rVert'}</Tex>
          which is a least-squares problem whose normal equation is the{' '}
          <strong>Poisson equation</strong> <T>{'\\Delta\\chi = \\nabla\\!\\cdot V'}</T>. Then
          extract the level set.
        </Rule>

        <Concept
          title="Why this is such a good formulation"
          intuition={
            <>It turns a geometry problem into a standard, global, well-conditioned PDE.</>
          }
        >
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Global.</strong> Every sample influences the solution everywhere, so noise
              averages out instead of producing local bumps.
            </li>
            <li>
              <strong>Smooth by construction.</strong> The Laplacian appears naturally, so the
              result is as smooth as the data permits — and you remember from topic 0 that{' '}
              <T>{'\\Delta\\chi = 0'}</T> means &ldquo;equal to the local average&rdquo;.
            </li>
            <li>
              <strong>Watertight.</strong> The solution is defined everywhere, so holes are
              interpolated rather than left open.
            </li>
            <li>
              <strong>The catch:</strong> it needs <em>oriented</em> normals. Getting consistent
              inside/outside orientation from a raw cloud is a non-trivial problem of its own, and
              getting it wrong turns the surface inside out.
            </li>
          </ul>
        </Concept>
      </Section>

      <Section
        id="marching"
        n={5}
        title="Marching squares and cubes"
        lead="From an implicit field to actual triangles. Lorensen & Cline 1987, and still the dominant algorithm."
      >
        <Rule tag="The algorithm">
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            <li>Start at a voxel containing the surface.</li>
            <li>
              Look at the <em>sign</em> of <T>{'f'}</T> at its 8 corners — inside or outside.
            </li>
            <li>Add polygons according to a pre-computed configuration table.</li>
            <li>March to the next voxel.</li>
          </ol>
        </Rule>

        <Figure caption="The 2D case: click a corner to flip it. Four corners, two states each, sixteen cases — all tabulated in advance. In 3D it is eight corners and 256 cases.">
          <MarchingSquares />
        </Figure>

        <Concept
          title="Where the accuracy comes from"
          intuition={
            <>
              The <em>signs</em> choose which edges are crossed; the <em>values</em> decide where
              along each edge the crossing sits, by linear interpolation. That is why the mesh is
              far finer than the voxel grid it came from.
            </>
          }
        >
          <p>
            If <T>{'f = -0.1'}</T> at one end of an edge and <T>{'f = +0.9'}</T> at the other, the
            zero crossing sits 10% of the way along — not at the midpoint. Without this, marching
            cubes would produce blocky, staircase output at voxel resolution.
          </p>
        </Concept>

        <KeyList
          title="Strengths and weaknesses, from the lecture"
          items={[
            {
              k: 'Very multi-purpose',
              v: 'Works for any implicit field: Poisson, SDF, medical CT, a neural network.',
            },
            {
              k: 'Extremely fast and parallelisable',
              v: 'Every voxel is independent — perfect for a GPU.',
            },
            { k: 'Simple to implement', v: 'A table lookup plus interpolation.' },
            { k: 'Virtually parameter-free', v: 'Only the grid resolution and the iso-value.' },
            {
              k: '✗ Badly shaped triangles',
              v: 'Slivers appear when a crossing lands very near a corner, which hurts downstream normal and curvature estimates.',
            },
            {
              k: '✗ No topological guarantees',
              v: 'Basic versions can produce holes or non-manifold edges where ambiguous cases are resolved inconsistently between neighbouring cells.',
            },
            {
              k: '✗ Many special cases',
              v: 'Implemented as large lookup tables — 256 entries in 3D, before symmetry reduction.',
            },
            {
              k: '✗ No sharp features',
              v: 'Linear interpolation along edges rounds off any crease that falls inside a voxel. Dual Contouring exists for this reason.',
            },
          ]}
        />

        <Pitfall title="The ambiguous cases">
          When two <em>diagonally opposite</em> corners are inside and the other two outside, the
          cell simply does not determine whether the two blobs touch. Two contours are equally
          consistent with the data. Resolve by subsampling inside the cell if you can, or pick one
          of the two possibilities — but pick <em>consistently</em>, because neighbouring cells
          choosing differently is exactly what punches holes in a 3D mesh.
        </Pitfall>
      </Section>
    </>
  )
}

export const drills: DrillSpec[] = [
  {
    id: 'sur-d1',
    topicId: 'surfaces',
    source: 'Sheet 8 · Ex 1.1–1.2',
    kind: 'explain',
    prompt: (
      <>
        Name the main steps of the 3D reconstruction pipeline, and explain why depth maps from
        several views must be fused.
      </>
    ),
    answer: (
      <>
        <strong>Pipeline:</strong> input images → camera poses (features, matching, epipolar
        geometry, SfM) → dense correspondences (rectify, match) → depth maps (<T>{'z = fb/d'}</T>) →
        depth-map fusion → 3D model (surface fit + meshing).
        <br />
        <br />
        <strong>Why fusion:</strong>
        <br />
        <em>Coverage</em> — a single depth map contains only what that camera saw; everything
        occluded or facing away is missing, and no single view covers a closed object.
        <br />
        <em>Accuracy</em> — depth noise grows as <T>{'z^2'}</T>; averaging overlapping, independent
        estimates reduces variance, and disagreement between views identifies outliers.
        <br />
        <em>Consistency</em> — each map is in its own camera&rsquo;s frame, so they must be
        transformed into a common frame (SfM poses, refined by ICP) and redundant points merged;
        otherwise you get several offset copies rather than one surface.
      </>
    ),
  },
  {
    id: 'sur-d2',
    topicId: 'surfaces',
    source: 'Sheet 8 · Ex 2.1',
    kind: 'explain',
    prompt: (
      <>
        What information is contained in a point cloud, and what is missing compared with a triangle
        mesh?
      </>
    ),
    answer: (
      <>
        <strong>Contained:</strong> the 3D positions <T>{'(X,Y,Z)'}</T> of sampled surface points;
        often colour (from the source image); sometimes normals and per-point confidence.
        <br />
        <br />
        <strong>Missing: connectivity</strong> — and therefore topology and surface. A mesh records
        which points form faces, so it defines a continuous surface with an inside and an outside. A
        cloud is an unordered set, so you cannot say whether two nearby points lie on the same
        surface or on opposite sides of a thin wall, cannot interpolate between samples, cannot
        compute area or volume, cannot texture-map, and cannot render it as a solid.
        <br />
        <br />
        Point clouds are nonetheless the natural output of every depth sensor: no topological
        assumptions, arbitrary shapes, trivial merging, and they scale to billions of points.
      </>
    ),
  },
  {
    id: 'sur-d2b',
    topicId: 'surfaces',
    source: 'Sheet 8 · Ex 2.2',
    kind: 'explain',
    prompt: <>Explain why point clouds are useful for digitising real-world objects.</>,
    answer: (
      <>
        Because a point cloud is <em>exactly what every depth sensor natively produces</em>.
        Time-of-flight scanners, structured light, laser triangulation, depth-from-blur and stereo
        all return independent per-sample depth measurements, and writing them down as{' '}
        <T>{'(X, Y, Z)'}</T> triples adds no interpretation of its own.
        <br />
        <br />
        That is the substantive advantage: the representation makes <strong>no assumptions</strong>.
        It imposes no topology, so it handles objects with holes, handles, thin sheets and
        disconnected parts equally well; it has no fixed resolution, so dense and sparse regions
        coexist; and merging two scans is literally concatenating two sets, which is what makes
        multi-view fusion tractable. It also scales — billions of points are routine — and stores
        colour and normals alongside position at no structural cost.
        <br />
        <br />
        The trade-off is that all of the interpretation is deferred. Surface reconstruction
        (registration → implicit field → meshing) is where the assumptions finally get made, and
        keeping that step separate is precisely what makes the pipeline modular.
      </>
    ),
  },
  {
    id: 'sur-d3',
    topicId: 'surfaces',
    source: 'Sheet 8 · Ex 2.4',
    kind: 'explain',
    prompt: <>Why do noise and missing measurements make surface reconstruction difficult?</>,
    answer: (
      <>
        <strong>Noise</strong> destroys the local structure the reconstruction relies on. Normals
        estimated from a noisy neighbourhood point in the wrong direction, which Poisson
        reconstruction depends on; the fitted surface becomes bumpy; and smoothing enough to remove
        the noise also removes genuine fine detail. There is no way to separate the two from samples
        alone.
        <br />
        <br />
        <strong>Missing data</strong> — from occlusion, dark or specular surfaces, grazing incidence
        — leaves holes, and filling one means <em>inventing</em> geometry with no way to distinguish
        a real hole (a handle, a window) from a measurement gap. The method must impose a prior, and
        the prior may be wrong.
        <br />
        <br />
        Compounding both: the true topology is fundamentally ambiguous. Two surfaces closer together
        than the sample spacing cannot be separated, so a thin object may be reconstructed as solid
        or as two sheets depending on nothing but the sampling density.
      </>
    ),
  },
  {
    id: 'sur-d4',
    topicId: 'surfaces',
    source: 'L10 · ICP',
    kind: 'explain',
    prompt: (
      <>
        Describe the two steps of an ICP iteration and state what ICP converges to. Why does it need
        a good initialisation?
      </>
    ),
    answer: (
      <>
        <strong>Step 1:</strong> for each point <T>{'\\mathbf x_i \\in X'}</T>, find its nearest
        neighbour <T>{'\\mathbf y_i \\in Y'}</T>. <strong>Step 2:</strong> find the rigid transform
        minimising <T>{'\\sum_i \\lVert R\\mathbf x_i + \\mathbf t - \\mathbf y_i\\rVert_2^2'}</T>,
        which has a closed form via the SVD of the cross-covariance:{' '}
        <T>{'R = U\\tilde\\Sigma V^{\\mathsf T}'}</T>, <T>{'\\mathbf t = \\mu^Y - R\\mu^X'}</T>{' '}
        (with <T>{'\\tilde\\Sigma'}</T> excluding reflections). Repeat.
        <br />
        <br />
        <strong>Convergence:</strong> the residual <T>{'\\sum_i d^2(\\mathbf x_i, Y)'}</T> decreases
        at every iteration, since both steps can only reduce it. So ICP always converges — but only
        to a <em>local</em> minimum.
        <br />
        <br />
        <strong>Why initialisation matters:</strong> the nearest-neighbour assignment in step 1 is
        only correct if the shapes already roughly overlap. From a poor start, points are matched to
        the wrong parts of the target, the estimated transform reinforces that mistake, and the
        residual still falls monotonically — into a confidently wrong alignment. ICP is therefore a
        refinement step, run after a coarse alignment from SfM poses or feature matching.
      </>
    ),
  },
  {
    id: 'sur-d5',
    topicId: 'surfaces',
    source: 'L10 · marching cubes',
    kind: 'choose',
    prompt: (
      <>
        In marching cubes, what determines <em>where along an edge</em> a vertex of the output mesh
        is placed?
      </>
    ),
    options: [
      'Always the midpoint of the edge.',
      'Linear interpolation between the scalar field values at the two edge endpoints.',
      'The gradient of the field at the voxel centre.',
      'A random position, later smoothed.',
    ],
    correct: 1,
    answer: (
      <>
        Linear interpolation of the field values. The <em>signs</em> at the eight corners select
        which of the 256 configurations applies and therefore which edges are crossed; the{' '}
        <em>values</em> then locate the crossing along each edge. If <T>{'f = -0.1'}</T> at one end
        and <T>{'f = +0.9'}</T> at the other, the zero sits 10% along.
        <br />
        <br />
        This is what gives sub-voxel accuracy — without it the output would be blocky at grid
        resolution. It is also the source of one weakness: interpolation rounds off any sharp crease
        that falls inside a voxel, which is why marching cubes reproduces no sharp features.
      </>
    ),
  },
  {
    id: 'sur-d6',
    topicId: 'surfaces',
    source: 'L10 · Poisson',
    kind: 'explain',
    prompt: (
      <>
        Explain the idea behind Poisson surface reconstruction. What does it solve for, and what
        does it require as input?
      </>
    ),
    answer: (
      <>
        It reconstructs the <strong>indicator function</strong> <T>{'\\chi_M'}</T> of the solid — 1
        inside, 0 outside — and then takes the surface as its level set.
        <br />
        <br />
        The key observation: <T>{'\\nabla\\chi_M'}</T> vanishes everywhere except at the surface,
        where it points along the normal. So a set of <em>oriented</em> points is exactly a set of
        samples of this gradient field <T>{'V'}</T>. Poisson reconstruction therefore solves
        <Tex>
          {
            '\\min_\\chi \\lVert \\nabla\\chi - V\\rVert \\quad\\Longleftrightarrow\\quad \\Delta\\chi = \\nabla\\!\\cdot V'
          }
        </Tex>
        the Poisson equation — a global, well-conditioned PDE.
        <br />
        <br />
        <strong>Why it is good:</strong> it is global (every sample influences the whole solution,
        so noise averages out), naturally smooth, and watertight (the solution exists everywhere, so
        holes are interpolated). <strong>What it requires:</strong> oriented normals — consistently
        pointing outwards. Estimating consistent orientation from a raw cloud is a separate,
        non-trivial problem, and getting it wrong turns the surface inside out.
      </>
    ),
  },
]
