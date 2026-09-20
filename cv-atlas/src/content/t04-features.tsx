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
import {
  GradientCompass,
  LaplacianPatch,
  NMSDemo,
  RatioTestLab,
  ScaleSpaceLab,
} from '@/components/viz/features'
import type { DrillSpec } from '@/components/learn/drill'
import type { TopicMeta } from './types'

export const meta: TopicMeta = {
  id: 'features',
  n: 4,
  title: 'Local features: edges, blobs, corners, descriptors',
  kicker:
    'Reduce a million pixels to a few hundred distinctive, repeatable points — then describe them so you can find the same points in another photo.',
  lectures: ['L04 Local Features', 'L05 (SIFT, structure tensor)'],
  exercises: ['Sheet 3, Ex 1–3', 'Sheet 4, Ex 1–2'],
  minutes: 45,
  stage: 'images',
  sections: [
    { id: 'why', title: 'Why features at all' },
    { id: 'edges', title: 'Edges and the Canny detector' },
    { id: 'laplacian', title: 'The Laplacian and blobs' },
    { id: 'scale', title: 'Scale space and characteristic scale' },
    { id: 'dog', title: 'Difference of Gaussians' },
    { id: 'corners', title: 'Corners: the structure tensor' },
    { id: 'sift', title: 'SIFT: describing a patch' },
    { id: 'matching', title: 'Matching and the ratio test' },
  ],
  sheet: [
    {
      name: 'Gradient magnitude & orientation',
      tex: '\\lVert\\nabla f\\rVert = \\sqrt{g_x^2 + g_y^2}, \\qquad \\theta = \\operatorname{atan2}(g_y, g_x)',
    },
    {
      name: 'Laplacian kernels',
      tex: '\\begin{pmatrix}0&1&0\\\\1&-4&1\\\\0&1&0\\end{pmatrix}, \\quad \\begin{pmatrix}1&1&1\\\\1&-8&1\\\\1&1&1\\end{pmatrix}',
      note: 'Both sum to 0.',
    },
    {
      name: 'Laplacian of Gaussian',
      tex: 'L(x,y;\\sigma) = \\Delta\\,(G_\\sigma * f)',
      note: 'Scale-normalised: σ²ΔG, needed to compare across scales.',
    },
    {
      name: 'Difference of Gaussians',
      tex: 'DoG(x,y,\\sigma) = G(x,y,k\\sigma) - G(x,y,\\sigma) \\approx (k-1)\\sigma^2 \\Delta G',
    },
    {
      name: 'Characteristic scale (disc of radius r)',
      tex: '\\sigma^{*} = r/\\sqrt{2}',
    },
    {
      name: 'Structure tensor',
      tex: 'A = w * \\begin{pmatrix} f_x^2 & f_x f_y \\\\ f_x f_y & f_y^2 \\end{pmatrix}',
      note: 'Both eigenvalues large ⇒ corner. The smaller one bounds the localisation accuracy.',
    },
    {
      name: 'Ratio test',
      tex: "r = \\dfrac{\\lVert f_1 - f_2\\rVert}{\\lVert f_1 - f_2'\\rVert}",
      note: 'Accept if r < ≈0.75–0.8. f₂′ is the second-best match.',
    },
  ],
}

export function Body() {
  return (
    <>
      <BigIdea oneLiner="Instead of comparing whole images, find a few hundred places that are distinctive enough to be recognised again — and describe each one so the description survives a change of viewpoint, scale and lighting.">
        <p>
          Three separate jobs hide in that sentence, and the lecture keeps them separate:{' '}
          <strong>detection</strong> (where are the interesting points?),{' '}
          <strong>description</strong> (what does the neighbourhood look like, as a vector?), and{' '}
          <strong>matching</strong> (which vector in image 2 corresponds to this one in image 1?).
          Every question on the exercise sheets is about one of the three.
        </p>
      </BigIdea>

      <WhyCare>
        SIFT is a hand-designed feature extractor, and comparing it to a CNN is genuinely
        illuminating: both compute oriented gradient responses, both pool them over small spatial
        cells, both build invariance by pooling rather than by clever algebra. The difference is
        that SIFT&rsquo;s invariances (to scale, rotation, illumination) were <em>designed in</em>,
        while a CNN has to learn them from data. That trade — inductive bias versus data — is the
        same decision you make every time you pick an architecture.
      </WhyCare>

      <Section
        id="why"
        n={1}
        title="Why features at all"
        lead="Reduce the image to “interesting” parts with convenient properties for further processing."
      >
        <Concept
          intuition={
            <>
              Matching two 3-megapixel images pixel-against-pixel is both hopeless and pointless:
              most pixels look like their neighbours, so they cannot be matched uniquely anyway. The
              only pixels worth matching are the ones that are locally <em>distinctive</em>.
            </>
          }
        >
          <KeyList
            items={[
              { k: 'Blobs', v: 'Regions that differ from their surround. Found by the Laplacian.' },
              { k: 'Straight line segments', v: 'Extended structure, found by edge linking.' },
              {
                k: 'Corners / junctions',
                v: 'Points where the intensity changes in two directions at once. Found by the structure tensor.',
              },
            ]}
          />
          <p className="mt-3">
            What makes a detector good is <em>repeatability</em>: it must fire on the same physical
            location when the photo is taken from somewhere else, at a different distance, in
            different light. Everything that follows is engineering for repeatability.
          </p>
        </Concept>
      </Section>

      <Section
        id="edges"
        n={2}
        title="Edges and the Canny detector"
        lead="An edge is a place of rapid change in the intensity function — so it is an extremum of the first derivative."
      >
        <Concept
          title="Where edges come from physically"
          intuition={
            <>
              A brightness edge in the image can have four completely different physical causes, and
              nothing in the pixels distinguishes them. This is one reason vision is hard.
            </>
          }
        >
          <KeyList
            items={[
              { k: 'Surface normal discontinuity', v: 'A crease — the object bends.' },
              {
                k: 'Depth discontinuity',
                v: 'An occlusion boundary — one object in front of another.',
              },
              { k: 'Surface colour discontinuity', v: 'Paint, texture, a printed line.' },
              {
                k: 'Illumination discontinuity',
                v: 'A shadow boundary — nothing about the object changed at all.',
              },
            ]}
          />
        </Concept>

        <Figure caption="Drag the components. The gradient always points across the edge towards brighter values; the edge itself runs perpendicular.">
          <GradientCompass />
        </Figure>

        <Worked
          title="Magnitude and orientation from components"
          source="Sheet 3 · Exercise 1"
          question={
            <>
              At a pixel, <T>{'g_x = 3'}</T> and <T>{'g_y = 4'}</T>. Give the gradient magnitude and
              orientation, and say why large magnitudes are useful for edge detection.
            </>
          }
          steps={[
            {
              label: 'Magnitude — Euclidean norm',
              body: (
                <Tex>
                  {
                    '\\lVert\\nabla f\\rVert = \\sqrt{g_x^2 + g_y^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5'
                  }
                </Tex>
              ),
            },
            {
              label: 'Orientation — atan2, not atan',
              body: (
                <>
                  <Tex>
                    {
                      '\\theta = \\operatorname{atan2}(4, 3) = \\arctan(4/3) \\approx 0.9273\\ \\text{rad} \\approx 53.13^\\circ'
                    }
                  </Tex>
                  <T>{'\\operatorname{atan2}'}</T> takes both signs, so it resolves the full{' '}
                  <T>{'[-\\pi, \\pi]'}</T> range; plain <T>{'\\arctan(g_y/g_x)'}</T> would collapse
                  the second and fourth quadrants onto the first and third.
                </>
              ),
            },
            {
              label: 'Why magnitude matters',
              body: (
                <>
                  An edge is a location of rapid intensity change, so it is an extremum of the first
                  derivative. The gradient magnitude measures exactly the <em>rate</em> of change,
                  independent of direction — so thresholding it isolates candidate edge pixels,
                  while flat regions score near zero.
                </>
              ),
            },
          ]}
          answer={
            <>
              Magnitude 5; orientation <T>{'\\approx 53.13^\\circ'}</T> (<T>{'0.927'}</T> rad).
              Large magnitudes flag rapid intensity change, which is the definition of an edge.
            </>
          }
        />

        <Rule tag="The Canny pipeline — four steps, in order">
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            <li>
              Filter the image with <em>x and y derivatives of a Gaussian</em>. Smoothing first is
              essential: differentiation amplifies noise.
            </li>
            <li>Compute gradient magnitude and orientation at each pixel.</li>
            <li>
              <em>Non-maximum suppression</em>: thin multi-pixel-wide ridges down to single-pixel
              width.
            </li>
            <li>
              <em>Hysteresis thresholding</em>: a high threshold to <em>start</em> an edge curve, a
              low threshold to <em>continue</em> it.
            </li>
          </ol>
        </Rule>

        <Figure caption="Non-maximum suppression compares each pixel against its two neighbours along the gradient direction and keeps it only if it is the largest. The ridge collapses to one pixel.">
          <NMSDemo />
        </Figure>

        <Concept
          title="Why NMS comes after the magnitude, not before"
          intuition={
            <>
              You cannot know which neighbours to compare against until you know the gradient{' '}
              <em>direction</em>, and you cannot decide who wins until you have the{' '}
              <em>magnitude</em>. So NMS needs both, and must come third.
            </>
          }
        >
          <p>
            The problem it solves: a real edge is blurred by the Gaussian, so the magnitude forms a
            ridge several pixels wide. Thresholding alone would give you a thick band. NMS keeps
            only the crest — one pixel across — which is what makes the output a <em>curve</em> you
            can trace rather than a region.
          </p>
        </Concept>

        <Aside title="Why hysteresis, rather than one threshold">
          A single threshold forces an impossible choice: set it high and real edges break into
          dashes wherever contrast dips; set it low and noise becomes edges. Hysteresis uses both —
          only strong pixels may <em>start</em> a curve, but once started it may be continued
          through weaker pixels that are connected to it. This exploits the fact that real edges are
          continuous, which noise is not.
        </Aside>
      </Section>

      <Section
        id="laplacian"
        n={3}
        title="The Laplacian and blobs"
        lead="Sum of the second derivatives. Zero on anything flat or linear; extreme on isolated spots."
      >
        <FormulaCard name="Laplace operator, and two discrete kernels">
          <Tex>
            {
              '\\Delta f = \\frac{\\partial^2 f}{\\partial x^2} + \\frac{\\partial^2 f}{\\partial y^2} \\;\\longrightarrow\\; \\begin{pmatrix}0&1&0\\\\1&-4&1\\\\0&1&0\\end{pmatrix} \\ \\text{or} \\ \\begin{pmatrix}1&1&1\\\\1&-8&1\\\\1&1&1\\end{pmatrix}'
            }
          </Tex>
        </FormulaCard>

        <Figure caption="Slide the centre pixel. At 80 the response is exactly 0 — the patch is flat. The further the centre departs from its neighbours, the larger the response.">
          <LaplacianPatch />
        </Figure>

        <Worked
          title="Laplacian response on a 3×3 patch"
          source="Sheet 3 · Exercise 2"
          question={
            <>
              With <T>{'D = \\begin{pmatrix}0&1&0\\\\1&-4&1\\\\0&1&0\\end{pmatrix}'}</T> and{' '}
              <T>{'I = \\begin{pmatrix}80&80&80\\\\80&120&80\\\\80&80&80\\end{pmatrix}'}</T>,
              compute the response at the centre pixel.
            </>
          }
          steps={[
            {
              label: 'Only five weights are non-zero',
              body: (
                <>
                  The four 4-neighbours carry weight <T>{'+1'}</T>, the centre carries <T>{'-4'}</T>
                  , and the corners carry 0.
                </>
              ),
            },
            {
              label: 'Sum the neighbours',
              body: <Tex>{'80 + 80 + 80 + 80 = 320'}</Tex>,
            },
            {
              label: 'Subtract four times the centre',
              body: <Tex>{'320 - 4\\cdot 120 = 320 - 480 = -160'}</Tex>,
            },
          ]}
          answer={
            <>
              The response is <T>{'-160'}</T>. Negative because the centre is <em>brighter</em> than
              its surround — a bright spot gives a strongly negative Laplacian, a dark spot a
              strongly positive one.
            </>
          }
        />

        <Concept
          title="Why isolated spots dominate"
          intuition={
            <>
              Rewrite the kernel as{' '}
              <T>{'4\\left(\\overline{I}_{\\text{nbrs}} - I_{\\text{centre}}\\right)'}</T>: it is
              literally four times the difference between the neighbourhood average and the pixel
              itself.
            </>
          }
        >
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Flat region:</strong> the centre <em>is</em> the average → response 0.
            </li>
            <li>
              <strong>A linear ramp:</strong> the neighbours on either side deviate by equal and
              opposite amounts → they cancel → response 0. (So the Laplacian is blind to gradual
              shading, which a first derivative is not.)
            </li>
            <li>
              <strong>A straight edge:</strong> only two of the four neighbours differ → moderate
              response, and it changes sign across the edge (the zero crossing).
            </li>
            <li>
              <strong>An isolated dot:</strong> all four neighbours differ in the same direction →
              maximal response.
            </li>
          </ul>
          <p className="mt-3">That ordering is exactly what makes it a blob detector.</p>
        </Concept>

        <Pitfall>
          The Laplacian is a <em>second</em> derivative, so it amplifies noise even more
          aggressively than the gradient does. Never apply it to a raw image — always smooth first.
          Doing both at once is the Laplacian of Gaussian.
        </Pitfall>
      </Section>

      <Section
        id="scale"
        n={4}
        title="Scale space and characteristic scale"
        lead="A blob has a size. Search only in (x, y) and you find the blobs that happen to match your σ; search in (x, y, σ) and you find them all — and learn their size for free."
      >
        <FormulaCard
          name="Laplacian of Gaussian"
          note="Smooth, then take the Laplacian — one operator."
        >
          <Tex>{'L(x, y; \\sigma) = \\Delta\\big(G_\\sigma * f\\big)'}</Tex>
        </FormulaCard>

        <Figure caption="The response of the LoG at the centre of a disc, as a function of σ. Switch to the plain Laplacian and the peak disappears entirely — that is what the σ² normalisation buys you.">
          <ScaleSpaceLab />
        </Figure>

        <Rule tag="Characteristic scale">
          The <strong>characteristic scale</strong> of a structure is the scale at which the
          (normalised) Laplacian response peaks. For a binary disc of radius <T>{'r'}</T> it is{' '}
          <T>{'\\sigma^* = r/\\sqrt{2}'}</T>. Because the peak location is tied to the{' '}
          <em>physical size of the structure</em>, it moves consistently when the image is scaled —
          which is precisely what makes scale-invariant detection possible.
        </Rule>

        <Concept
          title="Why searching across σ is not optional"
          intuition={
            <>
              Photograph the same object from twice the distance and every structure in the image
              halves in size. A detector fixed at one σ would fire on it in one photo and not the
              other — so the features could never be matched.
            </>
          }
        >
          <p>
            Searching the full <T>{'(x, y, \\sigma)'}</T> volume for extrema fixes this. If the same
            physical blob appears at <T>{'\\sigma^*'}</T> in one image and <T>{'\\sigma^*/2'}</T> in
            the other, both are found, and the ratio of the two scales{' '}
            <em>tells you the zoom factor</em>. The detected scale then sets the size of the
            descriptor window, so the descriptor covers the same physical area in both images. That
            is the whole mechanism of scale invariance.
          </p>
        </Concept>

        <Deeper label="Why the σ² factor is needed at all">
          <p>
            The amplitude of Gaussian derivatives decays with σ: differentiating a function that has
            been blurred more gives smaller numbers, regardless of the content. So the raw LoG
            response falls monotonically with σ and its maximum over σ is always at the smallest σ —
            useless.
          </p>
          <p className="mt-2">
            Lindeberg&rsquo;s fix is to multiply by <T>{'\\sigma^{2}'}</T> (for the Laplacian, which
            is a second derivative — in general <T>{'\\sigma^{n}'}</T> for an <T>{'n'}</T>-th
            derivative). The normalised response <T>{'\\sigma^2 \\Delta G * f'}</T> is then
            comparable across scales, and it peaks at the structure&rsquo;s own size.
          </p>
        </Deeper>
      </Section>

      <Section
        id="dog"
        n={5}
        title="Difference of Gaussians"
        lead="A cheap, accurate stand-in for the LoG — and the reason SIFT is fast enough to use."
      >
        <FormulaCard name="DoG">
          <Tex>{'DoG(x,y,\\sigma) = G(x,y,k\\sigma) - G(x,y,\\sigma), \\qquad k > 1'}</Tex>
        </FormulaCard>

        <Worked
          title="Why DoG approximates LoG"
          source="Sheet 4 · Exercise 1"
          question={
            <>Explain why the difference of two Gaussians approximates the Laplacian of Gaussian.</>
          }
          steps={[
            {
              label: 'Start from the heat equation',
              body: (
                <>
                  The Gaussian satisfies{' '}
                  <T>{'\\dfrac{\\partial G}{\\partial \\sigma} = \\sigma\\,\\Delta G'}</T> —
                  blurring more is the same as diffusing.
                </>
              ),
            },
            {
              label: 'Approximate the derivative by a finite difference',
              body: (
                <Tex>
                  {
                    '\\sigma\\,\\Delta G \\approx \\frac{G(x,y,k\\sigma) - G(x,y,\\sigma)}{k\\sigma - \\sigma}'
                  }
                </Tex>
              ),
            },
            {
              label: 'Rearrange',
              body: (
                <Tex>
                  {'G(x,y,k\\sigma) - G(x,y,\\sigma) \\approx (k-1)\\,\\sigma^{2}\\,\\Delta G'}
                </Tex>
              ),
            },
            {
              label: 'Read off what that means',
              body: (
                <>
                  The right-hand side is the <em>scale-normalised</em> LoG times the constant{' '}
                  <T>{'(k-1)'}</T>. A constant factor does not move the location of an extremum, so
                  DoG extrema and normalised-LoG extrema coincide. And DoG comes free: the pyramid
                  already contains the blurred images, so a subtraction is all it costs.
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'G(k\\sigma) - G(\\sigma) \\approx (k-1)\\sigma^2 \\Delta G'}</T> — the DoG is the
              scale-normalised LoG up to a constant factor, which does not move extrema. It is used
              because it costs one subtraction between images the pyramid already holds, instead of
              a separate second-derivative convolution at every scale.
            </>
          }
        />

        <KeyList
          title="The other three parts of that exercise"
          items={[
            {
              k: 'Why a 3×3×3 neighbourhood?',
              v: 'A keypoint must be an extremum in space AND in scale. The 26 neighbours are the 8 in the same DoG level plus 9 in the level below and 9 above. Comparing across scale is what makes the detection scale-invariant rather than just repeatable.',
            },
            {
              k: 'What structures does it detect?',
              v: 'Blobs — roughly circular regions brighter or darker than their surround, at their characteristic scale. Maxima are dark blobs on a light ground and minima the reverse (the sign convention follows from the Laplacian). Edges also respond, which is why SIFT adds a separate step to reject them.',
            },
            {
              k: 'Why is that scale-invariant?',
              v: 'Zooming the image by a factor s moves the peak from σ* to s·σ*. Since the search covers all σ, the same physical blob is still found, just at a different level — and the level tells you s, which sets the descriptor window size.',
            },
          ]}
        />
      </Section>

      <Section
        id="corners"
        n={6}
        title="Corners: the structure tensor"
        lead="A different question: not “is this a blob?” but “can this window be located precisely?”"
      >
        <Concept
          intuition={
            <>
              Slide a small window a little in every direction and watch how much the content
              changes. On a flat patch nothing changes (you cannot localise it at all). On an edge
              nothing changes <em>along</em> the edge (the aperture problem). On a corner,{' '}
              <em>every</em> direction changes — so the window can be pinned down.
            </>
          }
        >
          <FormulaCard
            name="Autocorrelation / structure tensor"
            note="w is a window function, usually a Gaussian."
          >
            <Tex>
              {'A = w * \\begin{pmatrix} f_x^2 & f_x f_y \\\\ f_x f_y & f_y^2 \\end{pmatrix}'}
            </Tex>
          </FormulaCard>
        </Concept>

        <KeyList
          title="Reading the two eigenvalues"
          items={[
            {
              k: <T>{'\\lambda_1 \\approx \\lambda_2 \\approx 0'}</T>,
              v: 'Flat region. No structure, no localisation.',
            },
            {
              k: <T>{'\\lambda_1 \\gg \\lambda_2 \\approx 0'}</T>,
              v: 'Edge. Well localised across the edge, completely unconstrained along it.',
            },
            {
              k: <T>{'\\lambda_1, \\lambda_2 \\text{ both large}'}</T>,
              v: 'Corner or junction. Localisable in both directions — a good feature.',
            },
          ]}
        />

        <Rule>
          <T>{'A^{-1}'}</T> provides a lower bound on the uncertainty of the window&rsquo;s
          location, so the <em>smaller</em> eigenvalue governs the largest uncertainty. Shi &amp;
          Tomasi&rsquo;s &ldquo;good features to track&rdquo; is therefore simply:{' '}
          <em>threshold the smaller eigenvalue</em>. Harris avoids computing eigenvalues at all by
          scoring <T>{'\\det A - k\\,(\\operatorname{tr} A)^2'}</T>, which is cheap because{' '}
          <T>{'\\det A = \\lambda_1\\lambda_2'}</T> and{' '}
          <T>{'\\operatorname{tr} A = \\lambda_1 + \\lambda_2'}</T>.
        </Rule>

        <Aside>
          <T>{'A'}</T> is symmetric by construction, so by the spectral theorem its eigenvalues are
          real and its eigenvectors orthogonal — that is the payoff from the maths topic, and it is
          why &ldquo;the two principal directions of a corner&rdquo; is even a meaningful phrase.
        </Aside>
      </Section>

      <Section
        id="sift"
        n={7}
        title="SIFT: describing a patch"
        lead="Lowe 2004. Detection by DoG, description by a grid of gradient-orientation histograms."
      >
        <Rule tag="The pipeline, in the order the lecture gives it">
          <ol className="mt-1 list-decimal space-y-1.5 pl-5">
            <li>Build a Gaussian scale-space pyramid.</li>
            <li>Take differences of adjacent levels → the DoG pyramid.</li>
            <li>
              Find local extrema in the 3×3×3 neighbourhood — a point must be significantly higher
              or lower than all 26 neighbours.
            </li>
            <li>Take a 16×16 window around the keypoint, at the detected scale.</li>
            <li>
              Compute the gradient orientation at every pixel; discard weak gradients by
              thresholding the magnitude.
            </li>
            <li>
              Split the window into a 4×4 grid of cells; build an 8-bin orientation histogram per
              cell.
            </li>
            <li>
              Concatenate: <strong>16 cells × 8 orientations = 128 numbers</strong>.
            </li>
          </ol>
        </Rule>

        <Concept
          title="Where each invariance comes from"
          intuition={<>Every design choice in that list buys one specific robustness.</>}
        >
          <KeyList
            items={[
              {
                k: 'Scale invariance',
                v: 'The detected characteristic scale sets the window size, so the 16×16 window covers the same physical area regardless of zoom.',
              },
              {
                k: 'Rotation invariance',
                v: 'The dominant orientation is measured and the window is rotated to align with it before the histograms are built, so all angles are measured relative to it.',
              },
              {
                k: 'Illumination invariance',
                v: 'Gradients are used rather than intensities, which removes an additive brightness change; normalising the 128-vector removes a multiplicative contrast change.',
              },
              {
                k: 'Tolerance to small shifts',
                v: 'Histogramming within a cell throws away exact position inside the cell — a few pixels of misalignment do not change the descriptor.',
              },
            ]}
          />
        </Concept>
      </Section>

      <Section
        id="matching"
        n={8}
        title="Matching and the ratio test"
        lead="Nearest neighbour in descriptor space is the obvious answer, and it is not good enough."
      >
        <Concept
          title="Why Euclidean distance is reasonable"
          intuition={
            <>
              A descriptor is a point in <T>{'\\mathbb R^{128}'}</T> whose coordinates are gradient
              energies. Two views of the same patch produce nearly the same energies, so the vectors
              land close together; different patches produce different energies and land far apart.
            </>
          }
        >
          <p>
            The <T>{'L_2'}</T> distance <T>{'\\lVert f_1 - f_2\\rVert_2'}</T> sums the squared
            per-bin discrepancies, so it penalises any bin that disagrees and treats all bins
            symmetrically — appropriate, since no orientation bin is a priori more important. It is
            also cheap and works with kd-trees and other nearest-neighbour structures.
          </p>
        </Concept>

        <Figure caption="Drag the best and second-best distances. Notice you can make both large and still accept — the ratio, not the absolute distance, is what carries information.">
          <RatioTestLab />
        </Figure>

        <Worked
          title="The ratio test, four parts"
          source="Sheet 4 · Exercise 2"
          question={
            <>
              With <T>{"r = \\lVert f_1 - f_2\\rVert / \\lVert f_1 - f_2'\\rVert"}</T>: what is the
              intuition, what does a high ratio mean, and why does it improve robustness?
            </>
          }
          steps={[
            {
              label: 'The intuition',
              body: (
                <>
                  The absolute distance to the best match is not informative on its own — it depends
                  on blur, noise, lighting and how textured the patch is. What <em>is</em>{' '}
                  informative is whether the best match is clearly better than the runner-up. The
                  ratio asks precisely that, and it is dimensionless.
                </>
              ),
            },
            {
              label: 'A high ratio',
              body: (
                <>
                  <T>{'r \\to 1'}</T> means the best and second-best candidates are almost equally
                  good, so the match is <em>ambiguous</em> — this descriptor is not distinctive.
                  Typically it lies on a repetitive texture (bricks, windows, foliage) where many
                  patches look alike.
                </>
              ),
            },
            {
              label: 'Why robustness improves',
              body: (
                <>
                  A correct match is usually much closer than any incorrect one, so it has a low
                  ratio. An incorrect match is competing with many equally-bad alternatives, so its
                  ratio is close to 1. Thresholding at about 0.75–0.8 therefore discards a large
                  share of false matches while losing few correct ones — a far better
                  precision/recall trade than any absolute-distance threshold can give.
                </>
              ),
            },
          ]}
          answer={
            <>
              The ratio measures <em>distinctiveness</em> rather than similarity. High ratio →
              ambiguous → reject. It is robust because it normalises away everything that scales
              both distances equally, leaving only the question &ldquo;is this match uniquely
              good?&rdquo;
            </>
          }
        />

        <Aside title="What happens to the survivors">
          Even after the ratio test some matches are wrong, so the geometry chapters add a second
          filter: fit a fundamental matrix with RANSAC and keep only the matches consistent with it.
          The notebook does exactly this — Lowe&rsquo;s ratio at 0.75, then{' '}
          <code className="font-mono text-[0.9em]">cv2.findFundamentalMat(..., FM_RANSAC)</code>.
          Appearance filters first, geometry second.
        </Aside>
      </Section>
    </>
  )
}

export const drills: DrillSpec[] = [
  {
    id: 'feat-d1',
    topicId: 'features',
    source: 'Sheet 3 · Ex 1.4',
    kind: 'explain',
    prompt: (
      <>
        In the Canny detector, why is non-maximum suppression applied <em>after</em> computing the
        gradient magnitude?
      </>
    ),
    answer: (
      <>
        Because NMS needs both pieces of information that step 2 produces. It compares each pixel
        against its two neighbours <em>along the gradient direction</em> — so it needs the
        orientation to know which neighbours to look at — and it keeps the pixel only if its{' '}
        <em>magnitude</em> is the largest of the three.
        <br />
        <br />
        The problem it solves: Gaussian smoothing blurs the edge, so the gradient magnitude forms a
        ridge several pixels wide. Thresholding alone would return a thick band. NMS keeps only the
        crest, thinning the response to a single pixel so the result is a traceable curve rather
        than a region.
      </>
    ),
  },
  {
    id: 'feat-d2',
    topicId: 'features',
    source: 'Sheet 3 · Ex 2.1',
    kind: 'compute',
    prompt: (
      <>
        Compute the Laplacian response at the centre of{' '}
        <T>{'\\begin{pmatrix}80&80&80\\\\80&120&80\\\\80&80&80\\end{pmatrix}'}</T> using{' '}
        <T>{'\\begin{pmatrix}0&1&0\\\\1&-4&1\\\\0&1&0\\end{pmatrix}'}</T>.
      </>
    ),
    answer: (
      <>
        Only the four 4-neighbours (weight +1) and the centre (weight −4) contribute:
        <Tex>{'80 + 80 + 80 + 80 - 4\\cdot 120 = 320 - 480 = -160'}</Tex>
        The response is <strong>−160</strong>. It is negative because the centre is brighter than
        its surround — the Laplacian is{' '}
        <T>{'4(\\overline{I}_{\\text{nbrs}} - I_{\\text{centre}})'}</T>, so a bright spot gives a
        large negative value.
      </>
    ),
  },
  {
    id: 'feat-d3',
    topicId: 'features',
    source: 'Sheet 3 · Ex 2.3',
    kind: 'explain',
    prompt: (
      <>
        The true Laplacian of a Gaussian-smoothed image is expensive. How is it typically
        approximated in practice?
      </>
    ),
    answer: (
      <>
        By the <strong>Difference of Gaussians</strong>:{' '}
        <T>{'G(k\\sigma) - G(\\sigma) \\approx (k-1)\\sigma^2\\Delta G'}</T>. It costs one image
        subtraction between two levels the Gaussian pyramid already contains, instead of a separate
        second-derivative convolution at every scale — and since the two differ only by a constant
        factor, the extrema are in the same places.
        <br />
        <br />
        Worth adding: Gaussian smoothing itself is separable, so each level of the pyramid is two 1D
        passes rather than one 2D one. Approaches like SURF push this further, approximating the
        second-derivative filters with box filters evaluated in constant time via integral images.
      </>
    ),
  },
  {
    id: 'feat-d4',
    topicId: 'features',
    source: 'Sheet 3 · Ex 3',
    kind: 'explain',
    prompt: (
      <>
        Define <em>characteristic scale</em>, and explain why extrema must be sought across σ and
        not only across (x, y).
      </>
    ),
    answer: (
      <>
        The <strong>characteristic scale</strong> of a structure is the scale σ at which the
        scale-normalised Laplacian response peaks. It is a property of the structure&rsquo;s own
        size — for a binary disc of radius <T>{'r'}</T> it is <T>{'\\sigma^* = r/\\sqrt 2'}</T>.
        <br />
        <br />
        Searching across σ is essential because <em>apparent size changes with viewpoint</em>. Zoom
        out by a factor of 2 and every structure halves; a detector fixed at one σ would fire on a
        blob in one image and miss it in the other, so the two could never be matched. Searching the
        full <T>{'(x,y,\\sigma)'}</T> volume finds the blob in both — and the ratio of the two
        detected scales recovers the zoom factor, which is then used to size the descriptor window
        so it covers the same physical patch. That is the mechanism behind scale invariance.
      </>
    ),
  },
  {
    id: 'feat-d4b',
    topicId: 'features',
    source: 'Sheet 3 · Ex 3.1',
    kind: 'explain',
    prompt: <>Explain why the LoG operator is suitable for blob detection.</>,
    answer: (
      <>
        The Laplacian is the sum of the unmixed second derivatives, so it measures how far a point
        departs from the average of its neighbourhood. Written as a kernel it is{' '}
        <T>{'4(\overline{I}_{\text{nbrs}} - I_{\text{centre}})'}</T>, which gives exactly the
        ordering a blob detector needs: <em>zero</em> on a flat region and on a linear ramp (the
        neighbours cancel), <em>moderate</em> on a straight edge (only two of four neighbours
        differ), and <em>maximal</em> on an isolated bright or dark spot, where all the neighbours
        differ in the same direction.
        <br />
        <br />
        The Gaussian part matters just as much. A second derivative amplifies noise badly, so the
        image must be smoothed first — and because{' '}
        <T>{'\Delta(G_\sigma * f) = (\Delta G_\sigma) * f'}</T>
        , smoothing and differentiating combine into a single operator whose kernel is the familiar
        centre-surround &ldquo;Mexican hat&rdquo;. That kernel is, quite literally, a template for a
        blob of a particular size, so convolving with it is template matching for blobs.
        <br />
        <br />
        Finally, σ selects <em>which</em> size responds. Sweeping σ and taking the scale-normalised{' '}
        <T>{'\sigma^2\Delta G'}</T> makes responses comparable across scales, so the peak locates
        both the blob and its size.
      </>
    ),
  },
  {
    id: 'feat-d5',
    topicId: 'features',
    source: 'Sheet 4 · Ex 1.2',
    kind: 'choose',
    prompt: <>In the DoG pyramid, why are extrema detected in a 3×3×3 neighbourhood?</>,
    options: [
      'To reduce computation compared with a larger window.',
      'Because a keypoint must be extremal in space and in scale — 8 neighbours in its own level plus 9 above and 9 below.',
      'Because SIFT descriptors are 3×3 grids of cells.',
      'To suppress noise by averaging over 27 values.',
    ],
    correct: 1,
    answer: (
      <>
        A keypoint has to be a local extremum <em>in space and in scale simultaneously</em>. Its 26
        neighbours are the 8 surrounding pixels in its own DoG level, plus the 9 in the level below
        and the 9 in the level above. Requiring it to beat all 26 is what makes the detection
        scale-selective: a structure that responds more strongly at a neighbouring σ is rejected
        there, so exactly one scale — the characteristic one — survives.
      </>
    ),
  },
  {
    id: 'feat-d6',
    topicId: 'features',
    source: 'Sheet 4 · Ex 2.3',
    kind: 'explain',
    prompt: (
      <>What does a high ratio-test value indicate, and why does the test improve robustness?</>
    ),
    answer: (
      <>
        <T>{'r \\to 1'}</T> means the best and second-best matches are almost equally good — the
        match is <em>ambiguous</em>, and the descriptor is not distinctive. This typically happens
        on repetitive texture (bricks, windows, foliage) where many patches genuinely look alike.
        <br />
        <br />
        It improves robustness because a correct match is usually far closer than any wrong one (low
        ratio), while a wrong match competes with many equally-bad alternatives (ratio near 1).
        Thresholding at ≈0.75–0.8 therefore removes a large fraction of false matches at the cost of
        very few true ones. Crucially, the ratio is <em>dimensionless</em>: it cancels everything
        that scales both distances together — blur, contrast, how textured the region is — which an
        absolute-distance threshold cannot do.
      </>
    ),
  },
  {
    id: 'feat-d7',
    topicId: 'features',
    source: 'L05 · structure tensor',
    kind: 'explain',
    prompt: (
      <>
        Given the structure tensor{' '}
        <T>{'A = w * \\begin{pmatrix}f_x^2 & f_xf_y\\\\ f_xf_y & f_y^2\\end{pmatrix}'}</T>, explain
        what its eigenvalues tell you.
      </>
    ),
    answer: (
      <>
        <T>{'A'}</T> describes how much the windowed image content changes when the window is
        shifted, as a function of shift direction. Its eigenvectors are the two principal directions
        (orthogonal, since <T>{'A'}</T> is symmetric) and its eigenvalues the change along each.
        <br />
        <br />
        <strong>Both ≈ 0</strong>: flat region — shifting changes nothing, the window cannot be
        localised at all. <strong>One large, one ≈ 0</strong>: an edge — well constrained across it,
        completely unconstrained along it (the aperture problem). <strong>Both large</strong>: a
        corner or junction — localisable in every direction, so a good feature.
        <br />
        <br />
        Since <T>{'A^{-1}'}</T> bounds the localisation uncertainty, the <em>smaller</em> eigenvalue
        governs the worst-case error — which is why Shi–Tomasi simply thresholds{' '}
        <T>{'\\lambda_{\\min}'}</T>, and why Harris uses{' '}
        <T>{'\\det A - k(\\operatorname{tr}A)^2'}</T> as a cheap proxy that needs no
        eigendecomposition.
      </>
    ),
  },
]
