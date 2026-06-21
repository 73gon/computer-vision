# Project 2 — Scene Reconstruction: Explanations & Notes

Internal notes for the group (not part of the submission). They explain _what_ each
part of the code does and _why_ we chose a given approach, and collect the likely
questions for the presentation.

Contributions:

- **Exercise 1 — F-matrix estimation & rectification:** Malik
- **Exercise 2 — Block-matching disparity & depth:** Schams
- **Exercise 3 — MRF smoothing:** Samer
- Exercise 4 (Marching Squares) is optional/ahead of the lecture and was left out.

---

## Exercise 1 — Fundamental matrix & rectification (Malik)

**Goal:** estimate the fundamental matrix `F` from two uncalibrated views and use it to
rectify the pair.

### Pipeline

1. **Correspondences.** We detect SIFT keypoints (`get_keypoints`) and match descriptors
   with a ratio test + cross-checking (`matching`). Library SIFT/matching are explicitly
   allowed for keypoint detection. The raw matches still contain outliers, so we run
   **RANSAC via `cv2.findHomography`** _only to obtain the inlier mask_. A homography is a
   reasonable robust model for rejecting gross mismatches, and feeding clean inliers into
   the F-estimation greatly improves stability (≈312 raw → ≈191 inliers).

2. **Fundamental matrix — `compute_fundamental_matrix` (implemented by hand).** `F`
   satisfies the epipolar constraint `y'ᵀ F y = 0` for every correspondence. This is
   _linear_ in the 9 unknown entries of `F`, so each correspondence gives one row of a
   design matrix `A`:

   ```
   [x'x, x'y, x', y'x, y'y, y', x, y, 1] · vec(F) = 0
   ```

   - We solve `A · vec(F) = 0` by taking the **right singular vector of the smallest
     singular value** (the null-space), i.e. the last row of `Vᵀ` from the SVD. This is the
     algebraic least-squares solution that minimizes `‖A f‖` subject to `‖f‖ = 1`.
   - A true fundamental matrix is **rank 2** (it maps points to epipolar lines that all
     pass through the epipole). The raw SVD solution is generally full rank, so we take a
     second SVD of `F`, zero the smallest singular value, and rebuild it. This enforces
     `det F = 0`.

3. **Normalization — `compute_fundamental_matrix_normalized` (Hartley 8-point).** Pixel
   coordinates are in the hundreds/thousands, which makes `A` badly conditioned and the
   result noise-sensitive. We translate each point set to its centroid and scale it so the
   **mean distance to the origin is √2**, build the similarity matrices `T1, T2`, estimate
   `F_norm` in the normalized space, and denormalize with `F = T2ᵀ F_norm T1`. Finally we
   divide by `F₃₃` because `F` is only defined up to scale.

4. **Rectification.** Given `F` and the inlier matches we compute the homographies
   `H1, H2` with `cv2.stereoRectifyUncalibrated` and warp both images with
   `cv2.warpPerspective`. After warping, corresponding points lie on the **same horizontal
   scanline** (visible in the plot: the yellow points sit at equal heights), which is
   exactly what the block matcher in Exercise 2 needs.

### Likely exam questions

- Why the SVD null-space? (homogeneous system, minimize `‖A f‖` s.t. `‖f‖ = 1`).
- Why rank-2 enforcement? (valid epipolar geometry / single epipole).
- Why normalize the points? (numerical conditioning of the 8-point system).
- Why is `F` only defined up to scale? (homogeneous equation `y'ᵀ F y = 0`).

---

## Exercise 2 — Block-matching disparity & depth (Schams)

**Goal:** compute disparity from a rectified pair with block matching, validate it with a
left/right check, and convert it to metric depth.

### Steps

- **Max disparity — `get_max_expected_disparity`.** For matched keypoints the disparity is
  the horizontal offset `|x1 − x2|`. Instead of the raw maximum we take the **99th
  percentile** so that a few wrong matches do not inflate the search range (which would
  make block matching slower _and_ more ambiguous). The value (~203 px at full resolution)
  is scaled by 0.25 to ~51 because we downsample the images by 0.25 for speed.

- **Block matching — `compute_disparity_map`.** Because the images are rectified, a pixel
  only moves **horizontally**. For every candidate disparity `d ∈ [0, d_max]` we:
  - shift the search image by `d` (left fixed → match at `x − d`; right fixed → `x + d`),
  - compute the per-pixel absolute difference, and
  - aggregate it over a 7×7 window → **Sum of Absolute Differences (SAD)**.

  Each pixel keeps the disparity with the **lowest SAD** (winner-takes-all). SAD is cheap
  and robust for this almost photometrically-consistent pair. The windowed sum is
  implemented ourselves with an **integral image** (`_windowed_sum`: two `cumsum`s +
  inclusion–exclusion), so the cost is independent of the window size and we avoid a
  library box filter. Disparities with no valid overlap (image borders) are set to `inf`
  so they are never selected.

- **Cross-checking — `cross_check_disparities`.** A match is trustworthy only if it is
  consistent both ways. Starting from pixel `x` in the left image, its match sits at
  `x − D_L(x)` in the right image; the right map there should report (almost) the same
  disparity. We keep the pixel only if `|D_L(x) − D_R(x − D_L(x))| ≤ threshold`, otherwise
  set it to 0. This removes **occlusions and ambiguous matches** (the dark speckles).

- **Depth — `estimate_depth`.** For a rectified rig, depth follows from triangulation:
  `Z = f · B / d`, with `f = 1718.22` px (calibrated focal length / 4 for the downscale)
  and baseline `B = 0.1747` m. Disparity 0 means "no match" → depth `inf` (rendered as
  far/clamped). Result: foreground objects (plant, sword) are close/bright, the background
  is far/dark.

### Likely exam questions

- Why search only horizontally? (rectified images → epipolar lines are scanlines).
- Why SAD vs SSD/NCC? (speed/robustness trade-off).
- Why a window instead of a single pixel? (single pixels are ambiguous; a window adds
  local context).
- What does cross-checking remove? (occlusions / ambiguous matches).
- The inverse depth–disparity relation `Z ∝ 1/d`.

---

## Exercise 3 — MRF smoothing (Samer)

**Goal:** clean up the noisy disparity map with a **Markov Random Field (MRF)** and
recompute depth from the corrected disparity.

### Why an MRF?

Winner-takes-all block matching decides each pixel independently, so the result is noisy
and full of small holes. Real surfaces are _piecewise smooth_: neighboring pixels usually
share a similar disparity. We encode this prior as an energy we minimize globally:

```
E(l) = Σ_p U_p(l_p)            (data term)
     + Σ_(p,q)∈N V(l_p, l_q)   (smoothness term)
```

- **Labels** are the integer disparities `0 … d_max` (`depths = arange(max_disparity+1)`).
- **Unary / data cost — `_calc_unary_costs`:** `U_p(l) = |D(p) − l|`. Staying close to the
  measured disparity is cheap, moving away is expensive. Shape `(H, W, L)`.
- **Pairwise / smoothness cost — `_calc_binary_costs`:** `V(l_p, l_q) = λ · |l_p − l_q|`. A
  linear penalty on disparity differences between 4-connected neighbors (diagonal is 0).
  `λ` trades data fidelity against smoothness — larger `λ` ⇒ smoother. We use a linear
  (rather than pure Potts) penalty so smooth depth gradients survive while large jumps are
  still punished.

### Solver

We minimize the energy with **graph cuts (α-expansion)** via `gco.cut_grid_graph_simple`
(4-connectivity, run to convergence). Graph cuts give a strong approximate global optimum
for this multi-label problem; the costs are cast to `int32` as the library requires.

### Why smooth disparity, not depth?

Disparity is a small set of integer labels — ideal for discrete graph cuts — and the
exercise explicitly asks to _recompute the depth from the corrected disparity_. So
`apply_mrf` returns a smoothed disparity, which we feed into `estimate_depth` (`Z = f·B/d`)
to get `smoothed_depth_map`.

### Result

The side-by-side plot shows the speckle noise removed and surfaces (plant, sword, floor)
turned into clean piecewise-smooth regions, while object boundaries are preserved.
Remaining black areas are large connected invalid (disparity-0) regions whose all-zero
neighborhoods keep the data term at 0.

### Likely exam questions

- What are the nodes / labels / edges of the MRF?
- Meaning of the unary vs pairwise terms?
- Role of `λ`?
- Why graph cuts / α-expansion instead of brute force (`L^(H·W)` combinations)?
- Potts vs linear smoothness penalty.
