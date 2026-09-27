// Geometry, timeline and flow helpers for the CCS (MEA absorption → compression) story.
// Everything is a pure function of story time t (seconds), so any frame renders exactly.
import {Easing, spring} from 'remotion';

export const FPS = 60;
export const T_END = 64; // story seconds (the story part of the video is 59 s)
export const FLOOR = 800;

export const INK = '#27313d';
export const M = {body: '#cfd8e2', shade: '#aab7c5', light: '#f6f9fb', top: '#e4eaf0', inner: '#5d6977'};
export const COL = {
	leanHot: '#1d4ed8', leanCool: '#60a5fa', richHot: '#ea580c',
	flue: '#e2e8f0', treated: '#f1f5f9', lean: '#93c5fd', rich: '#fdba74', steam: '#f8fafc', co2: '#fecaca',
	water: '#bfdbfe', cw: '#a5f3fc',
	leanDeep: '#3b82f6', richDeep: '#f97316',
};
export const MOLC = {CO2: '#dc2626', N2: '#94a3b8', O2: '#38bdf8', H2O: '#2563eb'};

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const pr = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const eio = Easing.inOut(Easing.cubic);
export const eo = Easing.out(Easing.cubic);
export const eob = (u: number) => {
	const c1 = 1.8, c3 = c1 + 1;
	return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};
export const h1 = (i: number) => {
	const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};
export const mixHex = (a: string, b: string, u: number) => {
	const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
	const A = p(a), B = p(b);
	return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(u)))).join(',')})`;
};

// ---------- part motion: fly in, then snap with a spring squash ----------
export type Tr = {dx: number; dy: number; sx: number; sy: number};
export function snapT(t: number, t0: number, t1: number, dx: number, dy: number, amp = 0.1): Tr | null {
	if (t < t0) return null;
	const vert = dy !== 0;
	if (t < t1) {
		const u = (t - t0) / (t1 - t0), e = 1 - Easing.in(Easing.quad)(u), st = 1 + 0.12 * u;
		return vert ? {dx: dx * e, dy: dy * e, sx: 1 / Math.sqrt(st), sy: st} : {dx: dx * e, dy: dy * e, sx: st, sy: 1 / Math.sqrt(st)};
	}
	const v = spring({frame: (t - t1) * FPS, fps: FPS, config: {damping: 7, stiffness: 260, mass: 0.5}});
	const s = amp * (1 - v);
	return vert ? {dx: 0, dy: 0, sx: 1 + s * 0.6, sy: 1 - s} : {dx: 0, dy: 0, sx: 1 - s, sy: 1 + s * 0.6};
}
export const popT = (t: number, t0: number): Tr | null => {
	if (t < t0) return null;
	const s = eob(pr(t, t0, t0 + 0.35));
	return {dx: 0, dy: 0, sx: s, sy: s};
};
export const trStr = (tr: Tr, px: number, py: number) =>
	`translate(${tr.dx + px} ${tr.dy + py}) scale(${tr.sx} ${tr.sy}) translate(${-px} ${-py})`;

// ---------- equipment ----------
export type Col = {cx: number; top: number; bot: number; r: number};
export const ABS: Col = {cx: 340, top: 110, bot: 730, r: 62};
export const STR: Col = {cx: 740, top: 170, bot: 700, r: 55};
// lean/rich exchanger: shell-and-tube, rich on the tube side (left -> right), lean on the shell side (bottom-right -> top-left)
export const HX = {x0: 450, x1: 620, y0: 500, y1: 560, hl: 430, hr: 640};
// kettle reboiler: shell, weir, overflow compartment on the right, steam channel head beyond it
export const REB = {x0: 810, x1: 950, y0: 695, y1: 757, weir: 915, ch: 966};
export const CND = {x0: 820, x1: 940, y0: 100, y1: 140};
export const DRUM = {x0: 950, x1: 1060, y0: 200, y1: 250};
export const COOLER = {x0: 461, x1: 489, y0: 330, y1: 390};
export const PUMPS = [{x: 378, y: 770, t: 3.8, on: 29.0}, {x: 760, y: 788, t: 3.95, on: 29.6}, {x: 930, y: 290, t: 4.1, on: 37.2}];
export const COMPS = [{x: 900, t: 4.6, on: 56.8}, {x: 1030, t: 4.8, on: 57.6}, {x: 1160, t: 5.0, on: 58.4}];
export const ICS = [{x: 965, t: 4.7}, {x: 1095, t: 4.9}];
export const CY = 450; // compressor row

// assembly: [start, snap]
export const ASM = {
	abs: [1.0, 1.45], str: [1.6, 2.05], hx: [2.3, 2.65], reb: [2.7, 3.05], cnd: [3.1, 3.4], drum: [3.4, 3.7],
	cooler: 4.3, pipes: [5.2, 6.4], labels: [5.9, 6.6], cut: [6.1, 6.8],
} as const;
export type Impact = {t: number; pts: [number, number][]; txt?: string; at?: [number, number]; big?: boolean};
export const IMPACTS: Impact[] = [
	{t: 1.45, pts: [[ABS.cx - ABS.r, 700], [ABS.cx + ABS.r, 700]], txt: '착!', at: [ABS.cx + 120, 250], big: true},
	{t: 2.05, pts: [[STR.cx - STR.r, 680], [STR.cx + STR.r, 680]], txt: '착!', at: [STR.cx + 115, 300], big: true},
	{t: 2.65, pts: [[HX.hl, 530], [HX.hr, 530]]},
	{t: 3.05, pts: [[REB.x0, 726], [REB.ch, 726]]},
	{t: 3.4, pts: [[CND.x0, 120], [CND.x1, 120]]},
	{t: 3.7, pts: [[DRUM.x0, 225], [DRUM.x1, 225]]},
];
export const shake = (t: number) => {
	let y = 0;
	for (const im of IMPACTS)
		if (im.big) {
			const tau = t - im.t;
			if (tau > 0 && tau < 0.45) y += 6 * Math.exp(-12 * tau) * Math.sin(55 * tau);
		}
	return y;
};

// The story clock skips 7 -> 12 s (the removed flue-gas cooler chapter), so later cues keep their times.
export const SKIP_AT = 7, SKIP = 5;
export const storyTime = (v: number) => (v < SKIP_AT ? v : v + SKIP);
export const videoTime = (s: number) => (s < SKIP_AT ? s : s - SKIP);

// ---------- pipes: route, fluid colour, when the fluid first flows ----------
export type Pt = [number, number];
export type Pipe = {
	key: string; pts: Pt[]; fluid: string; t0: number; dur: number;
	dots?: 'flue' | 'treated' | 'co2' | 'lean' | 'rich' | 'steam' | 'water' | 'overhead' | 'cw'; speed?: number; gap?: number;
	ends?: [boolean, boolean]; // flange where the pipe meets equipment
};
const icPipes = (x: number, i: number): Pipe[] => [
	{key: `icIn${i}`, pts: [[x - 8, 492], [x - 8, 467]], fluid: COL.cw, t0: 57.0 + i * 0.8, dur: 0.3, dots: 'cw', speed: 40, gap: 12, ends: [false, true]},
	{key: `icOut${i}`, pts: [[x + 8, 467], [x + 8, 492]], fluid: COL.cw, t0: 57.2 + i * 0.8, dur: 0.3, dots: 'cw', speed: 40, gap: 12, ends: [true, false]},
];
export const PIPES: Pipe[] = [
	{key: 'flueIn', pts: [[-80, 690], [278, 690]], fluid: COL.flue, t0: 12.0, dur: 1.0, dots: 'flue', speed: 120, gap: 16, ends: [false, true]},
	{key: 'treated', pts: [[340, 108], [340, 20]], fluid: COL.treated, t0: 14.8, dur: 0.6, dots: 'treated', speed: 90, gap: 18, ends: [true, false]},
	{key: 'leanB', pts: [[475, 486], [475, 240], [402, 240]], fluid: COL.lean, t0: 12.0, dur: 0.8, dots: 'lean', speed: 110, gap: 18, ends: [true, true]},
	{key: 'richA', pts: [[340, 732], [340, 770], [410, 770], [410, 530], [416, 530]], fluid: COL.rich, t0: 29.0, dur: 1.0, dots: 'rich', speed: 110, gap: 18, ends: [true, true]},
	{key: 'richB', pts: [[654, 530], [665, 530], [665, 260], [685, 260]], fluid: COL.rich, t0: 30.0, dur: 0.9, dots: 'rich', speed: 110, gap: 18, ends: [true, true]},
	{key: 'rebFeed', pts: [[740, 702], [740, 740], [810, 740]], fluid: COL.lean, t0: 29.2, dur: 0.4, dots: 'lean', speed: 70, gap: 18, ends: [true, true]},
	{key: 'leanA', pts: [[935, 754], [935, 788], [595, 788], [595, 574]], fluid: COL.lean, t0: 29.6, dur: 1.2, dots: 'lean', speed: 110, gap: 18, ends: [true, true]},
	{key: 'steam', pts: [[1020, 682], [958, 682], [958, 704]], fluid: COL.steam, t0: 34.3, dur: 0.5, dots: 'steam', speed: 80, gap: 20, ends: [false, true]},
	{key: 'steamCond', pts: [[958, 748], [958, 772], [1020, 772]], fluid: COL.water, t0: 35.0, dur: 0.5, dots: 'water', speed: 60, gap: 20, ends: [true, false]},
	{key: 'rebVap', pts: [[850, 697], [850, 650], [795, 650]], fluid: COL.steam, t0: 34.8, dur: 0.4, dots: 'steam', speed: 70, gap: 20, ends: [true, true]},
	{key: 'overhead', pts: [[740, 168], [740, 120], [820, 120]], fluid: COL.co2, t0: 36.0, dur: 0.6, dots: 'overhead', speed: 100, gap: 16, ends: [true, true]},
	{key: 'condOut', pts: [[940, 120], [980, 120], [980, 200]], fluid: COL.co2, t0: 36.6, dur: 0.4, dots: 'overhead', speed: 100, gap: 16, ends: [true, true]},
	{key: 'cndCwIn', pts: [[960, 166], [915, 166], [915, 141]], fluid: COL.cw, t0: 36.0, dur: 0.4, dots: 'cw', speed: 60, gap: 16, ends: [false, true]},
	{key: 'cndCwOut', pts: [[845, 99], [845, 76], [800, 76]], fluid: COL.cw, t0: 36.4, dur: 0.4, dots: 'cw', speed: 60, gap: 16, ends: [true, false]},
	{key: 'reflux', pts: [[1005, 252], [1005, 290], [860, 290], [860, 205], [795, 205]], fluid: COL.water, t0: 37.2, dur: 0.8, dots: 'water', speed: 80, gap: 20, ends: [true, true]},
	{key: 'coolCwIn', pts: [[520, 380], [490, 380]], fluid: COL.cw, t0: 30.4, dur: 0.3, dots: 'cw', speed: 50, gap: 14, ends: [false, true]},
	{key: 'coolCwOut', pts: [[490, 340], [520, 340]], fluid: COL.cw, t0: 30.6, dur: 0.3, dots: 'cw', speed: 50, gap: 14, ends: [true, false]},
	{key: 'co2Comp', pts: [[1040, 199], [1040, 165], [1085, 165], [1085, 370], [860, 370], [860, 450], [876, 450]], fluid: COL.co2, t0: 56.0, dur: 1.0, dots: 'co2', speed: 110, gap: 22, ends: [true, true]},
	{key: 's1', pts: [[924, 450], [945, 450]], fluid: COL.co2, t0: 57.0, dur: 0.3, dots: 'co2', speed: 90, gap: 15, ends: [true, true]},
	{key: 's2', pts: [[985, 450], [1006, 450]], fluid: COL.co2, t0: 57.4, dur: 0.3, dots: 'co2', speed: 80, gap: 15, ends: [true, true]},
	{key: 's3', pts: [[1054, 450], [1075, 450]], fluid: COL.co2, t0: 57.8, dur: 0.3, dots: 'co2', speed: 70, gap: 10, ends: [true, true]},
	{key: 's4', pts: [[1115, 450], [1136, 450]], fluid: COL.co2, t0: 58.2, dur: 0.3, dots: 'co2', speed: 60, gap: 10, ends: [true, true]},
	{key: 'exit', pts: [[1184, 450], [1290, 450]], fluid: COL.co2, t0: 58.9, dur: 0.8, dots: 'co2', speed: 55, gap: 7, ends: [true, false]},
	...icPipes(965, 0),
	...icPipes(1095, 1),
];
const segLen = (pts: Pt[]) => {
	const out = [0];
	for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
	return out;
};
export const pipeLen = (p: Pipe) => segLen(p.pts)[p.pts.length - 1];
export function pointAt(pts: Pt[], s: number): Pt {
	const cum = segLen(pts);
	let i = 1;
	while (i < cum.length - 1 && cum[i] < s) i++;
	const u = clamp((s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1));
	return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)];
}
export const poly = (pts: Pt[], close = false) =>
	'M ' + pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' L ') + (close ? ' Z' : '');

// flue-gas mixture for the moving dots (visual mix, not a composition)
export const flueSpecies = (k: number) => {
	const q = h1(k * 7.3 + 1);
	return q < 0.22 ? 'CO2' : q < 0.7 ? 'N2' : q < 0.88 ? 'O2' : 'H2O';
};

// solvent loop, used for the "용액 순환" highlight
export const LOOP: Pt[] = [
	[475, 240], [340, 240], [340, 735], [340, 770], [410, 770], [410, 530], [654, 530], [665, 530], [665, 260], [740, 260],
	[740, 740], [810, 740], [935, 745], [935, 788], [595, 788], [595, 530], [475, 530], [475, 240],
];

// ---------- camera: focus point + zoom over an 860-unit-tall world window ----------
const CAM: [number, number, number, number][] = [
	[0, 700, 430, 0.72], [12.0, 700, 430, 0.72], [12.9, 360, 420, 1.2], [18.4, 360, 420, 1.2], [19.2, 560, 420, 1.2],
	[24.6, 560, 420, 1.2], [25.5, 340, 250, 1.4], [28.5, 340, 250, 1.4], [29.5, 540, 540, 1.5], [33.5, 540, 540, 1.5],
	[34.5, 830, 520, 1.2], [40.4, 830, 520, 1.2], [41.2, 980, 480, 1.2], [45.5, 980, 480, 1.2], [46.4, 560, 470, 0.95],
	[50.5, 560, 470, 0.95], [51.4, 940, 230, 1.4], [55.5, 940, 230, 1.4], [56.4, 1060, 450, 1.25], [61.5, 1060, 450, 1.25],
	[63.2, 700, 430, 0.72],
];
export function camera(t: number): [number, number, number] {
	for (let i = 0; i < CAM.length - 1; i++) {
		const a = CAM[i], b = CAM[i + 1];
		if (t < b[0]) {
			const u = eio(clamp((t - a[0]) / (b[0] - a[0])));
			return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)];
		}
	}
	const l = CAM[CAM.length - 1];
	return [l[1], l[2], l[3]];
}
// world → screen (px) for the 1920×1080 frame, matching the viewBox in Plant.tsx
export function toScreen(t: number, p: Pt, height = 1080): Pt {
	const [fx, fy0, z] = camera(t);
	const fy = fy0 - shake(t), vh = 860 / z, k = height / vh;
	return [(p[0] - (fx - 430 / z)) * k, (p[1] - (fy - 430 / z)) * k];
}

// ---------- chapters (story seconds; chapter 1 ends at 7 s of video) ----------
export const CHAPTERS = [
	{t: 0, g: '설비', title: '포집 설비 조립', desc: 'CO₂ 포집 설비가 조립됩니다.'},
	{t: 12, g: '포집', title: '흡수', desc: '배가스는 위로, MEA 용액은 아래로 흐르며 CO₂가 용액에 녹아듭니다.'},
	{t: 19, g: '포집', title: '분자로 보면', desc: 'MEA가 CO₂와 결합합니다.'},
	{t: 25, g: '포집', title: '처리 가스 배출', desc: 'CO₂가 빠진 배가스는 흡수탑 상단으로 배출합니다.'},
	{t: 29, g: '재생', title: '열 회수', desc: 'CO₂를 머금은 용액을 뜨거운 재생 용액으로 먼저 데웁니다.'},
	{t: 34, g: '재생', title: '탈거', desc: '리보일러 스팀으로 가열하면 CO₂가 용액에서 떨어져 나옵니다.'},
	{t: 41, g: '재생', title: '분자로 보면', desc: '열을 받아 결합이 깨지고, MEA는 다시 쓸 수 있게 됩니다.'},
	{t: 46, g: '재생', title: '용액 순환', desc: 'CO₂를 내놓은 용액은 식혀서 흡수탑으로 돌아갑니다.'},
	{t: 51, g: '압축', title: '수분 제거', desc: '재생탑 위로 나온 CO₂에서 수증기를 응축해 걸러냅니다.'},
	{t: 56, g: '압축', title: '압축', desc: '여러 단의 압축기로 CO₂를 고압으로 압축합니다.'},
];
export const ZOOMS = [
	{t0: 19.0, t1: 25.0, target: [340, 470] as Pt, mode: 'absorb' as const},
	{t0: 41.0, t1: 46.0, target: [740, 440] as Pt, mode: 'release' as const},
];
