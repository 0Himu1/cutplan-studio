import type { Panel, Circle, CutType, PocketEngraving, Notch } from '../types/common.ts';
import type { NestedBin } from '../types/nesting.ts';

export type PackingAlgorithm = 'basic' | 'maxrects' | 'guillotine' | 'optimized';

interface Rect {
	width: number;
	height: number;
	name: string;
	boardType: string;
	x?: number;
	y?: number;
	// Panel specific
	pocketEngraving?: PocketEngraving;
	// Circle specific
	type?: 'panel' | 'circle';
	diameter?: number;
	cutType?: CutType;
	depth?: number;
	originalName?: string;
	notches?: Notch[];
}

interface FreeRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

const DEFAULT_KERF_THICKNESS = 3;

// --- Basic Packer (Shelf) ---
function packBasic(
	rects: Rect[],
	boardWidth: number,
	boardHeight: number,
	gap: number,
	allowRotation: boolean,
	alreadySorted: boolean = false,
): NestedBin[] {
	const bins: NestedBin[] = [];
	// Sort by height descending
	const sorted = alreadySorted
		? rects
		: rects.slice().sort((a, b) => b.height - a.height || b.width - a.width);

	bins.push({ width: boardWidth, height: boardHeight, rects: [] });
	let shelves: { y: number; height: number; x: number }[] = [];
	let currentY = 0;

	for (const r of sorted) {
		let placed = false;
		// Try to fit in existing shelves
		for (let si = 0; si < shelves.length && !placed; si++) {
			const sh = shelves[si];
			let w = r.width;
			let h = r.height;
			let useRot = false;
			if (allowRotation) {
				const fitsRot = sh.x + h <= boardWidth && w <= sh.height && sh.y + w <= boardHeight;
				const fits = sh.x + w <= boardWidth && h <= sh.height && sh.y + h <= boardHeight;
				if (!fits && fitsRot) {
					useRot = true;
					w = h;
					h = r.width;
				}
			}
			if (sh.x + w <= boardWidth && sh.y + h <= boardHeight) {
				bins[bins.length - 1].rects.push({
					x: sh.x,
					y: sh.y,
					width: w,
					height: h,
					name: r.name,
					boardType: r.boardType,
					pocketEngraving: r.pocketEngraving,
					type: r.type,
					diameter: r.diameter,
					cutType: r.cutType,

					originalName: r.originalName,
					notches: useRot
						? r.notches?.map(n => {
								const sideMap: Record<string, string> = {
									'bottom-left': 'bottom-left',
									'top-right': 'top-right',
									'bottom-right': 'top-left',
									'top-left': 'bottom-right',
								};
								return {
									...n,
									width: n.height,
									height: n.width,
									side: (sideMap[n.side] || n.side) as Notch['side'],
								};
							})
						: r.notches,
					depth: r.depth,
				});
				sh.x += w + gap;
				sh.height = Math.max(sh.height, h);
				placed = true;
			}
		}
		if (placed) continue;

		// Start new shelf
		let w = r.width;
		let h = r.height;
		if (allowRotation && w > h && h <= boardWidth && w > boardWidth) {
			const tmp = w;
			w = h;
			h = tmp;
		}

		if (currentY + h > boardHeight) {
			bins.push({ width: boardWidth, height: boardHeight, rects: [] });
			shelves = [];
			currentY = 0;
		}

		shelves.push({ y: currentY, height: h, x: 0 });
		bins[bins.length - 1].rects.push({
			x: 0,
			y: currentY,
			width: w,
			height: h,
			name: r.name,
			boardType: r.boardType,
			pocketEngraving: r.pocketEngraving,
			type: r.type,
			diameter: r.diameter,
			cutType: r.cutType,

			originalName: r.originalName,
			notches:
				w === r.height && h === r.width
					? r.notches?.map(n => {
							const sideMap: Record<string, string> = {
								'bottom-left': 'bottom-left',
								'top-right': 'top-right',
								'bottom-right': 'top-left',
								'top-left': 'bottom-right',
							};
							return {
								...n,
								width: n.height,
								height: n.width,
								side: (sideMap[n.side] || n.side) as Notch['side'],
							};
						})
					: r.notches,
			depth: r.depth,
		});
		shelves[shelves.length - 1].x = w + gap;
		currentY += h + gap;
	}
	return bins;
}

// --- MaxRects Packer ---
class MaxRectsBin {
	width: number;
	height: number;
	gap: number;
	freeRects: FreeRect[];
	placedRects: Rect[];

	constructor(width: number, height: number, gap: number) {
		this.width = width;
		this.height = height;
		this.gap = gap;
		this.freeRects = [{ x: 0, y: 0, width: width, height: height }];
		this.placedRects = [];
	}

	place(rect: Rect, allowRotation: boolean): boolean {
		let bestNode: FreeRect | null = null;
		let bestShortSideFit = Number.MAX_VALUE;
		let bestLongSideFit = Number.MAX_VALUE;
		let bestRotated = false;

		for (const free of this.freeRects) {
			// Try unrotated
			if (free.width >= rect.width && free.height >= rect.height) {
				const leftoverHoriz = Math.abs(free.width - rect.width);
				const leftoverVert = Math.abs(free.height - rect.height);
				const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
				const longSideFit = Math.max(leftoverHoriz, leftoverVert);

				if (
					shortSideFit < bestShortSideFit ||
					(shortSideFit === bestShortSideFit && longSideFit < bestLongSideFit)
				) {
					bestNode = {
						x: free.x,
						y: free.y,
						width: rect.width,
						height: rect.height,
					};
					bestShortSideFit = shortSideFit;
					bestLongSideFit = longSideFit;
					bestRotated = false;
				}
			}

			// Try rotated
			if (
				allowRotation &&
				free.width >= rect.height &&
				free.height >= rect.width
			) {
				const leftoverHoriz = Math.abs(free.width - rect.height);
				const leftoverVert = Math.abs(free.height - rect.width);
				const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
				const longSideFit = Math.max(leftoverHoriz, leftoverVert);

				if (
					shortSideFit < bestShortSideFit ||
					(shortSideFit === bestShortSideFit && longSideFit < bestLongSideFit)
				) {
					bestNode = {
						x: free.x,
						y: free.y,
						width: rect.height,
						height: rect.width,
					};
					bestShortSideFit = shortSideFit;
					bestLongSideFit = longSideFit;
					bestRotated = true;
				}
			}
		}

		if (bestNode) {
			this.placedRects.push({
				...rect,
				x: bestNode.x,
				y: bestNode.y,
				width: bestNode.width,
				height: bestNode.height,
				notches: bestRotated
					? rect.notches?.map(n => {
							const sideMap: Record<string, string> = {
								'bottom-left': 'bottom-left',
								'top-right': 'top-right',
								'bottom-right': 'top-left',
								'top-left': 'bottom-right',
							};
							return {
								...n,
								width: n.height,
								height: n.width,
								side: (sideMap[n.side] || n.side) as Notch['side'],
							};
						})
					: rect.notches,
			});
			this.splitFreeRects(bestNode);
			return true;
		}
		return false;
	}

	splitFreeRects(placed: FreeRect) {
		const newFreeRects: FreeRect[] = [];
		// Add gap to placed rect for splitting purposes
		const placedWithGap = {
			x: placed.x - this.gap,
			y: placed.y - this.gap,
			width: placed.width + 2 * this.gap,
			height: placed.height + 2 * this.gap,
		};

		for (const free of this.freeRects) {
			if (!this.isIntersecting(placedWithGap, free)) {
				newFreeRects.push(free);
				continue;
			}

			// Split free rect into up to 4 new rects
			if (
				placedWithGap.x < free.x + free.width &&
				placedWithGap.x + placedWithGap.width > free.x
			) {
				// New rect above
				if (
					placedWithGap.y > free.y &&
					placedWithGap.y < free.y + free.height
				) {
					newFreeRects.push({
						x: free.x,
						y: free.y,
						width: free.width,
						height: placedWithGap.y - free.y,
					});
				}
				// New rect below
				if (placedWithGap.y + placedWithGap.height < free.y + free.height) {
					newFreeRects.push({
						x: free.x,
						y: placedWithGap.y + placedWithGap.height,
						width: free.width,
						height:
							free.y + free.height - (placedWithGap.y + placedWithGap.height),
					});
				}
			}

			if (
				placedWithGap.y < free.y + free.height &&
				placedWithGap.y + placedWithGap.height > free.y
			) {
				// New rect left
				if (placedWithGap.x > free.x && placedWithGap.x < free.x + free.width) {
					newFreeRects.push({
						x: free.x,
						y: free.y,
						width: placedWithGap.x - free.x,
						height: free.height,
					});
				}
				// New rect right
				if (placedWithGap.x + placedWithGap.width < free.x + free.width) {
					newFreeRects.push({
						x: placedWithGap.x + placedWithGap.width,
						y: free.y,
						width:
							free.x + free.width - (placedWithGap.x + placedWithGap.width),
						height: free.height,
					});
				}
			}
		}

		// Filter contained rects
		this.freeRects = newFreeRects.filter((r, i) => {
			for (let j = 0; j < newFreeRects.length; j++) {
				if (i === j) continue;
				if (this.isContained(r, newFreeRects[j])) return false;
			}
			return true;
		});
	}

	isIntersecting(r1: FreeRect, r2: FreeRect): boolean {
		return (
			r1.x < r2.x + r2.width &&
			r1.x + r1.width > r2.x &&
			r1.y < r2.y + r2.height &&
			r1.y + r1.height > r2.y
		);
	}

	isContained(r1: FreeRect, r2: FreeRect): boolean {
		return (
			r1.x >= r2.x &&
			r1.y >= r2.y &&
			r1.x + r1.width <= r2.x + r2.width &&
			r1.y + r1.height <= r2.y + r2.height
		);
	}
}

function packMaxRects(
	rects: Rect[],
	boardWidth: number,
	boardHeight: number,
	gap: number,
	allowRotation: boolean,
	alreadySorted: boolean = false,
): NestedBin[] {
	const bins: MaxRectsBin[] = [];
	// Sort by area descending (BSSF heuristic works well with this)
	const sorted = alreadySorted
		? rects
		: rects.slice().sort((a, b) => b.width * b.height - a.width * a.height);

	for (const rect of sorted) {
		let placed = false;
		for (const bin of bins) {
			if (bin.place(rect, allowRotation)) {
				placed = true;
				break;
			}
		}
		if (!placed) {
			const newBin = new MaxRectsBin(boardWidth, boardHeight, gap);
			if (newBin.place(rect, allowRotation)) {
				bins.push(newBin);
			} else {
				// Item too big for bin
				console.warn(`Item ${rect.name} too big for board`);
			}
		}
	}

	return bins.map(b => ({
		width: b.width,
		height: b.height,
		rects: b.placedRects.map(r => ({
			x: r.x ?? 0,
			y: r.y ?? 0,
			width: r.width,
			height: r.height,
			name: r.name,
			boardType: r.boardType,
			pocketEngraving: r.pocketEngraving,
			type: r.type,
			diameter: r.diameter,
			cutType: r.cutType,
			depth: r.depth,
			originalName: r.originalName,
			notches: r.notches,
		})),
	}));
}

// --- Guillotine Packer ---
class GuillotineBin {
	width: number;
	height: number;
	gap: number;
	freeRects: FreeRect[];
	placedRects: Rect[];

	constructor(width: number, height: number, gap: number) {
		this.width = width;
		this.height = height;
		this.gap = gap;
		this.freeRects = [{ x: 0, y: 0, width: width, height: height }];
		this.placedRects = [];
	}

	place(rect: Rect, allowRotation: boolean): boolean {
		let bestNode: FreeRect | null = null;
		let bestScore = Number.MAX_VALUE;
		let bestRotated = false;
		let bestIndex = -1;

		// Best Area Fit
		for (let i = 0; i < this.freeRects.length; i++) {
			const free = this.freeRects[i];

			// Try unrotated
			if (free.width >= rect.width && free.height >= rect.height) {
				const score = free.width * free.height - rect.width * rect.height;
				if (score < bestScore) {
					bestNode = free;
					bestScore = score;
					bestRotated = false;
					bestIndex = i;
				}
			}

			// Try rotated
			if (
				allowRotation &&
				free.width >= rect.height &&
				free.height >= rect.width
			) {
				const score = free.width * free.height - rect.width * rect.height;
				if (score < bestScore) {
					bestNode = free;
					bestScore = score;
					bestRotated = true;
					bestIndex = i;
				}
			}
		}

		if (bestNode && bestIndex !== -1) {
			const w = bestRotated ? rect.height : rect.width;
			const h = bestRotated ? rect.width : rect.height;

			this.placedRects.push({
				...rect,
				x: bestNode.x,
				y: bestNode.y,
				width: w,
				height: h,
				notches: bestRotated
					? rect.notches?.map(n => {
							const sideMap: Record<string, string> = {
								'bottom-left': 'bottom-left',
								'top-right': 'top-right',
								'bottom-right': 'top-left',
								'top-left': 'bottom-right',
							};
							return {
								...n,
								width: n.height,
								height: n.width,
								side: (sideMap[n.side] || n.side) as Notch['side'],
							};
						})
					: rect.notches,
			});

			// Split the free rect (Guillotine split)
			const free = this.freeRects.splice(bestIndex, 1)[0];

			const wWithGap = w + this.gap;
			const hWithGap = h + this.gap;

			const splitHorizontal = free.width - wWithGap < free.height - hWithGap;

			if (splitHorizontal) {
				// Split horizontally
				if (free.width > wWithGap) {
					this.freeRects.push({
						x: free.x + wWithGap,
						y: free.y,
						width: free.width - wWithGap,
						height: hWithGap > free.height ? free.height : hWithGap, // Clamp height
					});
				}
				if (free.height > hWithGap) {
					this.freeRects.push({
						x: free.x,
						y: free.y + hWithGap,
						width: free.width,
						height: free.height - hWithGap,
					});
				}
			} else {
				// Split vertically
				if (free.width > wWithGap) {
					this.freeRects.push({
						x: free.x + wWithGap,
						y: free.y,
						width: free.width - wWithGap,
						height: free.height,
					});
				}
				if (free.height > hWithGap) {
					this.freeRects.push({
						x: free.x,
						y: free.y + hWithGap,
						width: wWithGap > free.width ? free.width : wWithGap, // Clamp width
						height: free.height - hWithGap,
					});
				}
			}
			return true;
		}
		return false;
	}
}

function packGuillotine(
	rects: Rect[],
	boardWidth: number,
	boardHeight: number,
	gap: number,
	allowRotation: boolean,
	alreadySorted: boolean = false,
): NestedBin[] {
	const bins: GuillotineBin[] = [];
	// Sort by area descending
	const sorted = alreadySorted
		? rects
		: rects.slice().sort((a, b) => b.width * b.height - a.width * a.height);

	for (const rect of sorted) {
		let placed = false;
		for (const bin of bins) {
			if (bin.place(rect, allowRotation)) {
				placed = true;
				break;
			}
		}
		if (!placed) {
			const newBin = new GuillotineBin(boardWidth, boardHeight, gap);
			if (newBin.place(rect, allowRotation)) {
				bins.push(newBin);
			} else {
				console.warn(`Item ${rect.name} too big for board`);
			}
		}
	}

	return bins.map(b => ({
		width: b.width,
		height: b.height,
		rects: b.placedRects.map(r => ({
			x: r.x ?? 0,
			y: r.y ?? 0,
			width: r.width,
			height: r.height,
			name: r.name,
			boardType: r.boardType,
			pocketEngraving: r.pocketEngraving,
			type: r.type,
			diameter: r.diameter,
			cutType: r.cutType,
			depth: r.depth,
			originalName: r.originalName,
			notches: r.notches,
		})),
	}));
}

type SortingStrategy =
	| 'area'
	| 'longSide'
	| 'shortSide'
	| 'width'
	| 'height'
	| 'perimeter';

function getSorter(strategy: SortingStrategy) {
	switch (strategy) {
		case 'area':
			return (a: Rect, b: Rect) =>
				b.width * b.height - a.width * a.height || b.width - a.width;
		case 'longSide':
			return (a: Rect, b: Rect) =>
				Math.max(b.width, b.height) - Math.max(a.width, a.height) ||
				Math.min(b.width, b.height) - Math.min(a.width, a.height);
		case 'shortSide':
			return (a: Rect, b: Rect) =>
				Math.min(b.width, b.height) - Math.min(a.width, a.height) ||
				Math.max(b.width, b.height) - Math.max(a.width, a.height);
		case 'width':
			return (a: Rect, b: Rect) => b.width - a.width || b.height - a.height;
		case 'height':
			return (a: Rect, b: Rect) => b.height - a.height || b.width - a.width;
		case 'perimeter':
			return (a: Rect, b: Rect) =>
				b.width + b.height - (a.width + a.height) || b.width - a.width;
	}
}

function calculateScore(bins: NestedBin[]): number {
	if (bins.length === 0) return 0;
	// Main goal: minimize bins
	// Secondary goal: minimize bounding box of the last bin
	const lastBin = bins[bins.length - 1];
	let maxRight = 0;
	let maxBottom = 0;
	for (const r of lastBin.rects) {
		maxRight = Math.max(maxRight, r.x + r.width);
		maxBottom = Math.max(maxBottom, r.y + r.height);
	}
	const lastBinArea = maxRight * maxBottom;
	const totalPossibleArea = lastBin.width * lastBin.height;

	// Score = Bins + (normalized last bin usage)
	// Lower is better
	return bins.length + lastBinArea / totalPossibleArea;
}

function nestOptimized(
	rects: Rect[],
	boardWidth: number,
	boardHeight: number,
	gap: number,
	allowRotation: boolean,
): NestedBin[] {
	const algorithms: Exclude<PackingAlgorithm, 'optimized'>[] = [
		'maxrects',
		'guillotine',
	];
	const strategies: SortingStrategy[] = [
		'area',
		'longSide',
		'shortSide',
		'width',
		'height',
		'perimeter',
	];

	let bestBins: {
		bins: NestedBin[];
		algo: string;
		strategy: string;
	} | null = null;
	let bestScore = Number.MAX_VALUE;

	for (const algo of algorithms) {
		for (const strategy of strategies) {
			const sorted = rects.slice().sort(getSorter(strategy));
			let result: NestedBin[];

			switch (algo) {
				case 'maxrects':
					result = packMaxRects(
						sorted,
						boardWidth,
						boardHeight,
						gap,
						allowRotation,
						true,
					);
					break;
				case 'guillotine':
					result = packGuillotine(
						sorted,
						boardWidth,
						boardHeight,
						gap,
						allowRotation,
						true,
					);
					break;
				case 'basic':
				default:
					result = packMaxRects(
						sorted,
						boardWidth,
						boardHeight,
						gap,
						allowRotation,
						true,
					);
					break;
			}

			const score = calculateScore(result);
			if (score < bestScore) {
				bestScore = score;
				bestBins = {
					bins: result,
					algo,
					strategy,
				};
			}
		}
	}

	if (bestBins) {
		return bestBins.bins;
	}
	return [];
}

export function nestPanels(
	panels: Panel[],
	boardWidth: number = 2440,
	boardHeight: number = 1220,
	kerfThickness: number = DEFAULT_KERF_THICKNESS,
	allowRotation: boolean = false,
	padding?: number,
	algorithm: PackingAlgorithm = 'optimized',
	circles: Circle[] = [],
): NestedBin[] {
	const toPlace: Rect[] = [];
	panels.forEach(panel => {
		for (let i = 0; i < panel.quantity; i++) {
			toPlace.push({
				width: panel.width,
				height: panel.height,
				name: panel.quantity > 1 ? `${panel.name} #${i + 1}` : panel.name,
				boardType: panel.boardType,
				pocketEngraving: panel.pocketEngraving,
				type: 'panel',
				originalName: panel.name,
				notches: panel.notches,
			});
		}
	});

	// Add Circles to place
	circles.forEach(circle => {
		for (let i = 0; i < circle.quantity; i++) {
			toPlace.push({
				width: circle.diameter, // Packer handles spacing via gap arg
				height: circle.diameter,
				name: circle.quantity > 1 ? `${circle.name} #${i + 1}` : circle.name,
				boardType: 'mixed',
				type: 'circle',
				diameter: circle.diameter,
				cutType: circle.cutType,
				depth:
					typeof circle.depth === 'number' && circle.depth > 0
						? circle.depth
						: typeof circle.depth === 'string' && parseFloat(circle.depth) > 0
							? parseFloat(circle.depth)
							: undefined,
				originalName: circle.name,
			});
		}
	});

	if (toPlace.length === 0) return [];

	const gap = kerfThickness;
	const margin = padding !== undefined ? padding : 0;
	// Reduce effective board size by margin * 2
	const usableWidth = boardWidth - 2 * margin;
	const usableHeight = boardHeight - 2 * margin;

	// Helper to shift rects by margin
	const shiftBin = (bin: NestedBin): NestedBin => ({
		...bin,
		width: boardWidth, // Return original board size
		height: boardHeight,
		rects: bin.rects.map(r => ({
			...r,
			x: r.x + margin,
			y: r.y + margin,
		})),
	});

	switch (algorithm) {
		case 'optimized':
			return nestOptimized(
				toPlace,
				usableWidth,
				usableHeight,
				gap,
				allowRotation,
			).map(shiftBin);
		case 'maxrects':
			return packMaxRects(
				toPlace,
				usableWidth,
				usableHeight,
				gap,
				allowRotation,
			).map(shiftBin);
		case 'guillotine':
			return packGuillotine(
				toPlace,
				usableWidth,
				usableHeight,
				gap,
				allowRotation,
			).map(shiftBin);
		case 'basic':
		default:
			return packBasic(
				toPlace,
				usableWidth,
				usableHeight,
				gap,
				allowRotation,
			).map(shiftBin);
	}
}
