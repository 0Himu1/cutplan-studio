export interface Notch {
	side: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
	width: number;
	height: number;
}

export interface PocketEngraving {
	enabled: boolean;
	side: 'left-back' | 'right-back' | 'top-back' | 'bottom-back'; // Which edge to engrave
	depth: number; // 6mm default
	width: number; // backThickness + 2mm
	length: number; // Full panel length
	offsetFromEdge: number; // Distance from outer edge to groove center
	gapStart?: number; // Optional: Gap at the start of the groove
	gapEnd?: number; // Optional: Gap at the end of the groove
}

export interface Panel {
	id: string;
	name: string;
	width: number;
	height: number;
	boardType: string;
	quantity: number;
	pocketEngraving?: PocketEngraving;
	notches?: Notch[];
	rotate?: boolean; // Sometimes used in forms
	projectId?: string; // ID of the project this panel belongs to
	completedQuantity?: number; // Number of items already cut
}

export interface AssemblyPart {
	name: string;
	width: number;
	height: number;
	thickness: number;
	position: [number, number, number]; // [x, y, z] in mm
	rotation: [number, number, number]; // [rx, ry, rz] in radians
	boardType: string;
	pocketEngraving?: PocketEngraving;
	notches?: Notch[];
	isDrawer?: boolean;
	hingeSide?: 'left' | 'right';
}

export type CutType = 'outside' | 'inside' | 'pocket';

export interface Circle {
	id: string;
	name: string;
	diameter: number;
	originalDiameter?: number;
	quantity: number;
	cutType: CutType;
	x?: number; // Used in nesting
	y?: number; // Used in nesting
	depth?: number;
	projectId?: string; // ID of the project this circle belongs to
	completedQuantity?: number; // Number of items already cut
}

export interface BoardConfig {
	boardWidth: number;
	boardHeight: number;
	boardThickness: number;
	kerfThickness: number;
	padding?: number;
	algorithm?: 'basic' | 'maxrects' | 'guillotine' | 'optimized';
}

// Category-specific board configuration (for multi-board system)
export interface CategoryBoardConfig {
	boardId?: string; // Stock board ID from backend
	boardWidth: number;
	boardHeight: number;
	boardThickness: number;
	baseMaterial?: string; // From selected board's baseMaterial property
}

// Multi-board configuration for 3 categories
export interface MultiBoardConfig {
	body: CategoryBoardConfig;
	front: CategoryBoardConfig;
	back: CategoryBoardConfig;
	kerfThickness: number;
	padding?: number;
	algorithm?: 'basic' | 'maxrects' | 'guillotine' | 'optimized';
}

export type PanelCategory = 'body' | 'front' | 'back';

export interface CategorizedNesting {
	body: unknown[]; // NestedBin[] - avoiding circular dep for now, but will fix in index
	front: unknown[];
	back: unknown[];
}

export interface VectorGCodeSettings {
	feedRate: number;
	zSafe: number;
	zDepth: number;
	passCount: number;
	scale?: number;
	unit?: 'mm' | 'inch';
	boardWidth?: number;
	boardHeight?: number;
	offsetX?: number;
	offsetY?: number;
	cutType?: 'on-line' | 'outside' | 'inside';
	bitDiameter?: number;
}
