// Two-bed PSA: the cycle model shared by the 2D and the 3D versions.
// Everything is a pure function of story time t (seconds), so any frame renders exactly.
import {Easing, spring} from 'remotion';

export const FPS = 60;
export const INK = '#27313d';
export const M = {body: '#cfd8e2', shade: '#aab7c5', light: '#f6f9fb', top: '#e4eaf0', inner: '#5d6977'};
export const GASC = {H2: '#06b6d4', IMP: '#dc2626'};
export const FLOW = {feed: '#e2e8f0', h2: '#a5f3fc', tail: '#fecaca'};

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

// ---------- part motion (2D): fly in, then snap with a spring squash ----------
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
export const settle = (t: number, t0: number, dur = 0.7) => eo(pr(t, t0, t0 + dur)); // 3D drop-in

// ---------- layout (2D world units; the 3D scene maps the same points) ----------
export type Pt = [number, number];
export type Bed = {key: 'A' | 'B'; cx: number; top: number; bot: number; r: number};
export const BEDS: Bed[] = [
	{key: 'A', cx: 280, top: 178, bot: 582, r: 58},
	{key: 'B', cx: 600, top: 178, bot: 582, r: 58},
];
export const Y = {prod: 80, eq: 140, feed: 700, tail: 780, floor: 800};
// adsorbent between the support screens
export const BED_IN = {top: 178 + 40, bot: 582 - 40};
export const frontY = (f: number) => lerp(BED_IN.bot, BED_IN.top, f);

export type ValveKey = 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6' | 'V7';
export const VALVES: {key: ValveKey; x: number; y: number; dir: 'h' | 'v'; name: string; t: number}[] = [
	{key: 'V1', x: 230, y: Y.feed, dir: 'h', name: 'A 원료', t: 3.7},
	{key: 'V2', x: 550, y: Y.feed, dir: 'h', name: 'B 원료', t: 3.85},
	{key: 'V3', x: 280, y: 742, dir: 'v', name: 'A 탈착', t: 4.0},
	{key: 'V4', x: 600, y: 742, dir: 'v', name: 'B 탈착', t: 4.15},
	{key: 'V5', x: 280, y: 110, dir: 'v', name: 'A 제품', t: 4.3},
	{key: 'V6', x: 600, y: 110, dir: 'v', name: 'B 제품', t: 4.45},
	{key: 'V7', x: 440, y: Y.eq, dir: 'h', name: '균압/퍼지', t: 4.6},
];
// static pipe network (drawn once assembled)
export const NET: Pt[][] = [
	[[20, Y.feed], [600, Y.feed]],
	[[280, 582], [280, Y.tail]], [[600, 582], [600, Y.tail]],
	[[280, Y.tail], [920, Y.tail]],
	[[280, 178], [280, Y.prod]], [[600, 178], [600, Y.prod]],
	[[280, Y.prod], [920, Y.prod]],
	[[280, Y.eq], [600, Y.eq]],
];
export const PATHS: Record<string, Pt[]> = {
	feedA: [[20, Y.feed], [280, Y.feed], [280, 584]],
	feedB: [[20, Y.feed], [600, Y.feed], [600, 584]],
	prodA: [[280, 176], [280, Y.prod], [920, Y.prod]],
	prodB: [[600, 176], [600, Y.prod], [920, Y.prod]],
	tailA: [[280, 584], [280, Y.tail], [920, Y.tail]],
	tailB: [[600, 584], [600, Y.tail], [920, Y.tail]],
	xAB: [[280, 176], [280, Y.eq], [600, Y.eq], [600, 176]],
	xBA: [[600, 176], [600, Y.eq], [280, Y.eq], [280, 176]],
};
const segLen = (pts: Pt[]) => {
	const out = [0];
	for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
	return out;
};
export const pathLen = (pts: Pt[]) => segLen(pts)[pts.length - 1];
export function pointAt(pts: Pt[], s: number): Pt {
	const cum = segLen(pts);
	let i = 1;
	while (i < cum.length - 1 && cum[i] < s) i++;
	const u = clamp((s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1));
	return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)];
}
export const poly = (pts: Pt[], close = false) =>
	'M ' + pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' L ') + (close ? ' Z' : '');

// ---------- the 6-step cycle ----------
export type Mode = 'PR' | 'AD' | 'EQD' | 'BD' | 'PU' | 'EQR';
export const MODE = {
	PR: {name: '가압', color: '#fbbf24'},
	AD: {name: '흡착', color: '#22c55e'},
	EQD: {name: '균압↓', color: '#a78bfa'},
	BD: {name: '탈압', color: '#f87171'},
	PU: {name: '퍼지', color: '#38bdf8'},
	EQR: {name: '균압↑', color: '#c4b5fd'},
} as const;
export type Flow = {path: keyof typeof PATHS; kind: 'feed' | 'h2' | 'tail'; rate: number};
export const STEPS: {dur: number; A: Mode; B: Mode; open: Partial<Record<ValveKey, number>>; flows: Flow[]}[] = [
	{dur: 4, A: 'PR', B: 'BD', open: {V1: 1, V4: 1}, flows: [{path: 'feedA', kind: 'feed', rate: 1}, {path: 'tailB', kind: 'tail', rate: 1}]},
	{dur: 7, A: 'AD', B: 'PU', open: {V1: 1, V5: 1, V7: 0.5, V4: 1}, flows: [{path: 'feedA', kind: 'feed', rate: 1}, {path: 'prodA', kind: 'h2', rate: 1}, {path: 'xAB', kind: 'h2', rate: 0.5}, {path: 'tailB', kind: 'tail', rate: 0.7}]},
	{dur: 4, A: 'EQD', B: 'EQR', open: {V7: 1}, flows: [{path: 'xAB', kind: 'h2', rate: 1}]},
	{dur: 4, A: 'BD', B: 'PR', open: {V3: 1, V2: 1}, flows: [{path: 'feedB', kind: 'feed', rate: 1}, {path: 'tailA', kind: 'tail', rate: 1}]},
	{dur: 7, A: 'PU', B: 'AD', open: {V2: 1, V6: 1, V7: 0.5, V3: 1}, flows: [{path: 'feedB', kind: 'feed', rate: 1}, {path: 'prodB', kind: 'h2', rate: 1}, {path: 'xBA', kind: 'h2', rate: 0.5}, {path: 'tailA', kind: 'tail', rate: 0.7}]},
	{dur: 4, A: 'EQR', B: 'EQD', open: {V7: 1}, flows: [{path: 'xBA', kind: 'h2', rate: 1}]},
];
export const CYCLE = STEPS.reduce((a, s) => a + s.dur, 0); // 30 s
export const STEP_T0 = STEPS.map((_, i) => STEPS.slice(0, i).reduce((a, s) => a + s.dur, 0));

// story timeline
export const WALK = [7, 7 + CYCLE] as const; // one slow cycle, step by step
export const FAST = 3; // then continuous operation at 3×
export const T_END = WALK[1] + 20;
// monotonic cycle clock (seconds of cycle time); -1 before the plant starts
export const cycleClock = (t: number) => (t < WALK[0] ? -1 : t < WALK[1] ? t - WALK[0] : CYCLE + (t - WALK[1]) * FAST);
export type CycleState = {clock: number; ct: number; k: number; tau: number; u: number};
export function cycleState(t: number): CycleState {
	const clock = Math.max(0, cycleClock(t));
	const ct = clock % CYCLE;
	let k = 0;
	while (k < STEPS.length - 1 && STEP_T0[k + 1] <= ct) k++;
	const tau = ct - STEP_T0[k];
	return {clock, ct, k, tau, u: tau / STEPS[k].dur};
}
export const modeOf = (bed: 'A' | 'B', k: number): Mode => STEPS[k][bed];

// pressure (0 = low, 1 = high) and impurity front (0 = bottom, 1 = top of the adsorbent) at the start/end of each mode
const P_RANGE: Record<Mode, [number, number]> = {PR: [0.5, 1], AD: [1, 1], EQD: [1, 0.5], BD: [0.5, 0], PU: [0, 0], EQR: [0, 0.5]};
const F_RANGE: Record<Mode, [number, number]> = {PR: [0.1, 0.2], AD: [0.2, 0.7], EQD: [0.7, 0.78], BD: [0.78, 0.5], PU: [0.5, 0.1], EQR: [0.1, 0.1]};
export const pressureAt = (bed: 'A' | 'B', ct: number) => {
	let k = 0;
	while (k < STEPS.length - 1 && STEP_T0[k + 1] <= ct) k++;
	const [a, b] = P_RANGE[modeOf(bed, k)];
	return lerp(a, b, eo(clamp((ct - STEP_T0[k]) / STEPS[k].dur / 0.8)));
};
export const frontAt = (bed: 'A' | 'B', ct: number) => {
	let k = 0;
	while (k < STEPS.length - 1 && STEP_T0[k + 1] <= ct) k++;
	const [a, b] = F_RANGE[modeOf(bed, k)];
	return lerp(a, b, eio(clamp((ct - STEP_T0[k]) / STEPS[k].dur)));
};
// valve opening 0..1 (0.5 = throttled), with a short stroke at each step change
export function valveAt(v: ValveKey, t: number) {
	if (t < WALK[0]) return 0;
	const {k, tau} = cycleState(t);
	const now = STEPS[k].open[v] ?? 0, prev = STEPS[(k + STEPS.length - 1) % STEPS.length].open[v] ?? 0;
	const first = t < WALK[0] + 0.3 && k === 0;
	return lerp(first ? 0 : prev, now, eo(clamp(tau / 0.3)));
}
// fade of a step's flows in/out (cycle seconds)
export const flowAlpha = (tau: number, dur: number) => pr(tau, 0, 0.3) * (1 - pr(tau, dur - 0.2, dur));

// ---------- chapters (story seconds) ----------
export const CHAPTERS = [
	{t: 0, g: '설비', title: '2탑 PSA 설비', desc: '흡착탑 두 기와 밸브 일곱 개로 이루어집니다.'},
	{t: 7, g: '사이클', title: '1. 가압 · 탈압', desc: 'A탑은 원료 가스로 압력을 올리고, B탑은 압력을 빼 불순물을 내보냅니다.'},
	{t: 11, g: '사이클', title: '2. 흡착 · 퍼지', desc: 'A탑이 불순물을 잡고 H₂를 내보냅니다. H₂ 일부는 B탑을 거꾸로 씻어 냅니다.'},
	{t: 18, g: '사이클', title: '3. 균압', desc: 'A탑에 남은 고압 가스를 B탑으로 옮겨 압력을 나눕니다.'},
	{t: 22, g: '사이클', title: '4. 탈압 · 가압', desc: '이번엔 반대로, B탑을 가압하고 A탑의 압력을 뺍니다.'},
	{t: 26, g: '사이클', title: '5. 퍼지 · 흡착', desc: 'B탑이 H₂를 만들고, 그 일부로 A탑을 씻어 냅니다.'},
	{t: 33, g: '사이클', title: '6. 균압', desc: 'B탑의 고압 가스를 A탑으로 옮기면 한 사이클이 끝납니다.'},
	{t: 37, g: '운전', title: '연속 운전', desc: '두 탑이 번갈아 가며 제품 H₂를 끊이지 않고 만듭니다.'},
];

// ---------- gas particles (2D world coords; z in -1..1 is the depth used by the 3D view) ----------
export type Dot = {x: number; y: number; z: number; imp: boolean; op: number};
const Y_IN = BED_IN.bot + 22, Y_OUT = BED_IN.top - 22;
export function bedDots(bed: Bed, t: number): Dot[] {
	if (t < WALK[0]) return [];
	const {k, tau, ct} = cycleState(t), d = STEPS[k].dur, mode = modeOf(bed.key, k), fa = flowAlpha(tau, d);
	const yf = frontY(frontAt(bed.key, ct)), seed = bed.key === 'A' ? 0 : 500, out: Dot[] = [];
	const put = (n: number, y: number, imp: boolean, op: number) => {
		const xn = h1(n * 3.1 + seed) * 2 - 1;
		out.push({x: bed.cx + xn * (bed.r - 14) + 3 * Math.sin(y / 15 + n), y, z: (h1(n * 5.3 + seed) * 2 - 1) * Math.sqrt(1 - xn * xn * 0.8), imp, op: op * fa});
	};
	const each = (R: number, life: number, fn: (n: number, a: number) => void) => {
		for (let n = Math.max(0, Math.floor((tau - life) * R)); n <= tau * R; n++) fn(n, tau - n / R);
	};
	if (mode === 'AD' || mode === 'PR') {
		const v = mode === 'AD' ? 80 : 55;
		each(10, 7, (n, a) => {
			const imp = h1(n * 3.7 + seed) < 0.35, y = Y_IN - v * a;
			if (imp) {
				const yc = yf + 8 - 34 * h1(n * 1.9 + seed), tc = (Y_IN - yc) / v;
				if (a > tc) {
					const s = pr(a, tc, tc + 0.7);
					if (s < 1) put(n, yc, true, 1 - s);
					return;
				}
				put(n, y, true, 1);
				return;
			}
			if (mode === 'PR' && Y_IN - y > 170) return put(n, y, false, 1 - pr(Y_IN - y, 170, 200));
			if (y < Y_OUT - 16) return;
			put(n, y, false, 1 - pr(y, Y_OUT + 10, Y_OUT - 16));
		});
	} else if (mode === 'EQD') {
		each(8, 4, (n, a) => {
			const y = lerp(yf - 20, Y_OUT, h1(n * 2.3 + seed)) - 90 * a;
			if (y > Y_OUT - 16) put(n, y, false, 1 - pr(y, Y_OUT + 10, Y_OUT - 16));
		});
	} else if (mode === 'EQR') {
		each(8, 2, (n, a) => {
			const y = Y_OUT + 90 * a;
			if (a < 1.7) put(n, y, false, 1 - pr(a, 1.3, 1.7));
		});
	} else if (mode === 'BD' || mode === 'PU') {
		each(9, 4, (n, a) => {
			const y = lerp(yf, Y_IN - 10, h1(n * 2.9 + seed)) + 90 * a;
			if (y < Y_IN + 16) put(n, y, h1(n * 4.3 + seed) < (mode === 'BD' ? 0.75 : 0.9), 1 - pr(y, Y_IN - 6, Y_IN + 16));
		});
		if (mode === 'PU')
			each(8, 6, (n, a) => {
				const y = Y_OUT + 80 * a;
				if (y < Y_IN + 16) put(n + 3000, y, false, 1 - pr(y, Y_IN - 6, Y_IN + 16));
			});
	}
	return out;
}
export function pipeDots(t: number): (Dot & {kind: Flow['kind']})[] {
	if (t < WALK[0]) return [];
	const {k, tau} = cycleState(t), d = STEPS[k].dur, fa = flowAlpha(tau, d), out: (Dot & {kind: Flow['kind']})[] = [];
	STEPS[k].flows.forEach((f, fi) => {
		const pts = PATHS[f.path], L = pathLen(pts), gap = 17 / f.rate, head = tau * 130;
		for (let j = Math.max(0, Math.ceil((head - L) / gap)); j <= head / gap; j++) {
			const s = head - j * gap;
			if (s < 0 || s > L) continue;
			const [x, y] = pointAt(pts, s), q = h1(j * 7.7 + fi * 31);
			out.push({x, y, z: 0, imp: f.kind === 'feed' ? q < 0.35 : f.kind === 'tail' ? q < 0.7 : false, op: fa, kind: f.kind});
		}
	});
	return out;
}
