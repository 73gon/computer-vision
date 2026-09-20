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
import { ConvolutionLab, SharpenLab } from '@/components/viz/filtering'
import type { DrillSpec } from '@/components/learn/drill'
import type { TopicMeta } from './types'

export const meta: TopicMeta = {
  id: 'filtering',
  n: 3,
  title: 'Image filtering',
  kicker:
    'Point operations change one pixel at a time. Convolution lets a pixel look at its neighbours — and that single step buys you blurring, sharpening, edges and, eventually, CNNs.',
  lectures: ['L03 Image Filtering', 'L03 + L04 notebooks'],
  exercises: ['Sheet 2, Ex 1–3'],
  minutes: 30,
  stage: 'images',
  sections: [
    { id: 'point', title: 'Point operations' },
    { id: 'convolution', title: 'Convolution' },
    { id: 'linearity', title: 'Linear and shift-invariant' },
    { id: 'lowpass', title: 'Smoothing, and what it destroys' },
    { id: 'sharpen', title: 'Sharpening as residual filtering' },
    { id: 'nonlinear', title: 'When linear filters are the wrong tool' },
  ],
  sheet: [
    {
      name: 'Point operation',
      tex: 'g(\\mathbf x) = a\\,I(\\mathbf x) + b',
      note: 'a = gain (contrast), b = bias (brightness).',
    },
    {
      name: 'Discrete convolution',
      tex: 'g(y,x) = (f * h)(y,x) = \\sum_{i,j} f(y-i,\\, x-j)\\, h(i,j)',
    },
    {
      name: 'Linearity',
      tex: '(\\alpha f_1 + f_2) * h = \\alpha (f_1 * h) + (f_2 * h)',
    },
    {
      name: 'Shift invariance',
      tex: 'f_{\\mathbf s} = f(\\cdot - \\mathbf s) \\;\\Rightarrow\\; f_{\\mathbf s} * h = (f*h)(\\cdot - \\mathbf s)',
    },
    {
      name: 'Impulse response',
      tex: '\\delta * h = h',
      note: 'Filtering an impulse returns the kernel itself.',
    },
    {
      name: 'Sharpening kernel',
      tex: 'k = (1+\\gamma)\\,\\delta - \\gamma\\, h',
      note: 'Sums to 1 whenever Σh = 1, so constant regions survive.',
    },
  ],
}

export function Body() {
  return (
    <>
      <BigIdea oneLiner="Every linear filter is the same operation — slide a small array of weights over the image and take a weighted sum — and what the filter does is decided entirely by those weights.">
        <p>
          There is really only one formula in this topic. The interesting part is reading a kernel
          and predicting its behaviour without running it: if the weights sum to 1 it leaves flat
          regions alone, if they sum to 0 it annihilates them, and if they are all positive it blurs
          while any sign change means it differentiates.
        </p>
      </BigIdea>

      <WhyCare>
        A convolutional layer is exactly this, with the weights learned instead of designed. The
        first layer of a trained CNN reliably rediscovers oriented edge filters and blobs — the
        Gabor-like and centre-surround kernels below. Knowing the hand-designed versions is what
        lets you read a filter visualisation and say something about it, and it explains why
        convolution is the right inductive bias for images at all: because the useful operations on
        images happen to be linear and shift-invariant.
      </WhyCare>

      <Section
        id="point"
        n={1}
        title="Point operations"
        lead="The simplest thing you can do: a function applied to each pixel value, ignoring every neighbour."
      >
        <FormulaCard name="Linear point process">
          <Tex>{'g(\\mathbf x) = a\\,I(\\mathbf x) + b'}</Tex>
        </FormulaCard>

        <KeyList
          items={[
            { k: <T>{'a'}</T>, v: 'Gain — increases contrast. Stretches the histogram.' },
            { k: <T>{'b'}</T>, v: 'Bias — increases brightness. Shifts the histogram.' },
            {
              k: <T>{'a(\\mathbf x),\\ b(\\mathbf x)'}</T>,
              v: 'Let them vary with position and the operation becomes a mask or a blend — the basis of compositing.',
            },
          ]}
        />

        <Pitfall title="The notebook's trap">
          Multiply an 8-bit image by 1.2 and everything above 213 clips to white; add 50 and
          everything above 205 clips. Look at the histogram, not just the picture: the clipped
          values pile up in one bin at 255 and that information is gone for good. This is why real
          pipelines do intensity maths in float and quantise once, at the end.
        </Pitfall>
      </Section>

      <Section
        id="convolution"
        n={2}
        title="Convolution"
        lead="Let each output pixel be a weighted sum of a neighbourhood in the input. That is the whole definition."
      >
        <FormulaCard
          name="Discrete 2D convolution"
          note="The lecture's convention; in short form g = f ∗ h."
        >
          <Tex>{'g(y,x) = (f * h)(y,x) = \\sum_{i,j} f(y-i,\\, x-j)\\; h(i,j)'}</Tex>
        </FormulaCard>

        <Figure caption="Pick a kernel and sweep. Watch the output fill in one pixel at a time — the cursor on the left is the neighbourhood being summed, the cursor on the right is where the sum lands.">
          <ConvolutionLab />
        </Figure>

        <Concept
          title="Reading a kernel without running it"
          intuition={
            <>
              Look at two things and you can usually predict the result: the <em>sum</em> of the
              weights, and whether they <em>change sign</em>.
            </>
          }
        >
          <KeyList
            items={[
              {
                k: 'Σh = 1',
                v: 'A constant region comes out unchanged. This is what makes a filter a smoother rather than a scaler.',
              },
              {
                k: 'Σh = 0',
                v: 'A constant region comes out as exactly 0. The filter is a derivative of some order — it only responds to change.',
              },
              {
                k: 'All weights ≥ 0',
                v: 'A local average, so a low-pass: it can only blur.',
              },
              {
                k: 'Signs change',
                v: 'A difference, so a high-pass: it responds to edges, corners or dots depending on the pattern.',
              },
            ]}
          />
        </Concept>

        <Deeper label="Convolution vs correlation — the flip nobody mentions">
          <p>
            The minus signs in <T>{'f(y-i, x-j)'}</T> mean the kernel is <em>flipped</em> before
            being applied. Without the flip you have <em>cross-correlation</em>. For symmetric
            kernels (box, Gaussian, Laplacian) the two are identical, so the distinction never
            bites. For asymmetric ones (Sobel) it flips the sign of the response.
          </p>
          <p className="mt-2">
            The flip is what makes convolution commutative and associative, which is what lets you
            pre-combine kernels: <T>{'(f*h_1)*h_2 = f*(h_1*h_2)'}</T>. That is how a separable
            Gaussian works — a 2D <T>{'n\\times n'}</T> blur becomes two 1D passes, dropping the
            cost from <T>{'O(n^2)'}</T> to <T>{'O(n)'}</T> per pixel.
          </p>
          <p className="mt-2">
            Deep-learning frameworks call their operation &ldquo;convolution&rdquo; but implement
            cross-correlation. It makes no difference when the weights are learned.
          </p>
        </Deeper>
      </Section>

      <Section
        id="linearity"
        n={3}
        title="Linear and shift-invariant"
        lead="The two properties that name the whole class of filters — and the proof the exercise sheet asks for."
      >
        <Worked
          title="Prove convolution is linear"
          source="Sheet 2 · Exercise 1"
          question={
            <>
              Show that <T>{'(\\alpha f_1 + f_2) * h = \\alpha (f_1 * h) + (f_2 * h)'}</T> for
              arbitrary images <T>{'f_1, f_2'}</T> and a scalar <T>{'\\alpha'}</T>.
            </>
          }
          steps={[
            {
              label: 'Write out the definition on the combined image',
              body: (
                <Tex>
                  {
                    '\\big((\\alpha f_1 + f_2) * h\\big)(y,x) = \\sum_{i,j} \\big(\\alpha f_1 + f_2\\big)(y-i, x-j)\\, h(i,j)'
                  }
                </Tex>
              ),
            },
            {
              label: 'Expand the pointwise sum inside',
              body: (
                <Tex>{'= \\sum_{i,j} \\Big[\\alpha f_1(y-i,x-j) + f_2(y-i,x-j)\\Big] h(i,j)'}</Tex>
              ),
            },
            {
              label: 'Split the sum, pull the constant out',
              body: (
                <>
                  Finite sums are linear, so
                  <Tex>
                    {'= \\alpha \\sum_{i,j} f_1(y-i,x-j)h(i,j) + \\sum_{i,j} f_2(y-i,x-j)h(i,j)'}
                  </Tex>
                </>
              ),
            },
            {
              label: 'Recognise the two convolutions',
              body: <Tex>{'= \\alpha (f_1 * h)(y,x) + (f_2 * h)(y,x) \\qquad \\square'}</Tex>,
            },
          ]}
          answer={
            <>
              The result follows from nothing more than linearity of the finite sum. State that
              explicitly — it is the only substantive step, and it is why the proof is three lines.
            </>
          }
        />

        <Worked
          title="Prove convolution is shift invariant"
          source="Sheet 2 · Exercise 1"
          question={
            <>
              Let <T>{'f_{\\mathbf s}(y,x) = f(y - s_1, x - s_2)'}</T> be the image shifted by{' '}
              <T>{'\\mathbf s'}</T>. Show that <T>{'f_{\\mathbf s} * h = (f * h)_{\\mathbf s}'}</T>.
            </>
          }
          steps={[
            {
              label: 'Apply the definition to the shifted image',
              body: (
                <Tex>
                  {
                    '(f_{\\mathbf s} * h)(y,x) = \\sum_{i,j} f_{\\mathbf s}(y-i, x-j)\\,h(i,j) = \\sum_{i,j} f(y - s_1 - i,\\; x - s_2 - j)\\,h(i,j)'
                  }
                </Tex>
              ),
            },
            {
              label: 'Recognise the inner expression',
              body: (
                <>
                  The right-hand side is exactly the definition of <T>{'(f*h)'}</T> evaluated at{' '}
                  <T>{'(y - s_1,\\; x - s_2)'}</T>.
                </>
              ),
            },
            {
              label: 'Conclude',
              body: (
                <Tex>
                  {
                    '(f_{\\mathbf s} * h)(y,x) = (f*h)(y - s_1, x - s_2) = (f*h)_{\\mathbf s}(y,x) \\qquad \\square'
                  }
                </Tex>
              ),
            },
          ]}
          answer={
            <>
              Shifting the input shifts the output by the same amount and changes nothing else —
              because <T>{'h'}</T> does not depend on position. A filter whose weights varied with{' '}
              <T>{'(y,x)'}</T> would <em>not</em> be shift invariant.
            </>
          }
        />

        <Rule>
          Together these make convolution a <strong>Linear Shift-Invariant (LSI)</strong> operator.
          The converse is the deep fact: <em>every</em> LSI operator on images is a convolution with
          some kernel, and that kernel is the operator&rsquo;s response to an impulse. So &ldquo;LSI
          filter&rdquo; and &ldquo;convolution&rdquo; name the same thing.
        </Rule>
      </Section>

      <Section
        id="lowpass"
        n={4}
        title="Smoothing, and what it destroys"
        lead="Local averaging suppresses high frequencies. The exercise wants that stated both ways — spatially and in frequency."
      >
        <Worked
          title="The box filter's impulse response"
          source="Sheet 2 · Exercise 2"
          question={
            <>
              With the normalised <T>{'3\\times3'}</T> box filter{' '}
              <T>{'h = \\tfrac19 \\mathbf{1}_{3\\times3}'}</T> and an impulse <T>{'f(y,x) = 1'}</T>{' '}
              at the origin, 0 elsewhere — compute <T>{'(f*h)(y,x)'}</T> explicitly, and explain why
              this filter reduces sharp structure.
            </>
          }
          steps={[
            {
              label: 'Substitute the impulse into the definition',
              body: <Tex>{'(f*h)(y,x) = \\sum_{i,j} f(y-i,\\,x-j)\\,h(i,j)'}</Tex>,
            },
            {
              label: 'Only one term survives',
              body: (
                <>
                  <T>{'f(y-i, x-j)'}</T> is non-zero only when <T>{'(y-i, x-j) = (0,0)'}</T>, i.e.{' '}
                  <T>{'i = y'}</T> and <T>{'j = x'}</T>. So the whole sum collapses to a single
                  term:
                  <Tex>{'(f*h)(y,x) = h(y,x)'}</Tex>
                </>
              ),
            },
            {
              label: 'Write out that kernel',
              body: (
                <Tex>
                  {
                    '(f*h)(y,x) = \\begin{cases} \\tfrac19 & y,x \\in \\{-1,0,1\\}\\\\ 0 & \\text{otherwise}\\end{cases}'
                  }
                </Tex>
              ),
            },
            {
              label: 'Why this smooths — the spatial argument',
              body: (
                <>
                  A single bright point has been spread over nine pixels, each at <T>{'1/9'}</T> of
                  the original height. Every output is the <em>mean</em> of its neighbourhood, so
                  any value that differs sharply from its neighbours is pulled towards them. Sharp
                  structure is, by definition, a large difference between adjacent pixels —
                  averaging is exactly the operation that reduces it.
                </>
              ),
            },
            {
              label: 'Why this smooths — the frequency argument',
              body: (
                <>
                  By the convolution theorem, <T>{'\\widehat{f*h} = \\hat f \\cdot \\hat h'}</T>:
                  filtering multiplies the spectrum by <T>{'\\hat h'}</T>. For the 1-D 3-tap box,
                  <Tex>{'\\hat h(\\omega) = \\tfrac13\\left(1 + 2\\cos\\omega\\right)'}</Tex>
                  which equals 1 at <T>{'\\omega = 0'}</T> (DC is preserved, because{' '}
                  <T>{'\\sum h = 1'}</T>) and falls to 0 at <T>{'\\omega = 2\\pi/3'}</T>. High
                  frequencies are attenuated; some are even sign-flipped beyond the zero, which is
                  the ringing the box filter is notorious for.
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'(f*h)(y,x) = h(y,x)'}</T> — the impulse response <em>is</em> the kernel:{' '}
              <T>{'1/9'}</T> on the <T>{'3\\times3'}</T> neighbourhood of the origin, 0 elsewhere.
              It smooths because each output is a local mean, which by the convolution theorem means
              multiplying the spectrum by a function that is 1 at DC and small at high frequencies.
            </>
          }
        />

        <Aside title="Box versus Gaussian">
          Both are low-pass, but the box has a hard edge in space, which means a slowly-decaying,
          oscillating response in frequency — hence ringing. The Gaussian is smooth in both domains
          (its Fourier transform is another Gaussian), so it has no ringing, and it is{' '}
          <em>separable</em>, so it is also cheaper. That is why the Gaussian, not the box, is the
          smoother of choice everywhere in this course.
        </Aside>
      </Section>

      <Section
        id="sharpen"
        n={5}
        title="Sharpening as residual filtering"
        lead="Add back what the blur removed. The algebra collapses to one kernel."
      >
        <Worked
          title="Derive the single sharpening kernel"
          source="Sheet 2 · Exercise 3"
          question={
            <>
              With <T>{'b = f * h'}</T> a smoothed version of <T>{'f'}</T> and{' '}
              <T>{'g = f + \\gamma(f - b)'}</T> for <T>{'\\gamma > 0'}</T>, rewrite{' '}
              <T>{'g = f * k'}</T> and give <T>{'k'}</T> in terms of <T>{'h'}</T> and the delta
              kernel <T>{'\\delta'}</T>.
            </>
          }
          steps={[
            {
              label: 'Write every f as a convolution',
              body: (
                <>
                  The delta kernel is the identity of convolution: <T>{'f = f * \\delta'}</T>.
                  <Tex>{'g = f*\\delta + \\gamma\\big(f*\\delta - f*h\\big)'}</Tex>
                </>
              ),
            },
            {
              label: 'Use linearity in the kernel',
              body: (
                <>
                  Convolution is bilinear, so the kernels can be combined:
                  <Tex>{'g = f * \\Big(\\delta + \\gamma\\delta - \\gamma h\\Big)'}</Tex>
                </>
              ),
            },
            {
              label: 'Collect',
              body: <Tex>{'k = (1 + \\gamma)\\,\\delta - \\gamma\\, h'}</Tex>,
            },
            {
              label: 'When are constant regions preserved?',
              body: (
                <>
                  A constant image <T>{'f \\equiv c'}</T> maps to <T>{'c \\sum k'}</T>, so it
                  survives unchanged iff <T>{'\\sum k = 1'}</T>. Now
                  <Tex>
                    {
                      '\\sum k = (1+\\gamma)\\underbrace{\\textstyle\\sum\\delta}_{=1} - \\gamma \\sum h = 1 + \\gamma - \\gamma\\sum h'
                    }
                  </Tex>
                  which equals 1 exactly when <T>{'\\sum h = 1'}</T> — i.e. whenever <T>{'h'}</T> is
                  a <em>normalised</em> low-pass filter, as assumed.
                </>
              ),
            },
            {
              label: 'Why it enhances edges',
              body: (
                <>
                  The residual <T>{'f - f*h'}</T> is the high-pass part of the image: it is zero
                  wherever <T>{'f'}</T> agrees with its local average (flat regions) and large where
                  it does not (edges, corners, fine texture). Adding <T>{'\\gamma'}</T> times it
                  therefore changes nothing in flat regions and amplifies the contrast exactly at
                  the transitions.
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'k = (1+\\gamma)\\delta - \\gamma h'}</T>. Constant regions are preserved iff{' '}
              <T>{'\\sum h = 1'}</T>, which holds by assumption for a normalised low-pass filter.
              Edges are enhanced because <T>{'f - f*h'}</T> is a high-pass residual: zero on flat
              regions, large at transitions.
            </>
          }
        />

        <Figure caption="Drag γ. The blue curve is the sharpened signal; the warm curve is the residual being added. Note the overshoot on either side of the edge — that halo is not a bug, it is what 'sharper' means here.">
          <SharpenLab />
        </Figure>

        <Rule>
          For the concrete case <T>{'\\gamma = 1'}</T> with a cross-shaped average, this collapses
          to the familiar <T>{'k = \\begin{pmatrix}0&-1&0\\\\-1&5&-1\\\\0&-1&0\\end{pmatrix}'}</T> —
          check the sum: it is 1. This is called <em>unsharp masking</em>, because historically the
          mask was an out-of-focus (unsharp) copy of the negative.
        </Rule>
      </Section>

      <Section
        id="nonlinear"
        n={6}
        title="When linear filters are the wrong tool"
        lead="The notebook's punchline: on salt-and-pepper noise, averaging fails and a rank filter wins."
      >
        <Concept
          intuition={
            <>
              A single outlier pixel with value 255 in a sea of 100s drags the <em>mean</em> of a
              3×3 window up by about 17. It does not move the <em>median</em> at all.
            </>
          }
        >
          <KeyList
            items={[
              {
                k: 'Gaussian noise',
                v: 'Zero-mean and independent per pixel, so averaging is the right estimator. Mean and Gaussian filters work well; the cost is blur.',
              },
              {
                k: 'Salt-and-pepper noise',
                v: 'A few pixels are wildly wrong. The mean is not robust to outliers; the median is. A median filter removes the specks and keeps edges crisp.',
              },
              {
                k: 'Median filter',
                v: 'Non-linear — it does not satisfy (f₁+f₂)∗h = f₁∗h + f₂∗h, so it is not a convolution and has no frequency response.',
              },
            ]}
          />
        </Concept>

        <Aside>
          The median filter is <em>edge-preserving</em>: at a step edge, more than half the window
          still lies on one side, so the median picks that side&rsquo;s value rather than a blend.
          That is the same intuition behind bilateral filtering and, in a different guise, behind
          the truncated smoothness penalties you will meet in the global-stereo topic — robust
          statistics, applied to images.
        </Aside>
      </Section>
    </>
  )
}

export const drills: DrillSpec[] = [
  {
    id: 'filt-d1',
    topicId: 'filtering',
    source: 'Sheet 2 · Ex 1',
    kind: 'explain',
    prompt: <>Prove that convolution with a fixed kernel is a linear operator.</>,
    hint: (
      <>Write the definition, expand the bracket, split the sum. There is nothing else in it.</>
    ),
    answer: (
      <>
        <Tex>
          {
            '\\big((\\alpha f_1 + f_2)*h\\big)(y,x) = \\sum_{i,j}\\big[\\alpha f_1(y-i,x-j) + f_2(y-i,x-j)\\big]h(i,j)'
          }
        </Tex>
        <Tex>
          {
            '= \\alpha\\sum_{i,j} f_1(y-i,x-j)h(i,j) + \\sum_{i,j} f_2(y-i,x-j)h(i,j) = \\alpha(f_1*h) + (f_2*h)'
          }
        </Tex>
        The only property used is linearity of the finite sum. Say so — it is the substance of the
        proof.
      </>
    ),
  },
  {
    id: 'filt-d2',
    topicId: 'filtering',
    source: 'Sheet 2 · Ex 2',
    kind: 'compute',
    prompt: (
      <>
        Compute <T>{'(f*h)'}</T> where <T>{'h'}</T> is the normalised 3×3 box filter and{' '}
        <T>{'f'}</T> is an impulse at the origin.
      </>
    ),
    answer: (
      <>
        Only the term with <T>{'(y-i, x-j) = (0,0)'}</T> survives, i.e. <T>{'i=y, j=x'}</T>, so
        <Tex>
          {
            '(f*h)(y,x) = h(y,x) = \\begin{cases}\\tfrac19 & y,x\\in\\{-1,0,1\\}\\\\ 0 & \\text{else}\\end{cases}'
          }
        </Tex>
        The impulse response of a filter <em>is</em> its kernel. The single bright point has been
        spread over nine pixels at one ninth the height: that is smoothing, made visible in its
        purest case.
      </>
    ),
  },
  {
    id: 'filt-d3',
    topicId: 'filtering',
    source: 'Sheet 2 · Ex 2',
    kind: 'explain',
    prompt: (
      <>
        Explain mathematically why the box filter reduces sharp image structures. Relate local
        averaging to the attenuation of high frequencies.
      </>
    ),
    answer: (
      <>
        <strong>Spatially:</strong> every output pixel is the arithmetic mean of its 3×3
        neighbourhood. A pixel that differs sharply from its neighbours gets pulled towards them, so
        differences between adjacent pixels — which is what &ldquo;sharp structure&rdquo; means —
        shrink.
        <br />
        <br />
        <strong>In frequency:</strong> by the convolution theorem{' '}
        <T>{'\\widehat{f*h} = \\hat f\\,\\hat h'}</T>, so the filter multiplies each frequency
        component by <T>{'\\hat h'}</T>. For the 3-tap box,{' '}
        <T>{'\\hat h(\\omega) = \\tfrac13(1 + 2\\cos\\omega)'}</T>: it is 1 at{' '}
        <T>{'\\omega = 0'}</T> (because <T>{'\\sum h = 1'}</T>, so constants pass untouched) and
        decays to 0 at <T>{'\\omega = 2\\pi/3'}</T>. High-frequency components — fine texture,
        edges, noise — are therefore attenuated or removed. It is a low-pass filter.
      </>
    ),
  },
  {
    id: 'filt-d4',
    topicId: 'filtering',
    source: 'Sheet 2 · Ex 3',
    kind: 'compute',
    prompt: (
      <>
        Rewrite <T>{'g = f + \\gamma(f - f*h)'}</T> as a single convolution <T>{'g = f*k'}</T>, and
        state when constant regions are preserved.
      </>
    ),
    hint: (
      <>
        Replace the bare <T>{'f'}</T> with <T>{'f*\\delta'}</T> so every term is a convolution, then
        factor.
      </>
    ),
    answer: (
      <>
        <Tex>
          {
            'g = f*\\delta + \\gamma(f*\\delta - f*h) = f * \\big[(1+\\gamma)\\delta - \\gamma h\\big]'
          }
        </Tex>
        so <T>{'k = (1+\\gamma)\\delta - \\gamma h'}</T>.
        <br />
        <br />A constant image <T>{'c'}</T> maps to <T>{'c\\sum k'}</T>, and{' '}
        <T>{'\\sum k = (1+\\gamma) - \\gamma\\sum h'}</T>. So constants are preserved{' '}
        <strong>
          iff <T>{'\\sum h = 1'}</T>
        </strong>
        , i.e. the low-pass filter is normalised — which is assumed in the question.
        <br />
        <br />
        Edges are enhanced because <T>{'f - f*h'}</T> is a high-pass residual: zero in flat regions,
        large at intensity transitions. Scaling it by <T>{'\\gamma'}</T> and adding it back
        amplifies contrast only where there was contrast to begin with.
      </>
    ),
  },
  {
    id: 'filt-d5',
    topicId: 'filtering',
    source: 'L04 notebook',
    kind: 'choose',
    prompt: <>Your image has salt-and-pepper noise. Which filter should you reach for, and why?</>,
    options: [
      'A larger Gaussian, because more averaging removes more noise.',
      'A median filter, because the median is robust to outliers while the mean is not.',
      'A sharpening filter, to restore the detail the noise covered.',
      'A box filter, because it is the cheapest low-pass.',
    ],
    correct: 1,
    answer: (
      <>
        Salt-and-pepper noise sets a few pixels to extreme values. Those outliers drag the{' '}
        <em>mean</em> of a window substantially, so any linear smoother spreads the speck into a
        grey smudge instead of removing it. The <em>median</em> ignores outliers entirely as long as
        fewer than half the window is corrupted — the speck vanishes and, because more than half the
        window still lies on one side of any edge, the edge stays crisp.
        <br />
        <br />
        Worth adding: the median filter is <em>non-linear</em>, so it is not a convolution and has
        no frequency response. Sharpening would make things worse — it amplifies exactly the
        high-frequency content the noise consists of.
      </>
    ),
  },
]
