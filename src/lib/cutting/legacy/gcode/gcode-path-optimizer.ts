export type GCodeAlgorithm =
	| 'nearest-neighbor'
	| '2-opt'
	| 'scan-line'
	| 'one-by-one';

export interface CutLine {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

/**
 * Calculate Euclidean distance between two points
 */
function distance(x1: number, y1: number, x2: number, y2: number): number {
	return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Calculate the distance from a point to the start of a line
 */
function distanceToLineStart(x: number, y: number, line: CutLine): number {
	return distance(x, y, line.x1, line.y1);
}

/**
 * Calculate the distance from a point to the end of a line
 */
function distanceToLineEnd(x: number, y: number, line: CutLine): number {
	return distance(x, y, line.x2, line.y2);
}

/**
 * Nearest Neighbor algorithm (Greedy TSP approximation)
 * Fast O(n²), produces ~15% longer paths than optimal
 */
function nearestNeighbor(lines: CutLine[]): CutLine[] {
	if (lines.length === 0) return [];

	const result: CutLine[] = [];
	const unvisited = new Set(lines.map((_, i) => i));

	// Start at origin (0, 0)
	let currentX = 0;
	let currentY = 0;

	while (unvisited.size > 0) {
		let nearestIdx = -1;
		let nearestDist = Infinity;
		let shouldReverse = false;

		// Find nearest unvisited line
		for (const idx of unvisited) {
			const line = lines[idx];

			// Check distance to start of line
			const distToStart = distanceToLineStart(currentX, currentY, line);
			if (distToStart < nearestDist) {
				nearestDist = distToStart;
				nearestIdx = idx;
				shouldReverse = false;
			}

			// Check distance to end of line (would need to reverse)
			const distToEnd = distanceToLineEnd(currentX, currentY, line);
			if (distToEnd < nearestDist) {
				nearestDist = distToEnd;
				nearestIdx = idx;
				shouldReverse = true;
			}
		}

		if (nearestIdx === -1) break;

		const line = lines[nearestIdx];
		if (shouldReverse) {
			result.push({ x1: line.x2, y1: line.y2, x2: line.x1, y2: line.y1 });
			currentX = line.x1;
			currentY = line.y1;
		} else {
			result.push(line);
			currentX = line.x2;
			currentY = line.y2;
		}

		unvisited.delete(nearestIdx);
	}

	return result;
}

/**
 * Calculate total travel distance for a path
 */
function calculateTotalDistance(lines: CutLine[]): number {
	if (lines.length === 0) return 0;

	let total = 0;
	let x = 0,
		y = 0;

	for (const line of lines) {
		// Travel to start of line
		total += distance(x, y, line.x1, line.y1);
		// Cut the line
		total += distance(line.x1, line.y1, line.x2, line.y2);
		// Update position
		x = line.x2;
		y = line.y2;
	}

	return total;
}

/**
 * 2-Opt optimization algorithm
 * Iteratively improves path by swapping edges
 */
function twoOpt(lines: CutLine[], maxIterations: number = 100): CutLine[] {
	if (lines.length < 4) return lines;

	// Start with nearest neighbor solution
	let route = nearestNeighbor(lines);
	let improved = true;
	let iterations = 0;

	while (improved && iterations < maxIterations) {
		improved = false;
		iterations++;

		for (let i = 0; i < route.length - 1; i++) {
			for (let j = i + 2; j < route.length; j++) {
				// Try swapping edges
				const newRoute = [...route];

				// Reverse segment between i+1 and j
				const segment = newRoute.slice(i + 1, j + 1).reverse();
				newRoute.splice(i + 1, j - i, ...segment);

				const currentDist = calculateTotalDistance(route);
				const newDist = calculateTotalDistance(newRoute);

				if (newDist < currentDist) {
					route = newRoute;
					improved = true;
				}
			}
		}
	}

	return route;
}

/**
 * Scan Line algorithm - OPTIMIZED FOR PANEL ATTACHMENT
 *
 * Cutting Strategy:
 * - Process all cuts from RIGHT to LEFT
 * - Horizontal cuts: Process right-most segments first, moving left
 * - Vertical cuts: Process right-most X positions first (highest X to lowest X)
 *
 * This ensures panels remain attached to the main board (left side)
 * until the final separating cuts are made, preventing "floating" panels
 * that can shift during center/internal cuts.
 */
function scanLine(
	lines: CutLine[],
	orientation: 'horizontal' | 'vertical' = 'horizontal'
): CutLine[] {
	if (lines.length === 0) return [];

	// Separate horizontal and vertical lines
	const horizontal = lines.filter(l => Math.abs(l.y1 - l.y2) < 1e-6);
	const vertical = lines.filter(l => Math.abs(l.x1 - l.x2) < 1e-6);

	const result: CutLine[] = [];

	// Always process cuts from right to left regardless of orientation
	// This keeps panels attached to the left side of the board

	// Group horizontal lines by Y coordinate
	const byY = new Map<number, CutLine[]>();
	for (const line of horizontal) {
		const y = line.y1;
		if (!byY.has(y)) byY.set(y, []);
		byY.get(y)!.push(line);
	}

	// Group vertical lines by X coordinate
	const byX = new Map<number, CutLine[]>();
	for (const line of vertical) {
		const x = line.x1;
		if (!byX.has(x)) byX.set(x, []);
		byX.get(x)!.push(line);
	}

	if (orientation === 'horizontal') {
		// HORIZONTAL ORIENTATION:
		// 1. Process horizontal lines first (by Y, top to bottom)
		// 2. Within each row, process right-to-left
		// 3. Then process vertical lines (by X, right to left)

		// Sort rows by Y coordinate (top to bottom, i.e., high Y to low Y)
		const sortedYs = Array.from(byY.keys()).sort((a, b) => b - a);

		for (const y of sortedYs) {
			const row = byY.get(y)!;
			// Sort by X descending (rightmost first) and cut right-to-left
			row.sort((a, b) => {
				const aRight = Math.max(a.x1, a.x2);
				const bRight = Math.max(b.x1, b.x2);
				return bRight - aRight;
			});

			for (const line of row) {
				// Ensure we cut from right to left (x2 > x1 means reverse)
				if (line.x1 < line.x2) {
					result.push({ x1: line.x2, y1: line.y2, x2: line.x1, y2: line.y1 });
				} else {
					result.push(line);
				}
			}
		}

		// Sort columns by X descending (rightmost first)
		const sortedXs = Array.from(byX.keys()).sort((a, b) => b - a);

		for (const x of sortedXs) {
			const col = byX.get(x)!;
			// Sort vertical cuts from top to bottom within each column
			col.sort((a, b) => {
				const aTop = Math.max(a.y1, a.y2);
				const bTop = Math.max(b.y1, b.y2);
				return bTop - aTop;
			});

			for (const line of col) {
				// Cut from top to bottom
				if (line.y1 < line.y2) {
					result.push({ x1: line.x2, y1: line.y2, x2: line.x1, y2: line.y1 });
				} else {
					result.push(line);
				}
			}
		}
	} else {
		// VERTICAL ORIENTATION:
		// 1. Process vertical lines first (by X, right to left)
		// 2. Within each column, process top to bottom
		// 3. Then process horizontal lines (by Y, top to bottom, right-to-left)

		// Sort columns by X descending (rightmost first)
		const sortedXs = Array.from(byX.keys()).sort((a, b) => b - a);

		for (const x of sortedXs) {
			const col = byX.get(x)!;
			// Sort vertical cuts from top to bottom
			col.sort((a, b) => {
				const aTop = Math.max(a.y1, a.y2);
				const bTop = Math.max(b.y1, b.y2);
				return bTop - aTop;
			});

			for (const line of col) {
				// Cut from top to bottom
				if (line.y1 < line.y2) {
					result.push({ x1: line.x2, y1: line.y2, x2: line.x1, y2: line.y1 });
				} else {
					result.push(line);
				}
			}
		}

		// Sort rows by Y descending (top first)
		const sortedYs = Array.from(byY.keys()).sort((a, b) => b - a);

		for (const y of sortedYs) {
			const row = byY.get(y)!;
			// Sort by X descending (rightmost first) and cut right-to-left
			row.sort((a, b) => {
				const aRight = Math.max(a.x1, a.x2);
				const bRight = Math.max(b.x1, b.x2);
				return bRight - aRight;
			});

			for (const line of row) {
				// Ensure we cut from right to left
				if (line.x1 < line.x2) {
					result.push({ x1: line.x2, y1: line.y2, x2: line.x1, y2: line.y1 });
				} else {
					result.push(line);
				}
			}
		}
	}

	return result;
}

/**
 * Main entry point for path optimization
 */
export function optimizePath(
	lines: CutLine[],
	algorithm: GCodeAlgorithm,
	orientation: 'horizontal' | 'vertical' = 'horizontal'
): CutLine[] {
	switch (algorithm) {
		case 'nearest-neighbor':
			return nearestNeighbor(lines);
		case '2-opt':
			return twoOpt(lines);
		case 'scan-line':
			return scanLine(lines, orientation);
		default:
			return lines;
	}
}
