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
  IoULab,
  LinearClassifierLab,
  NearestNeighbourLab,
  PrecisionRecallLab,
} from '@/components/viz/recognition'
import type { DrillSpec } from '@/components/learn/drill'
import type { TopicMeta } from './types'

export const meta: TopicMeta = {
  id: 'recognition',
  n: 11,
  title: 'Recognition: classification, detection, segmentation',
  kicker:
    'The other half of the course. Not “where is this surface?” but “what is this?” — and the answer went from stored templates to learned features in one decade.',
  lectures: ['L11 Recognition'],
  exercises: ['Sheet 8, Ex 3–4'],
  minutes: 45,
  sections: [
    { id: 'nn', title: 'Nearest neighbour, and why it fails' },
    { id: 'linear', title: 'The linear classifier' },
    { id: 'loss', title: 'Losses and optimisation' },
    { id: 'bow', title: 'Bag of words' },
    { id: 'cnn', title: 'Convolutional networks' },
    { id: 'seg', title: 'Semantic segmentation' },
    { id: 'det', title: 'Object detection' },
  ],
  sheet: [
    {
      name: 'Nearest-neighbour complexity',
      tex: '\\text{train } O(1), \\qquad \\text{test } O(MN)',
      note: 'N training images, M test images. Exactly the wrong way round.',
    },
    {
      name: 'Linear classifier',
      tex: '\\mathbf s = W\\mathbf x + \\mathbf b',
      note: 'Rows of W are per-class templates / hyperplanes.',
    },
    {
      name: 'Softmax loss',
      tex: 'L_i = -\\log\\left(\\frac{e^{s_{y_i}}}{\\sum_j e^{s_j}}\\right)',
    },
    {
      name: 'Multiclass SVM (hinge) loss',
      tex: 'L_i = \\sum_{j \\neq y_i}\\max\\big(0,\\; s_j - s_{y_i} + 1\\big)',
    },
    {
      name: 'Full loss',
      tex: 'L = \\frac1N\\sum_{i=1}^{N} L_i + \\lambda R(W)',
    },
    {
      name: 'Intersection over union',
      tex: '\\mathrm{IoU} = \\dfrac{|A \\cap B|}{|A \\cup B|}',
      note: 'A detection counts as correct if IoU > 0.5.',
    },
    {
      name: 'Precision / recall',
      tex: 'P = \\dfrac{\\mathrm{TP}}{\\mathrm{TP}+\\mathrm{FP}}, \\qquad R = \\dfrac{\\mathrm{TP}}{\\mathrm{TP}+\\mathrm{FN}}',
    },
  ],
}

export function Body() {
  return (
    <>
      <BigIdea oneLiner="A classifier draws boundaries in a high-dimensional space where each image is one point. The entire history of the field is about who chooses the coordinates of that space.">
        <p>
          Nearest neighbour uses raw pixels and memorises everything. A linear classifier uses raw
          pixels and learns one hyperplane per class. Bag-of-words uses hand-designed SIFT features.
          A CNN learns the features and the classifier together. Each step moves more of the design
          burden from the engineer to the data.
        </p>
      </BigIdea>

      <WhyCare>
        This topic <em>is</em> machine learning, so treat it as the place where your existing
        intuitions get their computer-vision vocabulary. The useful thing to extract is not the
        architectures but the two evaluation ideas — IoU and average precision — because those are
        what make detection results comparable at all, and they are the parts most people fumble in
        an exam.
      </WhyCare>

      <Section
        id="nn"
        n={1}
        title="Nearest neighbour, and why it fails"
        lead="Memorise every training image; at test time return the label of the most similar one."
      >
        <Figure caption="The decision regions are whatever the data carves out. Nothing is learned at training time; all the work is at test time.">
          <NearestNeighbourLab />
        </Figure>

        <Worked
          title="Classify a test point"
          source="Sheet 8 · Exercise 3"
          question={
            <>
              Training data: <T>{'(1,1)'}</T> cat, <T>{'(2,1)'}</T> cat, <T>{'(5,4)'}</T> dog,{' '}
              <T>{'(6,5)'}</T> dog, <T>{'(1,5)'}</T> toaster. Test point{' '}
              <T>{'\\mathbf x = (3,2)'}</T>. Compute all distances, name the nearest neighbour and
              the prediction, and state the complexity.
            </>
          }
          steps={[
            {
              label: 'Euclidean distances',
              body: (
                <div className="mt-1 font-mono text-[13px] leading-relaxed">
                  (1,1): √((3−1)² + (2−1)²) = √5 ≈ 2.236 <br />
                  (2,1): √(1 + 1) = √2 ≈ 1.414 <br />
                  (5,4): √(4 + 4) = √8 ≈ 2.828 <br />
                  (6,5): √(9 + 9) = √18 ≈ 4.243 <br />
                  (1,5): √(4 + 9) = √13 ≈ 3.606
                </div>
              ),
            },
            {
              label: 'Nearest neighbour',
              body: (
                <>
                  <T>{'(2,1)'}</T>, at distance <T>{'\\sqrt2 \\approx 1.414'}</T>.
                </>
              ),
            },
            {
              label: 'Prediction',
              body: (
                <>
                  Its label: <strong>cat</strong>.
                </>
              ),
            },
            {
              label: 'Complexity',
              body: (
                <>
                  <strong>
                    Training <T>{'O(1)'}</T>
                  </strong>{' '}
                  — just store the data, nothing is computed.{' '}
                  <strong>
                    Testing <T>{'O(MN)'}</T>
                  </strong>{' '}
                  — each of the <T>{'M'}</T> test images must be compared against all <T>{'N'}</T>{' '}
                  training images.
                </>
              ),
            },
          ]}
          answer={
            <>
              Nearest neighbour is <T>{'(2,1)'}</T> at distance <T>{'\\sqrt2'}</T>; predicted class{' '}
              <strong>cat</strong>. Training <T>{'O(1)'}</T>, testing <T>{'O(MN)'}</T>.
            </>
          }
        />

        <Pitfall title="The complexity is backwards">
          &ldquo;Slow training is OK; <em>fast testing is necessary</em>.&rdquo; You train once,
          offline, on a cluster. You then run inference millions of times, often on a phone, often
          with a latency budget. Nearest neighbour has exactly the wrong profile: free training, and
          test cost that grows with the size of the training set — so making the model better by
          adding data makes it slower.
        </Pitfall>

        <Concept
          title="The curse of dimensionality"
          intuition={
            <>
              A <T>{'32\\times32\\times3'}</T> image is a point in <T>{'\\mathbb R^{3072}'}</T>. To
              have a near neighbour in <em>every</em> direction you need data exponential in the
              dimension — so in practice every point is far from every other, and
              &ldquo;nearest&rdquo; stops meaning &ldquo;similar&rdquo;.
            </>
          }
        >
          <p>
            There is a second, more damning problem: <T>{'L_2'}</T> distance on raw pixels is not a
            perceptual distance. Shifting an image by two pixels, or brightening it slightly,
            changes the distance far more than replacing the cat with a dog of the same colour. The
            representation, not the classifier, is what is broken.
          </p>
        </Concept>
      </Section>

      <Section
        id="linear"
        n={2}
        title="The linear classifier"
        lead="Store one hyperplane per class instead of every image, and the test cost stops depending on the training-set size."
      >
        <FormulaCard name="The score function" note="x ∈ ℝ^D, W ∈ ℝ^{C×D}, b ∈ ℝ^C, s ∈ ℝ^C.">
          <Tex>{'\\mathbf s = f(\\mathbf x, W, \\mathbf b) = W\\mathbf x + \\mathbf b'}</Tex>
        </FormulaCard>

        <KeyList
          title="Three ways to read the same equation"
          items={[
            {
              k: 'Algebraic',
              v: 'Each class score is a dot product of the image with one row of W, plus a bias.',
            },
            {
              k: 'Geometric',
              v: 'Each row of W defines a hyperplane; the score is proportional to the signed distance from it. The classifier carves the space into C regions with linear boundaries.',
            },
            {
              k: 'Visual',
              v: 'Each row of W is a template for its class. The dot product is template matching, so the row reshaped into an image looks like a blurry average of that class.',
            },
          ]}
        />

        <Figure caption="The exercise's own W, b and x. Drag the input and watch the scores, the prediction and the two losses move.">
          <LinearClassifierLab />
        </Figure>

        <Worked
          title="Compute the class scores"
          source="Sheet 8 · Exercise 4"
          question={
            <>
              With <T>{'\\mathbf x = (2,1)^{\\mathsf T}'}</T>,{' '}
              <T>{'W = \\begin{pmatrix}1&0\\\\0&2\\\\-1&1\\end{pmatrix}'}</T> and{' '}
              <T>{'\\mathbf b = (0,-1,2)^{\\mathsf T}'}</T>, where the rows of <T>{'W'}</T> are cat,
              dog, toaster — compute <T>{'\\mathbf s'}</T> and the prediction.
            </>
          }
          steps={[
            {
              label: 'Row 1 — cat',
              body: <Tex>{'s_1 = 1\\cdot 2 + 0\\cdot 1 + 0 = 2'}</Tex>,
            },
            {
              label: 'Row 2 — dog',
              body: <Tex>{'s_2 = 0\\cdot 2 + 2\\cdot 1 + (-1) = 2 - 1 = 1'}</Tex>,
            },
            {
              label: 'Row 3 — toaster',
              body: <Tex>{'s_3 = (-1)\\cdot 2 + 1\\cdot 1 + 2 = -2 + 1 + 2 = 1'}</Tex>,
            },
            {
              label: 'Take the largest',
              body: (
                <>
                  <T>{'\\mathbf s = (2, 1, 1)^{\\mathsf T}'}</T>, so the maximum is the first
                  component.
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'\\mathbf s = (2,1,1)^{\\mathsf T}'}</T>; predicted class <strong>cat</strong>.
              (Note dog and toaster tie at 1 — the runner-up is ambiguous, which is exactly what the
              hinge loss&rsquo;s margin term is designed to punish.)
            </>
          }
        />

        <Rule tag="Nearest neighbour vs linear — the comparison the exercise asks for">
          <strong>Nearest neighbour</strong> is non-parametric: it stores <em>every</em> training
          image, does no work at training time, and at test time searches all of them —{' '}
          <T>{'O(1)'}</T> train, <T>{'O(MN)'}</T> test. Its decision boundary is arbitrarily
          complex, shaped entirely by the data.
          <br />
          <br />
          <strong>Linear</strong> is parametric: it stores only <T>{'W'}</T> and{' '}
          <T>{'\\mathbf b'}</T>, discards the training data afterwards, and at test time does one
          matrix–vector product — expensive training, <T>{'O(1)'}</T> test, independent of{' '}
          <T>{'N'}</T>. The price is that its boundary is a hyperplane, so it cannot represent a
          class that is not linearly separable in the given features.
        </Rule>
      </Section>

      <Section
        id="loss"
        n={3}
        title="Losses and optimisation"
        lead="The scores are only useful once you can say how wrong they are."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormulaCard
            name="Softmax (cross-entropy)"
            note="Interprets the scores as unnormalised log-probabilities."
          >
            <Tex>{'L_i = -\\log\\left(\\frac{e^{s_{y_i}}}{\\sum_j e^{s_j}}\\right)'}</Tex>
          </FormulaCard>
          <FormulaCard
            name="Multiclass SVM (hinge)"
            note="Wants the correct score to lead by a margin of 1."
          >
            <Tex>{'L_i = \\sum_{j \\neq y_i}\\max\\big(0, \\; s_j - s_{y_i} + 1\\big)'}</Tex>
          </FormulaCard>
        </div>

        <FormulaCard name="Full objective">
          <Tex>{'L = \\frac1N \\sum_{i=1}^{N} L_i + \\lambda R(W)'}</Tex>
        </FormulaCard>

        <Concept
          title="How the two losses differ in behaviour"
          intuition={
            <>
              The hinge loss is <em>satisfiable</em>: once the correct class leads by 1, the loss is
              exactly zero and that example stops producing gradient. The softmax loss is never
              satisfied — it always wants more confidence.
            </>
          }
        >
          <p>
            Practical consequence: with hinge, training focuses entirely on the examples near the
            boundary (the support vectors). With softmax, easy examples keep contributing small
            gradients forever, which is one motivation for focal loss in heavily imbalanced
            detection problems.
          </p>
        </Concept>

        <Rule tag="Stochastic gradient descent">
          <Tex>{'\\nabla_W L = \\frac1N\\sum_{i=1}^{N}\\nabla_W L_i + \\lambda\\nabla_W R(W)'}</Tex>
          The full sum is expensive when <T>{'N'}</T> is large, so it is approximated on a{' '}
          <em>minibatch</em> — 32, 64 or 128 examples are common — and the parameters are updated
          after each one.
        </Rule>
      </Section>

      <Section
        id="bow"
        n={4}
        title="Bag of words"
        lead="The bridge between hand-designed features and learned ones — and the answer to “how do I classify a variable-size set of features?”"
      >
        <Concept
          title="The problem it solves"
          intuition={
            <>
              A classifier needs a fixed-size input vector. SIFT gives you a{' '}
              <em>variable number</em> of 128-dimensional descriptors per image — a hundred here, a
              thousand there. You cannot feed that to a linear classifier.
            </>
          }
        >
          <p>
            The fix: build a fixed-size <em>histogram</em> of how often each kind of feature occurs,
            against a shared dictionary of feature types. The image becomes a bag of visual words,
            and the word counts are the fixed-size vector.
          </p>
        </Concept>

        <Rule tag="The three stages">
          <ol className="mt-1 list-decimal space-y-1.5 pl-5">
            <li>
              <strong>Dictionary learning.</strong> Extract features (e.g. SIFT) from many images,
              then cluster them — typically <T>{'k'}</T>-means. Each cluster centre is a{' '}
              <em>visual word</em>.
            </li>
            <li>
              <strong>Encode.</strong> For a new image: quantise each of its features to the nearest
              cluster centre, then histogram the word occurrences. Result: one fixed-length vector
              per image.
            </li>
            <li>
              <strong>Classify.</strong> Train any standard classifier on those vectors —{' '}
              <T>{'k'}</T>-NN, SVM, naive Bayes.
            </li>
          </ol>
        </Rule>

        <Aside title="What the 'bag' buys and costs">
          Treating an image as an unordered bag of parts means the representation is unchanged by
          where the parts are — so it handles occlusion gracefully (you lose some words, not the
          whole image) and inherits scale and rotation invariance from SIFT. The cost is that all
          spatial layout is discarded: a face and its scrambled parts give the same histogram.
          Spatial pyramids re-introduce coarse layout by histogramming over a grid of regions.
        </Aside>
      </Section>

      <Section
        id="cnn"
        n={5}
        title="Convolutional networks"
        lead="Stop designing the features. Learn the filters and the classifier together, end to end."
      >
        <Concept
          title="Why convolutional rather than fully connected"
          intuition={
            <>
              A fully connected layer on a <T>{'32\\times32\\times3'}</T> image flattens it to 3072
              numbers and multiplies by a <T>{'10\\times3072'}</T> matrix — throwing away the fact
              that neighbouring pixels are related, and learning a separate weight for every
              position.
            </>
          }
        >
          <p>
            A convolutional layer instead slides a small filter (say <T>{'5\\times5\\times3'}</T>)
            over every spatial location, producing an activation map. Two consequences:{' '}
            <strong>weight sharing</strong> (the same filter everywhere, so far fewer parameters)
            and <strong>translation equivariance</strong> (shift the input, the activation map
            shifts too). These are exactly the assumptions topic 3 established about images — this
            is the linear shift-invariant operator, with learned weights.
          </p>
        </Concept>

        <KeyList
          title="The standard components"
          items={[
            {
              k: 'Convolution',
              v: 'A bank of learned filters, applied at every spatial location. Depth of the output = number of filters.',
            },
            {
              k: 'Activation',
              v: 'ReLU, leaky ReLU, ELU, sigmoid, tanh, maxout. Without a nonlinearity, stacked convolutions collapse to a single convolution.',
            },
            {
              k: 'Pooling',
              v: 'Reduce spatial resolution. Max pooling with 2×2 filters and stride 2 keeps the largest value in each block — it adds small-shift invariance and enlarges the receptive field.',
            },
            {
              k: 'Fully connected head',
              v: 'The final classifier on the flattened feature map.',
            },
          ]}
        />

        <Deeper label="The architectures worth being able to name">
          <KeyList
            items={[
              {
                k: 'AlexNet (2012)',
                v: '8 layers, ReLUs, dropout, data augmentation, trained on two GPUs. Channels increase with depth while spatial resolution decreases. Triggered the deep-learning era by winning ImageNet decisively.',
              },
              {
                k: 'VGG (2015)',
                v: '3×3 convolutions everywhere. Three stacked 3×3 layers have the same receptive field as one 7×7 but with fewer parameters and two extra nonlinearities. 16 and 19 layer variants. Showed depth matters.',
              },
              {
                k: 'GoogLeNet / Inception (2015)',
                v: '22 layers. Inception modules combine convolutions and pooling of several filter sizes in parallel. Auxiliary classification heads improve gradient flow; global average pooling replaces the fully connected layers, giving 12× fewer parameters than VGG-16.',
              },
              {
                k: 'ResNet (2016)',
                v: 'Residual (skip) connections make very deep networks trainable — up to 152 layers. Simple regular structure of 3×3 convolutions with strided downsampling. Still the default backbone.',
              },
            ]}
          />
        </Deeper>

        <Aside title="The connection back to topic 4">
          The first layer of a trained CNN reliably learns oriented edge detectors and
          centre-surround blobs — the Gabor-like and Laplacian-like filters you designed by hand.
          That is a genuine result, not a story: these operations are the right first step for
          natural images, and gradient descent rediscovers them. What the network adds is everything{' '}
          <em>after</em> the first layer, which nobody managed to design by hand.
        </Aside>
      </Section>

      <Section
        id="seg"
        n={6}
        title="Semantic segmentation"
        lead="A class label for every pixel. The whole problem is getting the resolution back."
      >
        <KeyList
          title="Three designs, in order of how the lecture develops them"
          items={[
            {
              k: 'Sliding window',
              v: 'Extract a patch around each pixel, classify its centre with a CNN. Correct but hopelessly inefficient — overlapping patches recompute the same features thousands of times.',
            },
            {
              k: 'Fully convolutional, full resolution',
              v: 'Only convolutional layers, no downsampling, predict all pixels at once. Efficient in the sense of sharing computation, but very expensive: every layer runs at full resolution, and the receptive field grows only slowly with depth.',
            },
            {
              k: 'Encoder–decoder',
              v: 'Downsample to a low-resolution, high-channel bottleneck (cheap, large receptive field), then upsample back to full resolution. This is the design everything uses.',
            },
          ]}
        />

        <Concept
          title="How you upsample"
          intuition={
            <>
              Downsampling is easy; putting the resolution back is the interesting part, and there
              are four standard answers.
            </>
          }
        >
          <KeyList
            items={[
              {
                k: 'Nearest neighbour / bilinear',
                v: 'Plain interpolation. No parameters, no learning.',
              },
              {
                k: 'Bed of nails',
                v: 'Insert values at sparse (usually top-left) positions and zeros elsewhere, then convolve.',
              },
              {
                k: 'Max unpooling',
                v: 'Remember which element was the maximum during pooling and put the value back exactly there. Requires paired down/upsampling layers — this is SegNet.',
              },
              {
                k: 'Transposed convolution',
                v: 'Learnable upsampling: each input value weights a copy of the filter written into the output, and the stride sets the ratio between output and input movement. Equivalently, multiply by the transpose of the matrix that expresses the corresponding convolution.',
              },
            ]}
          />
        </Concept>

        <Rule tag="Skip connections — the U-Net idea">
          Downsampling destroys fine spatial detail, which no amount of upsampling can invent. So
          copy the high-resolution activations from the encoder across to the matching decoder
          stage. The decoder then has both the <em>semantics</em> from the bottleneck (what is
          this?) and the <em>localisation</em> from the skip (where exactly is the boundary?). This
          is why U-Net works so well on small datasets, and why it remains the default for
          biomedical segmentation — and, incidentally, the backbone of image-to-image models
          generally.
        </Rule>
      </Section>

      <Section
        id="det"
        n={7}
        title="Object detection"
        lead="Where and what, for an unknown number of objects. The evaluation is as important as the method."
      >
        <Concept
          title="Why detection is harder than classification"
          intuition={
            <>
              Classification has a fixed output size. Detection does not — the number of objects is
              not known in advance, so the network cannot simply have <T>{'k'}</T> output slots.
            </>
          }
        >
          <KeyList
            items={[
              {
                k: 'Precise localisation',
                v: 'A box is right or wrong by a threshold, so small errors matter.',
              },
              {
                k: 'Pose variation',
                v: 'Much larger impact than in classification, since it changes the box shape too.',
              },
              { k: 'Occlusion', v: 'Makes localisation difficult even when recognition succeeds.' },
              {
                k: 'Counting',
                v: 'Several instances of the same class must be separated, not merged.',
              },
              {
                k: 'Scale',
                v: 'Objects span orders of magnitude in size; small objects are systematically hard.',
              },
            ]}
          />
        </Concept>

        <Rule tag="Single object: two heads, one loss">
          Classification + localisation is solvable directly: share a backbone, then attach a
          classification head (softmax loss over classes) and a <em>regression</em> head predicting{' '}
          <T>{'(x, y, w, h)'}</T> with an <T>{'L_2'}</T> loss. Train with the weighted sum — a{' '}
          <strong>multitask loss</strong>. This only works because there is exactly one object.
        </Rule>

        <Figure caption="Drag the predicted box. IoU is the overlap divided by the total area covered; above 0.5 the detection counts as a hit.">
          <IoULab />
        </Figure>

        <Concept
          title="Evaluation: IoU, precision, recall, AP"
          intuition={
            <>
              You cannot report &ldquo;accuracy&rdquo; for a detector, because the number of
              detections it produces depends on a threshold you chose. The metric has to be
              threshold-free.
            </>
          }
        >
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <strong>Match detections to ground truth.</strong> Each detection is matched to the
              ground-truth box with the highest IoU. If <T>{'\\mathrm{IoU} > 0.5'}</T>, mark it
              correct. If several detections map to the same ground truth, only one counts as
              correct — the rest are false positives.
            </li>
            <li>
              <strong>Precision</strong> = correct detections / total detections.{' '}
              <strong>Recall</strong> = ground-truth objects matched / total ground-truth objects.
            </li>
            <li>
              <strong>Sweep the score threshold</strong> to trace a precision–recall curve. Low
              threshold: many detections, high recall, low precision. High threshold: the reverse.
            </li>
            <li>
              <strong>Average precision</strong> summarises the curve as one number, so the
              threshold drops out. <strong>mAP</strong> averages AP across categories. COCO-style AP
              additionally averages over several IoU thresholds, to reward better localisation —
              still confusingly called &ldquo;average precision&rdquo;.
            </li>
          </ol>
        </Concept>

        <Figure caption="Move the threshold and watch precision and recall trade against each other. Neither number alone describes the detector.">
          <PrecisionRecallLab />
        </Figure>

        <Aside title="Which side of the trade-off you want depends on the application">
          Detecting cancer cells in tissue: you need <strong>high recall</strong> — missing one is
          far worse than a false alarm a pathologist discards. Detecting edible mushrooms in a
          forest: you need <strong>high precision</strong> — a missed mushroom costs nothing, a
          false positive could kill someone. The metric cannot tell you which; only the task can.
        </Aside>

        <Deeper label="The R-CNN family, and why each version exists">
          <KeyList
            items={[
              {
                k: 'Scanning window',
                v: 'A fixed-size window at a fixed stride, run over an image pyramid to handle scale. Must classify millions of boxes, so it must be very fast, and still misses outlier aspect ratios.',
              },
              {
                k: 'R-CNN (2014)',
                v: 'Generate ~2000 region proposals (selective search), warp each, run a CNN on each. Big accuracy jump (54.2% vs 41.7% mAP on VOC 2007). But ~2000 full network evaluations per image, no feature sharing, and slow proposals.',
              },
              {
                k: 'Fast R-CNN (2015)',
                v: 'Run the CNN once on the whole image, then crop features per region with RoI pooling. 9× faster training, 146× faster testing at equal accuracy. The bottleneck moves to proposal generation (~1 s/image).',
              },
              {
                k: 'Faster R-CNN (2015)',
                v: 'Replace selective search with a learned Region Proposal Network sharing the backbone. A two-stage detector: stage one runs once per image (backbone + RPN), stage two once per region (RoI pool, classify, refine the box).',
              },
              {
                k: 'YOLO / SSD (2016)',
                v: 'Single stage — predict boxes directly from the feature map, no proposals. Faster, historically somewhat less accurate.',
              },
              {
                k: 'Mask R-CNN (2017)',
                v: 'Faster R-CNN plus a per-detection binary mask head → instance segmentation. Evaluated with IoU at the mask level, not the box level.',
              },
            ]}
          />
          <p className="mt-3">
            <strong>Non-maximum suppression</strong> appears in all of them as a separate, heuristic
            post-processing step: sort detections by score, and delete any that overlaps too much
            with a higher-scoring one. Without it, one object yields a cluster of near-duplicate
            boxes.
          </p>
        </Deeper>

        <Rule tag="The four recognition tasks">
          <strong>Classification</strong> — a label, no spatial extent.{' '}
          <strong>Semantic segmentation</strong> — a label per pixel, no object instances (two
          adjacent dogs are one &ldquo;dog&rdquo; region). <strong>Object detection</strong> — a box
          and a label per instance. <strong>Instance segmentation</strong> — a pixel mask and a
          label per instance. Being able to state these four cleanly, and what each one cannot
          express, is a standard exam question.
        </Rule>
      </Section>
    </>
  )
}

export const drills: DrillSpec[] = [
  {
    id: 'rec-d1',
    topicId: 'recognition',
    source: 'Sheet 8 · Ex 3',
    kind: 'compute',
    prompt: (
      <>
        Training set: <T>{'(1,1)'}</T> cat, <T>{'(2,1)'}</T> cat, <T>{'(5,4)'}</T> dog,{' '}
        <T>{'(6,5)'}</T> dog, <T>{'(1,5)'}</T> toaster. Classify <T>{'\\mathbf x = (3,2)'}</T> by
        nearest neighbour, and give the training and testing complexity.
      </>
    ),
    answer: (
      <>
        Distances: <T>{'\\sqrt5 \\approx 2.236'}</T>, <T>{'\\sqrt2 \\approx 1.414'}</T>,{' '}
        <T>{'\\sqrt8 \\approx 2.828'}</T>, <T>{'\\sqrt{18} \\approx 4.243'}</T>,{' '}
        <T>{'\\sqrt{13} \\approx 3.606'}</T>.
        <br />
        <br />
        Nearest neighbour: <T>{'(2,1)'}</T>. Predicted class: <strong>cat</strong>.
        <br />
        <br />
        Complexity:{' '}
        <strong>
          training <T>{'O(1)'}</T>
        </strong>{' '}
        (just store the data),{' '}
        <strong>
          testing <T>{'O(MN)'}</T>
        </strong>{' '}
        for <T>{'M'}</T> test and <T>{'N'}</T> training images. This is exactly backwards from what
        deployment needs — you train once but infer constantly, so fast testing matters far more
        than fast training.
      </>
    ),
  },
  {
    id: 'rec-d2',
    topicId: 'recognition',
    source: 'Sheet 8 · Ex 4.1–4.2',
    kind: 'compute',
    prompt: (
      <>
        With <T>{'\\mathbf x = (2,1)^{\\mathsf T}'}</T>,{' '}
        <T>{'W = \\begin{pmatrix}1&0\\\\0&2\\\\-1&1\\end{pmatrix}'}</T>,{' '}
        <T>{'\\mathbf b = (0,-1,2)^{\\mathsf T}'}</T> (rows = cat, dog, toaster), compute{' '}
        <T>{'\\mathbf s'}</T> and the predicted class.
      </>
    ),
    answer: (
      <>
        <Tex>
          {
            '\\mathbf s = W\\mathbf x + \\mathbf b = \\begin{pmatrix}1\\cdot2+0\\cdot1\\\\0\\cdot2+2\\cdot1\\\\-1\\cdot2+1\\cdot1\\end{pmatrix} + \\begin{pmatrix}0\\\\-1\\\\2\\end{pmatrix} = \\begin{pmatrix}2\\\\2\\\\-1\\end{pmatrix} + \\begin{pmatrix}0\\\\-1\\\\2\\end{pmatrix} = \\begin{pmatrix}2\\\\1\\\\1\\end{pmatrix}'
          }
        </Tex>
        The highest score is <T>{'s_{\\text{cat}} = 2'}</T>, so the prediction is{' '}
        <strong>cat</strong>. (Dog and toaster tie at 1.)
      </>
    ),
  },
  {
    id: 'rec-d3',
    topicId: 'recognition',
    source: 'Sheet 8 · Ex 4.3–4.4',
    kind: 'explain',
    prompt: (
      <>
        Explain the difference between a nearest-neighbour and a linear classifier, and why fast
        testing usually matters more than fast training.
      </>
    ),
    answer: (
      <>
        <strong>Nearest neighbour</strong> is non-parametric: it stores every training image and
        does no work at training time; at test time it searches all of them. <T>{'O(1)'}</T> train,{' '}
        <T>{'O(MN)'}</T> test, and memory grows with the dataset. Its decision boundary is
        arbitrarily complex, determined entirely by the data.
        <br />
        <br />
        <strong>Linear</strong> is parametric: it learns <T>{'W'}</T> and <T>{'\\mathbf b'}</T> —
        one hyperplane (equivalently, one template) per class — then discards the training data.
        Test time is a single matrix–vector product, independent of <T>{'N'}</T>. The price is that
        the boundary is linear, so classes not linearly separable in the given features cannot be
        represented.
        <br />
        <br />
        <strong>Why testing dominates:</strong> training happens once, offline, where you can afford
        a cluster and days of compute. Inference happens millions of times, often on-device, often
        under a latency budget. Nearest neighbour has the worst possible profile here: improving the
        model by adding data makes every prediction slower.
      </>
    ),
  },
  {
    id: 'rec-d4',
    topicId: 'recognition',
    source: 'L11 · detection metrics',
    kind: 'explain',
    prompt: (
      <>
        How are detections matched to ground truth, and why is average precision reported rather
        than a single precision or recall?
      </>
    ),
    answer: (
      <>
        <strong>Matching:</strong> each detection is matched to the ground-truth box with the
        highest IoU. If <T>{'\\mathrm{IoU} > 0.5'}</T> it is marked correct. If several detections
        map to the same ground-truth object, only one may count as correct; the others are false
        positives.
        <br />
        <br />
        <strong>Then:</strong> precision = correct detections / total detections; recall = matched
        ground truths / total ground truths.
        <br />
        <br />
        <strong>Why AP:</strong> a detector outputs scores, so the number of detections depends
        entirely on the threshold you pick — lower it and recall rises while precision falls. A
        single precision or recall value therefore says as much about your threshold choice as about
        the detector. Sweeping the threshold traces a precision–recall curve, and{' '}
        <strong>average precision</strong> summarises that whole curve in one threshold-independent
        number. mAP averages AP over categories; COCO-style AP additionally averages over several
        IoU thresholds, so better localisation is rewarded.
      </>
    ),
  },
  {
    id: 'rec-d5',
    topicId: 'recognition',
    source: 'L11 · segmentation',
    kind: 'explain',
    prompt: (
      <>
        Why is the sliding-window approach to semantic segmentation inefficient, and what replaced
        it?
      </>
    ),
    answer: (
      <>
        <strong>The inefficiency:</strong> you extract a patch around every pixel and classify its
        centre. Neighbouring patches overlap almost entirely, so the same convolutional features are
        recomputed thousands of times. Cost scales with the number of pixels times the cost of a
        full forward pass.
        <br />
        <br />
        <strong>What replaced it:</strong> a <em>fully convolutional</em> network that predicts all
        pixels in one pass, so overlapping computation is shared by construction. Running it at full
        resolution throughout is still expensive and gives a slowly growing receptive field, so the
        standard design is an <strong>encoder–decoder</strong>: downsample to a low-resolution,
        high-channel bottleneck (cheap, large receptive field), then upsample back — with bilinear
        interpolation, max unpooling, or learned transposed convolutions.
        <br />
        <br />
        Add <strong>skip connections</strong> (U-Net) so the decoder also sees the high-resolution
        encoder activations: downsampling destroys fine boundary detail that upsampling cannot
        invent, and the skip supplies it.
      </>
    ),
  },
  {
    id: 'rec-d6',
    topicId: 'recognition',
    source: 'L11 · tasks',
    kind: 'choose',
    prompt: (
      <>
        Two dogs stand side by side, touching. Which task distinguishes them as two separate things,
        at pixel level?
      </>
    ),
    options: [
      'Classification',
      'Semantic segmentation',
      'Object detection',
      'Instance segmentation',
    ],
    correct: 3,
    answer: (
      <>
        <strong>Instance segmentation.</strong> It assigns both a semantic label and an instance
        label to every pixel, so the two dogs are separate masks.
        <br />
        <br />
        The others fall short in specific ways: <em>classification</em> outputs one label with no
        spatial extent. <em>Semantic segmentation</em> labels every pixel &ldquo;dog&rdquo; but has
        no notion of instances, so the two merge into one region. <em>Object detection</em>{' '}
        separates the instances but only as bounding boxes, which overlap and do not follow the
        outlines. Mask R-CNN is the standard instance-segmentation method — Faster R-CNN plus a
        per-detection binary mask head, evaluated with IoU at the mask level.
      </>
    ),
  },
]
