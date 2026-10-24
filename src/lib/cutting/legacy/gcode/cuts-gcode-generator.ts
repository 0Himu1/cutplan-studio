import type { BoardConfig } from '../types/common.ts';
export interface SingleCut {id:string;name:string;orientation:'vertical'|'horizontal';distance:number;refEdge:'start'|'end';quantity:number;}

export function generateSingleCutsGCode(
	cuts: SingleCut[],
	boardConfig: BoardConfig,
	passCount: number = 2,
	orientation: 'vertical' | 'horizontal' = 'vertical', // machine orientation, not cut orientation
	safeZ: number = 10
): string {
	const { boardWidth, boardHeight, boardThickness, kerfThickness } =
		boardConfig;

	const feedRate = 2000;
	const plungeRate = 800;
	const spindleSpeed = 18000;
	const passDepth = boardThickness / passCount;
	// Use provided safeZ or default to 10
	const retractZ = safeZ;

	// Extend cut by bit diameter to ensure clean cut through edge
	const extension = kerfThickness;

	let gcode = '';
	gcode += '; CNC Single Cuts G-Code\n';
	gcode += `; Generated: ${new Date().toISOString()}\n`;
	gcode += `; Board Size: ${boardWidth}x${boardHeight}x${boardThickness}\n`;
	gcode += `; Passes: ${passCount} (Depth per pass: ${passDepth.toFixed(
		2
	)}mm)\n\n`;

	// Machine Setup
	gcode += 'G21                 ; Metric (mm)\n';
	gcode += 'G90                 ; Absolute positioning\n';
	gcode += 'G17                 ; XY plane\n';
 gcode += `G00 Z${safeZ}\n`;
	gcode += `M3 S${spindleSpeed}       ; Spindle ON\n`;
	gcode += 'G04 P1              ; Dwell 1 second\n\n';

	// Helper to rotate point if machine orientation is vertical
	const transform = (x: number, y: number) => {
		if (orientation === 'vertical') {
			return { x: y, y: x };
		}
		return { x, y };
	};

	for (const cut of cuts) {
		gcode += `; --- Cut: ${cut.name} (${cut.orientation} @ ${cut.distance} from ${cut.refEdge}) ---\n`;

		let startX = 0,
			startY = 0,
			endX = 0,
			endY = 0;

		if (cut.orientation === 'vertical') {
			// Cut Line is Vertical (X constant)
			let x = cut.distance;
			if (cut.refEdge === 'end') {
				x = boardWidth - cut.distance;
			}

			// Validate bounds
			if (x < 0 || x > boardWidth) {
				gcode += `; SKIP: Cut out of bounds (X=${x})\n`;
				continue;
			}

			// Cut from bottom to top (Y)
			startX = x;
			startY = -extension;
			endX = x;
			endY = boardHeight + extension;
		} else {
			// Cut Line is Horizontal (Y constant)
			let y = cut.distance;
			if (cut.refEdge === 'end') {
				y = boardHeight - cut.distance;
			}

			if (y < 0 || y > boardHeight) {
				gcode += `; SKIP: Cut out of bounds (Y=${y})\n`;
				continue;
			}

			// Cut from left to right (X)
			startX = -extension;
			startY = y;
			endX = boardWidth + extension;
			endY = y;
		}

		// Apply Machine Orientation Rotation
		const p1 = transform(startX, startY);
		const p2 = transform(endX, endY);

		gcode += `G00 Z${safeZ}\n`;
		gcode += `G00 X${p1.x.toFixed(3)} Y${p1.y.toFixed(3)}\n`;

		for (let pass = 1; pass <= passCount; pass++) {
			let z = pass * passDepth;
			if (z > boardThickness) z = boardThickness + 0.5; // slight overcut for through cut? verify.

			gcode += `G01 Z-${z.toFixed(3)} F${plungeRate}\n`;
			gcode += `G01 X${p2.x.toFixed(3)} Y${p2.y.toFixed(3)} F${feedRate}\n`;

			// If not last pass, rapid back to start? Or cut back?
			// Standard simple: Rapid Z up, Rapid back to start.
			if (pass < passCount) {
				gcode += `G00 Z${safeZ}\n`;
				gcode += `G00 X${p1.x.toFixed(3)} Y${p1.y.toFixed(3)}\n`;
			}
		}
		gcode += `G00 Z${safeZ}\n\n`;
	}

	// Program End
	gcode += `G00 Z${retractZ}           ; Final retract\n`;
	gcode += 'M5                     ; Spindle OFF\n';
	gcode += 'M30                    ; End program\n';

	return gcode;
}
