import type { Topic } from './types'

import * as math from './t00-math'
import * as orientation from './t01-orientation'
import * as images from './t02-images'
import * as filtering from './t03-filtering'
import * as features from './t04-features'
import * as camera from './t05-camera'
import * as epipolar from './t06-epipolar'
import * as sfm from './t07-sfm'
import * as stereo from './t08-stereo'
import * as globalStereo from './t09-global-stereo'
import * as surfaces from './t10-surfaces'
import * as recognition from './t11-recognition'
import * as neural from './t12-neural'

const modules = [
  math,
  orientation,
  images,
  filtering,
  features,
  camera,
  epipolar,
  sfm,
  stereo,
  globalStereo,
  surfaces,
  recognition,
  neural,
]

export const TOPICS: Topic[] = modules
  .map((m) => ({ ...m.meta, Body: m.Body, drills: m.drills }))
  .sort((a, b) => a.n - b.n)

export const TOPIC_BY_ID = new Map(TOPICS.map((t) => [t.id, t]))

export const ALL_DRILLS = TOPICS.flatMap((t) => t.drills)

export const TOTAL_MINUTES = TOPICS.reduce((s, t) => s + t.minutes, 0)
