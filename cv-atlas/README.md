# CV Atlas

A study app for the HHU **Computer Vision** course (Summer 2026), built from the
lecture slides, the nine exercise sheets, the math recap and the four Jupyter
notebooks in `../Lecture` and `../Exercise`.

## Running it

```bash
npm install
npm run dev
```

Then open the printed URL. Progress is stored in `localStorage` only — nothing
is uploaded anywhere, and the app works offline once loaded.

```bash
npm run build     # type-check + production bundle into dist/
npx tsc -b        # type-check only
```

## How the content is organised

Every topic follows the same rhythm, deliberately:

1. **The 30-second version** — one sentence you could say out loud.
2. **Why an ML person should care** — the hook back to something already familiar.
3. **Sections** — intuition first, then the formalism, then a worked example
   taken verbatim from an exercise sheet, then the one rule worth memorising.
4. **Try it yourself** — the sheet's own questions, with model answers.

Two cross-cutting views:

- **Exam drills** (`#/drills`) — all 71 questions from the nine sheets plus the
  math recap, filterable and shuffleable, each markable as *got it* / *shaky*.
- **Formula sheet** (`#/sheet`) — every formula on one printable page.

## Source mapping

| Topic | Lectures | Exercises |
| --- | --- | --- |
| 00 The maths you actually need | Math Recap | Recap Ex 1–15 |
| 01 What computer vision is trying to do | L01 | — |
| 02 Digital images and 2D transformations | L02 + notebook | Sheet 1 |
| 03 Image filtering | L03, L04 notebooks | Sheet 2 |
| 04 Local features | L04, L05 | Sheets 3, 4 |
| 05 The camera | L05, L07 | Sheet 4 Ex 3, Sheet 8 Ex 1 |
| 06 Epipolar geometry | L05, L06 + notebook | Sheet 5 |
| 07 Structure from motion | L07 | Sheet 6 Ex 1–2 |
| 08 Dense stereo | L08, L09 | Sheet 6 Ex 3 |
| 09 Global stereo | L08, L09 + notebook | Sheet 7 |
| 10 From depth maps to surfaces | L10 | Sheet 8 Ex 1–2 |
| 11 Recognition | L11 | Sheet 8 Ex 3–4 |
| 12 Multi-view stereo and neural rendering | L12, L13 | Sheet 9 |

Every numeric answer in the worked examples and drills was checked against the
exercise sheets before being written down.

## Conventions worth knowing

The lecture and Exercise sheet 5 use **mirrored conventions** for the epipolar
constraint. This app follows the lecture:

- `E = [t]×R` with `xᵀ E x′ = 0`, `x` in the left image and `x′` in the right
- `l = E x′` (left image), `l′ = Eᵀ x` (right image)
- `E e′ = 0`, `Eᵀ e = 0`, `tᵀE = 0`
- `F = K⁻ᵀ [t]× R K′⁻¹` with `pᵀ F p′ = 0`

Topic 06 flags the difference explicitly — it is a standard source of lost marks.

## Stack and structure

Vite · React 19 · TypeScript · Tailwind v4 · Motion · KaTeX · lucide-react.

```
src/
  content/       one module per topic: meta + Body + drills
  components/
    learn/       BigIdea, Concept, Worked, Rule, Pitfall, Drill …
    viz/         the interactive figures, one file per topic area
    layout/      shell, sidebar, command palette, section rail
    ui/          button, panel, KaTeX wrapper
  pages/         home, topic, drills, sheet
  lib/           hash router, localStorage store, helpers
```

Design follows the [Eigenpair brand system](https://eigenpair.com/brand): a
monochrome palette with four semantic accent tints used *only* to encode meaning
in diagrams (left/right camera, data/smoothness term, correct/incorrect,
scale). Cooper Light BT is not web-licensed, so Fraunces stands in as the
display face; Geist and Geist Mono are used as specified.

### Notes on the interactive figures

SVG geometry is rendered directly and animated with CSS transitions
(`.ep-anim`) rather than through Motion. Motion cannot reliably interpolate SVG
presentation attributes such as `cx`, `r` and `height`; it writes `undefined`
on the first frame. Motion is still used for entrance animations, layout
transitions and anything driven by transforms or opacity.
