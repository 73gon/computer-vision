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
import { PlaneSweepLab, PositionalEncodingLab, VolumeRenderLab } from '@/components/viz/neural'
import type { DrillSpec } from '@/components/learn/drill'
import type { TopicMeta } from './types'

export const meta: TopicMeta = {
  id: 'neural',
  n: 12,
  title: 'Multi-view stereo and neural rendering',
  kicker:
    'More than two cameras, then a change of tactic: instead of matching pixels, build a scene that renders back into the photos you took.',
  lectures: ['L12 Multiview stereo', 'L13 Radiance fields'],
  exercises: ['Sheet 9, Ex 1–4'],
  minutes: 40,
  stage: 'model',
  sections: [
    { id: 'mvs', title: 'Multi-view stereo' },
    { id: 'planesweep', title: 'Plane-sweep stereo' },
    { id: 'inverse', title: 'Vision as inverse rendering' },
    { id: 'nerf', title: 'Neural radiance fields' },
    { id: 'encoding', title: 'Positional encoding' },
    { id: 'compare', title: 'NeRF versus classical MVS' },
  ],
  sheet: [
    {
      name: 'Homography for a plane',
      tex: "\\tilde{\\mathbf x}' = \\tilde H \\tilde{\\mathbf x}",
      note: 'Two views of points on one 3D plane are related by a homography. This is what plane sweep exploits.',
    },
    {
      name: 'Differentiable rendering loss',
      tex: 'L = (I_{\\text{pred}} - I_{\\text{obs}})^2',
    },
    {
      name: 'NeRF',
      tex: 'F(\\mathbf x, \\mathbf d) \\to (\\sigma, \\mathbf c)',
      note: 'x = 3D position, d = viewing direction, σ = volume density, c = emitted RGB.',
    },
    {
      name: 'Volume rendering',
      tex: '\\hat C = \\sum_{i=1}^{N} T_i\\,\\alpha_i\\,\\mathbf c_i, \\qquad T_i = \\prod_{j<i}(1-\\alpha_j)',
    },
    {
      name: 'Density to alpha',
      tex: '\\alpha_i = 1 - \\exp(-\\sigma_i \\delta_i)',
      note: 'δ is the distance between consecutive samples along the ray.',
    },
    {
      name: 'Positional encoding',
      tex: '\\gamma(p) = \\big(\\sin(2^0\\pi p), \\cos(2^0\\pi p), \\dots, \\sin(2^{L-1}\\pi p), \\cos(2^{L-1}\\pi p)\\big)',
    },
  ],
}

export function Body() {
  return (
    <>
      <BigIdea oneLiner="Two cameras give you one weak vote per pixel. Many cameras give you many votes — and once you have many, you can stop matching pixels altogether and instead ask which 3D scene would have produced all these photographs.">
        <p>
          The chapter has two halves that are really one idea. Plane-sweep stereo makes the{' '}
          <em>hypothesis</em> explicit: guess a depth, warp the neighbours onto it, see if they
          agree. Inverse rendering makes the hypothesis the <em>whole scene</em>: guess a scene,
          render it, compare with the photographs, and backpropagate.
        </p>
      </BigIdea>

      <WhyCare>
        NeRF is the cleanest example in the course of a network used as a <em>representation</em>{' '}
        rather than a predictor. It is not trained on a dataset and then run on new inputs — the
        weights <em>are</em> the scene, fitted by overfitting to fifty photographs of it. That is a
        genuinely different way to use a network, and the trick that makes it work (positional
        encoding, to defeat the spectral bias of MLPs) is worth knowing on its own.
      </WhyCare>

      <Section
        id="mvs"
        n={1}
        title="Multi-view stereo"
        lead="Same problem as two-view stereo, with more evidence — and the freedom to choose which evidence."
      >
        <Concept
          title="The basic idea"
          intuition={
            <>
              Pick one image as the <strong>reference</strong> and several others as{' '}
              <strong>neighbours</strong>. Solve for a depth at every pixel of the reference by
              checking consistency against all the neighbours at once, then repeat with a different
              reference.
            </>
          }
        >
          <KeyList
            title="What the extra views buy"
            items={[
              {
                k: 'A stronger match signal',
                v: 'Matching against several neighbours instead of one averages out noise and, crucially, suppresses false matches: a wrong depth may happen to agree with one neighbour, but rarely with five.',
              },
              {
                k: 'Neighbour selection',
                v: 'With many candidates you can pick the best subset per reference — similar enough in viewpoint to match, different enough to triangulate accurately.',
              },
              {
                k: 'Occlusion handling',
                v: 'A surface hidden in one neighbour is usually visible in another, so the half-occlusion problem largely dissolves.',
              },
              {
                k: 'Completeness',
                v: 'A depth map per reference frame, merged into one model, covers the object from all sides.',
              },
            ]}
          />
        </Concept>

        <Rule tag="The MVS pipeline, with the purpose of each step">
          <ol className="mt-1 list-decimal space-y-1.5 pl-5">
            <li>
              <strong>Images</strong> — several overlapping views.
            </li>
            <li>
              <strong>Camera poses</strong> — from SfM. Required before anything else, because depth
              only means something relative to a known camera.
            </li>
            <li>
              <strong>Dense correspondences</strong> — match every pixel, not just features, using
              the known geometry to constrain the search.
            </li>
            <li>
              <strong>Depth maps</strong> — one per reference view, converted from the matches.
            </li>
            <li>
              <strong>Depth-map fusion</strong> — bring all maps into one frame, average the
              agreements, discard the outliers.
            </li>
            <li>
              <strong>3D model</strong> — fit an implicit surface, extract a mesh.
            </li>
          </ol>
        </Rule>

        <Pitfall title="Two typical sources of reconstruction error">
          <strong>Matching failures</strong> — textureless surfaces, repetitive structure,
          non-Lambertian materials (specular highlights and reflections move with the camera, so the
          brightness-constancy assumption fails outright), and thin structures smaller than the
          matching window.
          <br />
          <br />
          <strong>Pose and calibration errors</strong> — every depth is computed{' '}
          <em>relative to</em> the estimated camera. A small pose error puts an otherwise perfect
          depth map in the wrong place, so fusing several of them produces a doubled or blurred
          surface rather than a sharp one. This is why bundle adjustment quality directly limits MVS
          quality.
        </Pitfall>
      </Section>

      <Section
        id="planesweep"
        n={2}
        title="Plane-sweep stereo"
        lead="Sweep a family of planes through the scene. At each one, warp every neighbour onto it and ask whether they agree."
      >
        <Concept
          title="Why a homography is the right warp"
          intuition={
            <>
              Corresponding points in two images are related by a homography{' '}
              <em>if their 3D pre-images lie on a common plane</em>. So once you{' '}
              <em>hypothesise</em> a plane, the mapping between the views is fully determined — no
              search required.
            </>
          }
        >
          <p>
            That is the whole trick. Rectified two-view stereo only works for a fronto-parallel
            pair; plane sweeping works for arbitrary camera poses, because the plane hypothesis
            supplies the warp directly. Sweep planes parallel to the reference camera&rsquo;s image
            plane, reproject each neighbour onto each plane by its homography, and compare.
          </p>
        </Concept>

        <Figure caption="At the wrong depth the reprojected neighbours disagree and the patch looks blurred; at the right depth they land on top of each other.">
          <PlaneSweepLab />
        </Figure>

        <Worked
          title="Read a depth off the cost profile"
          source="Sheet 9 · Exercise 1.2"
          question={
            <>
              Five candidate planes at <T>{'z \\in \\{1,2,3,4,5\\}'}</T> m with matching costs{' '}
              <T>{'C(z) = \\{0.81,\\ 0.42,\\ 0.18,\\ 0.37,\\ 0.64\\}'}</T>. What depth is estimated?
            </>
          }
          steps={[
            {
              label: 'The cost is a dissimilarity',
              body: <>Lower is better, so take the minimum, not the maximum.</>,
            },
            {
              label: 'Find the minimum',
              body: (
                <>
                  <T>{'\\min\\{0.81, 0.42, 0.18, 0.37, 0.64\\} = 0.18'}</T>, at the third plane.
                </>
              ),
            },
            {
              label: 'Read off the depth',
              body: (
                <>
                  <T>{'\\hat z = \\argmin_z C(z) = 3'}</T> m. The profile is nicely V-shaped and has
                  a single clear minimum, so this is a confident estimate.
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'\\hat z = 3'}</T> m. Worth adding: a sub-pixel refinement would fit a parabola
              through the three lowest costs (0.42, 0.18, 0.37) and take its vertex, giving a
              continuous depth slightly below 3 m rather than a quantised one.
            </>
          }
        />

        <Rule tag="From a cost profile to a depth map">
          Every pixel of the reference view gets its own cost profile over the planes. Stack them
          and you have a <strong>cost volume</strong> of width × height × depth-planes — the exact
          analogue of the disparity cost volume in topic 8, but indexed by depth rather than
          disparity. A depth-map solver (belief propagation, graph cuts, or a 3D CNN) then extracts
          one depth per pixel — using the <em>same</em> smoothness reasoning as topic 9, because
          taking the per-pixel argmin alone is just winner-takes-all with all its noise.
        </Rule>

        <KeyList
          title="Plane sweep vs classical block matching"
          items={[
            {
              k: 'Plane sweep ✓',
              v: 'Works with arbitrary camera poses — no rectification needed. Handles any number of neighbours at once, giving a much stronger signal. Costs are directly in depth, so multiple views combine naturally.',
            },
            {
              k: 'Plane sweep ✗',
              v: 'Expensive: one homography warp per plane per neighbour, for every pixel. Depth resolution is quantised by the plane spacing. The planes are usually fronto-parallel, which biases slanted surfaces.',
            },
            {
              k: 'Block matching ✓',
              v: 'Very cheap and simple: a 1D search along a row, contiguous in memory, trivially parallel. Real-time on modest hardware.',
            },
            {
              k: 'Block matching ✗',
              v: 'Requires a rectified pair, so it is restricted to two views with a suitable configuration. Only one neighbour, so it is far more vulnerable to ambiguity, occlusion and noise.',
            },
          ]}
        />

        <Aside title="MVSNet, and the modern version">
          MVSNet (Yao 2018) keeps this structure exactly and learns the pieces: a CNN extracts
          features, the plane-sweep warps build a cost volume out of those features instead of raw
          patches, and a 3D CNN regularises the volume before the depth is regressed. The geometry —
          hypothesise a depth, warp, compare — is unchanged. What changed is that the{' '}
          <em>comparison function</em> and the <em>regulariser</em> are learned.
        </Aside>
      </Section>

      <Section
        id="inverse"
        n={3}
        title="Vision as inverse rendering"
        lead="Reframe the whole problem: find the scene whose rendered images match the photographs."
      >
        <Concept
          title="Rendering and its inverse"
          intuition={
            <>
              <strong>Rendering:</strong> 3D scene representation → image. Well-defined, a function,
              and computable — ray tracing or rasterisation. <br />
              <strong>Inverse rendering:</strong> image(s) → 3D scene representation. Ill-posed, not
              a function, and the whole subject of this course.
            </>
          }
        >
          <p>
            The idea that makes it tractable: do not invert the renderer. Instead <em>optimise</em>{' '}
            — parameterise the scene, render it, measure the difference from the real photographs,
            and adjust the scene to reduce it. That converts an inverse problem into an optimisation
            problem, which is a thing we know how to do.
          </p>
        </Concept>

        <Rule tag="Why the renderer must be differentiable">
          Gradient descent needs <T>{'\\partial L/\\partial\\theta'}</T> — how the loss changes when
          a scene parameter changes. By the chain rule that is{' '}
          <T>
            {
              '\\dfrac{\\partial L}{\\partial I_{\\text{pred}}} \\cdot \\dfrac{\\partial I_{\\text{pred}}}{\\partial \\theta}'
            }
          </T>
          , and the second factor is the derivative <em>of the rendering process</em>. If rendering
          is not differentiable — a hard visibility test, a discrete rasterisation decision — that
          derivative is zero almost everywhere, and there is no signal telling the optimiser which
          way to move. You would be left with derivative-free search over millions of parameters,
          which is hopeless.
        </Rule>

        <Worked
          title="A reconstruction loss"
          source="Sheet 9 · Exercise 3.3"
          question={
            <>
              An observed pixel has intensity <T>{'I_{\\text{obs}} = 0.72'}</T>; the render predicts{' '}
              <T>{'I_{\\text{pred}} = 0.63'}</T>. Compute the squared loss, and explain how
              minimising it improves the scene.
            </>
          }
          steps={[
            {
              label: 'Substitute',
              body: <Tex>{'L = (I_{\\text{pred}} - I_{\\text{obs}})^2 = (0.63 - 0.72)^2'}</Tex>,
            },
            {
              label: 'Evaluate',
              body: <Tex>{'= (-0.09)^2 = 0.0081'}</Tex>,
            },
            {
              label: 'How this improves the estimate',
              body: (
                <>
                  The gradient{' '}
                  <T>
                    {
                      '\\partial L/\\partial I_{\\text{pred}} = 2(I_{\\text{pred}} - I_{\\text{obs}}) = -0.18'
                    }
                  </T>{' '}
                  is backpropagated <em>through the renderer</em> to the scene parameters — the
                  colours and densities along the ray that produced this pixel. Each parameter moves
                  in the direction that would have made the render darker or lighter, as needed.
                  Repeating over every pixel of every training view forces the representation
                  towards a scene that is consistent with <em>all</em> the photographs at once — and
                  consistency across many viewpoints is what pins down the 3D geometry.
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'L = 0.0081'}</T>. Minimising it over all pixels and all views drives the scene
              representation towards one that reproduces every photograph, and multi-view
              consistency is what recovers the geometry.
            </>
          }
        />

        <Aside title="Multiplane images — the stepping stone">
          Stereo Magnification (Zhou et al. 2018) represents a scene as a stack of RGBA planes at
          fixed depths, seen from a reference viewpoint. New views are synthesised by warping each
          plane with its homography and compositing back to front. A U-Net predicts the RGB and
          alpha from input views, trained on RealEstate10K — 10 million frames from 80 000 clips,
          with poses from SLAM. It is a fixed, explicit, limited representation, and its limits (a
          fixed plane count, no true view-dependence) are exactly what NeRF removes.
        </Aside>
      </Section>

      <Section
        id="nerf"
        n={4}
        title="Neural radiance fields"
        lead="Represent the scene as a cloud of coloured fog, and store the fog in the weights of a small network."
      >
        <FormulaCard name="The NeRF function">
          <Tex>{'F(\\mathbf x, \\mathbf d) \\longrightarrow (\\sigma, \\mathbf c)'}</Tex>
        </FormulaCard>

        <KeyList
          title="The four symbols"
          items={[
            {
              k: <T>{'\\mathbf x'}</T>,
              v: 'A 3D position in the scene — where in space you are asking about.',
            },
            {
              k: <T>{'\\mathbf d'}</T>,
              v: 'A viewing direction — from which direction you are looking at that point.',
            },
            {
              k: <T>{'\\sigma'}</T>,
              v: 'Volume density: how much the medium at x blocks light. Depends on x only — geometry cannot depend on where you stand.',
            },
            {
              k: <T>{'\\mathbf c'}</T>,
              v: 'Emitted RGB colour. Depends on x AND d — which is what lets it model specular highlights.',
            },
          ]}
        />

        <Concept
          title="Volume rendering along a ray"
          intuition={
            <>
              March along the ray <T>{'\\mathbf r(t) = \\mathbf o + t\\mathbf d'}</T>, sampling
              points. Each contributes its colour, weighted by how opaque it is <em>and</em> by how
              much light survived everything in front of it.
            </>
          }
        >
          <FormulaCard name="The discrete estimator">
            <Tex>
              {
                '\\hat C = \\sum_{i=1}^{N} T_i\\,\\alpha_i\\,\\mathbf c_i, \\qquad T_i = \\prod_{j<i}\\big(1 - \\alpha_j\\big), \\qquad \\alpha_i = 1 - \\exp(-\\sigma_i\\delta_i)'
              }
            </Tex>
          </FormulaCard>
          <p>
            <T>{'T_i'}</T> is the <strong>transmittance</strong> — the probability that the ray got
            this far without hitting anything. <T>{'\\alpha_i'}</T> is the opacity of sample{' '}
            <T>{'i'}</T>, derived from the stored density <T>{'\\sigma_i'}</T> and the distance{' '}
            <T>{'\\delta_i'}</T> between samples. Computing this for a ray through every pixel
            renders an image.
          </p>
        </Concept>

        <Figure caption="Click a density bar to raise it (shift-click to lower). Raise an early sample and everything behind it stops contributing — that is transmittance doing occlusion.">
          <VolumeRenderLab />
        </Figure>

        <Rule tag="Why the soft, volumetric formulation is the point">
          A hard surface with a z-buffer test has <em>zero gradient</em> almost everywhere: nudging
          a triangle either changes nothing or discontinuously flips which surface is visible. There
          is nothing for gradient descent to follow.
          <br />
          <br />
          The volumetric formulation replaces that hard test with a smooth product of
          transmittances. Every sample along the ray contributes something, so every sample receives
          a gradient, and occlusion emerges from the product rather than from a discrete decision.
          That is precisely what makes the whole pipeline differentiable — and it is why triangle
          meshes were described in the lecture as &ldquo;hard to deal with&rdquo; for inverse
          rendering.
        </Rule>

        <Concept
          title="Why colour depends on the viewing direction"
          intuition={
            <>
              A Lambertian surface looks the same from everywhere. A glossy or metallic one does not
              — the highlight moves as you move. If colour were a function of position alone, that
              would be unrepresentable.
            </>
          }
        >
          <p>
            Making <T>{'\\mathbf c'}</T> depend on <T>{'\\mathbf d'}</T> lets a single point emit
            different colours in different directions, so specular highlights, reflections and
            general non-Lambertian appearance are captured. Note the deliberate asymmetry:{' '}
            <T>{'\\sigma'}</T> depends on <T>{'\\mathbf x'}</T> <em>only</em>. Geometry must be
            consistent across views, and forcing that is what stops the network from cheating by
            memorising each training image independently.
          </p>
        </Concept>
      </Section>

      <Section
        id="encoding"
        n={5}
        title="Positional encoding"
        lead="The one implementation detail without which none of it works."
      >
        <Concept
          title="The failure it fixes"
          intuition={
            <>
              Train a plain MLP to map <T>{'(x,y)'}</T> to the RGB of an image and it learns a
              blurry, washed-out version. It cannot fit the detail no matter how long you train.
            </>
          }
        >
          <p>
            Standard coordinate-based MLPs are strongly biased towards <em>low-frequency</em>{' '}
            functions — they cannot represent high-frequency variation efficiently. Nearby inputs
            produce nearby outputs, and a ReLU network needs a great many units to make that change
            quickly.
          </p>
        </Concept>

        <FormulaCard
          name="Positional encoding"
          note="Applied per coordinate, before the network sees it."
        >
          <Tex>
            {
              '\\gamma(p) = \\Big(\\sin(2^0\\pi p),\\, \\cos(2^0\\pi p),\\, \\dots,\\, \\sin(2^{L-1}\\pi p),\\, \\cos(2^{L-1}\\pi p)\\Big)'
            }
          </Tex>
        </FormulaCard>

        <Figure caption="Each band doubles in frequency. Two nearby inputs already differ sharply in the high bands, so a low-frequency-biased network can represent a high-frequency function.">
          <PositionalEncodingLab />
        </Figure>

        <Aside>
          Two points a hair apart have nearly identical raw coordinates, but their high-frequency
          encodings differ substantially — so the network can assign them very different outputs
          without needing to be high-frequency itself. Raise <T>{'L'}</T> and you buy detail; raise
          it too far and you buy aliasing and noise, which is what Mip-NeRF later addressed by
          integrating the encoding over a cone rather than evaluating it at a point.
        </Aside>
      </Section>

      <Section
        id="compare"
        n={6}
        title="NeRF versus classical MVS"
        lead="The comparison the exercise asks for, with a real advantage and a real disadvantage each."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[16px] border border-hairline bg-card p-4">
            <div className="eyebrow mb-2">Classical MVS</div>
            <p className="mb-2 text-[15px] leading-relaxed">
              <strong>Advantage:</strong> it produces an <em>explicit</em> geometric model — a point
              cloud or mesh you can measure, edit, simulate with, 3D-print, or drop into a game
              engine. It is interpretable, it generalises to new scenes without retraining, and it
              is fast once the poses are known.
            </p>
            <p className="text-[15px] leading-relaxed">
              <strong>Disadvantage:</strong> it depends entirely on photometric matching, so it
              fails on textureless, repetitive, transparent and specular surfaces. Thin structures
              are lost and the results are typically noisy and full of holes.
            </p>
          </div>
          <div className="rounded-[16px] border border-hairline bg-card p-4">
            <div className="eyebrow mb-2">NeRF</div>
            <p className="mb-2 text-[15px] leading-relaxed">
              <strong>Advantage:</strong> photorealistic novel views, including view-dependent
              effects (specularity, reflection, transparency) that surface-based MVS cannot
              represent at all. It handles semi-transparent media and fine structure like hair, and
              needs no explicit correspondences.
            </p>
            <p className="text-[15px] leading-relaxed">
              <strong>Disadvantage:</strong> the geometry is implicit, buried in the weights — hard
              to edit, measure or export. Training is per-scene and slow, rendering is slow, many
              posed input views are needed, and it extrapolates poorly beyond the training
              viewpoints.
            </p>
          </div>
        </div>

        <Pitfall title="The one-sentence version, if you only remember one thing">
          MVS optimises for <strong>geometry</strong> and gets images as a by-product. NeRF
          optimises for <strong>images</strong> and gets geometry as a by-product. Which one you
          want depends entirely on whether the deliverable is a measurement or a picture.
        </Pitfall>

        <Deeper label="Where this was going next">
          The lecture&rsquo;s trajectory is worth having in your head as a closing narrative. The
          challenges named for view synthesis are <em>extrapolation</em> (large disocclusions when
          moving far from the input views) and <em>non-Lambertian effects</em>. Multiplane images
          answered the second partially with a fixed, explicit representation. NeRF answered both by
          making the representation continuous and view-dependent — at the cost of speed. Mip-NeRF
          360 then addressed unbounded scenes and aliasing, and later work (hash grids, Gaussian
          splatting) has mostly been about recovering the speed that the implicit representation
          gave away.
        </Deeper>
      </Section>
    </>
  )
}

export const drills: DrillSpec[] = [
  {
    id: 'neu-d1',
    topicId: 'neural',
    source: 'Sheet 9 · Ex 1.1',
    kind: 'explain',
    prompt: (
      <>
        Explain the idea of plane-sweep stereo. Why are neighbouring images reprojected onto
        hypothetical planes?
      </>
    ),
    answer: (
      <>
        Plane sweep estimates depth by <em>testing hypotheses</em>. A family of planes is swept
        through the scene, parallel to the reference camera&rsquo;s image plane, each one standing
        for one candidate depth. For each plane, every neighbouring image is reprojected onto it and
        compared with the reference; the depth whose reprojections agree best wins.
        <br />
        <br />
        <strong>Why reprojection works:</strong> two views of points lying on a{' '}
        <em>common 3D plane</em> are related by a homography. So hypothesising a plane{' '}
        <em>determines</em> the warp completely — no search is needed, just one matrix per plane per
        neighbour. At the correct depth the warped neighbours line up with the reference and the
        patch is sharp; at a wrong depth they are misaligned and the averaged patch is blurred,
        which the matching cost detects.
        <br />
        <br />
        The advantage over rectified block matching is that this needs no rectification, works for
        arbitrary camera poses, and combines any number of neighbours at once.
      </>
    ),
  },
  {
    id: 'neu-d2',
    topicId: 'neural',
    source: 'Sheet 9 · Ex 1.2–1.3',
    kind: 'compute',
    prompt: (
      <>
        For <T>{'z = \\{1,2,3,4,5\\}'}</T> m with costs{' '}
        <T>{'C(z) = \\{0.81, 0.42, 0.18, 0.37, 0.64\\}'}</T>, give the estimated depth, then explain
        how per-pixel cost profiles become a depth map.
      </>
    ),
    answer: (
      <>
        The cost is a dissimilarity, so take the minimum: <T>{'0.18'}</T> at the third plane, giving{' '}
        <strong>
          <T>{'\\hat z = 3'}</T> m
        </strong>
        . (A sub-pixel refinement would fit a parabola through the three lowest costs and take its
        vertex.)
        <br />
        <br />
        <strong>From profiles to a depth map:</strong> every pixel of the reference view has its own
        profile over the planes. Stacking them gives a <em>cost volume</em> of width × height ×
        planes. Taking the per-pixel argmin is winner-takes-all and is noisy for the usual reasons
        (textureless, repetitive, occluded regions), so the volume is passed to a depth-map solver —
        belief propagation, graph cuts, or a 3D CNN — which imposes spatial smoothness exactly as in
        the MRF topic and returns one depth per pixel.
      </>
    ),
  },
  {
    id: 'neu-d3',
    topicId: 'neural',
    source: 'Sheet 9 · Ex 2.2–2.4',
    kind: 'explain',
    prompt: (
      <>
        Why use several neighbouring views instead of a single stereo pair, and name two typical
        sources of reconstruction error in MVS.
      </>
    ),
    answer: (
      <>
        <strong>Why several views:</strong> a stronger and less ambiguous match signal — a wrong
        depth may happen to agree with one neighbour but rarely with five, so false matches are
        suppressed and noise averages out. Occlusion largely dissolves, because a surface hidden in
        one neighbour is usually visible in another. With many candidates you can also{' '}
        <em>select</em> the best neighbours per reference: close enough in viewpoint to match
        reliably, far enough apart to triangulate accurately. And several reference views give
        complete coverage of the object.
        <br />
        <br />
        <strong>Two error sources:</strong>
        <br />
        <em>1. Matching failures</em> — textureless surfaces (no signal), repetitive structure
        (ambiguous signal), and non-Lambertian materials where highlights move with the camera so
        brightness constancy fails; also thin structures below the window size.
        <br />
        <em>2. Pose / calibration error</em> — every depth is relative to the estimated camera, so a
        small pose error displaces an otherwise correct depth map. Fusing several slightly displaced
        maps gives a doubled or blurred surface. This is why MVS quality is bounded by bundle
        adjustment quality.
      </>
    ),
  },
  {
    id: 'neu-d3b',
    topicId: 'neural',
    source: 'Sheet 9 · Ex 2.1',
    kind: 'explain',
    prompt: (
      <>
        The MVS pipeline is: images → camera poses → dense correspondences → depth maps → depth-map
        fusion → 3D model. Explain the purpose of each step.
      </>
    ),
    answer: (
      <>
        <strong>Images</strong> — the raw measurements: several overlapping views, since one view
        cannot determine depth at all.
        <br />
        <strong>Camera poses</strong> — recover where each photo was taken from (features → matching
        → F/E → structure from motion). This must come first, because a depth is only meaningful
        relative to a known camera, and every later step needs the geometry to constrain its search.
        <br />
        <strong>Dense correspondences</strong> — find the match for <em>every</em> pixel, not just a
        few features, using the known poses to reduce the search to a line or a set of depth
        hypotheses.
        <br />
        <strong>Depth maps</strong> — convert each match into a distance, via <T>{'z = fb/d'}</T>{' '}
        for a rectified pair or directly from the winning plane in a plane sweep. One map per
        reference view, in that camera&rsquo;s own frame.
        <br />
        <strong>Depth-map fusion</strong> — transform all maps into one common frame, average where
        views agree (which reduces noise), discard where they disagree (which removes outliers), and
        merge redundant points so overlaps do not produce a doubled shell.
        <br />
        <strong>3D model</strong> — turn the fused, unstructured point cloud into an actual surface:
        fit an implicit field (e.g. Poisson) and extract a mesh with marching cubes.
      </>
    ),
  },
  {
    id: 'neu-d4',
    topicId: 'neural',
    source: 'Sheet 9 · Ex 3.1–3.2',
    kind: 'explain',
    prompt: (
      <>
        Explain the difference between rendering and inverse rendering, and why the rendering
        process must be differentiable for gradient-based optimisation.
      </>
    ),
    answer: (
      <>
        <strong>Rendering</strong> goes from a 3D scene representation (geometry, materials,
        lighting, camera) to an image. It is a well-defined, computable function — ray tracing or
        rasterisation. <strong>Inverse rendering</strong> goes the other way: from images back to a
        scene representation. It is ill-posed and not a function, since many scenes explain the same
        images. That is computer vision.
        <br />
        <br />
        The practical approach is not to invert the renderer but to <em>optimise</em>: parameterise
        the scene, render it, compare with the photographs, and adjust.
        <br />
        <br />
        <strong>Why differentiability:</strong> gradient descent needs{' '}
        <T>
          {
            '\\partial L/\\partial\\theta = (\\partial L/\\partial I_{\\text{pred}})(\\partial I_{\\text{pred}}/\\partial\\theta)'
          }
        </T>
        , and the second factor is the derivative of the rendering process itself. With a hard
        visibility test or a discrete rasterisation decision, that derivative is zero almost
        everywhere and the optimiser gets no signal about which direction to move. NeRF&rsquo;s
        volumetric formulation exists precisely to avoid this: the soft accumulation{' '}
        <T>{'\\sum T_i\\alpha_i\\mathbf c_i'}</T> gives every sample along the ray a non-zero
        gradient.
      </>
    ),
  },
  {
    id: 'neu-d5',
    topicId: 'neural',
    source: 'Sheet 9 · Ex 4.1–4.3',
    kind: 'explain',
    prompt: (
      <>
        For <T>{'F(\\mathbf x, \\mathbf d) \\to (\\sigma, \\mathbf c)'}</T>: explain the meaning of
        each input and output, and why colour is a function of viewing direction.
      </>
    ),
    answer: (
      <>
        <strong>Inputs.</strong> <T>{'\\mathbf x'}</T> is a 3D position — where in the scene volume
        you are querying. <T>{'\\mathbf d'}</T> is a viewing direction — from which direction that
        point is being looked at, taken from the ray through the pixel being rendered.
        <br />
        <br />
        <strong>Outputs.</strong> <T>{'\\sigma'}</T> is the volume density, i.e. how much the medium
        at <T>{'\\mathbf x'}</T> blocks light — effectively the differential probability of the ray
        terminating there. It encodes the <em>geometry</em>. <T>{'\\mathbf c'}</T> is the emitted
        RGB colour at that point in that direction — the <em>appearance</em>.
        <br />
        <br />
        <strong>Why c depends on d:</strong> only a perfectly Lambertian surface looks the same from
        every direction. Glossy, metallic and wet surfaces have highlights and reflections that{' '}
        <em>move</em> as the camera moves. If colour were a function of position alone, none of that
        could be represented, and the network would be forced to average the views into a dull,
        incorrect appearance.
        <br />
        <br />
        Note the deliberate asymmetry: <T>{'\\sigma'}</T> depends on <T>{'\\mathbf x'}</T>{' '}
        <em>only</em>. Geometry must be consistent across all views, and enforcing that is what
        stops the network from simply memorising each training image independently.
      </>
    ),
  },
  {
    id: 'neu-d6',
    topicId: 'neural',
    source: 'Sheet 9 · Ex 4.4',
    kind: 'explain',
    prompt: (
      <>
        Compare NeRF with classical multi-view stereo. Give one advantage and one disadvantage of
        each.
      </>
    ),
    answer: (
      <>
        <strong>Classical MVS — advantage:</strong> it produces an <em>explicit</em> geometric model
        (point cloud or mesh) that can be measured, edited, simulated with, printed or imported into
        other software. It is interpretable, needs no per-scene training, and is fast once poses are
        known. <strong>Disadvantage:</strong> it relies wholly on photometric matching, so it fails
        on textureless, repetitive, transparent and specular surfaces; thin structures are lost;
        output is typically noisy and holey.
        <br />
        <br />
        <strong>NeRF — advantage:</strong> photorealistic novel-view synthesis including
        view-dependent effects (specularity, reflection, transparency) that a surface model cannot
        represent at all; handles semi-transparent media and fine structure like hair; needs no
        explicit correspondences. <strong>Disadvantage:</strong> the geometry is implicit in the
        network weights — hard to extract, edit or measure; training is per-scene and slow;
        rendering is slow; many posed input views are needed; extrapolation beyond the training
        viewpoints is poor.
        <br />
        <br />
        The one-line summary:{' '}
        <em>
          MVS optimises for geometry and gets images as a by-product; NeRF optimises for images and
          gets geometry as a by-product.
        </em>
      </>
    ),
  },
]
