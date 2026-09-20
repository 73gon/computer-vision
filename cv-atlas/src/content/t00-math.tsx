import { T, Tex } from '@/components/ui/tex'
import {
  Aside,
  BigIdea,
  Concept,
  Deeper,
  FormulaCard,
  KeyList,
  Pitfall,
  Rule,
  Section,
  WhyCare,
  Worked,
} from '@/components/learn/primitives'
import type { DrillSpec } from '@/components/learn/drill'
import type { TopicMeta } from './types'

export const meta: TopicMeta = {
  id: 'math',
  n: 0,
  title: 'The maths you actually need',
  kicker:
    'Derivatives, gradients, determinants and eigenvalues — but only the six moves that keep reappearing.',
  lectures: ['Math Recap sheet'],
  exercises: ['Math Recap, Ex 1–15'],
  minutes: 35,
  sections: [
    { id: 'derivatives', title: 'Differentiation, in four rules' },
    { id: 'gradient', title: 'Gradient and Hessian' },
    { id: 'parts', title: 'Integration by parts' },
    { id: 'matrices', title: 'Matrices, determinants, cross product' },
    { id: 'eigen', title: 'Eigenvalues and eigenvectors' },
    { id: 'laplace', title: 'Where it all lands: the Laplace operator' },
  ],
  sheet: [
    { name: 'Product rule', tex: "(f\\cdot g)' = f'g + fg'" },
    { name: 'Quotient rule', tex: "\\left(\\tfrac{f}{g}\\right)' = \\dfrac{f'g - fg'}{g^2}" },
    { name: 'Chain rule', tex: "(f\\circ g)'(x) = f'(g(x))\\cdot g'(x)" },
    {
      name: 'Gradient',
      tex: '\\nabla f = \\left(\\tfrac{\\partial f}{\\partial x_1},\\dots,\\tfrac{\\partial f}{\\partial x_n}\\right)^{\\mathsf T}',
      note: 'Points in the direction of steepest ascent.',
    },
    { name: 'Integration by parts', tex: "\\int u v' = uv - \\int u'v", note: 'Pick u by LIATE.' },
    { name: '2×2 determinant', tex: '\\det\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix} = ad-bc' },
    { name: 'Eigen-problem', tex: 'A\\mathbf v = \\lambda\\mathbf v,\\quad \\det(A-\\lambda I)=0' },
    {
      name: 'Determinant / trace',
      tex: '\\det A = \\prod_i \\lambda_i,\\qquad \\operatorname{tr} A = \\sum_i \\lambda_i',
    },
    {
      name: 'Laplace operator',
      tex: '\\Delta f = \\sum_{i=1}^{n}\\frac{\\partial^2 f}{\\partial x_i^2}',
      note: 'How far a point sits from its local average.',
    },
  ],
}

export function Body() {
  return (
    <>
      <BigIdea oneLiner="Almost every formula in this course is a derivative, a determinant, or an eigenvector wearing a costume.">
        <p>
          You do not need a maths refresher in general. You need six specific moves, because the
          same six keep showing up: differentiating to find edges, gradients to find the direction
          of change, determinants to ask &ldquo;is this invertible?&rdquo;, cross products to write
          &ldquo;these two vectors are parallel&rdquo; as a linear equation, eigenvectors to find
          the null space of <T>{'E'}</T> and <T>{'F'}</T>, and second derivatives to build the
          Laplacian.
        </p>
      </BigIdea>

      <WhyCare>
        Two of these are the entire backbone of training a network. The gradient is what
        backpropagation computes; the Hessian is what second-order optimisers and every &ldquo;is
        this a minimum or a saddle?&rdquo; argument reach for. If you have written{' '}
        <code className="font-mono text-[0.9em]">loss.backward()</code>, you have already used
        section 02 — this is just the same object, with the notation the exam uses.
      </WhyCare>

      <Section
        id="derivatives"
        n={1}
        title="Differentiation, in four rules"
        lead="Linearity, power, product, quotient, chain. Everything on the sheet is a combination of these."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormulaCard name="Linearity">
            <Tex>{"(c f \\pm g)' = c f' \\pm g'"}</Tex>
          </FormulaCard>
          <FormulaCard name="Power rule">
            <Tex>{"(x^n)' = n\\,x^{n-1}"}</Tex>
          </FormulaCard>
          <FormulaCard name="Product rule">
            <Tex>{"(f\\cdot g)' = f'g + fg'"}</Tex>
          </FormulaCard>
          <FormulaCard name="Quotient rule" note="g ≠ 0">
            <Tex>{"\\left(\\frac{f}{g}\\right)' = \\frac{f'g - fg'}{g^2}"}</Tex>
          </FormulaCard>
        </div>

        <FormulaCard name="Chain rule — the one that carries the marks">
          <Tex>{"(f\\circ g)'(x) = f'(g(x))\\cdot g'(x)"}</Tex>
        </FormulaCard>

        <KeyList
          title="Standard derivatives"
          items={[
            { k: <T>{'(e^x)&#x27; = e^x'}</T>, v: 'The only function that is its own derivative.' },
            { k: <T>{'(\\ln x)&#x27; = 1/x'}</T>, v: 'Only for x > 0.' },
            {
              k: <T>{'(\\sin x)&#x27; = \\cos x'}</T>,
              v: 'And (cos x)′ = −sin x — the minus is the marks.',
            },
          ]}
        />

        <Worked
          title="Power rule and linearity"
          source="Math Recap · Exercise 1"
          question={
            <>
              Differentiate <T>{'f(x) = 3x^4 - 5x^2 + 7x - 2'}</T>.
            </>
          }
          steps={[
            {
              label: 'Split by linearity',
              body: <>Differentiate each term on its own; constants multiply straight through.</>,
            },
            {
              label: 'Power rule, term by term',
              body: (
                <Tex>
                  {"(3x^4)' = 12x^3,\\quad (-5x^2)' = -10x,\\quad (7x)' = 7,\\quad (-2)' = 0"}
                </Tex>
              ),
            },
          ]}
          answer={<Tex>{"f'(x) = 12x^3 - 10x + 7"}</Tex>}
        />

        <Worked
          title="Product rule, then factor"
          source="Math Recap · Exercise 2"
          question={
            <>
              Compute <T>{"g'(x)"}</T> for <T>{'g(x) = x^2 e^x'}</T> and factor the result.
            </>
          }
          steps={[
            {
              label: 'Name the pieces',
              body: (
                <>
                  <T>{'f = x^2'}</T> so <T>{"f' = 2x"}</T>; <T>{'h = e^x'}</T> so{' '}
                  <T>{"h' = e^x"}</T>.
                </>
              ),
            },
            { label: 'Apply', body: <Tex>{"g'(x) = 2x e^x + x^2 e^x"}</Tex> },
            {
              label: 'Factor out the common part',
              body: (
                <>
                  Both terms carry <T>{'x e^x'}</T>.
                </>
              ),
            },
          ]}
          answer={<Tex>{"g'(x) = x e^x (x + 2)"}</Tex>}
        />

        <Worked
          title="Chain rule — name the outer and inner function"
          source="Math Recap · Exercise 3"
          question={
            <>
              Differentiate <T>{'h(x) = \\sin(x^3 + 1)'}</T>, stating the outer and inner function
              explicitly.
            </>
          }
          steps={[
            {
              label: 'Identify',
              body: (
                <>
                  Outer: <T>{'f(u) = \\sin u'}</T>. Inner: <T>{'u = g(x) = x^3 + 1'}</T>.
                </>
              ),
            },
            {
              label: 'Differentiate each',
              body: (
                <>
                  <T>{"f'(u) = \\cos u"}</T> and <T>{"g'(x) = 3x^2"}</T>.
                </>
              ),
            },
            { label: 'Multiply', body: <Tex>{"h'(x) = \\cos(x^3+1)\\cdot 3x^2"}</Tex> },
          ]}
          answer={<Tex>{"h'(x) = 3x^2\\cos(x^3+1)"}</Tex>}
        />

        <Worked
          title="Quotient and chain together"
          source="Math Recap · Exercise 4"
          question={
            <>
              Compute <T>{'k(x) = \\dfrac{\\ln(x^2+1)}{x}'}</T> for <T>{'x \\neq 0'}</T>.
            </>
          }
          steps={[
            {
              label: 'Differentiate the numerator (chain rule)',
              body: (
                <Tex>
                  {'\\frac{d}{dx}\\ln(x^2+1) = \\frac{1}{x^2+1}\\cdot 2x = \\frac{2x}{x^2+1}'}
                </Tex>
              ),
            },
            {
              label: 'Quotient rule',
              body: (
                <Tex>{"k'(x) = \\frac{\\frac{2x}{x^2+1}\\cdot x - \\ln(x^2+1)\\cdot 1}{x^2}"}</Tex>
              ),
            },
          ]}
          answer={<Tex>{"k'(x) = \\frac{\\dfrac{2x^2}{x^2+1} - \\ln(x^2+1)}{x^2}"}</Tex>}
        />
      </Section>

      <Section
        id="gradient"
        n={2}
        title="Gradient and Hessian"
        lead="A partial derivative holds every other variable still. Collect them and you get a direction; differentiate again and you get curvature."
      >
        <Concept
          intuition={
            <>
              Standing on a hillside, the gradient is the compass bearing of the steepest way up,
              and its length is how steep that is. The Hessian is the shape of the hill around you —
              bowl, dome, or saddle.
            </>
          }
        >
          <Tex>
            {
              '\\nabla f(\\mathbf x) = \\begin{pmatrix}\\partial f/\\partial x_1\\\\ \\vdots\\\\ \\partial f/\\partial x_n\\end{pmatrix}, \\qquad H_f = \\begin{pmatrix}\\partial^2 f/\\partial x^2 & \\partial^2 f/\\partial x\\partial y\\\\ \\partial^2 f/\\partial y\\partial x & \\partial^2 f/\\partial y^2\\end{pmatrix}'
            }
          </Tex>
        </Concept>

        <Rule tag="Schwarz's theorem">
          When the mixed partials are continuous, the order of differentiation does not matter:{' '}
          <T>
            {
              '\\frac{\\partial^2 f}{\\partial x_i \\partial x_j} = \\frac{\\partial^2 f}{\\partial x_j \\partial x_i}'
            }
          </T>
          . So the Hessian is <em>symmetric</em> — which is exactly why its eigenvalues are real,
          which is what makes the structure tensor in the corner detector usable.
        </Rule>

        <Worked
          title="All first-order partials"
          source="Math Recap · Exercise 5"
          question={
            <>
              Find all first partial derivatives of <T>{'f(x,y) = x^2 y + y^3 - 3xy'}</T>.
            </>
          }
          steps={[
            {
              label: 'Differentiate in x, treating y as a constant',
              body: (
                <>
                  <T>{'x^2y \\to 2xy'}</T>, <T>{'y^3 \\to 0'}</T>, <T>{'-3xy \\to -3y'}</T>.
                </>
              ),
            },
            {
              label: 'Differentiate in y, treating x as a constant',
              body: (
                <>
                  <T>{'x^2y \\to x^2'}</T>, <T>{'y^3 \\to 3y^2'}</T>, <T>{'-3xy \\to -3x'}</T>.
                </>
              ),
            },
          ]}
          answer={<Tex>{'f_x = 2xy - 3y, \\qquad f_y = x^2 + 3y^2 - 3x'}</Tex>}
        />

        <Worked
          title="Hessian, and a check of Schwarz"
          source="Math Recap · Exercise 6"
          question={
            <>
              Compute all second partials of <T>{'f(x,y) = x^3 + x^2y^2'}</T>, assemble the Hessian
              and verify Schwarz&rsquo;s theorem.
            </>
          }
          steps={[
            {
              label: 'First order',
              body: <Tex>{'f_x = 3x^2 + 2xy^2, \\qquad f_y = 2x^2 y'}</Tex>,
            },
            {
              label: 'Second order',
              body: (
                <Tex>
                  {
                    'f_{xx} = 6x + 2y^2,\\quad f_{xy} = 4xy,\\quad f_{yx} = 4xy,\\quad f_{yy} = 2x^2'
                  }
                </Tex>
              ),
            },
            {
              label: 'Assemble',
              body: (
                <Tex>
                  {'H_f(x,y) = \\begin{pmatrix} 6x + 2y^2 & 4xy \\\\ 4xy & 2x^2 \\end{pmatrix}'}
                </Tex>
              ),
            },
          ]}
          answer={
            <>
              <T>{'f_{xy} = f_{yx} = 4xy'}</T>, so Schwarz holds and the Hessian is symmetric. Both
              mixed partials are polynomials, hence continuous everywhere, so the hypothesis of the
              theorem is satisfied — say that sentence, it is often worth a mark.
            </>
          }
        />

        <Worked
          title="Gradient at a point, and what it means"
          source="Math Recap · Exercise 7"
          question={
            <>
              Compute <T>{'\\nabla f'}</T> for <T>{'f(x,y,z) = x^2 y + yz^2'}</T> at{' '}
              <T>{'p = (1,2,1)'}</T> and interpret it geometrically.
            </>
          }
          steps={[
            {
              label: 'Partials',
              body: <Tex>{'f_x = 2xy,\\qquad f_y = x^2 + z^2,\\qquad f_z = 2yz'}</Tex>,
            },
            {
              label: 'Evaluate at (1, 2, 1)',
              body: (
                <Tex>
                  {
                    'f_x = 2\\cdot1\\cdot2 = 4,\\quad f_y = 1 + 1 = 2,\\quad f_z = 2\\cdot2\\cdot1 = 4'
                  }
                </Tex>
              ),
            },
            {
              label: 'Interpret',
              body: (
                <>
                  <T>{'\\nabla f(p) = (4,2,4)^{\\mathsf T}'}</T> points in the direction in which{' '}
                  <T>{'f'}</T> increases fastest at <T>{'p'}</T>, and{' '}
                  <T>{'\\lVert\\nabla f(p)\\rVert = \\sqrt{16+4+16} = 6'}</T> is that rate of
                  increase. It is also normal to the level surface <T>{'f = f(p)'}</T> through{' '}
                  <T>{'p'}</T>.
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'\\nabla f(1,2,1) = (4, 2, 4)^{\\mathsf T}'}</T>, magnitude 6, pointing along the
              steepest ascent and perpendicular to the level set.
            </>
          }
        />
      </Section>

      <Section
        id="parts"
        n={3}
        title="Integration by parts"
        lead="One rule, one choice. The choice is the exam."
      >
        <FormulaCard
          name="Integration by parts"
          note="Pick u by LIATE: Log > Inverse > Algebraic > Trig > Exponential."
        >
          <Tex>
            {"\\int_a^b u(x)v'(x)\\,dx = \\Big[u(x)v(x)\\Big]_a^b - \\int_a^b u'(x)v(x)\\,dx"}
          </Tex>
        </FormulaCard>

        <Worked
          title="∫ x eˣ dx"
          source="Math Recap · Exercise 8"
          question={<>Evaluate the indefinite integral, stating your choice of u and v′.</>}
          steps={[
            {
              label: 'Choose (LIATE: polynomial beats exponential)',
              body: (
                <>
                  <T>{"u = x \\Rightarrow u' = 1"}</T>; <T>{"v' = e^x \\Rightarrow v = e^x"}</T>.
                </>
              ),
            },
            {
              label: 'Substitute',
              body: <Tex>{'\\int x e^x dx = x e^x - \\int 1\\cdot e^x dx'}</Tex>,
            },
            { label: 'Finish', body: <Tex>{'= x e^x - e^x + C'}</Tex> },
          ]}
          answer={<Tex>{'\\int x e^x\\,dx = e^x(x-1) + C'}</Tex>}
        />

        <Worked
          title="∫ x sin(x) dx"
          source="Math Recap · Exercise 9"
          question={<>Evaluate. (This one shows up all over Fourier analysis.)</>}
          steps={[
            {
              label: 'Choose',
              body: (
                <>
                  <T>{"u = x,\\; u' = 1"}</T>; <T>{"v' = \\sin x,\\; v = -\\cos x"}</T>.
                </>
              ),
            },
            {
              label: 'Substitute — mind the double minus',
              body: <Tex>{'\\int x\\sin x\\,dx = -x\\cos x - \\int (-\\cos x)\\,dx'}</Tex>,
            },
            { label: 'Finish', body: <Tex>{'= -x\\cos x + \\sin x + C'}</Tex> },
          ]}
          answer={<Tex>{'\\int x\\sin x\\,dx = \\sin x - x\\cos x + C'}</Tex>}
        />

        <Pitfall>
          The sign slip in <T>{'v = -\\cos x'}</T> is the single most common lost mark on this
          question. Write the minus down before you substitute, not after.
        </Pitfall>
      </Section>

      <Section
        id="matrices"
        n={4}
        title="Matrices, determinants, cross product"
        lead="The determinant answers one question — is this map invertible — and the cross product turns “these are parallel” into linear equations."
      >
        <KeyList
          title="Arithmetic you must not fumble"
          items={[
            { k: <T>{'(AB)_{ij} = \\sum_k A_{ik}B_{kj}'}</T>, v: 'Row times column.' },
            { k: <T>{'AB \\neq BA'}</T>, v: 'In general. Never assume otherwise.' },
            {
              k: <T>{'(AB)^{\\mathsf T} = B^{\\mathsf T}A^{\\mathsf T}'}</T>,
              v: 'The order flips.',
            },
            { k: <T>{'(A^{-1})^{-1} = A'}</T>, v: '' },
            { k: <T>{'\\det(A^{\\mathsf T}) = \\det(A)'}</T>, v: '' },
            { k: <T>{'\\det(AB) = \\det(A)\\det(B)'}</T>, v: '' },
            {
              k: <T>{'\\det(\\alpha A) = \\alpha^n \\det(A)'}</T>,
              v: 'n is the matrix size — not 2, not a typo.',
            },
            {
              k: <T>{'\\det(A) \\neq 0 \\iff A \\text{ invertible}'}</T>,
              v: 'This is the one the exam actually asks about.',
            },
          ]}
        />

        <Worked
          title="Matrix product, and whether it commutes"
          source="Math Recap · Exercise 10"
          question={
            <>
              With <T>{'A=\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}'}</T> and{' '}
              <T>{'B=\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}'}</T>, compute <T>{'AB'}</T> and check
              whether <T>{'AB = BA'}</T>.
            </>
          }
          steps={[
            {
              label: 'AB — row of A against column of B',
              body: (
                <Tex>
                  {
                    'AB = \\begin{pmatrix}1\\cdot0+2\\cdot1 & 1\\cdot1+2\\cdot0\\\\ 3\\cdot0+4\\cdot1 & 3\\cdot1+4\\cdot0\\end{pmatrix} = \\begin{pmatrix}2&1\\\\4&3\\end{pmatrix}'
                  }
                </Tex>
              ),
            },
            {
              label: 'BA',
              body: (
                <Tex>
                  {
                    'BA = \\begin{pmatrix}0\\cdot1+1\\cdot3 & 0\\cdot2+1\\cdot4\\\\ 1\\cdot1+0\\cdot3 & 1\\cdot2+0\\cdot4\\end{pmatrix} = \\begin{pmatrix}3&4\\\\1&2\\end{pmatrix}'
                  }
                </Tex>
              ),
            },
            {
              label: 'Compare',
              body: (
                <>
                  <T>{'B'}</T> swaps rows when applied on the left and swaps columns on the right —
                  different operations.
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>
                {
                  'AB = \\begin{pmatrix}2&1\\\\4&3\\end{pmatrix} \\neq \\begin{pmatrix}3&4\\\\1&2\\end{pmatrix} = BA'
                }
              </T>
              . Matrix multiplication does not commute.
            </>
          }
        />

        <Worked
          title="Determinants, 2×2 and 3×3"
          source="Math Recap · Exercise 11"
          question={
            <>
              (a) <T>{'\\det\\begin{pmatrix}3&1\\\\5&2\\end{pmatrix}'}</T>. (b) Cofactor expansion
              along row 1 of <T>{'B=\\begin{pmatrix}1&2&0\\\\0&3&1\\\\2&0&4\\end{pmatrix}'}</T>. (c)
              What does <T>{'\\det(A)=0'}</T> mean for <T>{'Ax=b'}</T>?
            </>
          }
          steps={[
            { label: '(a) ad − bc', body: <Tex>{'3\\cdot2 - 1\\cdot5 = 6 - 5 = 1'}</Tex> },
            {
              label: '(b) Expand along the first row, alternating signs + − +',
              body: (
                <Tex>
                  {
                    '\\det B = 1\\cdot\\det\\begin{pmatrix}3&1\\\\0&4\\end{pmatrix} - 2\\cdot\\det\\begin{pmatrix}0&1\\\\2&4\\end{pmatrix} + 0\\cdot\\det\\begin{pmatrix}0&3\\\\2&0\\end{pmatrix}'
                  }
                </Tex>
              ),
            },
            {
              label: '(b) Evaluate the minors',
              body: <Tex>{'= 1\\cdot 12 - 2\\cdot(0-2) + 0 = 12 + 4 = 16'}</Tex>,
            },
            {
              label: '(c) Interpret',
              body: (
                <>
                  <T>{'\\det A = 0'}</T> means <T>{'A'}</T> is singular: its columns are linearly
                  dependent, so it has a non-trivial null space.
                </>
              ),
            },
          ]}
          answer={
            <>
              (a) 1. (b) 16. (c) <T>{'A'}</T> is not invertible, so <T>{'Ax=b'}</T> has{' '}
              <em>no unique solution</em> — either no solution at all, or infinitely many (a whole
              affine subspace of them).
            </>
          }
        />

        <Worked
          title="Cross product, and what it is for"
          source="Math Recap · Exercise 13"
          question={
            <>
              Compute <T>{'\\mathbf u \\times \\mathbf v'}</T> for <T>{'\\mathbf u = (1,0,0)'}</T>,{' '}
              <T>{'\\mathbf v = (0,1,0)'}</T>, and interpret it.
            </>
          }
          steps={[
            {
              label: 'Write the symbolic determinant',
              body: (
                <Tex>
                  {
                    '\\mathbf u\\times\\mathbf v = \\det\\begin{pmatrix}\\mathbf e_1&\\mathbf e_2&\\mathbf e_3\\\\1&0&0\\\\0&1&0\\end{pmatrix}'
                  }
                </Tex>
              ),
            },
            {
              label: 'Expand',
              body: (
                <Tex>
                  {
                    '= \\mathbf e_1(0\\cdot0 - 0\\cdot1) - \\mathbf e_2(1\\cdot0 - 0\\cdot0) + \\mathbf e_3(1\\cdot1 - 0\\cdot0)'
                  }
                </Tex>
              ),
            },
          ]}
          answer={
            <>
              <T>{'\\mathbf u\\times\\mathbf v = (0,0,1)^{\\mathsf T} = \\mathbf e_3'}</T>:
              perpendicular to both, right-handed, with length equal to the area of the
              parallelogram they span (here 1). Two vectors are parallel exactly when their cross
              product vanishes — the fact the triangulation chapter is built on.
            </>
          }
        />

        <Deeper label="The skew-symmetric form — you will need this for the essential matrix">
          <p className="mb-3">
            The cross product with a fixed vector is a <em>linear</em> map, so it can be written as
            a matrix:
          </p>
          <Tex>
            {
              '[\\mathbf t]_\\times = \\begin{pmatrix}0 & -t_3 & t_2\\\\ t_3 & 0 & -t_1\\\\ -t_2 & t_1 & 0\\end{pmatrix}, \\qquad \\mathbf t \\times \\mathbf x = [\\mathbf t]_\\times \\mathbf x'
            }
          </Tex>
          <p className="mt-3">
            It is skew-symmetric (
            <T>{'[\\mathbf t]_\\times^{\\mathsf T} = -[\\mathbf t]_\\times'}</T>) and singular:{' '}
            <T>{'[\\mathbf t]_\\times \\mathbf t = \\mathbf t\\times\\mathbf t = 0'}</T>, so it has
            rank 2 with <T>{'\\mathbf t'}</T> in its null space. That single fact is why the
            essential matrix has rank 2, and why the epipole is the null vector of <T>{'E'}</T>.
          </p>
        </Deeper>
      </Section>

      <Section
        id="eigen"
        n={5}
        title="Eigenvalues and eigenvectors"
        lead="Directions the matrix does not rotate — only stretches. Find them by asking when A − λI collapses."
      >
        <Concept
          intuition={
            <>
              Most vectors get spun around by a matrix. A few special directions come out pointing
              the same way, just longer or shorter. Those are the eigenvectors; the stretch factors
              are the eigenvalues.
            </>
          }
        >
          <Tex>
            {
              'A\\mathbf v = \\lambda\\mathbf v,\\quad \\mathbf v \\neq 0 \\iff \\det(A - \\lambda I) = 0'
            }
          </Tex>
        </Concept>

        <KeyList
          title="Facts that get used later"
          items={[
            {
              k: 'Symmetric ⇒ real eigenvalues',
              v: 'Why the structure tensor and the Hessian always give you real numbers to compare.',
            },
            {
              k: 'Symmetric ⇒ orthogonal eigenvectors',
              v: 'For distinct eigenvalues. The two principal directions of a corner are perpendicular.',
            },
            {
              k: <T>{'\\det A = \\prod \\lambda_i,\\; \\operatorname{tr} A = \\sum \\lambda_i'}</T>,
              v: 'Harris uses exactly these two to score a corner without ever computing eigenvectors.',
            },
            {
              k: 'Smallest eigenvalue ≈ 0',
              v: 'The matrix squashes that direction flat. In the 8-point algorithm that is the direction you want.',
            },
          ]}
        />

        <Worked
          title="A symmetric 2×2, end to end"
          source="Math Recap · Exercise 14"
          question={
            <>
              For <T>{'A = \\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}'}</T>: characteristic
              polynomial, eigenvalues, eigenvectors, and are they orthogonal?
            </>
          }
          steps={[
            {
              label: 'Characteristic polynomial',
              body: (
                <Tex>
                  {
                    'p(\\lambda) = \\det\\begin{pmatrix}2-\\lambda&1\\\\1&2-\\lambda\\end{pmatrix} = (2-\\lambda)^2 - 1 = \\lambda^2 - 4\\lambda + 3'
                  }
                </Tex>
              ),
            },
            {
              label: 'Roots',
              body: (
                <>
                  <T>{'\\lambda^2 - 4\\lambda + 3 = (\\lambda-1)(\\lambda-3)'}</T>, so{' '}
                  <T>{'\\lambda_1 = 1'}</T>, <T>{'\\lambda_2 = 3'}</T>.
                </>
              ),
            },
            {
              label: 'Eigenvector for λ = 3',
              body: (
                <>
                  <T>
                    {
                      '(A - 3I)\\mathbf v = \\begin{pmatrix}-1&1\\\\1&-1\\end{pmatrix}\\mathbf v = 0'
                    }
                  </T>{' '}
                  gives <T>{'v_1 = v_2'}</T>, so <T>{'\\mathbf v_2 = (1,1)^{\\mathsf T}'}</T>.
                </>
              ),
            },
            {
              label: 'Eigenvector for λ = 1',
              body: (
                <>
                  <T>
                    {'(A - I)\\mathbf v = \\begin{pmatrix}1&1\\\\1&1\\end{pmatrix}\\mathbf v = 0'}
                  </T>{' '}
                  gives <T>{'v_1 = -v_2'}</T>, so <T>{'\\mathbf v_1 = (1,-1)^{\\mathsf T}'}</T>.
                </>
              ),
            },
            {
              label: 'Orthogonality',
              body: (
                <>
                  <T>{'(1,1)\\cdot(1,-1) = 1 - 1 = 0'}</T>. ✓
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'\\lambda = 1, 3'}</T> with eigenvectors <T>{'(1,-1)^{\\mathsf T}'}</T> and{' '}
              <T>{'(1,1)^{\\mathsf T}'}</T>. They are orthogonal <em>because A is symmetric</em> —
              the spectral theorem guarantees it for distinct eigenvalues, so this is not a
              coincidence of the numbers.
            </>
          }
        />

        <Worked
          title="A rotation has no real eigenvalues"
          source="Math Recap · Exercise 15"
          question={
            <>
              For the 90° rotation <T>{'B = \\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}'}</T>: solve{' '}
              <T>{'\\det(B-\\lambda I) = 0'}</T>, interpret, and connect it to{' '}
              <T>{"f'' = \\lambda f"}</T>.
            </>
          }
          steps={[
            {
              label: 'Characteristic polynomial',
              body: (
                <Tex>
                  {
                    '\\det\\begin{pmatrix}-\\lambda & -1\\\\ 1 & -\\lambda\\end{pmatrix} = \\lambda^2 + 1 = 0'
                  }
                </Tex>
              ),
            },
            {
              label: 'Roots',
              body: (
                <>
                  <T>{'\\lambda = \\pm i'}</T> — no real solutions.
                </>
              ),
            },
            {
              label: 'Geometric meaning',
              body: (
                <>
                  A 90° rotation maps <em>no</em> real direction onto a multiple of itself. Every
                  vector genuinely turns, so there is no invariant real axis in the plane.
                </>
              ),
            },
            {
              label: 'The analogy with calculus',
              body: (
                <>
                  <T>{"f'' = \\lambda f"}</T> is the same equation with <T>{'d^2/dx^2'}</T> in place
                  of <T>{'A'}</T>. For <T>{'\\lambda = -\\omega^2 < 0'}</T> the solutions are{' '}
                  <T>{'f(x) = A\\cos(\\omega x) + B\\sin(\\omega x)'}</T>, since differentiating a
                  sine twice returns <T>{'-\\omega^2'}</T> times itself.
                </>
              ),
            },
          ]}
          answer={
            <>
              <T>{'\\lambda = \\pm i'}</T>: no real eigenvalues, because a rotation leaves no real
              direction fixed. The eigenfunctions of <T>{'d^2/dx^2'}</T> for negative eigenvalue are
              sines and cosines — which is where Fourier analysis, and every frequency argument in
              this course, starts.
            </>
          }
        />
      </Section>

      <Section
        id="laplace"
        n={6}
        title="Where it all lands: the Laplace operator"
        lead="Sum of the unmixed second derivatives — the trace of the Hessian. It measures how far a point sits from its own neighbourhood."
      >
        <FormulaCard name="Laplace operator">
          <Tex>
            {
              '\\Delta f = \\sum_{i=1}^{n}\\frac{\\partial^2 f}{\\partial x_i^2} = \\operatorname{div}(\\nabla f)'
            }
          </Tex>
        </FormulaCard>

        <Rule>
          <T>{'\\Delta f(\\mathbf x) > 0'}</T>: the point lies <em>below</em> its local average — a
          valley. <T>{'\\Delta f(\\mathbf x) < 0'}</T>: it lies <em>above</em> — a peak.{' '}
          <T>{'\\Delta f = 0'}</T>: it is exactly the local mean (a harmonic function).
        </Rule>

        <Concept
          title="Why this matters three chapters later"
          intuition={
            <>
              An isolated bright pixel is a peak, so <T>{'\\Delta f \\ll 0'}</T>. A flat region is
              its own average, so <T>{'\\Delta f = 0'}</T>. That is a blob detector, written in one
              operator — and everything about LoG, DoG and SIFT follows from it.
            </>
          }
        />

        <Aside title="The loop closes">
          <T>{'\\Delta f = \\lambda f'}</T> is the eigenvalue problem for the Laplace operator. For{' '}
          <T>{'\\lambda = -\\omega^2 < 0'}</T> the eigenfunctions are sines and cosines — the same
          answer as Exercise 15. That is why &ldquo;smoothing removes high frequencies&rdquo; and
          &ldquo;the Laplacian responds to rapid change&rdquo; are two descriptions of one fact.
        </Aside>
      </Section>
    </>
  )
}

export const drills: DrillSpec[] = [
  {
    id: 'math-d1',
    topicId: 'math',
    source: 'Math Recap · Ex 12',
    kind: 'compute',
    prompt: (
      <>
        With <T>{'A = \\begin{pmatrix}2&1\\\\0&3\\end{pmatrix}'}</T>, verify{' '}
        <T>{'\\det(2A) = 2^2\\det(A)'}</T>.
      </>
    ),
    hint: <>Scale every entry first, then take the determinant. Do not scale only one row.</>,
    answer: (
      <>
        <T>{'\\det A = 2\\cdot3 - 1\\cdot0 = 6'}</T>.{' '}
        <T>{'2A = \\begin{pmatrix}4&2\\\\0&6\\end{pmatrix}'}</T>, so{' '}
        <T>{'\\det(2A) = 24 = 2^2\\cdot 6'}</T>. ✓ The exponent is the <em>matrix size</em>{' '}
        <T>{'n'}</T>, because scaling multiplies each of the <T>{'n'}</T> rows.
      </>
    ),
  },
  {
    id: 'math-d2',
    topicId: 'math',
    source: 'Math Recap · Ex 11c',
    kind: 'choose',
    prompt: (
      <>
        A square matrix <T>{'A'}</T> has <T>{'\\det(A) = 0'}</T>. What follows for{' '}
        <T>{'A\\mathbf x = \\mathbf b'}</T>?
      </>
    ),
    options: [
      'The system has no solution.',
      'The system has no unique solution: either none, or infinitely many.',
      'The system always has infinitely many solutions.',
      'Nothing follows — the determinant says nothing about solvability.',
    ],
    correct: 1,
    answer: (
      <>
        <T>{'\\det A = 0'}</T> means <T>{'A'}</T> is singular, so it has a non-trivial null space.
        If <T>{'\\mathbf b'}</T> lies in the column space there are infinitely many solutions (add
        any null vector); if it does not, there are none. What is ruled out is <em>exactly one</em>{' '}
        solution.
      </>
    ),
  },
  {
    id: 'math-d3',
    topicId: 'math',
    source: 'Math Recap · Ex 14d',
    kind: 'explain',
    prompt: (
      <>
        Why are the eigenvectors of <T>{'\\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}'}</T> orthogonal?
        Give the reason, not just the check.
      </>
    ),
    answer: (
      <>
        Because the matrix is <em>symmetric</em>. The spectral theorem says a real symmetric matrix
        has real eigenvalues and that eigenvectors belonging to <em>distinct</em> eigenvalues are
        orthogonal. Computing <T>{'(1,1)\\cdot(1,-1) = 0'}</T> confirms it, but the mark is for
        naming symmetry as the cause. This is the same reason the structure tensor&rsquo;s two
        principal directions are perpendicular.
      </>
    ),
  },
  {
    id: 'math-d4',
    topicId: 'math',
    source: 'Math Recap · Outlook',
    kind: 'explain',
    prompt: (
      <>
        State what the sign of <T>{'\\Delta f'}</T> tells you about a point, and connect it to what
        the Laplacian filter does to an image.
      </>
    ),
    answer: (
      <>
        <T>{'\\Delta f > 0'}</T>: the point is below the average of its neighbourhood (a valley,
        i.e. a dark spot). <T>{'\\Delta f < 0'}</T>: above it (a peak, a bright spot).{' '}
        <T>{'\\Delta f = 0'}</T>: exactly the local mean, i.e. flat or linear. <br />
        <br />A discrete Laplacian kernel such as{' '}
        <T>{'\\begin{pmatrix}0&1&0\\\\1&-4&1\\\\0&1&0\\end{pmatrix}'}</T> has weights summing to
        zero, so it outputs exactly 0 on any constant patch and responds most strongly where a pixel
        differs most from its four neighbours — an isolated dot. That is precisely a blob detector.
      </>
    ),
  },
]
