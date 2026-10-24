import type { PocketEngraving } from '../types/common.ts';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {
	computeWidthPasses,
	validateWidthCoverage,
	computeCenterOffset,
} from '../utils/pocket-utils.ts';

export interface EngravingRect {
	name: string;
	x: number;
	y: number;
	width: number;
	height: number;
	pocketEngraving?: PocketEngraving;
}

/**
 * Generate G-code for pocket engraving (groove for back panel)
 * Engraving is done BEFORE profile cutting to ensure panel stability
 */
export function generatePocketEngravingGCode(
	rect: EngravingRect,
	orientation: 'horizontal' | 'vertical',
	feedRate: number,
	safeZ: number,
	kerfThickness: number,
): string {
	if (!rect.pocketEngraving?.enabled) return '';

	const engraving = rect.pocketEngraving;
	let gcode = '';

	gcode += `; --- POCKET ENGRAVING for ${rect.name} ---\n`;
	gcode += `; Groove: ${engraving.width}mm wide x ${engraving.depth}mm deep\n`;

	// Calculate groove position based on panel position and engraving side
	const passes = Math.ceil(engraving.depth / 2); // 2mm per pass for engraving
	const passDepthIncrement = engraving.depth / passes;

	// Determine groove coordinates based on which side of the panel needs the groove
	// The groove runs along the back edge of the panel
	const gapStart = engraving.gapStart ?? 0;
	const gapEnd = engraving.gapEnd ?? 0;

	let startX: number, startY: number, endX: number, endY: number;

	switch (engraving.side) {
		case 'left-back':
		case 'right-back':
			// Vertical groove along the back edge (depth direction)
			// For side panels: groove runs along the shorter dimension (depth of cabinet)
			{
				// Use explicit offset if provided (Outer Pocket uses 0 + width/2), otherwise default to 10mm + width/2
				const center =
					engraving.offsetFromEdge !== undefined
						? engraving.offsetFromEdge
						: computeCenterOffset(engraving.width, 10);
				startX = rect.x + (engraving.side==='left-back'?center:rect.width-center);
			}
			startY = rect.y + gapStart;
			endX = startX;
			endY = rect.y + rect.height - gapEnd;
			break;
		case 'top-back':
		case 'bottom-back':
			// Horizontal groove along the back edge
			// For top/bottom panels: groove runs along the width
			{
				// Use explicit offset if provided (Outer Pocket uses 0 + width/2), otherwise default to 10mm + width/2
				const center =
					engraving.offsetFromEdge !== undefined
						? engraving.offsetFromEdge
						: computeCenterOffset(engraving.width, 10);
				startX = rect.x + gapStart;
				startY = rect.y + (engraving.side==='bottom-back'?center:rect.height-center);
				endX = rect.x + rect.width - gapEnd;
				endY = startY;
			}
			break;
		default:
			return '';
	}

	// Apply rotation if needed
	if (orientation === 'vertical') {
		[startX, startY] = [startY, startX];
		[endX, endY] = [endY, endX];
	}

	const { offsets } = computeWidthPasses(engraving.width, kerfThickness, 0.05);
	if (!validateWidthCoverage(engraving.width, kerfThickness, 0.05)) {
		return '';
	}

	// Generate engraving passes across width offsets and depth increments
	for (let pass = 1; pass <= passes; pass++) {
		const depth = -(pass * passDepthIncrement);
		for (const off of offsets) {
			const sx = startX;
			const sy = startY;
			const ex = endX;
			const ey = endY;
			let ox1 = sx,
				oy1 = sy,
				ox2 = ex,
				oy2 = ey;
			if (startX === endX) {
				ox1 = sx + off;
				ox2 = ex + off;
			} else {
				oy1 = sy + off;
				oy2 = ey + off;
			}
			gcode += `G00 Z${safeZ}\n`;
			gcode += `G00 X${ox1.toFixed(3)} Y${oy1.toFixed(3)}\n`;
			gcode += `G01 Z${depth.toFixed(3)} F${feedRate}\n`;
			gcode += `G01 X${ox2.toFixed(3)} Y${oy2.toFixed(3)} F${feedRate}\n`;
			gcode += `G00 Z${safeZ}\n`;
		}
	}

	gcode += `; --- END POCKET ENGRAVING ---\n\n`;

	return gcode;
}
