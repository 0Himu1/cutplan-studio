import type { NestedBin } from '../types/nesting.ts';
import type { PocketEngraving, CutType, Notch } from '../types/common.ts';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

import {
	optimizePath,
	type GCodeAlgorithm,
	type CutLine,
} from './gcode-path-optimizer.ts';

import {
	generatePocketEngravingGCode,
	type EngravingRect,
} from './engraving-generator.ts';

interface Rect {
	name: string;
	x: number;
	y: number;
	width: number;
	height: number;
	cutType?: CutType;
	type?: 'panel' | 'circle';
	diameter?: number;
	depth?: number;
	pocketEngraving?: PocketEngraving;
	notches?: Notch[];
}

export function generateGCode(
	bins: NestedBin[],
	boardThickness: number,
	orientation: 'horizontal' | 'vertical' = 'horizontal',
	passCount: number = 4,
	kerfThickness: number = 0,
	algorithm: GCodeAlgorithm = 'scan-line',
	safeZ: number = 10,
 settings:{feedRate?:number;plungeRate?:number;spindleSpeed?:number}={},
): string {
	// Machine Settings
	const feedRate = settings.feedRate??2000; // Increased default feed for circles ref
	const plungeRate = settings.plungeRate??800;
	const spindleSpeed = settings.spindleSpeed??18000;
	const passDepth = boardThickness / passCount;
	// Use provided safeZ or default to 10
	const retractZ = safeZ;

	const kHalf = kerfThickness / 2;

	function rotateIfNeeded(rect: Rect, orientation: 'horizontal' | 'vertical') {
		if (orientation === 'horizontal') {
			return {
				x1: rect.x,
				y1: rect.y,
				x2: rect.x + rect.width,
				y2: rect.y + rect.height,
			};
		}

		return {
			x1: rect.y,
			y1: rect.x,
			x2: rect.y + rect.height,
			y2: rect.x + rect.width,
		};
	}

	let gcode = '';
	gcode += '; CNC Cabinet Cutting G-Code\n';
	gcode += `; Generated: ${new Date().toISOString()}\n`;
	gcode += `; Board Thickness: ${boardThickness}mm\n`;
	gcode += `; Passes: ${passCount} (Depth per pass: ${passDepth.toFixed(
		2,
	)}mm)\n`;
	gcode += `; Kerf: ${kerfThickness}mm\n`;
	gcode += `; Sheets: ${bins.length}\n\n`;

	// Machine Setup
	gcode += 'G21                 ; Metric (mm)\n';
	gcode += 'G90                 ; Absolute positioning\n';
	gcode += 'G17                 ; XY plane\n';
 gcode += `G00 Z${safeZ}\n`;
	gcode += `M3 S${spindleSpeed}       ; Spindle ON\n`;
	gcode += 'G04 P1              ; Dwell 1 second\n\n';

	for (let sheetIdx = 0; sheetIdx < bins.length; sheetIdx++) {
		const sheet = bins[sheetIdx];

		gcode += `; ===== SHEET ${sheetIdx + 1} / ${bins.length} =====\n`;
		gcode += `; Size: ${sheet.width}mm x ${sheet.height}mm\n\n`;

		if (!sheet.rects?.length) continue;

		// Cast to our extended Rect type
		const allRects = sheet.rects as Rect[];

		// Separate Circles and Panels
		const circles = allRects.filter(r => r.type === 'circle');
		const panels = allRects.filter(r => r.type !== 'circle'); // assume undefined is panel

		// ===== STEP 1: GENERATE POCKET ENGRAVINGS (PANELS) =====
		// Engravings must happen before any cutting to ensure panel stability
		let hasEngravings = false;
		for (const rect of panels) {
			if (rect.pocketEngraving?.enabled) {
				if (!hasEngravings) {
					gcode += '; ===== POCKET ENGRAVINGS (Before Cutting) =====\n';
					hasEngravings = true;
				}
				gcode += generatePocketEngravingGCode(
					rect as EngravingRect,
					orientation,
					200, // slower feed for engraving? keeping original 200
					safeZ,
					kerfThickness,
				);
			}
		}
		if (hasEngravings) {
			gcode += '; ===== END POCKET ENGRAVINGS =====\n\n';
		}

		// ===== STEP 1.5: CUT CIRCLES =====
		if (circles.length > 0) {
			gcode += '; ===== CIRCLE CUTS =====\n';
			for (const circle of circles) {
				// Determine Center (Nesting engine gives bounding box x,y)
				let centerX = circle.x + circle.width / 2;
				let centerY = circle.y + circle.height / 2;

				// Adjust for orientation
				if (orientation === 'vertical') {
					const temp = centerX;
					centerX = centerY;
					centerY = temp;
				}

				// Determine target depth accurately
				const rawDepth = circle.depth;
				const targetDepth =
					typeof rawDepth === 'number' && rawDepth > 0
						? rawDepth
						: typeof rawDepth === 'string' && parseFloat(rawDepth) > 0
							? parseFloat(rawDepth)
							: boardThickness;
				const r = (circle.diameter || circle.width) / 2;

				// Calculate passes for this specific circle
				const maxDepthPerPass = boardThickness / passCount;
				const requiredPasses = Math.ceil(targetDepth / maxDepthPerPass);

				gcode += `; Cutting ${circle.name} (Diam=${circle.diameter}, Type=${circle.cutType}, RequestedDepth=${rawDepth}, CalculatedDepth=${targetDepth})\n`;
				gcode += `G00 Z${safeZ}\n`;

				let cutRadius = r;
				if (circle.cutType === 'outside') {
					cutRadius = r + kHalf;
				} else if (circle.cutType === 'inside') {
					cutRadius = r - kHalf;
				}

				if (circle.cutType === 'pocket') {
					// Pocketing logic
					gcode += `G01 X${centerX.toFixed(3)} Y${centerY.toFixed(3)} F${feedRate}\n`;
					for (let pass = 1; pass <= requiredPasses; pass++) {
						const pocketMaxDepthPerPass = targetDepth / requiredPasses;
						let z = pass * pocketMaxDepthPerPass;
						if (z > targetDepth) z = targetDepth;

						gcode += `G01 Z-${z.toFixed(3)} F${plungeRate}\n`;

						const stepover = kerfThickness * 0.5;
						let currentR = 0;

						while (currentR < r - kHalf) {
							currentR += stepover;
							if (currentR > r - kHalf) currentR = r - kHalf;

							// Move to right side ring
							const ringStartX = centerX + currentR;
							const ringStartY = centerY;
							gcode += `G01 X${ringStartX.toFixed(3)} Y${ringStartY.toFixed(
								3,
							)} F${feedRate}\n`;
							// Full circle CCW
							gcode += `G03 X${ringStartX.toFixed(3)} Y${ringStartY.toFixed(
								3,
							)} I-${currentR.toFixed(3)} J0.000\n`;

							if (currentR >= r - kHalf) break;
						}
						// Return to center for next pass
						gcode += `G01 X${centerX.toFixed(3)} Y${centerY.toFixed(3)}\n`;
					}
					gcode += `G00 Z${safeZ}\n`;
				} else {
					// Profile Cut (Inside/Outside)
					if (cutRadius <= 0) {
						gcode += `; WARNING: Hole too small for tool\n`;
						continue;
					}

					// Start at East point
					const startX = centerX + cutRadius;
					const startY = centerY;

					gcode += `G00 X${startX.toFixed(3)} Y${startY.toFixed(3)}\n`;

					for (let pass = 1; pass <= requiredPasses; pass++) {
						let z = pass * maxDepthPerPass;
						if (z > targetDepth) z = targetDepth;

						gcode += `G01 Z-${z.toFixed(3)} F${plungeRate}\n`;
						gcode += `G03 X${startX.toFixed(3)} Y${startY.toFixed(
							3,
						)} I-${cutRadius.toFixed(3)} J0.000 F${feedRate}\n`;
					}
					gcode += `G00 Z${safeZ}\n`;
				}
				gcode += '\n';
			}
			gcode += '; ===== END CIRCLES =====\n\n';
		}

		// ===== STEP 2: GENERATE PROFILE CUTS (PANELS) =====
		if (panels.length === 0) continue;

		if (algorithm === 'one-by-one') {
			// ONE BY ONE STRATEGY:
			// Cut each panel completely before moving to the next.
			// Sort panels Left-to-Right by their minimum X coordinate.

			// Sort panels
			panels.sort((a, b) => {
				const rA = rotateIfNeeded(a, orientation);
				const rB = rotateIfNeeded(b, orientation);
				// Sort by X (leftmost X first)
				const xA = Math.min(rA.x1, rA.x2);
				const xB = Math.min(rB.x1, rB.x2);
				return xA - xB;
			});

			gcode += '; ===== ONE-BY-ONE PROFILE CUTS (Left to Right) =====\n';

			const cutHistory: { x1: number; y1: number; x2: number; y2: number }[] =
				[];

			// Helper to check if a segment is already covered by history
			// Returns true if the segment is fully covered by history
			// We use a small epsilon for float comparison
			const isSegmentCovered = (
				x1: number,
				y1: number,
				x2: number,
				y2: number,
			) => {
				const isHorizontal = Math.abs(y1 - y2) < 0.001;
				const isVertical = Math.abs(x1 - x2) < 0.001;

				if (!isHorizontal && !isVertical) return false; // Should be axis aligned

				// Normalize current segment
				const minPos = isHorizontal ? Math.min(x1, x2) : Math.min(y1, y2);
				const maxPos = isHorizontal ? Math.max(x1, x2) : Math.max(y1, y2);
				const fixedPos = isHorizontal ? y1 : x1;

				// Check against all history segments
				// We need to find if the union of overlapping history intervals covers [minPos, maxPos]
				const relevantIntervals: { start: number; end: number }[] = [];

				for (const h of cutHistory) {
					// Check alignment
					const hIsHorizontal = Math.abs(h.y1 - h.y2) < 0.001;
					if (hIsHorizontal !== isHorizontal) continue;

					const hFixedPos = hIsHorizontal ? h.y1 : h.x1;
					// Check fixed position match (within small tolerance, e.g. 0.01mm)
					if (Math.abs(hFixedPos - fixedPos) > 0.1) continue;

					// Get interval
					const hMin = isHorizontal
						? Math.min(h.x1, h.x2)
						: Math.min(h.y1, h.y2);
					const hMax = isHorizontal
						? Math.max(h.x1, h.x2)
						: Math.max(h.y1, h.y2);

					// Check overlap
					if (hMax > minPos && hMin < maxPos) {
						relevantIntervals.push({
							start: Math.max(hMin, minPos),
							end: Math.min(hMax, maxPos),
						});
					}
				}

				if (relevantIntervals.length === 0) return false;

				// Merge intervals and check coverage
				relevantIntervals.sort((a, b) => a.start - b.start);
				const coveredStart = relevantIntervals[0].start;
				let coveredEnd = relevantIntervals[0].end;

				// Since we just need to know if the WHOLE segment is covered,
				// check if coveredStart <= minPos. IF not, there's a gap at start.
				if (coveredStart > minPos + 0.001) return false;

				for (let i = 1; i < relevantIntervals.length; i++) {
					const next = relevantIntervals[i];
					if (next.start < coveredEnd + 0.001) {
						coveredEnd = Math.max(coveredEnd, next.end);
					} else {
						// Gap detected
						return false;
					}
				}

				return coveredEnd >= maxPos - 0.001;
			};

			for (let i = 0; i < panels.length; i++) {
				const panel = panels[i];
				const rect = rotateIfNeeded(panel, orientation);

				const minX = Math.min(rect.x1, rect.x2) - kHalf; //
				const maxX = Math.max(rect.x1, rect.x2) + kHalf;
				const minY = Math.min(rect.y1, rect.y2) - kHalf;
				const maxY = Math.max(rect.y1, rect.y2) + kHalf;

				gcode += `; Cutting Panel ${i + 1}: ${panel.name || 'Unnamed'}\n`;

				// Define 4 segments (Counter-Clockwise for external profile usually? Or standard loop)
				// Let's stick to the previous loop direction:
				// Start BL -> TL -> TR -> BR -> BL
				// 1. BL to TL (Left Edge): x=minX, y goes minY to maxY
				// 2. TL to TR (Top Edge): y=maxY, x goes minX to maxX
				// 3. TR to BR (Right Edge): x=maxX, y goes maxY to minY
				// 4. BR to BL (Bottom Edge): y=minY, x goes maxX to minX

				let segments = [
					{ x1: minX, y1: minY, x2: minX, y2: maxY, name: 'Left' },
					{ x1: minX, y1: maxY, x2: maxX, y2: maxY, name: 'Top' },
					{ x1: maxX, y1: maxY, x2: maxX, y2: minY, name: 'Right' },
					{ x1: maxX, y1: minY, x2: minX, y2: minY, name: 'Bottom' },
				];

				if (panel.notches && panel.notches.length > 0) {
					// Define polygon points
					// Start Bottom-Left
					const points = [
						{ x: minX, y: minY },
						{ x: minX, y: maxY },
						{ x: maxX, y: maxY },
						{ x: maxX, y: minY },
					];

					panel.notches.forEach(notch => {
						// Transform notch if orientation is vertical
						let nSide: Notch['side'] = notch.side;
						let nW = notch.width;
						let nH = notch.height;

						if (orientation === 'vertical') {
							// In vertical orientation, we swap X and Y.
							// So width becomes height, height becomes width.
							// Side mapping:
							// bottom-left -> bottom-left (stays same corner in swapped coords)
							// top-right -> top-right
							// bottom-right -> top-left
							// top-left -> bottom-right
							const sideMap: Record<string, string> = {
								'bottom-left': 'bottom-left',
								'top-right': 'top-right',
								'bottom-right': 'top-left',
								'top-left': 'bottom-right',
							};
							nSide = (sideMap[nSide] || nSide) as Notch['side'];
							nW = notch.height;
							nH = notch.width;
						}

						if (nSide === 'bottom-left') {
							// Replace Bottom-Left point
							const idx = points.findIndex(
								p =>
									Math.abs(p.x - minX) < 0.001 && Math.abs(p.y - minY) < 0.001,
							);
							if (idx !== -1) {
								points.splice(
									idx,
									1,
									{ x: minX + nW, y: minY },
									{ x: minX + nW, y: minY + nH },
									{ x: minX, y: minY + nH },
								);
							}
						} else if (nSide === 'bottom-right') {
							const brIdx = points.findIndex(
								p =>
									Math.abs(p.x - maxX) < 0.001 && Math.abs(p.y - minY) < 0.001,
							);
							if (brIdx !== -1) {
								points.splice(
									brIdx,
									1,
									{ x: maxX, y: minY + nH },
									{ x: maxX - nW, y: minY + nH },
									{ x: maxX - nW, y: minY },
								);
							}
						} else if (nSide === 'top-left') {
							const tlIdx = points.findIndex(
								p =>
									Math.abs(p.x - minX) < 0.001 && Math.abs(p.y - maxY) < 0.001,
							);
							if (tlIdx !== -1) {
								points.splice(
									tlIdx,
									1,
									{ x: minX, y: maxY - nH },
									{ x: minX + nW, y: maxY - nH },
									{ x: minX + nW, y: maxY },
								);
							}
						} else if (nSide === 'top-right') {
							const trIdx = points.findIndex(
								p =>
									Math.abs(p.x - maxX) < 0.001 && Math.abs(p.y - maxY) < 0.001,
							);
							if (trIdx !== -1) {
								points.splice(
									trIdx,
									1,
									{ x: maxX - nW, y: maxY },
									{ x: maxX - nW, y: maxY - nH },
									{ x: maxX, y: maxY - nH },
								);
							}
						}
					});

					// Convert points to segments
					const notchedSegments = [];
					for (let pIdx = 0; pIdx < points.length; pIdx++) {
						const nextIdx = (pIdx + 1) % points.length;
						notchedSegments.push({
							x1: points[pIdx].x,
							y1: points[pIdx].y,
							x2: points[nextIdx].x,
							y2: points[nextIdx].y,
							name: `Seg-${pIdx}`,
						});
					}
					segments = notchedSegments;
				}

				// identify which segments to cut
				const segmentsToCut: typeof segments = [];

				for (const seg of segments) {
					// Check if ALREADY covered
					if (isSegmentCovered(seg.x1, seg.y1, seg.x2, seg.y2)) {
						// Skip
						continue;
					}
					segmentsToCut.push(seg);
				}

				// Add ALL segments to history for future panels check
				for (const seg of segments) {
					cutHistory.push({ x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2 });
				}

				if (segmentsToCut.length === 0) continue;

				// Generate GCode for segments to cut
				// We try to chain them if possible
				for (let pass = 1; pass <= passCount; pass++) {
					const depth = -(pass * passDepth);

					// Group contiguous segments
					// If we have Left, Top, Right... they are contiguous.
					// If we have Left, Right... they are not.
					// Simple approach: Iterate segmentsToCut. If start of current != end of previous, retract and move.

					let hasActivePath = false;
					let lastX = -99999;
					let lastY = -99999;

					for (let sIdx = 0; sIdx < segmentsToCut.length; sIdx++) {
						const seg = segmentsToCut[sIdx];

						// Check connectivity (tolerance)
						const isConnected =
							hasActivePath &&
							Math.abs(seg.x1 - lastX) < 0.001 &&
							Math.abs(seg.y1 - lastY) < 0.001;

						if (!isConnected) {
							// Retract if we were cutting
							if (hasActivePath) {
								gcode += `G00 Z${safeZ}\n`;
							}
							// Move to start
							gcode += `G00 Z${safeZ}\n`; // Safety first
							gcode += `G00 X${seg.x1.toFixed(3)} Y${seg.y1.toFixed(3)}\n`;
							gcode += `G01 Z${depth.toFixed(3)} F${plungeRate}\n`;
							hasActivePath = true;
						}

						// Cut segment
						gcode += `G01 X${seg.x2.toFixed(3)} Y${seg.y2.toFixed(
							3,
						)} F${feedRate}\n`;
						lastX = seg.x2;
						lastY = seg.y2;
					}

					if (hasActivePath) {
						gcode += `G00 Z${safeZ}\n`;
					}
				}
				gcode += '\n';
			}
			continue; // toggle regular profile cut generation off for 'one-by-one'
		}

		// ===== ORIGINAL ALGORITHM: GENERATE PROFILE EDGES =====
		if (panels.length === 0) continue;

		type Edge = {
			o: 'v' | 'h';
			pos: number;
			from: number;
			to: number;
			rectIdx: number;
			side: 'left' | 'right' | 'top' | 'bottom';
		};
		const edges: Edge[] = [];
		for (let i = 0; i < panels.length; i++) {
			const r = panels[i];
			const { x1, y1, x2, y2 } = rotateIfNeeded(r, orientation);
			edges.push({
				o: 'v',
				pos: x1,
				from: y1,
				to: y2,
				rectIdx: i,
				side: 'left',
			});
			edges.push({
				o: 'v',
				pos: x2,
				from: y1,
				to: y2,
				rectIdx: i,
				side: 'right',
			});
			edges.push({
				o: 'h',
				pos: y1,
				from: x1,
				to: x2,
				rectIdx: i,
				side: 'bottom',
			});
			edges.push({
				o: 'h',
				pos: y2,
				from: x1,
				to: x2,
				rectIdx: i,
				side: 'top',
			});
		}

		const used = new Set<number>();
		const lines: CutLine[] = [];
		const outerH: CutLine[] = [];
		const outerV: CutLine[] = [];

		for (let i = 0; i < edges.length; i++) {
			if (used.has(i)) continue;
			const e = edges[i];
			let matched = false;
			for (let j = i + 1; j < edges.length; j++) {
				if (used.has(j)) continue;
				const f = edges[j];
				if (e.o !== f.o) continue;
				if (e.rectIdx === f.rectIdx) continue;
				if (
					e.o === 'v' &&
					e.side === 'right' &&
					f.side === 'left' &&
					e.from === f.from &&
					e.to === f.to &&
					(Math.abs(f.pos - e.pos - kerfThickness) < 1e-6 ||
						Math.abs(f.pos - e.pos) < 1e-6)
				) {
					const cx =
						Math.abs(f.pos - e.pos - kerfThickness) < 1e-6
							? e.pos + kHalf
							: e.pos;
					lines.push({ x1: cx, y1: e.from, x2: cx, y2: e.to });
					used.add(i);
					used.add(j);
					matched = true;
					break;
				}
				if (
					e.o === 'h' &&
					e.side === 'top' &&
					f.side === 'bottom' &&
					e.from === f.from &&
					e.to === f.to &&
					(Math.abs(e.pos - f.pos - kerfThickness) < 1e-6 ||
						Math.abs(e.pos - f.pos) < 1e-6)
				) {
					const cy =
						Math.abs(e.pos - f.pos - kerfThickness) < 1e-6
							? e.pos + kHalf
							: e.pos;
					lines.push({ x1: e.from, y1: cy, x2: e.to, y2: cy });
					used.add(i);
					used.add(j);
					matched = true;
					break;
				}
			}
			if (matched) continue;
			if (e.o === 'v') {
				const x = e.side === 'left' ? e.pos - kHalf : e.pos + kHalf;
				outerV.push({ x1: x, y1: e.from, x2: x, y2: e.to });
			} else {
				const y = e.side === 'bottom' ? e.pos - kHalf : e.pos + kHalf;
				outerH.push({ x1: e.from, y1: y, x2: e.to, y2: y });
			}
		}

		// Merge colinear horizontal segments into continuous runs
		const byY = new Map<number, { start: number; end: number }[]>();
		for (const seg of outerH) {
			const y = seg.y1;
			const arr = byY.get(y) || [];
			arr.push({
				start: Math.min(seg.x1, seg.x2),
				end: Math.max(seg.x1, seg.x2),
			});
			byY.set(y, arr);
		}
		for (const [y, arr] of byY.entries()) {
			arr.sort((a, b) => a.start - b.start);
			let cur = arr[0];
			for (let i = 1; i < arr.length; i++) {
				const nxt = arr[i];
				if (nxt.start <= cur.end + kerfThickness + 1e-6) {
					cur.end = Math.max(cur.end, nxt.end);
				} else {
					lines.push({ x1: cur.start, y1: y, x2: cur.end, y2: y });
					cur = nxt;
				}
			}
			if (cur) lines.push({ x1: cur.start, y1: y, x2: cur.end, y2: y });
		}

		// Merge colinear vertical segments into continuous runs
		const byX = new Map<number, { start: number; end: number }[]>();
		for (const seg of outerV) {
			const x = seg.x1;
			const arr = byX.get(x) || [];
			arr.push({
				start: Math.min(seg.y1, seg.y2),
				end: Math.max(seg.y1, seg.y2),
			});
			byX.set(x, arr);
		}
		for (const [x, arr] of byX.entries()) {
			arr.sort((a, b) => a.start - b.start);
			let cur = arr[0];
			for (let i = 1; i < arr.length; i++) {
				const nxt = arr[i];
				if (nxt.start <= cur.end + kerfThickness + 1e-6) {
					cur.end = Math.max(cur.end, nxt.end);
				} else {
					lines.push({ x1: x, y1: cur.start, x2: x, y2: cur.end });
					cur = nxt;
				}
			}
			if (cur) lines.push({ x1: x, y1: cur.start, x2: x, y2: cur.end });
		}

		// Use path optimizer to order cuts efficiently
		const ordered = optimizePath(lines, algorithm, orientation);

		for (const line of ordered) {
			for (let pass = 1; pass <= passCount; pass++) {
				const depth = -(pass * passDepth);
				gcode += `G00 Z${safeZ}\n`;
				gcode += `G00 X${line.x1.toFixed(3)} Y${line.y1.toFixed(3)}\n`;
				gcode += `G01 Z${depth.toFixed(3)} F${plungeRate}\n`;
				gcode += `G01 X${line.x2.toFixed(3)} Y${line.y2.toFixed(
					3,
				)} F${feedRate}\n`;
				gcode += `G00 Z${safeZ}\n`;
			}
			gcode += `\n`;
		}
	}

	// Program End
	gcode += `G00 Z${retractZ}           ; Final retract\n`;
	gcode += 'M5                     ; Spindle OFF\n';
	gcode += 'M30                    ; End program\n';

	return gcode;
}

export interface GlassFrameOptions {
	doorWidth: number;
	doorHeight: number;
	frameTop: number;
	frameBottom: number;
	frameLeft: number;
	frameRight: number;
	bitDiameter: number;
	boardThickness: number;
	passCount: number;
	feedRate: number;
	plungeRate: number;
	spindleSpeed: number;
	safeZ: number;
}

export function generateGlassFrameGCode(options: GlassFrameOptions): string {
	const {
		doorWidth,
		doorHeight,
		frameTop,
		frameBottom,
		frameLeft,
		frameRight,
		bitDiameter,
		boardThickness,
		passCount,
		feedRate,
		plungeRate,
		spindleSpeed,
		safeZ,
	} = options;

	const holeWidth = doorWidth - frameLeft - frameRight;
	const holeHeight = doorHeight - frameTop - frameBottom;
	const bitRadius = bitDiameter / 2;

	if (holeWidth <= 0 || holeHeight <= 0)
		return '; Error: Frame widths are too large for door dimensions.';

	const x1 = frameLeft + bitRadius;
	const x2 = doorWidth - frameRight - bitRadius;
	const y1 = frameBottom + bitRadius;
	const y2 = doorHeight - frameTop - bitRadius;

	if (x2 <= x1 || y2 <= y1)
		return '; Error: Bit diameter too large for the hole size.';

	let gcode = '';
	gcode += '; CNC Glass Frame Hole Generator\n';
	gcode += `; Generated: ${new Date().toISOString()}\n`;
	gcode += `; Door: ${doorWidth}mm x ${doorHeight}mm\n`;
	gcode += `; Frame: T:${frameTop}, B:${frameBottom}, L:${frameLeft}, R:${frameRight}\n`;
	gcode += `; Hole: ${holeWidth.toFixed(2)}mm x ${holeHeight.toFixed(2)}mm\n`;
	gcode += `; Bit: ${bitDiameter}mm\n\n`;

	gcode += 'G21                 ; Metric (mm)\n';
	gcode += 'G90                 ; Absolute positioning\n';
	gcode += 'G17                 ; XY plane\n';
 gcode += `G00 Z${safeZ}\n`;
	gcode += `M3 S${spindleSpeed}       ; Spindle ON\n`;
	gcode += 'G04 P1              ; Dwell 1 second\n\n';

	const passDepth = boardThickness / passCount;

	for (let pass = 1; pass <= passCount; pass++) {
		const z = -(pass * passDepth);
		gcode += `; Pass ${pass}\n`;
		gcode += `G00 Z${safeZ}\n`;
		gcode += `G00 X${x1.toFixed(3)} Y${y1.toFixed(3)}\n`;
		gcode += `G01 Z${z.toFixed(3)} F${plungeRate}\n`;
		gcode += `G01 X${x2.toFixed(3)} Y${y1.toFixed(3)} F${feedRate}\n`;
		gcode += `G01 X${x2.toFixed(3)} Y${y2.toFixed(3)}\n`;
		gcode += `G01 X${x1.toFixed(3)} Y${y2.toFixed(3)}\n`;
		gcode += `G01 X${x1.toFixed(3)} Y${y1.toFixed(3)}\n`;
	}

	gcode += `\nG00 Z${safeZ}           ; Final retract\n`;
	gcode += 'M5                     ; Spindle OFF\n';
	gcode += 'M30                    ; End program\n';

	return gcode;
}
