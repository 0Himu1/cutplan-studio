/**
 * Computes the number of passes and offsets for a pocket cut based on desired width and kerf.
 */
export function computeWidthPasses(
	desiredWidth: number,
	kerfThickness: number,
	tolerance: number = 0.05
) {
	const W = Math.max(0, Number(desiredWidth));
	const K = Math.max(0.001, Number(kerfThickness));
	const N = Math.max(1, Math.ceil(W / K));
	const step = N === 1 ? 0 : (W - K) / (N - 1);
	const coverage = K + (N - 1) * step;
	const offsets = [];
	for (let i = 0; i < N; i++) {
		offsets.push(step * (i - (N - 1) / 2));
	}
	if (Math.abs(coverage - W) > tolerance && N > 1) {
		const adjust = W - coverage;
		offsets[offsets.length - 1] += adjust;
	}
	const finalCoverage = K + (N - 1) * step + (N > 1 ? W - coverage : 0);
	return { offsets, coverage: finalCoverage, passes: N, step };
}

/**
 * Validates if the calculated coverage is within tolerance of the desired width.
 */
export function validateWidthCoverage(
	desiredWidth: number,
	kerfThickness: number,
	tolerance: number = 0.05
) {
	const { coverage } = computeWidthPasses(
		desiredWidth,
		kerfThickness,
		tolerance
	);
	return Math.abs(coverage - desiredWidth) <= tolerance;
}

/**
 * Computes a center offset for pocket placement.
 */
export function computeCenterOffset(width: number, clearanceMm: number) {
	const W = Math.max(0, Number(width));
	const C = Math.max(0, Number(clearanceMm));
	return W / 2 + C;
}
