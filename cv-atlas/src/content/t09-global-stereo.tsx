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
import { DPTable, DSIGrid, MRFLab } from '@/components/viz/global'
import type { DrillSpec } from '@/components/learn/drill'
import type { TopicMeta } from './types'

export const meta: TopicMeta = {
  id: 'global-stereo',
  n: 9,
  title: 'Global stereo: DSI, dynamic programming, MRFs',
  kicker:
    'Stop deciding each pixel on its own. Solve a whole scanline as a shortest path, or a whole image as an energy minimisation — and the ambiguities resolve themselves.',
  lectures: ['L08 (DSI, DP)', 'L09 (graphical models, MRF)'],
  exercises: ['Sheet 7, Ex 1–4'],
  minutes: 45,
  stage: 'depth',
  sections: [
    { id: 'idea', title: 'The basic idea' },
    { id: 'dsi', title: 'The disparity space image' },
    { id: 'dp', title: 'Dynamic programming' },
    { id: 'mrf', title: 'Markov random fields' },
    { id: 'energy', title: 'From probability to energy' },
    { id: 'solvers', title: 'Solving, and learned costs' },
  ],
  sheet: [
    {
      name: 'Disparity space image',
      tex: 'C(i,j) = \\text{match score for left pixel } i \\text{ with right pixel } j, \\quad d = i - j',
    },
    {
      name: 'Cox et al. DP recurrence',
      tex: 'C(i,j) = \\min\\begin{cases} C(i-1,j-1) + \\mathrm{diss}(i,j) \\\\ C(i-1,j) + c_{\\text{occ}} \\\\ C(i,j-1) + c_{\\text{occ}}\\end{cases}',
    },
    {
      name: 'MRF energy',
      tex: 'E(D) = \\sum_i \\psi_{\\text{data}}(d_i) + \\lambda\\sum_{i\\sim j}\\psi_{\\text{smooth}}(d_i, d_j)',
    },
    {
      name: 'Gibbs distribution',
      tex: 'p(D) \\propto \\exp\\{-E(D)\\}, \\qquad \\psi(\\cdot) := -\\log f(\\cdot)',
      note: 'So maximising p is minimising E.',
    },
    {
      name: 'Smoothness models',
      tex: "\\psi_{\\text{smooth}}(d,d') = [d \\neq d'] \\ \\text{(Potts)}, \\qquad \\min(|d-d'|, \\tau) \\ \\text{(truncated } \\ell_1)",
    },
  ],
}

export function Body() {
  return (
    <>
      <BigIdea oneLiner="Real depth is mostly smooth, with rare jumps at object boundaries. Build that single fact into the objective and the ambiguous pixels get their answer from their neighbours.">
        <p>
          Two ways to do it, and the exercise sheet covers both. Along a single scanline the problem
          has a chain structure, so dynamic programming finds the <em>exact</em> optimum in
          polynomial time. Over the whole 2D image the graph has loops, exact inference is
          intractable, and you settle for good approximations — graph cuts or belief propagation.
        </p>
      </BigIdea>

      <WhyCare>
        This is structured prediction, and it is the classical counterpart of a CRF head on a
        segmentation network. The output is not a label or a number but a whole image, the variables
        interact, and inference means optimising over an exponentially large space. The MRF is also{' '}
        &ldquo;interpretable by design&rdquo;: you can point at the data term and the smoothness
        term and say what each one believes — which is exactly what you cannot do with a black-box
        regressor.
      </WhyCare>

      <Section
        id="idea"
        n={1}
        title="The basic idea"
        lead="Two objectives that pull against each other, and one parameter that sets the balance."
      >
        <Concept
          intuition={
            <>
              Per-pixel matching optimises one thing: patch similarity. That is an{' '}
              <em>independent</em> objective at every pixel, and it has no way to express the fact
              that neighbouring pixels usually lie on the same surface.
            </>
          }
        >
          <KeyList
            items={[
              {
                k: 'Data term',
                v: 'For each pixel: how well does this disparity explain what I see? An independent objective per pixel.',
              },
              {
                k: 'Smoothness term',
                v: 'For each neighbouring pair: are their disparities similar? An objective over pairs of results.',
              },
              {
                k: 'The tension',
                v: 'A textureless pixel has a nearly flat data term, so smoothness decides it — correctly. A pixel at an object boundary has a sharp data term that must be allowed to overrule smoothness.',
              },
            ]}
          />
        </Concept>

        <Rule>
          Everything in this topic is a way of minimising{' '}
          <T>
            {
              'E(D) = \\sum_i \\psi_{\\text{data}}(d_i) + \\lambda \\sum_{i\\sim j}\\psi_{\\text{smooth}}(d_i, d_j)'
            }
          </T>
          . The methods differ only in the <em>graph</em> (a chain or a grid) and therefore in
          whether the minimum can be found exactly.
        </Rule>
      </Section>

      <Section
        id="dsi"
        n={2}
        title="The disparity space image"
        lead="Lay out every possible match between two scanlines as a 2D table, and a disparity assignment becomes a path through it."
      >
        <Concept
          intuition={
            <>
              Rows are pixels along the right scanline, columns are pixels along the left.{' '}
              <T>{'C(i,j)'}</T> is the match score between left pixel <T>{'i'}</T> and right pixel{' '}
              <T>{'j'}</T>, and the disparity of that cell is <T>{'d = i - j'}</T> — constant along
              each diagonal.
            </>
          }
        />

        <Figure caption="The DSI for a 6-pixel scanline. Cells outside 0 ≤ d ≤ 2 are struck out before matching starts. The six given matches form a staircase that never doubles back.">
          <DSIGrid />
        </Figure>

        <Worked
          title="Build the DSI and mark the invalid cells"
          source="Sheet 7 · Exercise 1"
          question={
            <>
              Left and right scanlines of 6 pixels, <T>{'d = i - j'}</T>, valid range{' '}
              <T>{'0 \\le d \\le 2'}</T>. Mark the invalid cells and compute the disparities of the
              matches <T>{'(1,1), (2,1), (3,2), (4,3), (5,3), (6,4)'}</T>.
            </>
          }
          steps={[
            {
              label: 'The two constraints',
              body: (
                <>
                  <T>{'d < 0'}</T> means <T>{'j > i'}</T> — the whole region above the main
                  diagonal. Geometrically this would place the point <em>behind</em> the cameras.{' '}
                  <br />
                  <T>{'d > 2'}</T> means <T>{'i - j > 2'}</T> — everything more than two cells below
                  the diagonal, outside the assumed depth range.
                </>
              ),
            },
            {
              label: 'What survives',
              body: (
                <>
                  A diagonal band three cells wide: the cells with <T>{'j = i'}</T>,{' '}
                  <T>{'j = i-1'}</T> and <T>{'j = i-2'}</T>.
                </>
              ),
            },
            {
              label: 'Disparities of the given matches',
              body: (
                <div className="mt-1 font-mono text-[13px]">
                  (1,1) → d = 0 <br />
                  (2,1) → d = 1 <br />
                  (3,2) → d = 1 <br />
                  (4,3) → d = 1 <br />
                  (5,3) → d = 2 <br />
                  (6,4) → d = 2
                </div>
              ),
            },
            {
              label: 'Why this is a path problem',
              body: (
                <>
                  Assigning a disparity to <em>every</em> left pixel means picking one cell per
                  column, and the ordering constraint (surfaces do not swap order between views)
                  forces those cells to form a monotone, connected staircase from the top-left to
                  the bottom-right. The total cost is the sum along the staircase — so the best
                  scanline interpretation is the <strong>minimum-cost connected path</strong>{' '}
                  through the DSI.
                </>
              ),
            },
          ]}
          answer={
            <>
              Disparities <T>{'0, 1, 1, 1, 2, 2'}</T>. Invalid: everything above the main diagonal (
              <T>{'d<0'}</T>) and everything more than two below it (<T>{'d>2'}</T>). A full
              scanline solution is a connected monotone path, so the problem is shortest-path.
            </>
          }
        />

        <Aside title="Why the ordering constraint holds (usually)">
          If two surface points A and B appear in the order A, B along the left scanline, they
          normally also appear in that order on the right — so the path can never double back. It
          fails for thin objects in front of a distant background (a pole in front of a wall), where
          the order genuinely reverses. That is a known limitation of scanline DP, and one reason 2D
          methods eventually replaced it.
        </Aside>
      </Section>

      <Section
        id="dp"
        n={3}
        title="Dynamic programming"
        lead="Three moves, one recurrence, and an exact optimum for the whole scanline."
      >
        <FormulaCard
          name="Cox et al. recurrence"
          note="Three cases: match, occluded from one side, occluded from the other."
        >
          <Tex>
            {
              'C(i,j) = \\min\\begin{cases} C(i-1,j-1) + \\mathrm{dissimilarity}(i,j) & \\text{match}\\\\ C(i-1,j) + c_{\\text{occ}} & \\text{occluded from left}\\\\ C(i,j-1) + c_{\\text{occ}} & \\text{occluded from right}\\end{cases}'
            }
          </Tex>
        </FormulaCard>

        <Concept
          title="Reading the three moves"
          intuition={
            <>
              A <strong>diagonal</strong> step advances both scanlines: the two pixels are matched
              to each other. A step that advances only <em>one</em> index means that pixel has no
              partner — it is occluded — and you pay a fixed penalty rather than a match cost.
            </>
          }
        >
          <KeyList
            items={[
              {
                k: 'Diagonal (i−1,j−1) → (i,j)',
                v: 'A match. Disparity stays the same, so this is a fronto-parallel surface. Cost = the dissimilarity of the two patches.',
              },
              {
                k: 'One index advances',
                v: 'That pixel has no counterpart in the other image — a half-occlusion. Cost = a constant occlusion penalty, since there is no patch to compare against.',
              },
              {
                k: 'A run of non-diagonal steps',
                v: 'The disparity changes by one per step — a depth discontinuity, or a slanted surface being approximated by a staircase.',
              },
            ]}
          />
        </Concept>

        <Figure caption="Step through the fill, then watch the optimal path light up. Every value is its own cost plus the cheapest way of reaching it.">
          <DPTable />
        </Figure>

        <Worked
          title="Fill the accumulated-cost table"
          source="Sheet 7 · Exercise 2"
          question={
            <>
              Find the minimum-cost path through{' '}
              <T>{'C = \\begin{pmatrix}1&4&6&8\\\\3&2&5&7\\\\6&3&2&4\\\\9&6&3&1\\end{pmatrix}'}</T>{' '}
              with moves right, down and diagonal down-right. Give the recurrence, the full table{' '}
              <T>{'D'}</T>, the minimum cost and one optimal path.
            </>
          }
          steps={[
            {
              label: 'The recurrence',
              body: (
                <Tex>
                  {
                    'D(i,j) = C(i,j) + \\min\\big\\{\\, D(i-1,j),\\; D(i,j-1),\\; D(i-1,j-1) \\,\\big\\}'
                  }
                </Tex>
              ),
            },
            {
              label: 'Base case and first row / column',
              body: (
                <>
                  <T>{'D(1,1) = C(1,1) = 1'}</T>. The first row can only be reached from the left
                  and the first column only from above:
                  <div className="mt-1.5 font-mono text-[13px]">
                    row 1: 1, 5, 11, 19 <br />
                    col 1: 1, 4, 10, 19
                  </div>
                </>
              ),
            },
            {
              label: 'Row 2',
              body: (
                <div className="font-mono text-[13px] leading-relaxed">
                  D(2,2) = 2 + min(5, 4, 1) = 3 <br />
                  D(2,3) = 5 + min(11, 3, 5) = 8 <br />
                  D(2,4) = 7 + min(19, 8, 11) = 15
                </div>
              ),
            },
            {
              label: 'Row 3',
              body: (
                <div className="font-mono text-[13px] leading-relaxed">
                  D(3,2) = 3 + min(3, 10, 4) = 6 <br />
                  D(3,3) = 2 + min(8, 6, 3) = 5 <br />
                  D(3,4) = 4 + min(15, 5, 8) = 9
                </div>
              ),
            },
            {
              label: 'Row 4',
              body: (
                <div className="font-mono text-[13px] leading-relaxed">
                  D(4,2) = 6 + min(6, 19, 10) = 12 <br />
                  D(4,3) = 3 + min(5, 12, 6) = 8 <br />
                  D(4,4) = 1 + min(9, 8, 5) = 6
                </div>
              ),
            },
            {
              label: 'The complete table',
              body: (
                <Tex>
                  {
                    'D = \\begin{pmatrix} 1 & 5 & 11 & 19\\\\ 4 & 3 & 8 & 15\\\\ 10 & 6 & 5 & 9\\\\ 19 & 12 & 8 & 6\\end{pmatrix}'
                  }
                </Tex>
              ),
            },
            {
              label: 'Backtrack from the bottom-right',
              body: (
                <>
                  <T>{'D(4,4)=6'}</T> came from <T>{'D(3,3)=5'}</T> (diagonal); <T>{'D(3,3)'}</T>{' '}
                  from <T>{'D(2,2)=3'}</T>; <T>{'D(2,2)'}</T> from <T>{'D(1,1)=1'}</T>. Path:{' '}
                  <T>{'(1,1)\\to(2,2)\\to(3,3)\\to(4,4)'}</T>, costs <T>{'1+2+2+1 = 6'}</T> ✓
                </>
              ),
            },
          ]}
          answer={
            <>
              Minimum cost <strong>6</strong>, along the all-diagonal path{' '}
              <T>{'(1,1)\\to(2,2)\\to(3,3)\\to(4,4)'}</T>. In stereo terms every step is a{' '}
              <em>match</em> at constant disparity — a single fronto-parallel surface across the
              whole scanline, with no occlusions.
            </>
          }
        />

        <Aside title="Why DP works here and not on the full image">
          A scanline is a <em>chain</em>: pixel <T>{'i'}</T> interacts only with <T>{'i-1'}</T> and{' '}
          <T>{'i+1'}</T>. That gives the optimal-substructure property, so the best path to a cell
          depends only on the best paths to its three predecessors, and the exact global optimum
          falls out in <T>{'O(n \\cdot d)'}</T>. A 2D image grid has <em>loops</em>, the
          substructure property fails, and exact minimisation becomes NP-hard for general energies.
          The visible symptom of solving rows independently is the classic{' '}
          <strong>streaking</strong> artefact, since nothing couples one row to the next.
        </Aside>
      </Section>

      <Section
        id="mrf"
        n={4}
        title="Markov random fields"
        lead="Put the smoothness on a 2D grid instead of a chain and you have a graphical model — with all the power and all the intractability that implies."
      >
        <Concept
          title="The model"
          intuition={
            <>
              One node per pixel, one edge per neighbouring pair (a 4-connected grid). The solution
              minimises a data cost at each node and a smoothness cost on each edge.
            </>
          }
        >
          <FormulaCard name="Second-order graphical model">
            <Tex>
              {
                'p(\\mathbf D) \\propto \\exp\\left\\{-\\sum_i \\psi_{\\text{data}}(d_i) - \\lambda\\sum_{i\\sim j}\\psi_{\\text{smooth}}(d_i, d_j)\\right\\}'
              }
            </Tex>
          </FormulaCard>
          <KeyList
            items={[
              {
                k: <T>{'\\psi_{\\text{data}}(d_i)'}</T>,
                v: 'Unary term — the matching cost of assigning disparity d to pixel i.',
              },
              {
                k: <T>{'\\psi_{\\text{smooth}}(d_i,d_j)'}</T>,
                v: 'Pairwise term — the penalty for neighbouring pixels disagreeing.',
              },
              { k: <T>{'i \\sim j'}</T>, v: 'Neighbouring pixels on a 4-connected grid.' },
              {
                k: <T>{'\\lambda'}</T>,
                v: 'How much you trust the smoothness prior relative to the data.',
              },
            ]}
          />
        </Concept>

        <KeyList
          title="Two standard smoothness models"
          items={[
            {
              k: <T>{"\\text{Potts: } \\psi(d,d') = [d \\neq d']"}</T>,
              v: 'A flat penalty for any disagreement, regardless of size. Produces piecewise-constant depth — good for fronto-parallel scenes, bad for slanted ones.',
            },
            {
              k: <T>{"\\text{Truncated } \\ell_1: \\ \\min(|d-d'|, \\tau)"}</T>,
              v: 'Penalises proportionally to the jump, but caps it at τ. Small variation is cheap, so slanted surfaces are fine; a large jump costs only τ, so genuine depth discontinuities are affordable. This is a robust penalty, exactly like the median filter argument.',
            },
          ]}
        />

        <Figure caption="Set the disparities by hand and watch the two terms trade off. Drag λ through 2 and the winner flips.">
          <MRFLab />
        </Figure>

        <Worked
          title="Evaluate two assignments"
          source="Sheet 7 · Exercise 3"
          question={
            <>
              Four pixels, <T>{'d \\in \\{0,1,2\\}'}</T>, <T>{'\\lambda = 2'}</T>, Potts smoothness,
              with data costs{' '}
              <T>
                {
                  '\\begin{array}{c|ccc} & 0 & 1 & 2\\\\\\hline 1 & 0 & 2 & 4\\\\ 2 & 1 & 0 & 3\\\\ 3 & 3 & 0 & 1\\\\ 4 & 4 & 2 & 0\\end{array}'
                }
              </T>
              . Compute <T>{'E(0,1,1,2)'}</T> and <T>{'E(1,1,1,1)'}</T>, and say which is preferred.
            </>
          }
          steps={[
            {
              label: 'D = (0,1,1,2) — data term',
              body: (
                <>
                  Read the table: pixel 1 at <T>{'d=0'}</T> costs 0; pixel 2 at <T>{'d=1'}</T> costs
                  0; pixel 3 at <T>{'d=1'}</T> costs 0; pixel 4 at <T>{'d=2'}</T> costs 0.
                  <Tex>{'\\sum \\psi_{\\text{data}} = 0 + 0 + 0 + 0 = 0'}</Tex>
                </>
              ),
            },
            {
              label: 'D = (0,1,1,2) — smoothness term',
              body: (
                <>
                  Three neighbouring pairs: <T>{'(0,1)'}</T> differ → 1; <T>{'(1,1)'}</T> equal → 0;{' '}
                  <T>{'(1,2)'}</T> differ → 1.
                  <Tex>{'\\lambda \\sum \\psi_{\\text{smooth}} = 2 \\times 2 = 4'}</Tex>
                </>
              ),
            },
            {
              label: 'D = (0,1,1,2) — total',
              body: <Tex>{'E = 0 + 4 = 4'}</Tex>,
            },
            {
              label: 'D = (1,1,1,1) — data term',
              body: (
                <>
                  Pixel 1 at <T>{'d=1'}</T> costs 2; pixel 2 costs 0; pixel 3 costs 0; pixel 4 costs
                  2.
                  <Tex>{'\\sum \\psi_{\\text{data}} = 2 + 0 + 0 + 2 = 4'}</Tex>
                </>
              ),
            },
            {
              label: 'D = (1,1,1,1) — smoothness term',
              body: (
                <>
                  All neighbours equal, so every pairwise term is 0.
                  <Tex>{'\\lambda \\sum \\psi_{\\text{smooth}} = 2 \\times 0 = 0'}</Tex>
                </>
              ),
            },
            {
              label: 'D = (1,1,1,1) — total',
              body: <Tex>{'E = 4 + 0 = 4'}</Tex>,
            },
            {
              label: 'Compare',
              body: (
                <>
                  Both have energy <strong>4</strong>. <em>Neither is preferred</em> — they are
                  exactly tied, and the MRF cannot distinguish them at this λ.
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'E(0,1,1,2) = 0 + 2\\cdot2 = 4'}</T> and <T>{'E(1,1,1,1) = 4 + 0 = 4'}</T>. They{' '}
              <strong>tie</strong>.
              <br />
              <br />
              That is not an accident: <T>{'\\lambda = 2'}</T> is precisely the crossover. For{' '}
              <T>{'\\lambda < 2'}</T> the data-driven labelling wins (it pays nothing in data cost);
              for <T>{'\\lambda > 2'}</T> the constant labelling wins (it pays nothing in
              smoothness). Saying <em>that</em> is the full-mark answer.
            </>
          }
        />

        <Pitfall title="What λ does — and what happens when it is huge">
          <T>{'\\lambda'}</T> sets how much a disagreement between neighbours costs, relative to the
          evidence in the images. Too small and you recover per-pixel block matching, noise and all.
          Too large and the smoothness term dominates entirely: with Potts, any disagreement becomes
          unaffordable, so the global minimum is a <strong>single constant disparity</strong> for
          the whole image — the one minimising the summed data cost. All depth structure is gone.
          Real depth discontinuities are over-smoothed away long before that limit is reached.
        </Pitfall>

        <Deeper label="Why it is called a Markov random field">
          <p>
            Potentials <T>{'\\psi(x)'}</T> are non-negative functions of a variable;{' '}
            <T>{'\\psi(x, y)'}</T> is a joint potential of two. Given a set of variables{' '}
            <T>{'\\mathbf X = \\{x_1,\\dots,x_N\\}'}</T>, the model is a Markov random field if the
            distribution factorises over the maximal cliques of the graph:
          </p>
          <Tex>{'p(\\mathbf X) = \\frac{1}{Z}\\prod_{k=1}^{K}\\psi_k(\\mathbf X_k)'}</Tex>
          <p className="mt-2">
            <strong>Local Markov property:</strong> a variable is conditionally independent of all
            others given its neighbours. <strong>Global Markov property:</strong> two sets of
            variables are conditionally independent given a separating set.{' '}
            <strong>Hammersley–Clifford</strong> is the theorem that ties the two views together:
            for a strictly positive distribution, satisfying the Markov properties of a graph is
            equivalent to factorising over its cliques. That is what licenses writing{' '}
            <T>{'p(\\mathbf D)'}</T> as a product of unary and pairwise terms in the first place.
          </p>
          <p className="mt-2">
            One caveat the lecture flags: the factorisation induced by a graph is{' '}
            <em>not unique</em>, which is why factor graphs — with explicit nodes for the factors —
            are often preferred for describing a model unambiguously.
          </p>
        </Deeper>
      </Section>

      <Section
        id="energy"
        n={5}
        title="From probability to energy"
        lead="The exercise asks you to show these are the same thing. It is two lines, and the reason is worth understanding."
      >
        <Worked
          title="Maximising p(D) is minimising E(D)"
          source="Sheet 7 · Exercise 4.3"
          question={
            <>
              Show that maximising{' '}
              <T>
                {
                  'p(\\mathbf D) \\propto \\exp\\{-\\sum_i \\psi_{\\text{data}}(d_i) - \\lambda\\sum_{i\\sim j}\\psi_{\\text{smooth}}(d_i,d_j)\\}'
                }
              </T>{' '}
              is equivalent to minimising an energy <T>{'E(\\mathbf D)'}</T>.
            </>
          }
          steps={[
            {
              label: 'Write the proportionality with its constant',
              body: (
                <>
                  <Tex>{'p(\\mathbf D) = \\frac{1}{Z}\\exp\\{-E(\\mathbf D)\\}'}</Tex>
                  where <T>{'Z = \\sum_{\\mathbf D} \\exp\\{-E(\\mathbf D)\\}'}</T> is the partition
                  function — it depends on the model, not on the particular <T>{'\\mathbf D'}</T>.
                </>
              ),
            },
            {
              label: 'Take logs — monotone, so the argmax is unchanged',
              body: <Tex>{'\\log p(\\mathbf D) = -E(\\mathbf D) - \\log Z'}</Tex>,
            },
            {
              label: 'Drop the constant and flip the sign',
              body: (
                <Tex>
                  {
                    '\\argmax_{\\mathbf D}\\, p(\\mathbf D) = \\argmax_{\\mathbf D}\\, \\big(-E(\\mathbf D)\\big) = \\argmin_{\\mathbf D}\\, E(\\mathbf D)'
                  }
                </Tex>
              ),
            },
            {
              label: 'Identify E',
              body: (
                <Tex>
                  {
                    'E(\\mathbf D) = \\sum_i \\psi_{\\text{data}}(d_i) + \\lambda\\sum_{i\\sim j}\\psi_{\\text{smooth}}(d_i, d_j)'
                  }
                </Tex>
              ),
            },
          ]}
          answer={
            <>
              Because <T>{'\\exp'}</T> is strictly increasing and <T>{'Z'}</T> does not depend on{' '}
              <T>{'\\mathbf D'}</T>, the maximum of <T>{'p'}</T> is exactly the minimum of{' '}
              <T>{'E'}</T>. The MAP estimate <em>is</em> the energy minimiser — which is why the
              literature moves between the probabilistic and the energy language without comment.
              The bridge in the other direction is <T>{'\\psi(\\cdot) := -\\log f(\\cdot)'}</T>: a
              cost is a negative log-likelihood.
            </>
          }
        />

        <Rule tag="What the two terms mean probabilistically">
          <T>{'\\psi_{\\text{data}}(d_i)'}</T> is the negative log-<em>likelihood</em>: how
          improbable the observed pixels are if the disparity really is <T>{'d_i'}</T>. It comes
          from the matching cost (SSD, NCC, or a learned score).
          <br />
          <br />
          <T>{'\\psi_{\\text{smooth}}(d_i,d_j)'}</T> is the negative log-<em>prior</em>: how
          improbable it is a priori for two neighbouring pixels to have those disparities, before
          looking at the images at all. Together, the MAP estimate is likelihood × prior — Bayes,
          written as an energy.
        </Rule>

        <Concept
          title="Why this is the right model for stereo"
          intuition={
            <>It encodes exactly the two things we actually know about depth, and nothing else.</>
          }
        >
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>The data term</strong> captures all the image evidence, per pixel — including
              the fact that in a textureless region there <em>is</em> no strong evidence, which
              shows up as a flat unary.
            </li>
            <li>
              <strong>The smoothness term</strong> encodes the physical fact that surfaces are
              mostly continuous, so ambiguous pixels can borrow evidence from confident neighbours.
            </li>
            <li>
              <strong>A robust pairwise term</strong> (truncated, or Potts) makes discontinuities
              affordable, so the prior does not destroy genuine object boundaries.
            </li>
            <li>
              <strong>It is interpretable by design</strong>: every term is a statement you can
              defend, and λ is a single knob whose meaning is clear.
            </li>
          </ul>
        </Concept>
      </Section>

      <Section
        id="solvers"
        n={6}
        title="Solving, and learned costs"
        lead="The energy is easy to write and hard to minimise. Two approximations dominate, and one part of it is now usually learned."
      >
        <KeyList
          title="How the minimisation is actually done"
          items={[
            {
              k: 'Dynamic programming',
              v: 'Exact, but only on a chain — one scanline at a time. Fast. Produces streaking, because nothing couples adjacent rows.',
            },
            {
              k: 'Graph cuts',
              v: 'Boykov, Veksler & Zabih 1999. α-expansion / α-β swap reduce the multi-label problem to a sequence of binary min-cut problems, each solved exactly. Gives a strong approximation guarantee for metric smoothness terms. This is what produced the big visible jump in benchmark quality.',
            },
            {
              k: 'Belief propagation',
              v: 'Message passing on the grid. Exact on trees, approximate ("loopy") on grids, but works well in practice and parallelises.',
            },
          ]}
        />

        <Concept
          title="Siamese networks: learning the data term"
          intuition={
            <>
              SSD and NCC are hand-designed guesses at &ldquo;do these two patches show the same
              thing?&rdquo;. That is a binary classification problem, and it can be learned.
            </>
          }
        >
          <p>
            A Siamese network runs the same convolutional trunk over the left patch and the right
            patch — <em>shared weights</em>, hence &ldquo;Siamese&rdquo; — and compares the two
            embeddings. Trained on ground-truth disparities, it learns a similarity that tolerates
            exposure differences, mild perspective change and specularities in a way no fixed
            formula does.
          </p>
          <p className="mt-3">
            Note what this does <em>not</em> replace. The rectification, the disparity search range,
            the cost volume and the smoothness prior all remain. Winner-takes-all on the learned
            cost is already better than winner-takes-all on SSD — but it is still noisy, and feeding
            the learned costs into the same MRF is better than either. Geometry supplies the
            structure; learning supplies the similarity function.
          </p>
        </Concept>

        <Rule tag="Summary — the lecture's own closing slide">
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Block matching suffers from ambiguities.</li>
            <li>Choosing the window size is a problematic trade-off.</li>
            <li>
              Smoothness constraints resolve some ambiguities and permit small windows (so no
              bleeding artefacts).
            </li>
            <li>The problem can be formulated as MAP inference in a discrete MRF.</li>
            <li>The MAP solution is obtained with belief propagation, graph cuts, and so on.</li>
            <li>Integrating recognition cues can regularise the problem further.</li>
          </ul>
        </Rule>
      </Section>
    </>
  )
}

export const drills: DrillSpec[] = [
  {
    id: 'gs-d1',
    topicId: 'global-stereo',
    source: 'Sheet 7 · Ex 1.4',
    kind: 'explain',
    prompt: (
      <>
        Explain why finding a good stereo matching for a whole scanline can be formulated as finding
        a low-cost path through the DSI.
      </>
    ),
    answer: (
      <>
        Each DSI cell <T>{'(i,j)'}</T> holds the cost of matching left pixel <T>{'i'}</T> with right
        pixel <T>{'j'}</T>, which fixes a disparity <T>{'d = i-j'}</T>. Assigning a disparity to
        every left pixel therefore means choosing one cell per column, and the total cost of the
        interpretation is the sum of the chosen cells.
        <br />
        <br />
        The <strong>ordering constraint</strong> — surface points keep their left-to-right order
        between the two views — means the chosen cells form a monotone, connected staircase from the
        top-left to the bottom-right: the path can move right, down or diagonally, but never double
        back. So a valid scanline interpretation <em>is</em> a connected path, and the best one is
        the minimum-cost path. That is a shortest-path problem on a DAG, solvable exactly by dynamic
        programming.
        <br />
        <br />
        The move types carry meaning: diagonal = a match, one-index-only = a pixel with no partner,
        i.e. a half-occlusion.
      </>
    ),
  },
  {
    id: 'gs-d2',
    topicId: 'global-stereo',
    source: 'Sheet 7 · Ex 2',
    kind: 'compute',
    prompt: (
      <>
        Give the DP recurrence and the full accumulated table for{' '}
        <T>{'C = \\begin{pmatrix}1&4&6&8\\\\3&2&5&7\\\\6&3&2&4\\\\9&6&3&1\\end{pmatrix}'}</T>, with
        moves right, down and diagonal.
      </>
    ),
    hint: <>D(i,j) = C(i,j) + min of the three reachable predecessors.</>,
    answer: (
      <>
        <Tex>{'D(i,j) = C(i,j) + \\min\\{D(i-1,j),\\, D(i,j-1),\\, D(i-1,j-1)\\}'}</Tex>
        <Tex>
          {
            'D = \\begin{pmatrix} 1 & 5 & 11 & 19\\\\ 4 & 3 & 8 & 15\\\\ 10 & 6 & 5 & 9\\\\ 19 & 12 & 8 & 6\\end{pmatrix}'
          }
        </Tex>
        Minimum path cost <strong>6</strong>, along <T>{'(1,1)\\to(2,2)\\to(3,3)\\to(4,4)'}</T> —
        costs <T>{'1+2+2+1=6'}</T>.
        <br />
        <br />
        Interpretation: every move is <em>diagonal</em>, so every pixel is matched and the disparity
        is constant — a fronto-parallel surface with no occlusions. A horizontal or vertical move
        would mean a pixel in one image has no partner in the other (a half-occlusion), and a run of
        them would be a depth discontinuity.
      </>
    ),
  },
  {
    id: 'gs-d3',
    topicId: 'global-stereo',
    source: 'Sheet 7 · Ex 3.1–3.3',
    kind: 'compute',
    prompt: (
      <>
        With <T>{'\\lambda = 2'}</T>, Potts smoothness and the data table from the sheet, compute{' '}
        <T>{'E(0,1,1,2)'}</T> and <T>{'E(1,1,1,1)'}</T>. Which does the MRF prefer?
      </>
    ),
    answer: (
      <>
        <strong>
          <T>{'D = (0,1,1,2)'}</T>
        </strong>
        : data <T>{'= 0+0+0+0 = 0'}</T>; two of the three neighbouring pairs disagree, so smoothness{' '}
        <T>{'= 2'}</T> and <T>{'\\lambda\\cdot 2 = 4'}</T>. Total <T>{'E = 4'}</T>.
        <br />
        <br />
        <strong>
          <T>{'D = (1,1,1,1)'}</T>
        </strong>
        : data <T>{'= 2+0+0+2 = 4'}</T>; no pair disagrees, so smoothness <T>{'= 0'}</T>. Total{' '}
        <T>{'E = 4'}</T>.
        <br />
        <br />
        <strong>Neither is preferred — they tie at 4.</strong> And that is the point of the
        question: <T>{'\\lambda = 2'}</T> is exactly the crossover. Below it the data-driven
        labelling wins; above it the constant one does. Stating the tie <em>and</em> naming λ = 2 as
        the tipping point is the full answer.
      </>
    ),
  },
  {
    id: 'gs-d4',
    topicId: 'global-stereo',
    source: 'Sheet 7 · Ex 3.4',
    kind: 'explain',
    prompt: (
      <>
        Explain the role of <T>{'\\lambda'}</T>. What happens if it is chosen very large?
      </>
    ),
    answer: (
      <>
        <T>{'\\lambda'}</T> weights the smoothness prior against the image evidence — how much you
        are willing to pay, in matching cost, to make neighbouring disparities agree. It is the one
        knob that trades noise against detail.
        <br />
        <br />
        <strong>λ → 0:</strong> the smoothness term vanishes and each pixel is decided
        independently. You are back to winner-takes-all block matching, with all its noise in
        textureless and occluded regions.
        <br />
        <br />
        <strong>λ very large:</strong> any disagreement between neighbours becomes prohibitively
        expensive. With a Potts penalty the global minimum degenerates to a{' '}
        <em>single constant disparity</em> over the whole image — the one that minimises the total
        data cost. Real depth discontinuities are smoothed away long before that; the visible
        symptom is objects bleeding into the background.
        <br />
        <br />
        Worth adding: a <em>truncated</em> penalty such as <T>{"\\min(|d-d'|,\\tau)"}</T> caps the
        cost of a jump at τ, so even with a large λ a genuine discontinuity stays affordable. That
        is why robust pairwise terms are preferred in practice.
      </>
    ),
  },
  {
    id: 'gs-d4b',
    topicId: 'global-stereo',
    source: 'Sheet 7 · Ex 4.1–4.2',
    kind: 'explain',
    prompt: (
      <>
        Explain what the unary term <T>{'\psi_{\text{data}}(d_i)'}</T> and the pairwise term{' '}
        <T>{'\psi_{\text{smooth}}(d_i, d_j)'}</T> represent.
      </>
    ),
    answer: (
      <>
        <strong>The unary term</strong> is the <em>data</em> cost at a single pixel: how badly
        disparity <T>{'d_i'}</T> explains what the images actually show at pixel <T>{'i'}</T>. It
        comes from the matching cost — SSD, NCC, or a learned similarity — between the patch around{' '}
        <T>{'i'}</T> in the left image and the patch it would correspond to at that disparity in the
        right. Probabilistically it is a negative log-likelihood, <T>{'\psi = -\log f'}</T>. In a
        textureless region it is nearly flat, which is the model honestly reporting that the image
        contains no evidence here.
        <br />
        <br />
        <strong>The pairwise term</strong> is the <em>prior</em>: a penalty for two neighbouring
        pixels being assigned different disparities. It encodes the physical fact that surfaces are
        mostly continuous, so it is what lets a confident pixel lend its answer to an ambiguous
        neighbour. Common choices are the Potts model <T>{'[d_i \neq d_j]'}</T> (a flat penalty for
        any disagreement → piecewise-constant depth) and the truncated <T>{'\ell_1'}</T> penalty{' '}
        <T>{'\min(|d_i - d_j|, \tau)'}</T> (proportional but capped, so slanted surfaces are cheap
        and genuine discontinuities remain affordable).
        <br />
        <br />
        Together, minimising <T>{'\sum\psi_{\text{data}} + \lambda\sum\psi_{\text{smooth}}'}</T> is
        maximising likelihood × prior — Bayes, written as an energy.
      </>
    ),
  },
  {
    id: 'gs-d5',
    topicId: 'global-stereo',
    source: 'Sheet 7 · Ex 4.3',
    kind: 'explain',
    prompt: (
      <>
        Show that maximising <T>{'p(\\mathbf D)'}</T> is equivalent to minimising an energy{' '}
        <T>{'E(\\mathbf D)'}</T>.
      </>
    ),
    answer: (
      <>
        Write <T>{'p(\\mathbf D) = \\frac1Z \\exp\\{-E(\\mathbf D)\\}'}</T> with{' '}
        <T>{'Z = \\sum_{\\mathbf D}\\exp\\{-E(\\mathbf D)\\}'}</T> the partition function, which
        does not depend on the particular <T>{'\\mathbf D'}</T>. Taking logs — a strictly increasing
        transformation, so the argmax is unchanged:
        <Tex>{'\\log p(\\mathbf D) = -E(\\mathbf D) - \\log Z'}</Tex>
        Dropping the constant and flipping the sign,
        <Tex>
          {
            '\\argmax_{\\mathbf D} p(\\mathbf D) = \\argmin_{\\mathbf D} E(\\mathbf D), \\quad E(\\mathbf D) = \\sum_i \\psi_{\\text{data}}(d_i) + \\lambda\\sum_{i\\sim j}\\psi_{\\text{smooth}}(d_i,d_j)'
          }
        </Tex>
        So the MAP estimate is exactly the energy minimiser. The correspondence in the other
        direction is <T>{'\\psi(\\cdot) := -\\log f(\\cdot)'}</T> — a cost is a negative
        log-likelihood, the unary term is the likelihood and the pairwise term the prior.
      </>
    ),
  },
  {
    id: 'gs-d6',
    topicId: 'global-stereo',
    source: 'Sheet 7 · Ex 4.4',
    kind: 'explain',
    prompt: <>Why is this MRF model useful for depth estimation from stereo images?</>,
    answer: (
      <>
        Because it encodes exactly the two things we know, and combines them optimally rather than
        heuristically.
        <br />
        <br />
        <strong>It uses all the image evidence</strong> through the unary terms — including,
        honestly, the fact that a textureless pixel has <em>weak</em> evidence, which shows up as a
        flat unary rather than a confident wrong answer.
        <br />
        <br />
        <strong>It encodes the physical prior</strong> that surfaces are mostly continuous, so
        ambiguous pixels (textureless, repetitive, occluded) inherit a sensible disparity from
        confident neighbours instead of being decided by noise.
        <br />
        <br />
        <strong>It permits small windows.</strong> Because the smoothness comes from the prior
        rather than from a large aggregation window, matching windows can be small — which removes
        the bleeding artefact at object boundaries.
        <br />
        <br />
        <strong>It is interpretable by design</strong> and solved globally: every term is a
        defensible statement, λ has a clear meaning, and graph cuts or belief propagation optimise
        the whole image jointly rather than pixel by pixel.
      </>
    ),
  },
]
