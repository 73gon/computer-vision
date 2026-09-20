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
import { BlockMatchLab, DisparityDepthLab } from '@/components/viz/stereo'
import type { DrillSpec } from '@/components/learn/drill'
import type { TopicMeta } from './types'

export const meta: TopicMeta = {
  id: 'stereo',
  n: 8,
  title: 'Dense stereo: rectification, disparity, block matching',
  kicker:
    'Line the two images up so matches sit on the same row, measure how far each pixel shifted, and turn that shift into depth.',
  lectures: ['L08, L09 Stereo reconstruction'],
  exercises: ['Sheet 6, Ex 3'],
  minutes: 35,
  stage: 'corr',
  sections: [
    { id: 'rectify', title: 'Rectification' },
    { id: 'disparity', title: 'Disparity and depth' },
    { id: 'matching', title: 'Block matching' },
    { id: 'problems', title: 'Everything that goes wrong' },
    { id: 'pipeline', title: 'The reconstruction pipeline' },
  ],
  sheet: [
    {
      name: 'Disparity',
      tex: 'd = x_1 - x_2',
      note: 'Horizontal displacement of the same scene point between rectified views.',
    },
    {
      name: 'Disparity to depth',
      tex: 'z = \\dfrac{f\\,b}{d}',
      note: 'f focal length in pixels, b baseline. Derived from (z−f)/(b−d) = z/b.',
    },
    {
      name: 'Depth precision',
      tex: '\\Delta z \\approx \\dfrac{z^2}{f\\,b}\\,\\Delta d',
      note: 'Error grows with the square of depth.',
    },
    {
      name: 'Matching costs',
      tex: '\\text{SSD},\\ \\text{SAD},\\ \\text{NCC},\\ \\text{mutual information}',
      note: 'NCC is invariant to affine changes in intensity.',
    },
  ],
}

export function Body() {
  return (
    <>
      <BigIdea oneLiner="Once two images are rectified, a 3D reconstruction is just one number per pixel: how far left the same thing appears in the other image.">
        <p>
          The pipeline is short and each step buys something specific. Rectification collapses a 2D
          correspondence search into a 1D one. Block matching finds that 1D shift. The formula{' '}
          <T>{'z = fb/d'}</T> converts it to metres. The rest of this topic and the whole of the
          next one are about the many ways block matching fails.
        </p>
      </BigIdea>

      <WhyCare>
        The cost volume you build here — height × width × disparity — is exactly the tensor that
        learned stereo networks consume. GC-Net, PSMNet and friends replace the hand-designed SSD
        with a learned similarity and the winner-takes-all argmin with a 3D convolutional
        regulariser. The geometry (rectify, search along a row, build a cost volume) is unchanged;
        only the two <em>functions</em> are learned.
      </WhyCare>

      <Section
        id="rectify"
        n={1}
        title="Rectification"
        lead="Make both cameras face exactly the same direction, and epipolar lines become image rows."
      >
        <Concept
          intuition={
            <>
              The epipolar constraint already told you a match lies on a line. Rectification chooses
              a warping that makes those lines{' '}
              <em>horizontal and at the same height in both images</em> — so &ldquo;search the
              epipolar line&rdquo; becomes &ldquo;scan along row <T>{'y'}</T>&rdquo;, with no
              geometry left in the inner loop.
            </>
          }
        >
          <KeyList
            items={[
              {
                k: 'What changes',
                v: 'Both image planes are re-warped (homographies) to become coplanar and parallel to the baseline.',
              },
              {
                k: 'Where the epipoles go',
                v: 'To infinity — the baseline no longer meets either image plane, so the epipolar lines become parallel.',
              },
              {
                k: 'What you gain',
                v: 'Correspondences lie on the same image row as the query point. The search is 1D, contiguous in memory, and trivially parallel.',
              },
              {
                k: 'The cost',
                v: 'Resampling (so interpolation blur), and the images must be re-cropped; strongly convergent rigs get badly distorted.',
              },
            ]}
          />
        </Concept>

        <Rule>
          Rectification does not add information — every match it finds was already available on the
          unrectified epipolar line. It is purely an <em>implementation</em> convenience, and an
          enormous one: it turns an irregular per-pixel geometric query into a raster scan.
        </Rule>
      </Section>

      <Section
        id="disparity"
        n={2}
        title="Disparity and depth"
        lead="One formula, one derivation, one important consequence about precision."
      >
        <Concept
          intuition={
            <>
              Hold a finger up and blink alternate eyes. It jumps a lot when close, barely at all
              when far. That jump is disparity, and it is <em>inversely</em> proportional to depth.
            </>
          }
        />

        <Worked
          title="Derive z = fb/d"
          source="L08 · Disparity to depth"
          question={
            <>
              With disparity <T>{'d = x_1 - x_2'}</T>, focal length <T>{'f'}</T> and baseline{' '}
              <T>{'b'}</T>, derive the depth.
            </>
          }
          steps={[
            {
              label: 'Set up the similar triangles',
              body: (
                <>
                  The left and right rays intersect at the 3D point and share the epipolar plane.
                  Comparing the large triangle (baseline <T>{'b'}</T>, depth <T>{'z'}</T>) with the
                  small one formed at depth <T>{'z - f'}</T> gives
                  <Tex>{'\\frac{z - f}{b - d} = \\frac{z}{b}'}</Tex>
                </>
              ),
            },
            {
              label: 'Cross-multiply',
              body: <Tex>{'b(z-f) = z(b-d) \\;\\Longrightarrow\\; zb - fb = zb - zd'}</Tex>,
            },
            {
              label: 'Cancel and solve',
              body: (
                <>
                  The <T>{'zb'}</T> terms cancel, leaving <T>{'-fb = -zd'}</T>:
                  <Tex>{'z = \\frac{f\\,b}{d}'}</Tex>
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'z = fb/d'}</T>. Depth is <em>inversely</em> proportional to disparity: far points
              shift little, near points shift a lot. Zero disparity means infinite depth.
            </>
          }
        />

        <Figure caption="Set f = 800, b = 0.2, d = 40 for the exercise-sheet answer. Then drag d towards small values and watch the ±1 px uncertainty explode.">
          <DisparityDepthLab />
        </Figure>

        <Worked
          title="A numerical depth"
          source="Sheet 6 · Exercise 3.2–3.3"
          question={
            <>
              A rectified rig has <T>{'b = 0.2'}</T> m and <T>{'f = 800'}</T> px. State the formula
              and compute the depth of a point with disparity <T>{'d = 40'}</T> px.
            </>
          }
          steps={[
            { label: 'The formula', body: <Tex>{'z = \\frac{f\\,b}{d}'}</Tex> },
            {
              label: 'Substitute — check the units first',
              body: (
                <>
                  <T>{'f'}</T> and <T>{'d'}</T> are both in pixels, so they cancel and the result
                  carries the units of <T>{'b'}</T>, metres. Good.
                  <Tex>{'z = \\frac{800 \\times 0.2}{40} = \\frac{160}{40} = 4'}</Tex>
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'z = 4'}</T> metres. (Unit check is worth doing out loud: px · m / px = m.)
            </>
          }
        />

        <Deeper label="The precision consequence — why stereo is myopic">
          <p>
            Differentiate <T>{'z = fb/d'}</T> with respect to <T>{'d'}</T>:
          </p>
          <Tex>{'\\frac{dz}{dd} = -\\frac{fb}{d^2} = -\\frac{z^2}{fb}'}</Tex>
          <p className="mt-2">
            So a fixed disparity error of <T>{'\\pm 1'}</T> px translates into a depth error of{' '}
            <T>{'z^2/(fb)'}</T>, which grows <em>quadratically</em> with distance. With{' '}
            <T>{'f = 800'}</T>, <T>{'b = 0.2'}</T>: at 4 m one pixel is 10 cm; at 40 m it is 10
            metres.
          </p>
          <p className="mt-2">
            Two fixes, both with costs. Increase <T>{'f'}</T> — a longer lens, but a narrower field
            of view. Increase <T>{'b'}</T> — a wider rig, but more occlusion and more perspective
            difference between the views, which makes matching harder. That tension is the central
            design trade-off of any stereo system.
          </p>
        </Deeper>
      </Section>

      <Section
        id="matching"
        n={3}
        title="Block matching"
        lead="Slide a window along the row, score every shift, take the best. Three lines of algorithm, endless failure modes."
      >
        <Rule tag="The algorithm">
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            <li>Choose a disparity range.</li>
            <li>
              For every pixel, compute the best disparity — the shift whose window matches best.
            </li>
            <li>
              Repeat in the opposite direction and remove inconsistencies, to reduce outliers
              (left–right consistency check).
            </li>
          </ol>
        </Rule>

        <KeyList
          title="Typical matching scores"
          items={[
            {
              k: 'SSD / SAD',
              v: 'Sum of squared / absolute differences. Cheapest. Assumes identical brightness in both cameras.',
            },
            {
              k: 'Normalised cross-correlation',
              v: 'Subtract the window mean and divide by its standard deviation before correlating. Invariant to any affine intensity change, so it survives different exposure or gain between the two cameras. This is why NCC is the default.',
            },
            {
              k: 'Mutual information',
              v: 'Only assumes a statistical dependence between the two windows, not a linear one. Robust enough for cross-modal matching (e.g. infrared against visible).',
            },
          ]}
        />

        <Figure caption="Switch the scene. On rich texture the cost has one sharp minimum; on a textureless or repetitive patch the winner-takes-all pick becomes arbitrary.">
          <BlockMatchLab />
        </Figure>

        <Concept
          title="The left–right consistency check"
          intuition={
            <>
              Match left-to-right, then right-to-left. A correct match agrees both ways. A pixel
              that is occluded in the other view does not — it gets assigned <em>some</em> partner
              going one way, but that partner points back at a different pixel.
            </>
          }
        >
          <p>
            This is the cheapest and most reliable outlier detector in classical stereo, and it is
            what produces the &ldquo;invalid&rdquo; holes you see in real disparity maps. Those
            holes are not a failure — they are the algorithm correctly declining to guess.
          </p>
        </Concept>
      </Section>

      <Section
        id="problems"
        n={4}
        title="Everything that goes wrong"
        lead="The five failure modes from the lecture, and why each one breaks the assumption block matching rests on."
      >
        <Concept
          intuition={
            <>
              Block matching assumes exactly one thing:{' '}
              <em>the correct disparity is the one whose window looks most similar</em>. Each
              failure mode below is a situation where that assumption is false.
            </>
          }
        >
          <KeyList
            items={[
              {
                k: 'Textureless surfaces',
                v: 'A blank wall looks the same at every disparity, so the cost curve is flat and the minimum is set by noise. There is genuinely no information in the window.',
              },
              {
                k: 'Repetitive structure',
                v: 'A brick wall or a row of windows matches equally well at several disparities. Multiple near-equal minima; the winner is essentially arbitrary.',
              },
              {
                k: 'Half-occlusions',
                v: 'Near a depth discontinuity, a strip visible in one image is hidden in the other. There is no correct match to find — but winner-takes-all always returns one.',
              },
              {
                k: 'Slanted surfaces',
                v: 'A fronto-parallel window assumes constant disparity across it. On a slanted surface disparity varies within the window, so the true match is blurred and the estimate biased.',
              },
              {
                k: 'Non-Lambertian surfaces',
                v: 'Specular highlights and reflections move with the viewpoint, so the two windows genuinely differ. The brightness-constancy assumption underneath every matching cost fails.',
              },
            ]}
          />
        </Concept>

        <Pitfall title="The window-size trade-off has no good answer">
          <strong>Small windows</strong> localise depth discontinuities well but carry little
          information, so they are noisy and defeated by textureless regions.{' '}
          <strong>Large windows</strong> average away noise but smear depth across object boundaries
          — the &ldquo;bleeding&rdquo; artefact — and make the slanted-surface bias worse. No single
          size is right for a whole image, which is precisely the argument for abandoning
          independent per-pixel decisions and adding a <em>smoothness prior</em>. That is the next
          topic.
        </Pitfall>

        <Aside title="The observation that rescues the situation">
          Real depth is <em>mostly smooth</em>, except at object boundaries, which are rare. So
          although any individual pixel may be ambiguous, its neighbours usually are not — and a
          method that solves all pixels jointly can borrow evidence across the ambiguous ones. This
          single sentence motivates dynamic programming, MRFs and graph cuts.
        </Aside>
      </Section>

      <Section
        id="pipeline"
        n={5}
        title="The reconstruction pipeline"
        lead="Where this topic sits, and what still has to happen afterwards."
      >
        <Rule tag="Input images → Camera poses → Dense correspondences → Depth maps → Depth-map fusion → 3D model">
          You have just produced one <em>depth map</em>, from one stereo pair, in the reference
          camera&rsquo;s frame. It is incomplete (occlusions), noisy, and covers only what that pair
          could see. The remaining two boxes — fusion and surface extraction — are topic 10.
        </Rule>

        <Concept
          title="What you know at this point"
          intuition={
            <>Trace the dependencies backwards and every previous topic is load-bearing.</>
          }
        >
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Camera poses</strong> came from features + epipolar geometry + SfM (topics 4,
              6, 7).
            </li>
            <li>
              <strong>Rectification</strong> needs those poses and the intrinsics (topic 5).
            </li>
            <li>
              <strong>Matching</strong> needs a similarity measure and the assumption that
              corresponding patches look alike (topic 3).
            </li>
            <li>
              <strong>Depth</strong> is <T>{'z = fb/d'}</T>, and back-projecting each pixel with its
              depth gives a 3D point (topic 5).
            </li>
          </ul>
        </Concept>
      </Section>
    </>
  )
}

export const drills: DrillSpec[] = [
  {
    id: 'ste-d1',
    topicId: 'stereo',
    source: 'Sheet 6 · Ex 3.1',
    kind: 'explain',
    prompt: (
      <>
        Why is rectification performed before stereo matching, and how does it simplify the search
        for correspondences?
      </>
    ),
    answer: (
      <>
        Epipolar geometry already guarantees that the match for a point lies on a line in the other
        image, but in general that line is slanted and differs per pixel — so the inner loop of
        matching would need a geometric computation and non-contiguous memory access.
        <br />
        <br />
        Rectification re-warps both images (by homographies) so the image planes are{' '}
        <strong>coplanar and parallel to the baseline</strong>. The epipoles move to infinity and
        the epipolar lines become <strong>parallel horizontal scanlines</strong>. Consequently the
        match for a pixel at <T>{'(x, y)'}</T> lies at <T>{'(x - d, y)'}</T> — the same row.
        <br />
        <br />
        The search collapses from 2D to 1D, becomes a contiguous raster scan, and reduces to
        estimating a single scalar <T>{'d'}</T> per pixel. It adds no information; it is an
        implementation simplification, but a decisive one.
      </>
    ),
  },
  {
    id: 'ste-d2',
    topicId: 'stereo',
    source: 'Sheet 6 · Ex 3.2–3.3',
    kind: 'compute',
    prompt: (
      <>
        State the depth–disparity relation and compute <T>{'z'}</T> for <T>{'b = 0.2'}</T> m,{' '}
        <T>{'f = 800'}</T> px, <T>{'d = 40'}</T> px.
      </>
    ),
    answer: (
      <>
        <Tex>
          {'z = \\frac{f\\,b}{d} = \\frac{800 \\times 0.2}{40} = \\frac{160}{40} = 4\\ \\text{m}'}
        </Tex>
        Units: pixels cancel between <T>{'f'}</T> and <T>{'d'}</T>, leaving the units of{' '}
        <T>{'b'}</T> — metres.
        <br />
        <br />
        Worth adding: depth is <em>inversely</em> proportional to disparity, so precision degrades
        as <T>{'z^2'}</T>. Here a <T>{'\\pm1'}</T> px disparity error is{' '}
        <T>{'z^2/(fb) = 16/160 = 0.1'}</T> m at 4 m — but 10 m at 40 m.
      </>
    ),
  },
  {
    id: 'ste-d3',
    topicId: 'stereo',
    source: 'Sheet 6 · Ex 3.4',
    kind: 'explain',
    prompt: (
      <>
        What is the common problem with block matching in textureless regions and at
        half-occlusions?
      </>
    ),
    answer: (
      <>
        Both break the assumption that the correct disparity is the one with the most similar
        window, but in different ways.
        <br />
        <br />
        <strong>Textureless regions:</strong> every candidate window looks about the same, so the
        matching cost is nearly flat across the whole disparity range. The minimum is determined by
        noise rather than by content, and the estimate is arbitrary. There is genuinely no
        information in the window to extract. (Repetitive texture is the related failure: several
        equally deep minima rather than one flat curve.)
        <br />
        <br />
        <strong>Half-occlusions:</strong> at a depth discontinuity, a strip of surface visible in
        one image is hidden behind the foreground object in the other. There <em>is no</em> correct
        match — but winner-takes-all always returns the least-bad one, producing a confident wrong
        answer in a systematic band beside every object boundary.
        <br />
        <br />
        Partial mitigations: a left–right consistency check detects occlusions (the match disagrees
        in the two directions) and NCC handles exposure differences. The real fix is to stop
        deciding each pixel independently and add a smoothness prior — dynamic programming or an
        MRF.
      </>
    ),
  },
  {
    id: 'ste-d4',
    topicId: 'stereo',
    source: 'L08',
    kind: 'choose',
    prompt: (
      <>
        Your two cameras have different exposure settings. Which matching cost is most appropriate?
      </>
    ),
    options: [
      'Sum of squared differences (SSD)',
      'Sum of absolute differences (SAD)',
      'Normalised cross-correlation (NCC)',
      'Any of them — exposure does not affect matching',
    ],
    correct: 2,
    answer: (
      <>
        <strong>NCC.</strong> A change in exposure or gain is approximately an affine change of
        intensity, <T>{'I \\mapsto aI + b'}</T>. NCC subtracts the window mean (killing <T>{'b'}</T>
        ) and divides by the window standard deviation (killing <T>{'a'}</T>), so the score is
        unchanged. SSD and SAD compare raw intensities and would report a large cost even for a
        perfect geometric match.
        <br />
        <br />
        For genuinely different sensors (infrared against visible), even affine invariance is not
        enough — there you would use mutual information, which only assumes a statistical dependence
        between the windows.
      </>
    ),
  },
  {
    id: 'ste-d5',
    topicId: 'stereo',
    source: 'L08',
    kind: 'explain',
    prompt: <>Explain the window-size trade-off in block matching.</>,
    answer: (
      <>
        <strong>Small windows:</strong> few pixels, so little evidence — the cost curve is noisy and
        ambiguous, and textureless regions become hopeless. But the window straddles a depth
        discontinuity for only a few pixels, so boundaries stay sharp.
        <br />
        <br />
        <strong>Large windows:</strong> more evidence, so smoother and more reliable costs in
        textured regions. But near an object boundary the window covers two different depths at
        once, so the estimate is a blend — the &ldquo;bleeding&rdquo; or &ldquo;foreground
        fattening&rdquo; artefact. Large windows also worsen the fronto-parallel bias on slanted
        surfaces, since they assume constant disparity across the window.
        <br />
        <br />
        No single size is right for a whole image, because the ideal size depends on local texture
        and on proximity to a discontinuity. The principled way out is to stop deciding pixels
        independently: add a smoothness prior and solve the whole scanline or the whole image
        jointly, which then permits small windows without the noise.
      </>
    ),
  },
]
