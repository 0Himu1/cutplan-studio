import { CutType, PocketEngraving, Notch } from './common.ts';

export interface NestedItem {
	x: number;
	y: number;
	width: number;
	height: number;
	name: string;
	boardType: string;
	// Panel specific
	pocketEngraving?: PocketEngraving;
	notches?: Notch[];
	// Circle specific
	type?: 'panel' | 'circle';
	diameter?: number;
	cutType?: CutType;
	depth?: number;
	rotated?: boolean;
	originalName?: string;
}

export interface NestedBin {
	width: number;
	height: number;
	rects: NestedItem[];
}
