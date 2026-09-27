// Geometry, timeline and bead physics for the bed story.
// Everything is a pure function of story time t (seconds), so any frame renders exactly.
import {Easing, spring} from 'remotion';

export const FPS = 60;
export const T_END = 50;

export const cx = 400, R = 120, TILT = 0.22, RY = R * TILT;
export const yTop = 210, yBot = 630;       // tangent lines of the straight shell
export const HD = 60;                       // 2:1 semi-ellipsoidal head depth = D/4
export const WALL = 7, RI = R - WALL;
export const RN = 22, RF = 38;              // nozzle / flange radius
export const FLOOR = 800, G = 1600;
export const FUN = {yT: 12, rT: 100, yB: 92, rB: 13, yExit: 114}; // loading hopper
export const BAG_OUT = -36;                 // bulk-bag spout

export const INK = '#27313d';
export const M = {body: '#cfd8e2', shade: '#aab7c5', light: '#f6f9fb', top: '#e4eaf0', inner: '#5d6977'};

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
function mulberry(a: number) {
	return () => {
		a |= 0; a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// ---------- path helpers ----------
export type Pt = [number, number];
export const ell = (x: number, y: number, rx: number, ry: number, a0: number, a1: number, n = 40): Pt[] => {
	const out: Pt[] = [];
	for (let i = 0; i <= n; i++) {
		const a = a0 + ((a1 - a0) * i) / n;
		out.push([x + rx * Math.cos(a), y + ry * Math.sin(a)]);
	}
	return out;
};
export const poly = (pts: Pt[], close = false) =>
	'M ' + pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' L ') + (close ? ' Z' : '');
const PI = Math.PI;
export const PATH = {
	silhouette: poly([[cx - R, yBot], [cx - R, yTop], ...ell(cx, yTop, R, HD, PI, 2 * PI), [cx + R, yBot], ...ell(cx, yBot, R, HD, 0, PI)], true),
	shellFront: poly([[cx - R, yTop], [cx - R, yBot], ...ell(cx, yBot, R, RY, PI, 0), [cx + R, yTop], ...ell(cx, yTop, R, RY, 0, PI)], true),
	bowl: poly([[cx - R, yBot], ...ell(cx, yBot, R, HD, PI, 0), ...ell(cx, yBot, R, RY, 0, PI)], true),
	dome: poly([...ell(cx, yTop, R, HD, PI, 2 * PI), ...ell(cx, yTop, R, RY, 0, PI)], true),
	cavity: poly([[cx - RI, yBot], [cx - RI, yTop], ...ell(cx, yTop, RI, HD - WALL, PI, 2 * PI), [cx + RI, yBot], ...ell(cx, yBot, RI, HD - WALL, 0, PI)], true),
};
export const cylPath = (x: number, y0: number, y1: number, r: number) =>
	poly([[x - r, y0], [x - r, y1], ...ell(x, y1, r, r * TILT, PI, 0, 20), [x + r, y0]], true);
export const profilePath = (side: number, a: number, b: number) => {
	const al = Math.acos(Math.min(1, RN / a));
	return side < 0
		? poly([...ell(cx, yBot, a, b, PI - al, PI), [cx - a, yTop], ...ell(cx, yTop, a, b, PI, PI + al)])
		: poly([...ell(cx, yTop, a, b, 2 * PI - al, 2 * PI), [cx + a, yBot], ...ell(cx, yBot, a, b, 0, al)]);
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
export const trStr = (tr: Tr, px: number, py: number) =>
	`translate(${tr.dx + px} ${tr.dy + py}) scale(${tr.sx} ${tr.sy}) translate(${-px} ${-py})`;

// ---------- assembly & impacts ----------
export const ASM = {
	shell: [2.5, 3.05], bowl: [3.3, 3.75], dome: [4.0, 4.45], nzT: [4.8, 5.15], nzB: [5.1, 5.45],
	ports: [5.7, 5.85, 6.0], legL: [6.2, 6.62], legR: [6.35, 6.78],
} as const;
export type Impact = {t: number; pts: Pt[]; txt?: string; at?: Pt; big?: boolean};
export const IMPACTS: Impact[] = [
	{t: 3.05, pts: [[cx - R, 330], [cx + R, 330], [cx - R, 520], [cx + R, 520]], txt: '착!', at: [cx + R + 70, 300], big: true},
	{t: 3.75, pts: [[cx - R, yBot], [cx + R, yBot]], txt: '착!', at: [cx + R + 64, yBot + 34], big: true},
	{t: 4.45, pts: [[cx - R, yTop], [cx + R, yTop]], txt: '착!', at: [cx + R + 64, yTop - 34], big: true},
	{t: 5.15, pts: [[cx - RN - 3, 152], [cx + RN + 3, 152]]},
	{t: 5.45, pts: [[cx - RN - 3, 686], [cx + RN + 3, 686]]},
	{t: 6.62, pts: [[cx - R - 20, 580]], txt: '딱', at: [cx - R - 70, 535]},
	{t: 6.78, pts: [[cx + R + 20, 580]], txt: '딱', at: [cx + R + 70, 535]},
	{t: 8.6, pts: [[cx - RF, 100], [cx + RF, 100]]},
	{t: 12.5, pts: [[cx - RF, 100], [cx + RF, 100]]},
	{t: 40.1, pts: [[cx - RF, 100], [cx + RF, 100]]},
	{t: 40.4, pts: [[cx - RF, 742], [cx + RF, 742]]},
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

// ---------- camera: focus point + zoom over a 860-unit-tall world window ----------
const CAM: [number, number, number, number][] = [
	[0, 445, 430, 1], [11.6, 445, 430, 1], [12.5, 445, 330, 0.88], [38.9, 445, 330, 0.88], [39.8, 445, 430, 1],
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

// ---------- adsorbent layers & bead flow ----------
// Each layer: a bulk bag arrives (tB) and pours into the hopper; the hopper drains through
// the top nozzle; beads free-fall, hit the heap near the centre and roll to their seat.
export type Bead = {
	i: number; x: number; y: number; yHit: number; rd: number; tl: number; ts: number; th: number;
	xi: number; x0: number; yS: number; te: number; tb: number; tgx: number; tgy: number; bx: number;
};
export type Layer = {
	key: string; name: string; role: string; r: number; yLo: number; yHi: number; bowl?: boolean;
	tB: number; tEnd: number; base: string; hi: number;
	parts: Bead[]; S: number[]; frows: {y: number; c: number; C: number}[]; fdy: number;
	tDone: number; tbSorted: number[]; bagEnd: number;
};
const LAYER_DEFS = [
	{key: 'cer1', name: '세라믹 볼', role: '하부 지지층 · 가스 분산', r: 8, yLo: yBot + HD - WALL, yHi: yBot, bowl: true, tB: 13.2, tEnd: 17.2, base: '#e6dfcf', hi: 0.9},
	{key: 'alu', name: '활성 알루미나', role: 'H₂O 제거', r: 5.4, yLo: 630, yHi: 560, tB: 17.9, tEnd: 22.3, base: '#fbfbf8', hi: 0.9},
	{key: 'ac', name: '활성탄', role: 'CO₂ · CH₄ · CO · N₂ 흡착', r: 4.8, yLo: 560, yHi: 390, tB: 22.4, tEnd: 28.4, base: '#3b4047', hi: 0.45},
	{key: 'z5a', name: '제올라이트 5A', role: '마지막 방어층', r: 4.5, yLo: 390, yHi: 250, tB: 28.6, tEnd: 34.4, base: '#e2b66c', hi: 0.8},
	{key: 'cer2', name: '세라믹 볼', role: '상부 고정층', r: 6.5, yLo: 250, yHi: 228, tB: 35.1, tEnd: 38.8, base: '#e6dfcf', hi: 0.9},
];
export const SCREENS = [
	{y: 630, t0: 17.4, t1: 18.0, after: 0},
	{y: 250, t0: 34.6, t1: 35.2, after: 3},
];
export const funHW = (y: number) => (y >= FUN.yB ? FUN.rB : lerp(FUN.rB, FUN.rT, (FUN.yB - y) / (FUN.yB - FUN.yT)));
export function nAt(S: number[], t: number) {
	// continuous count of beads released from the hopper
	if (t <= S[0]) return 0;
	let lo = 0, hi = S.length - 1;
	if (t >= S[hi]) return hi;
	while (hi - lo > 1) {
		const m = (lo + hi) >> 1;
		if (S[m] <= t) lo = m; else hi = m;
	}
	return lo + (t - S[lo]) / (S[hi] - S[lo]);
}
export function pilePos(L: Layer, m: number, xi: number): Pt {
	// m = beads still below this one in the hopper
	const rows = L.frows;
	m = Math.max(0, m);
	let k = 0;
	while (k < rows.length - 1 && rows[k + 1].C <= m) k++;
	const f = (m - rows[k].C) / rows[k].c, y = rows[k].y - f * L.fdy;
	return [cx + xi * Math.max(0, funHW(y) - L.r - 1.5), y];
}
export const LAYERS: Layer[] = LAYER_DEFS.map((def) => {
	const rnd = mulberry(7 + def.r * 13);
	const r = def.r, dx = 2 * r * 1.03, dy = 2 * r * 0.87;
	const seats: {x: number; y: number; row: number}[] = [];
	let row = 0;
	for (let y = def.yLo - r; y >= def.yHi + 0.7 * r; y -= dy, row++) {
		let hw = RI - 0.5;
		if (def.bowl) {
			const e = (y - yBot) / (HD - WALL);
			if (e >= 1) continue;
			hw = (RI - 0.5) * Math.sqrt(Math.max(0, 1 - e * e)) - r * 0.35;
		}
		const span = 2 * (hw - r);
		if (span < 0) continue;
		const n = Math.floor((span - dx / 2) / dx) + 1;
		if (n < 1) continue;
		const start = cx - ((n - 1) * dx) / 2 + (row % 2 ? dx / 4 : -dx / 4);
		for (let j = 0; j < n; j++) seats.push({x: start + j * dx + (rnd() - 0.5) * r * 0.2, y: y + (rnd() - 0.5) * r * 0.2, row});
	}
	const frows: Layer['frows'] = [];
	let C = 0;
	for (let y = FUN.yExit - r; y - r > FUN.yT + 2; y -= dy) {
		const c = Math.max(1, Math.floor((2 * Math.max(0, funHW(y) - r - 1.5)) / (2 * r * 1.04)) + 1);
		frows.push({y, c, C});
		C += c;
	}
	const tS = def.tB + 0.45, tR0 = tS + 0.95, tLand0 = tR0 + 1.3;
	const nR = Math.max(1, row), mound = Math.min(0.28 * nR * dy, 48), yS = FUN.yExit - r;
	const list = seats.map((p) => {
		const f = nR > 1 ? p.row / (nR - 1) : 0, dxn = Math.abs(p.x - cx) / RI;
		const frac = clamp((0.78 * f + 0.22 * dxn * (1 - 0.4 * f) + (rnd() - 0.5) * 0.05) / 0.93);
		const tl = tLand0 + (def.tEnd - tLand0) * frac;
		const yHit = Math.max(yS + 6, p.y - mound * dxn * (1 - 0.3 * f));
		const rd = 0.1 + (0.32 * Math.abs(p.x - cx)) / RI, ft = Math.sqrt((2 * (yHit - yS)) / G);
		return {x: p.x, y: p.y, yHit, rd, tl, ts: tl - rd - ft, th: tl - rd} as Bead;
	});
	const shift = Math.max(0, tR0 - Math.min(...list.map((p) => p.ts)));
	for (const p of list) { p.tl += shift; p.ts += shift; p.th += shift; }
	list.sort((a, b) => a.ts - b.ts);
	const L: Layer = {...def, parts: list, S: list.map((p) => p.ts), frows, fdy: dy, tDone: 0, tbSorted: [], bagEnd: 0};
	const N = list.length, cap = Math.max(1, Math.min(Math.floor(C * 0.85), Math.ceil(N * 0.5)));
	list.forEach((p, i) => {
		p.i = i;
		p.xi = ((i * 0.6180339887 + 0.31) % 1) * 2 - 1;
		p.x0 = cx + p.xi * Math.max(0, FUN.rB - r - 1.5);
		p.yS = yS;
		p.te = i < cap ? tS + 0.3 + i * (0.6 / cap) : L.S[i - cap]; // lands on the hopper pile
		const mE = i < cap ? i : cap, jit = clamp(mE / 3), tg = pilePos(L, mE, p.xi);
		p.tgx = tg[0] + (h1(i * 3.3) - 0.5) * r * 0.8 * jit;
		p.tgy = tg[1] + (h1(i * 5.1) - 0.5) * r * 0.9 * jit;
		p.bx = cx + (rnd() - 0.5) * 8;
		p.tb = p.te - Math.sqrt((2 * (p.tgy - BAG_OUT)) / G); // leaves the bag
	});
	L.tDone = Math.max(...list.map((p) => p.tl));
	L.tbSorted = list.map((p) => p.tb).sort((a, b) => a - b);
	L.bagEnd = L.tbSorted[N - 1];
	return L;
});
export function vesselPos(p: Bead, t: number): Pt {
	if (t >= p.tl) return [p.x, p.y];
	if (t < p.th) {
		const tau = t - p.ts;
		return [p.x0, p.yS + 0.5 * G * tau * tau];
	}
	const u = (t - p.th) / p.rd, e = eo(u);
	return [lerp(p.x0, p.x, e), lerp(p.yHit, p.y, e) - Math.sin(Math.PI * u) * 4 * (1 - u)];
}
export function hopperPos(L: Layer, p: Bead, t: number, nNow: number): Pt {
	if (t < p.te) {
		const tau = t - p.tb, u = tau / (p.te - p.tb);
		return [lerp(p.bx, p.tgx, u), BAG_OUT + 0.5 * G * tau * tau];
	}
	const m = p.i - nNow, jit = clamp(m / 3), q = pilePos(L, m, p.xi);
	return [q[0] + (h1(p.i * 3.3) - 0.5) * L.r * 0.8 * jit, q[1] + (h1(p.i * 5.1) - 0.5) * L.r * 0.9 * jit];
}
export const landedFraction = (L: Layer, t: number) => {
	let n = 0;
	for (const p of L.parts) if (p.tl <= t) n++;
	return n / L.parts.length;
};

// ---------- gas molecules (final chapter) ----------
// A fresh bed catches each component at the inlet (bottom) of its layer, so each loaded zone
// grows upward from where the previous one ends. H₂O stays in the alumina; CO₂, CH₄, CO and
// N₂ are almost all taken by the carbon, strongest first (CO₂ at the bottom, N₂ on top).
// Zeolite 5A is the final guard: only a little N₂ reaches it and sticks at its bottom.
export const SPECIES = [
	{k: 'H2', label: 'H₂', col: '#0891b2', w: 0.4, stop: false, to: '통과 → 제품'},
	{k: 'H2O', label: 'H₂O', col: '#2563eb', w: 0.12, stop: true, to: '활성 알루미나'},
	{k: 'CO2', label: 'CO₂', col: '#dc2626', w: 0.17, stop: true, to: '활성탄'},
	{k: 'CH4', label: 'CH₄', col: '#16a34a', w: 0.11, stop: true, to: '활성탄'},
	{k: 'CO', label: 'CO', col: '#9333ea', w: 0.1, stop: true, to: '활성탄'},
	{k: 'N2', label: 'N₂', col: '#ea580c', w: 0.1, stop: true, to: '활성탄 · 일부 5A'},
];
type ZoneDef = {base: number; below: string[]; col: string};
export const ZONES: Record<string, ZoneDef> = {
	H2O: {base: 626, below: [], col: '#2563eb'},
	CO2: {base: 556, below: [], col: '#dc2626'},
	CH4: {base: 556, below: ['CO2'], col: '#16a34a'},
	CO: {base: 556, below: ['CO2', 'CH4'], col: '#9333ea'},
	N2: {base: 556, below: ['CO2', 'CH4', 'CO'], col: '#ea580c'},
	N2z: {base: 386, below: [], col: '#ea580c'}, // the little N₂ that slips through to the 5A
};
export const ZONE_DH = 2; // loaded-zone growth per captured molecule (world px)
export type Mol = {
	ts: number; sp: (typeof SPECIES)[number]; zk: string | null; pts: Pt[]; cum: number[]; len: number; speed: number; ph: number; tCap: number;
};
export const MOLS: Mol[] = [];
const front: Record<string, number> = {};
for (let n = 0; ; n++) {
	const ts = 41.8 + n / 15;
	if (ts > 48.6) break;
	let q = h1(n * 7 + 3), sp = SPECIES[0];
	for (const s of SPECIES) {
		if (q < s.w) { sp = s; break; }
		q -= s.w;
	}
	const zk = !sp.stop ? null : sp.k === 'N2' && h1(n * 23 + 4) < 0.3 ? 'N2z' : sp.k;
	const lane = cx + (h1(n * 11 + 5) * 2 - 1) * (RI - 14);
	const pts: Pt[] = [[cx + (h1(n * 5 + 2) - 0.5) * 20, 738], [cx + (h1(n * 5 + 2) - 0.5) * 24, 688], [lane, 628]];
	if (zk) {
		// stop at the current front of its zone, with a short mass-transfer spread above it
		const z = ZONES[zk];
		const top = z.base - z.below.reduce((a, b) => a + (front[b] ?? 0), 0) - (front[zk] ?? 0);
		pts.push([lane, top - 3 - 12 * Math.pow(h1(n * 13 + 1), 2)]);
		front[zk] = (front[zk] ?? 0) + ZONE_DH;
	} else pts.push([lane, 232], [cx + (h1(n * 3 + 9) - 0.5) * 20, 156], [cx, 104]);
	const cum = [0];
	for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
	const len = cum[cum.length - 1], speed = 140 * (0.9 + 0.2 * h1(n * 19));
	MOLS.push({ts, sp, zk, pts, cum, len, speed, ph: h1(n * 17) * 6.28, tCap: ts + len / speed});
}
// Loaded zone at time t: [bottom y, top y] in world units.
export function zoneAt(zk: string, t: number): [number, number] {
	const z = ZONES[zk];
	const count = (key: string) => MOLS.filter((m) => m.zk === key && m.tCap <= t).length * ZONE_DH;
	const bottom = z.base - z.below.reduce((a, b) => a + count(b), 0);
	return [bottom, bottom - count(zk)];
}
export function molPos(m: Mol, d: number): Pt {
	let i = 1;
	while (i < m.cum.length - 1 && m.cum[i] < d) i++;
	const a = m.pts[i - 1], b = m.pts[i], u = clamp((d - m.cum[i - 1]) / (m.cum[i] - m.cum[i - 1] || 1));
	let x = lerp(a[0], b[0], u);
	const y = lerp(a[1], b[1], u);
	if (y < 630 && y > 232) x += 2.6 * Math.sin(d / 8 + m.ph);
	return [x, y];
}

// ---------- chapters (story seconds) ----------
export const CHAPTERS = [
	{t: 0, g: '제작', title: '설계 도면', desc: '내경 D, 길이 L, 2:1 반타원형 경판으로 탑의 모양을 정합니다.'},
	{t: 2.5, g: '제작', title: '흡착탑 조립', desc: 'PSA 흡착탑 한 기가 조립됩니다.'},
	{t: 8.3, g: '제작', title: '점검', desc: '완성된 흡착탑을 점검합니다.'},
	{t: 10.4, g: '충전', title: '단면 보기', desc: '안쪽을 보기 위해 앞쪽 절반을 잘라 냅니다.'},
	{t: 11.7, g: '충전', title: '충전 준비', desc: '플랜지를 열고 노즐 위에 호퍼를 올립니다.'},
	{t: 13.2, g: '충전', title: '하부 지지층', desc: '세라믹 볼이 흡착제를 받치고 가스를 고르게 퍼뜨립니다.'},
	{t: 17.4, g: '충전', title: '활성 알루미나', desc: '스크린을 깔고, 수분을 먼저 잡는 층을 붓습니다.'},
	{t: 22.4, g: '충전', title: '활성탄', desc: 'CO₂ · CH₄ · CO · N₂ 대부분을 잡는 주 흡착층입니다.'},
	{t: 28.6, g: '충전', title: '제올라이트 5A', desc: '마지막 방어층. 남은 불순물이 제품 쪽으로 새지 않게 막습니다.'},
	{t: 34.6, g: '충전', title: '상부 고정층', desc: '스크린과 세라믹 볼로 윗면을 눌러 흡착제가 들뜨지 않게 합니다.'},
	{t: 39.0, g: '운전', title: '배관 연결', desc: '아래에 원료 배관, 위에 제품 배관을 연결합니다.'},
	{t: 41.2, g: '운전', title: '가스 흐름', desc: '각 성분이 맞는 층에 잡히고 H₂만 위로 빠져나갑니다.'},
];
