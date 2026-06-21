import cv2
import matplotlib.pyplot as plt
import numpy as np
from numpy.typing import NDArray
from scipy.ndimage import gaussian_filter
from scipy.spatial.distance import cdist
from tqdm.auto import tqdm

try:
    import gco
except ImportError:
    pass  # handle gco missing gracefully if needed


def show_matching_result(img1, img2, keypoints1, keypoints2):
    """
    Plot the images and their corresponding matching points.

    Args:
        img1 (np.ndarray): First input image.
        img2 (np.ndarray): Second input image.
        keypoints1 (np.ndarray): Array of matching keypoints from img1.
        keypoints2 (np.ndarray): Array of matching keypoints from img2.
    """
    fig = plt.figure(figsize=(8, 8))
    plt.imshow(np.hstack((img1, img2)), cmap="gray")

    for kp1, kp2 in zip(keypoints1, keypoints2):
        plt.scatter(kp1[0], kp1[1], s=10, edgecolors="white", c="tab:blue")
        plt.scatter(kp2[0] + img1.shape[1], kp2[1], s=10, edgecolors="white", c="tab:blue")
        plt.plot([kp1[0], kp2[0] + img1.shape[1]], [kp1[1], kp2[1]])


def get_affine_transformation(
    points_in: NDArray[np.float32],
    points_out: NDArray[np.float32],
):
    """
    Computes an affine transformation from points_in to points_out using least squares.

    Args:
        points_in (NDArray[np.float32]): Array of input coordinates.
        points_out (NDArray[np.float32]): Array of target coordinates.

    Returns:
        NDArray: Computed affine transformation matrix.
    """
    # transform to homogenous coordinates
    points_in = np.hstack((points_in, np.ones((len(points_in), 1))), dtype=np.float32)
    points_out = np.hstack(
        (points_out, np.ones((len(points_out), 1))),
        dtype=np.float32,
    )

    # solve the least-squares problem A.T@Ax = A.Tb
    resulting = np.linalg.solve(points_in.T @ points_in, points_in.T @ points_out)

    return np.round(resulting.T, decimals=5)


def transform_points(points, matrix):
    """
    Transforms points using a given 3x3 transformation matrix.

    Args:
        points (NDArray): Points to transform.
        matrix (NDArray): 3x3 transformation matrix.

    Returns:
        NDArray: Transformed coordinates.
    """
    # homogneous coordinates
    points = np.hstack((points, np.ones((len(points), 1))), dtype=np.float32)

    # transform the points
    points = (matrix @ points.T).T
    points = points[:, :2] / points[:, 2, np.newaxis]
    return points


def get_keypoints(image, filtering=False, sigma=3):
    """
    Returns the keypoints of the image using the SIFT algorithm.

    Args:
        image (np.ndarray): Input image.
        filtering (bool): Optional flag to apply Gaussian filtering.
        sigma (float): Sigma for Gaussian filtering if enabled.

    Returns:
        tuple: (keypoints array, descriptors array)
    """
    # apply an optional smoothing to reduce the amount of found keypoints
    if filtering:
        image = gaussian_filter(image, sigma=sigma)

    sift = cv2.SIFT_create()
    keypoints, descriptors = sift.detectAndCompute(image, None)
    # transform keypoints to numpy array
    keypoints = np.array([list(keypoints[i].pt) for i in range(len(keypoints))])

    # return the keypoints and the descriptors
    return keypoints, descriptors


def intersect2d(array1, array2):
    """
    Calculates the intersection over the rows of two arrays.

    Args:
        array1 (NDArray): First array.
        array2 (NDArray): Second array.

    Returns:
        NDArray: Array containing intersecting rows.
    """
    # tests which entries are the same
    test = array1[:, None] == array2  # needs [:, None] to induce broadcasting

    # selects only the entries, for which the
    return array2[np.all(test.mean(0) > 0, axis=1)]


def matching(descriptors_1, descriptors_2, max_ratio=0.7, cross_checking=True):
    """
    Matches the descriptors against each other.
    Returns the best match for each descriptor, if it is significant.
    The significance is defined by the max_ratio: distance_1 / distance_2 < max_ratio.
    Optional cross-checking of matches.

    Args:
        descriptors_1 (NDArray): Descriptors from the first image.
        descriptors_2 (NDArray): Descriptors from the second image.
        max_ratio (float): Maximum ratio between nearest neighbor distances for significance testing.
        cross_checking (bool): If True, validates matches bidirectionally.

    Returns:
        NDArray: Array of match indices for descriptors.
    """
    # calculate the distance between all pairs
    distance_matrix = cdist(descriptors_1, descriptors_2)

    # get the first and second match (only sorts up to the kth smallest entry, in O(n + k log(k)))
    matches, distances = (
        np.argpartition(distance_matrix, 2, axis=1)[:, :2],
        np.partition(distance_matrix, 2, axis=1)[:, :2],
    )
    if cross_checking:
        matches2, distances2 = (
            np.argpartition(distance_matrix.T, 2, axis=1)[:, :2],
            np.partition(distance_matrix.T, 2, axis=1)[:, :2],
        )

    # get the ratios
    ratios = distances[:, 0] / distances[:, 1]
    if cross_checking:
        ratios2 = distances2[:, 0] / distances2[:, 1]

    # cutoff at max_ratio
    mask = ratios < max_ratio
    if cross_checking:
        mask2 = ratios2 < max_ratio

    # produce the final matches
    final_matches = np.stack(
        (np.arange(descriptors_1.shape[0])[mask], matches[mask, 0]),
    ).T
    if cross_checking:
        final_matches2 = np.stack(
            (np.arange(descriptors_2.shape[0])[mask2], matches2[mask2, 0]),
        ).T

    # cross_checking
    if cross_checking:
        # return the intersection of the two matches arrays (invert final_matches2 to point in the same direction)
        final_matches = intersect2d(final_matches, final_matches2[:, ::-1])

    return final_matches


# ============================================================================
# Exercise 1 - Fundamental matrix estimation        Contributor: Malik
# ============================================================================
def compute_fundamental_matrix(points1, points2):
    """Compute the fundamental matrix given the point correspondences.

    y'.T @ F @ y = 0

    y' = (y1', y2', 1)
    y = (y1, y2, 1)

    Parameters
    ------------
    points1, points2 - array with shape [n, 3]
        corresponding points in images represented as
        homogeneous coordinates
    """
    # build one row [x'x, x'y, x', y'x, y'y, y', x, y, 1] per correspondence
    x1, y1 = points1[:, 0], points1[:, 1]
    x2, y2 = points2[:, 0], points2[:, 1]
    A = np.stack(
        [x2 * x1, x2 * y1, x2, y2 * x1, y2 * y1, y2, x1, y1, np.ones_like(x1)],
        axis=1,
    )

    # solution is the null-space vector (smallest singular value)
    _, _, Vt = np.linalg.svd(A)
    F = Vt[-1].reshape(3, 3)

    # enforce rank 2 by zeroing the smallest singular value
    U, S, Vt = np.linalg.svd(F)
    S[-1] = 0
    F = U @ np.diag(S) @ Vt
    return F


def compute_fundamental_matrix_normalized(points1, points2):
    """
    Normalize points by calculating the centroid, subtracting
    it from the points and scaling the points such that the distance
    from the origin is sqrt(2)

    Parameters
    ------------
    points1, points2 - with shape [n, 2]
    """

    # Hartley normalization: center the points and scale so the mean distance
    # to the origin is sqrt(2), which improves the conditioning of the system
    def _normalize(points):
        centroid = points.mean(axis=0)
        shifted = points - centroid
        # mean distance to the origin after centering
        mean_dist = np.mean(np.sqrt(np.sum(shifted**2, axis=1)))
        # scale so that the mean distance becomes sqrt(2)
        scale = np.sqrt(2) / mean_dist
        T = np.array(
            [
                [scale, 0, -scale * centroid[0]],
                [0, scale, -scale * centroid[1]],
                [0, 0, 1],
            ]
        )
        points_h = np.hstack((points, np.ones((len(points), 1))))
        points_norm = (T @ points_h.T).T
        return points_norm, T

    points1_norm, T1 = _normalize(np.asarray(points1, dtype=np.float64))
    points2_norm, T2 = _normalize(np.asarray(points2, dtype=np.float64))

    # estimate in normalized space, then denormalize: F = T2^T F_norm T1
    F_norm = compute_fundamental_matrix(points1_norm, points2_norm)
    F = T2.T @ F_norm @ T1
    return F / F[2, 2]


# ============================================================================
# Exercise 2 - Block matching disparity & depth      Contributor: Schams
# ============================================================================
def get_max_expected_disparity(points1: np.ndarray, points2: np.ndarray) -> int:
    """
    Calculates the maximum expected horizontal disparity from matched points.

    It computes the absolute horizontal difference for each matched pair,
    takes the 99th percentile of these disparities.

    Args:
        points1 (np.ndarray): A (N, 2) NumPy array of (x, y) coordinates for
                              matched keypoints in the first image.
        points2 (np.ndarray): A (N, 2) NumPy array of (x, y) coordinates for
                              matched keypoints in the second image,
                              corresponding to pts1_xy.

    Returns:
        int: The estimated maximum expected disparity, rounded up to the nearest integer.
    """
    # 99th percentile of the horizontal shift (robust to outlier matches)
    horizontal_disparities = np.abs(points1[:, 0] - points2[:, 0])
    return int(np.ceil(np.percentile(horizontal_disparities, 99)))


def _windowed_sum(values: np.ndarray, window_size: int) -> np.ndarray:
    """Sum the values over a (window_size x window_size) window per pixel.

    Implemented with an integral image (cumulative sums) so the cost is
    independent of the window size. Borders use a clipped (shrinking) window.
    """
    height, width = values.shape
    integral = np.zeros((height + 1, width + 1), dtype=np.float64)
    integral[1:, 1:] = np.cumsum(np.cumsum(values, axis=0), axis=1)

    half = window_size // 2
    rows = np.arange(height)
    cols = np.arange(width)
    r0 = np.clip(rows - half, 0, height)
    r1 = np.clip(rows + half + 1, 0, height)
    c0 = np.clip(cols - half, 0, width)
    c1 = np.clip(cols + half + 1, 0, width)

    # window sum via inclusion-exclusion on the integral image
    window_sum = integral[np.ix_(r1, c1)] - integral[np.ix_(r0, c1)] - integral[np.ix_(r1, c0)] + integral[np.ix_(r0, c0)]
    return window_sum


def compute_disparity_map(img_fixed: np.ndarray, img_search: np.ndarray, window_size: int, max_disparity: int, direction: str = "L->R") -> np.ndarray:
    """
    Computes the disparity map using Sum of Absolute Differences (SAD) over a local window.
    Searches along the same scanline.

    Args:
        img_fixed (np.ndarray): The reference image against which blocks are matched.
        img_search (np.ndarray): The target image to search for matches.
        window_size (int): Dimensions of the block matching window (e.g. 5x5).
        max_disparity (int): The maximum disparity search range.
        direction (str): 'L->R' if img_fixed is the left image, 'R->L' if it is the right image.

    Returns:
        np.ndarray: Calculated disparity map of shape (H, W).
    """
    height, width = img_fixed.shape
    best_cost = np.full((height, width), np.inf, dtype=np.float64)
    best_disparity = np.zeros((height, width), dtype=np.float64)

    for d in tqdm(range(max_disparity + 1), desc=f"Disparity {direction}", leave=False):
        diff = np.zeros((height, width), dtype=np.float64)
        if direction == "L->R":
            # left is fixed: corresponding point in the right image is at x - d
            diff[:, d:] = np.abs(img_fixed[:, d:] - img_search[:, : width - d])
        else:  # "R->L": right is fixed, match in the left image at x + d
            diff[:, : width - d] = np.abs(img_fixed[:, : width - d] - img_search[:, d:])

        cost = _windowed_sum(diff, window_size)

        # pixels without a valid match for this disparity must not be selected
        if direction == "L->R":
            cost[:, :d] = np.inf
        elif d > 0:
            cost[:, width - d :] = np.inf

        improved = cost < best_cost
        best_disparity[improved] = d
        best_cost[improved] = cost[improved]

    return best_disparity


def cross_check_disparities(disparity_L: np.ndarray, disparity_R: np.ndarray, threshold: float = 0.5) -> np.ndarray:
    """
    Performs cross-checking on L-R and R-L disparity maps to filter inconsistent matches.
    A match D_L(y, x) is consistent if D_R(y, x - D_L(y, x)) is close to D_L(y, x).

    Args:
        disparity_L (np.ndarray): Left-to-Right disparity map (H, W).
        disparity_R (np.ndarray): Right-to-Left disparity map (H, W).
        threshold (float): Maximum allowed absolute difference for consistency.

    Returns:
        np.ndarray: Cross-checked disparity map (H, W). Invalid matches are set to 0.
    """
    # match of left pixel x sits at x - D_L; keep it only if D_R there agrees
    height, width = disparity_L.shape
    xs = np.arange(width)[None, :].repeat(height, axis=0)
    x_match = xs - disparity_L.astype(int)

    valid = x_match >= 0
    x_match_clipped = np.clip(x_match, 0, width - 1)
    disparity_R_at_match = np.take_along_axis(disparity_R, x_match_clipped, axis=1)

    consistent = valid & (np.abs(disparity_L - disparity_R_at_match) <= threshold)
    return np.where(consistent, disparity_L, 0)


def estimate_depth(disparity_map: np.ndarray, focal_length_pixels: float, baseline_meters: float) -> np.ndarray:
    """
    Estimates scene depth from a disparity map.

    Args:
        disparity_map (np.ndarray): The computed disparity map.
        focal_length_pixels (float): Camera focal length in pixels (from camera calibration).
        baseline_meters (float): Distance between camera optical centers in meters.

    Returns:
        np.ndarray: A depth map representing Z coordinate values.
    """
    # triangulation: Z = f * B / d; disparity 0 means no match -> inf
    depth_map = np.full_like(disparity_map, np.inf, dtype=np.float64)
    valid = disparity_map > 0
    depth_map[valid] = focal_length_pixels * baseline_meters / disparity_map[valid]
    return depth_map


# ============================================================================
# Exercise 3 - MRF smoothing (graph cuts)            Contributor: Samer
# ============================================================================
def apply_mrf(disparity_map: np.ndarray, max_disparity: int, lambda_: int = 3) -> np.ndarray:
    """
    Apply a Markov Random Field to a disparity map to fill holes and remove noise.
    Requires gco-wrapper.

    Args:
        disparity_map (np.ndarray): The initial (noisy) disparity map.
        max_disparity (int): The maximum disparity label possible.
        lambda_ (int): Scaling smoothness penalty parameter.

    Returns:
        np.ndarray: The smoothed disparity map after MRF application.
    """
    # labels are the integer disparities 0..max_disparity
    depths = np.arange(0, max_disparity + 1)

    unary_cost = _calc_unary_costs(disparity_map, depths).astype(np.int32)
    pairwise_cost = _calc_binary_costs(depths, lambda_).astype(np.int32)

    # alpha-expansion graph cut on a 4-connected grid
    labels = gco.cut_grid_graph_simple(unary_cost, pairwise_cost, connect=4, n_iter=-1)

    smoothed = depths[labels.reshape(disparity_map.shape)]
    return smoothed.astype(disparity_map.dtype)


def _calc_unary_costs(depth_map: np.ndarray, depths: np.ndarray) -> np.ndarray:
    """
    Calculate the unary costs for the MRF.
    Costs are equal to the absolute difference between the current depth and the proposed depth.

    Args:
        depth_map (np.ndarray): The current depth map.
        depths (np.ndarray): Array of possible disparity/depth labels.

    Returns:
        np.ndarray: Calculated unary costs of shape (H, W, len(depths)).
    """
    # data term: |measured - label| for each pixel and label
    return np.abs(depth_map[:, :, None] - depths[None, None, :])


def _calc_binary_costs(depths: np.ndarray, lambda_: int) -> np.ndarray:
    """
    Calculate the binary costs for the MRF.
    Costs are equal to the absolute difference between the two depths, multiplied by lambda.

    Args:
        depths (np.ndarray): Array of possible depth/disparity labels.
        lambda_ (int): The smoothness penalty weight.

    Returns:
        np.ndarray: Pairwise cost matrix of shape (len(depths), len(depths)).
    """
    # smoothness term: lambda * |label_i - label_j|
    return lambda_ * np.abs(depths[:, None] - depths[None, :])


def extract_surface_marching_squares(depth_map: np.ndarray, isovalue: float) -> list:
    """
    Implement the marching squares algorithm to extract isosurfaces from the depth map.

    Args:
        depth_map (np.ndarray): The smoothed depth map grid.
        isovalue (float): The threshold depth value corresponding to the surface.

    Returns:
        list: A list of line segments where each segment is a tuple of coordinates: [((x1, y1), (x2, y2)), ...]
    """
    # TODO: Implement the marching squares algorithm
    # Hint: You must resolve the ambiguous saddle cases (where opposite corners share the same sign)
    # by subsampling the center of the cell (i.e. computing the average of the 4 corners).
    pass
