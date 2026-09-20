import { T } from '@/components/ui/tex'
import {
  Aside,
  BigIdea,
  Concept,
  Figure,
  KeyList,
  Rule,
  Section,
  WhyCare,
} from '@/components/learn/primitives'
import { PipelineMap } from '@/components/viz/pipeline'
import type { DrillSpec } from '@/components/learn/drill'
import type { TopicMeta } from './types'

export const meta: TopicMeta = {
  id: 'orientation',
  n: 1,
  title: 'What computer vision is trying to do',
  kicker:
    'Graphics goes 3D → image. Vision goes image → 3D, and that direction is not invertible. Everything else is a consequence.',
  lectures: ['L01 Intro', 'L01 Organization'],
  exercises: [],
  minutes: 15,
  sections: [
    { id: 'inverse', title: 'Vision is graphics, run backwards' },
    { id: 'illposed', title: 'Why that makes it ill-posed' },
    { id: 'map', title: 'The map of the course' },
  ],
  sheet: [
    {
      name: 'Vision vs graphics',
      tex: '\\text{graphics: scene} \\to \\text{image}, \\qquad \\text{vision: image} \\to \\text{scene}',
      note: 'The second direction loses information and is not invertible.',
    },
  ],
}

export function Body() {
  return (
    <>
      <BigIdea oneLiner="A camera flattens a 3D world onto a 2D grid. Computer vision is the attempt to un-flatten it — knowing that the flattening destroyed information you will never get back.">
        <p>
          Hold that sentence. Every method in this course is a strategy for coping with the missing
          information: use a second camera, use many cameras, use smoothness, use learned priors.
          Once you can name <em>which</em> strategy a method is using, the method stops being a wall
          of formulas.
        </p>
      </BigIdea>

      <WhyCare>
        You already know the machine-learning framing of this: it is an inverse problem with a
        non-injective forward model, so it needs regularisation. Smoothness priors, MRFs, learned
        matching costs and NeRF are four different regularisers for the same underdetermined
        problem. If you keep that frame, the second half of the course is one idea repeated with
        better tools.
      </WhyCare>

      <Section
        id="inverse"
        n={1}
        title="Vision is graphics, run backwards"
        lead="The textbook definition, and the one picture that organises it."
      >
        <Concept
          intuition={
            <>
              Graphics has it easy: you are <em>given</em> the objects, poses, shapes, motions,
              materials and lights, and asked to produce the image. Vision is handed the image and
              asked for everything else.
            </>
          }
        >
          <p>
            The lecture&rsquo;s working definition, after Pascal Fua: computer vision is the branch
            of computer science whose goal is to <em>model the real world</em> or to{' '}
            <em>recognise objects</em> from digital images — captured by ordinary cameras, video,
            infrared, radar or medical sensors.
          </p>
          <p className="mt-3">
            Notice that this is two goals, not one. &ldquo;Model the real world&rdquo; is the
            geometry half of the course (topics 05–12). &ldquo;Recognise objects&rdquo; is the
            recognition half (topic 11). They share the front end — pixels, filters, features — and
            then part ways.
          </p>
        </Concept>

        <KeyList
          title="What the camera is, formally"
          items={[
            {
              k: 'A projection ℝ³ → ℝ²',
              v: 'Nonlinear (it divides by depth) and generally not invertible.',
            },
            {
              k: 'An object in the scene',
              v: 'It has its own 3D position, 3D orientation, focal length and pixel size. Those are things you have to estimate too.',
            },
            {
              k: 'A sampler',
              v: 'It quantises both coordinates (the sensor grid) and intensities (the A/D conversion).',
            },
          ]}
        />

        <Aside title="The plenoptic function">
          All the light in a scene can be described by a function of position, direction, wavelength
          and time. A photograph is a tiny 2D slice of it. That framing becomes literal again in the
          last topic, where NeRF learns a function of position and direction and renders slices out
          of it.
        </Aside>
      </Section>

      <Section
        id="illposed"
        n={2}
        title="Why that makes it ill-posed"
        lead="Four statements from the lecture that are worth being able to recite."
      >
        <Rule tag="The core four">
          <ol className="mt-1 list-decimal space-y-1.5 pl-5">
            <li>Vision is an inverse problem.</li>
            <li>
              The projection is nonlinear and not invertible — information about the scene is lost.
            </li>
            <li>The same image could come from many different scenes.</li>
            <li>The same scene can produce many different images.</li>
          </ol>
        </Rule>

        <Concept
          title="Points 3 and 4 are different failures"
          intuition={
            <>
              Point 3 is <em>ambiguity</em>: a small nearby object and a large distant one project
              identically, so the image underdetermines the scene. Point 4 is{' '}
              <em>nuisance variation</em>: viewpoint, illumination, occlusion and deformation all
              change the pixels without changing the thing you care about.
            </>
          }
        >
          <p>
            Geometry attacks point 3, by adding constraints (more views, known baselines, epipolar
            geometry). Recognition attacks point 4, by learning representations that are invariant
            to the nuisance. That is the cleanest way to remember which half of the course a method
            belongs to.
          </p>
        </Concept>

        <Aside title="Perception is more than measuring light">
          The lecture&rsquo;s visual illusions make the point that even a perfect light meter would
          not see: the same measured intensity is read as different brightness depending on context.
          Any system that maps pixels straight to meaning is making assumptions — the only question
          is whether they are explicit (a prior you wrote) or implicit (a prior your training data
          contained).
        </Aside>
      </Section>

      <Section
        id="map"
        n={3}
        title="The map of the course"
        lead="Where every later topic sits, and what each one adds."
      >
        <Figure caption="The 3D reconstruction pipeline. Lectures 5 through 13 are, almost without exception, one box in this chain.">
          <PipelineMap />
        </Figure>

        <KeyList
          title="How the chapters chain together"
          items={[
            {
              k: 'Single view',
              v: '3D point + projection matrix → image point. One image is never enough to invert this.',
            },
            {
              k: 'Two views',
              v: 'Corresponding point pairs → the relative orientation of the cameras (E and F), and then 3D points by triangulation.',
            },
            {
              k: 'Many views',
              v: 'Structure from motion solves for all cameras and all points at once, by minimising reprojection error.',
            },
            {
              k: 'Dense',
              v: 'Given poses, match every pixel rather than a few features. Rectify, then search along a scanline.',
            },
            {
              k: 'Surface',
              v: 'Fuse the depth maps, then turn a noisy point cloud into a watertight mesh.',
            },
            {
              k: 'Learned',
              v: 'Replace the matching cost, the depth solver, or the whole scene representation with something trained.',
            },
          ]}
        />

        <Aside title="A short history, for the oral exam">
          Stereo correlation (1957) → blocks world (1963) → shape from shading (1970) → marching
          cubes (1987) → factorisation SfM (1990) → graph-cut stereo and uncalibrated 3D (1998) →
          Middlebury benchmarks (2001) → city-scale SfM, &ldquo;Rome in a day&rdquo; (2009) → Kinect
          (2011) → the deep-learning era → NeRF (2020). The useful pattern: each wave was unlocked
          either by a new <em>optimisation</em> tool or by a new <em>benchmark</em>.
        </Aside>
      </Section>
    </>
  )
}

export const drills: DrillSpec[] = [
  {
    id: 'orient-d1',
    topicId: 'orientation',
    source: 'L01',
    kind: 'explain',
    prompt: (
      <>Explain what is meant by “computer vision is ill-posed”. Give two distinct reasons.</>
    ),
    answer: (
      <>
        It is an <em>inverse</em> problem: we are trying to undo the imaging process. Two reasons it
        cannot be undone cleanly:
        <br />
        <br />
        <strong>1. Information is destroyed.</strong> Perspective projection maps{' '}
        <T>{'\\mathbb R^3 \\to \\mathbb R^2'}</T>; it is nonlinear (division by depth) and not
        invertible. Every point on a viewing ray maps to the same pixel, so depth is gone.
        <br />
        <br />
        <strong>2. The mapping is many-to-many.</strong> The same image can be produced by many
        different scenes (a small near object vs a large far one), and the same scene produces many
        different images (viewpoint, illumination, occlusion). So even with the projection known,
        the solution is not unique.
      </>
    ),
  },
  {
    id: 'orient-d2',
    topicId: 'orientation',
    source: 'L01',
    kind: 'choose',
    prompt: <>Which statement correctly contrasts vision with graphics?</>,
    options: [
      'Graphics recovers scene information from images; vision produces images from scenes.',
      'Vision recovers scene information from images; graphics produces images from a described 3D scene.',
      'Both solve the same problem, but graphics is faster.',
      'Vision is a special case of graphics restricted to grayscale.',
    ],
    correct: 1,
    answer: (
      <>
        Graphics is the forward direction — given objects, poses, shapes, motions, materials and
        light, produce an image. Vision is the inverse — given images, recover information about the
        3D scene. The asymmetry matters: the forward direction is a well-defined function, the
        inverse is not.
      </>
    ),
  },
]
