// 2D (flat) two-bed PSA, drawn in world units (see sim.ts for layout and cycle logic).
import React from 'react';
import {KR} from '../fonts';
import {
	BEDS, BED_IN, Bed, FLOW, GASC, INK, M, MODE, NET, PATHS, STEPS, Tr, VALVES, WALK, Y, bedDots, cycleState, eo, eob,
	flowAlpha, frontAt, frontY, mixHex, modeOf, pipeDots, poly, popT, pr, pressureAt, snapT, trStr, valveAt,
} from '../sim';

const HALO = {paintOrder: 'stroke' as const, stroke: '#f8fafc', strokeWidth: 6, strokeLinejoin: 'round' as const};
const STOPS: [number, string][] = [
	[0, M.body], [0.18, M.body], [0.18, M.light], [0.265, M.light], [0.265, M.body], [0.31, M.body],
	[0.31, '#eef3f7'], [0.335, '#eef3f7'], [0.335, M.body], [0.71, M.body], [0.71, M.shade], [1, M.shade],
];
const Snap: React.FC<{tr: Tr | null; px: number; py: number; children: React.ReactNode}> = ({tr, px, py, children}) =>
	tr ? <g transform={trStr(tr, px, py)}>{children}</g> : null;
const Label: React.FC<{x: number; y: number; a?: number; anchor?: 'start' | 'middle' | 'end'; size?: number; color?: string; children: React.ReactNode}> = ({x, y, a = 1, anchor = 'middle', size = 21, color = '#18212c', children}) =>
	a > 0 ? <text x={x} y={y} opacity={a} fontFamily={KR} fontSize={size} fontWeight={900} fill={color} textAnchor={anchor} style={HALO}>{children}</text> : null;

const ASM = {bedA: [1.0, 1.45], bedB: [1.6, 2.05], pipes: [2.3, 3.6], labels: [4.8, 5.5], cut: [5.3, 6.1]} as const;
const IMPACTS = [
	{t: 1.45, bed: BEDS[0]},
	{t: 2.05, bed: BEDS[1]},
];

// ---------- bed ----------
const BedView: React.FC<{b: Bed; t: number}> = ({b, t}) => {
	const id = `bed-${b.key}`, cut = pr(t, ASM.cut[0], ASM.cut[1]);
	const {ct} = cycleState(t), running = t >= WALK[0];
	const f = frontAt(b.key, running ? ct : 0), yf = frontY(f);
	const ix = b.cx - b.r + 6, iw = 2 * b.r - 12;
	const beads: React.ReactNode[] = [];
	for (let row = 0, y = BED_IN.bot - 6; y > BED_IN.top + 4; y -= 10, row++)
		for (let x = ix + 8 + (row % 2) * 5; x < ix + iw - 4; x += 10)
			beads.push(<circle key={`${row}-${x}`} cx={x} cy={y} r={4.1} fill="#dcc9a0" stroke="rgba(39,49,61,.55)" strokeWidth={0.8} />);
	return (
		<g>
			<defs>
				<linearGradient id={`${id}-m`} gradientUnits="userSpaceOnUse" x1={b.cx - b.r} x2={b.cx + b.r} y1={0} y2={0}>
					{STOPS.map(([o, c], i) => <stop key={i} offset={o} stopColor={c} />)}
				</linearGradient>
				<clipPath id={`${id}-in`}><rect x={ix} y={b.top + 6} width={iw} height={b.bot - b.top - 12} rx={b.r - 6} ry={(b.r - 6) * 0.55} /></clipPath>
				<linearGradient id={`${id}-load`} gradientUnits="userSpaceOnUse" x1={0} x2={0} y1={yf - 36} y2={yf + 24}>
					<stop offset={0} stopColor={GASC.IMP} stopOpacity={0} /><stop offset={0.6} stopColor={GASC.IMP} stopOpacity={0.34} /><stop offset={1} stopColor={GASC.IMP} stopOpacity={0.42} />
				</linearGradient>
			</defs>
			<rect x={b.cx - b.r} y={b.top} width={2 * b.r} height={b.bot - b.top} rx={b.r} ry={b.r * 0.55} fill={`url(#${id}-m)`} stroke={INK} strokeWidth={2.4} />
			{cut > 0 ? (
				<g opacity={cut}>
					<rect x={ix} y={b.top + 6} width={iw} height={b.bot - b.top - 12} rx={b.r - 6} ry={(b.r - 6) * 0.55} fill="#eef3f8" stroke={INK} strokeWidth={1.2} />
					<g clipPath={`url(#${id}-in)`}>
						{beads}
						<rect x={ix} y={yf - 36} width={iw} height={BED_IN.bot - yf + 36} fill={`url(#${id}-load)`} />
						{/* support screens */}
						{[BED_IN.top, BED_IN.bot].map((y) => (
							<g key={y}>
								<rect x={ix} y={y - 3} width={iw} height={6} fill="#b8c2cd" />
								<line x1={ix} y1={y} x2={ix + iw} y2={y} stroke={INK} strokeWidth={1.6} strokeDasharray="3 3" />
							</g>
						))}
						{bedDots(b, t).map((d, i) =>
							d.op > 0.01 ? <circle key={i} cx={d.x} cy={d.y} r={4.3} fill={d.imp ? GASC.IMP : GASC.H2} stroke="#fff" strokeWidth={1.3} opacity={d.op} /> : null,
						)}
					</g>
					<rect x={b.cx - 26} y={b.top + 10} width={52} height={24} rx={12} fill="#fff" stroke={INK} strokeWidth={2} />
					<text x={b.cx} y={b.top + 29} fontFamily={KR} fontSize={17} fontWeight={900} textAnchor="middle" fill="#18212c">{b.key}탑</text>
				</g>
			) : null}
		</g>
	);
};
// pressure gauge + current step badge, outside each bed
const BedSide: React.FC<{b: Bed; t: number}> = ({b, t}) => {
	const a = pr(t, ASM.labels[0], ASM.labels[1]);
	if (a <= 0) return null;
	const running = t >= WALK[0], {ct, k} = cycleState(t);
	const p = running ? pressureAt(b.key, ct) : 0.5, an = ((-220 + 260 * p) * Math.PI) / 180;
	const x = b.key === 'A' ? b.cx - 118 : b.cx + 118, y = 300;
	const m = MODE[modeOf(b.key, k)];
	return (
		<g opacity={a} fontFamily={KR}>
			<line x1={b.key === 'A' ? x + 26 : x - 26} y1={y} x2={b.key === 'A' ? b.cx - b.r : b.cx + b.r} y2={y} stroke={INK} strokeWidth={3} />
			<circle cx={x} cy={y} r={27} fill="#fff" stroke={INK} strokeWidth={3} />
			{Array.from({length: 9}, (_, j) => {
				const q = ((-220 + 32.5 * j) * Math.PI) / 180;
				return <line key={j} x1={x + 18 * Math.cos(q)} y1={y + 18 * Math.sin(q)} x2={x + 23 * Math.cos(q)} y2={y + 23 * Math.sin(q)} stroke={INK} strokeWidth={1.4} />;
			})}
			<line x1={x} y1={y} x2={x + 19 * Math.cos(an)} y2={y + 19 * Math.sin(an)} stroke="#dc2626" strokeWidth={3} strokeLinecap="round" />
			<circle cx={x} cy={y} r={3} fill={INK} />
			<text x={x} y={y + 50} fontSize={16} fontWeight={700} fill="#5d6876" textAnchor="middle">압력</text>
			{running ? (
				<g>
					<rect x={x - 42} y={y + 66} width={84} height={34} rx={17} fill={m.color} stroke={INK} strokeWidth={2.4} />
					<text x={x} y={y + 90} fontSize={19} fontWeight={900} fill="#18212c" textAnchor="middle">{m.name}</text>
				</g>
			) : null}
		</g>
	);
};

// ---------- valves ----------
const Valve: React.FC<{v: (typeof VALVES)[number]; t: number}> = ({v, t}) => {
	const o = valveAt(v.key, t);
	const fill = o <= 0.02 ? '#e5e7eb' : o < 0.75 ? mixHex('#e5e7eb', '#bef264', o / 0.5) : mixHex('#bef264', '#22c55e', (o - 0.5) / 0.5);
	const rot = v.dir === 'h' ? 0 : v.x < 440 ? 90 : -90; // stem points away from the label
	const labelSide = v.dir === 'h' ? {x: v.x, y: v.key === 'V7' ? v.y + 36 : v.y - 44, anchor: 'middle' as const} : v.x < 440 ? {x: v.x - 24, y: v.y + 6, anchor: 'end' as const} : {x: v.x + 24, y: v.y + 6, anchor: 'start' as const};
	return (
		<g>
			<g transform={`translate(${v.x} ${v.y}) rotate(${rot})`}>
				<line x1={0} y1={0} x2={0} y2={-18} stroke={INK} strokeWidth={2.4} />
				<rect x={-9} y={-28} width={18} height={11} rx={2} fill={M.shade} stroke={INK} strokeWidth={1.8} />
				<path d="M -15 -10 L 15 10 L 15 -10 L -15 10 Z" fill={fill} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
				{o <= 0.02 ? <line x1={-6} y1={0} x2={6} y2={0} stroke="#dc2626" strokeWidth={3} /> : null}
			</g>
			<text x={labelSide.x} y={labelSide.y} fontFamily={KR} fontSize={15} fontWeight={900} fill="#18212c" textAnchor={labelSide.anchor} style={HALO}>{v.key}</text>
			<text x={labelSide.x} y={labelSide.y + 17} fontFamily={KR} fontSize={13} fontWeight={700} fill="#5d6876" textAnchor={labelSide.anchor} style={HALO}>{v.name}</text>
		</g>
	);
};

// ---------- pipes ----------
const Pipes: React.FC<{t: number}> = ({t}) => {
	const f = eo(pr(t, ASM.pipes[0], ASM.pipes[1]));
	const {k, tau} = cycleState(t), running = t >= WALK[0], fa = running ? flowAlpha(tau, STEPS[k].dur) : 0;
	return (
		<g fill="none" strokeLinejoin="round">
			{NET.map((s, i) => <path key={`o${i}`} d={poly(s)} stroke={INK} strokeWidth={12} pathLength={1} strokeDasharray={`${f} 2`} />)}
			{NET.map((s, i) => <path key={`i${i}`} d={poly(s)} stroke={M.body} strokeWidth={8} pathLength={1} strokeDasharray={`${f} 2`} />)}
			{running ? STEPS[k].flows.map((fl, i) => <path key={`fl${i}`} d={poly(PATHS[fl.path])} stroke={FLOW[fl.kind]} strokeWidth={6} opacity={fa} />) : null}
			{/* flanges at the bed nozzles */}
			{f >= 1 ? BEDS.flatMap((b) => [b.top - 4, b.bot + 4].map((y) => <line key={`${b.key}${y}`} x1={b.cx - 12} y1={y} x2={b.cx + 12} y2={y} stroke={INK} strokeWidth={6} strokeLinecap="round" />)) : null}
			{pipeDots(t).map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={3.6} fill={d.imp ? GASC.IMP : GASC.H2} stroke="#fff" strokeWidth={1} opacity={d.op} />)}
		</g>
	);
};

const Impacts: React.FC<{t: number}> = ({t}) => (
	<g>
		{IMPACTS.map((im, n) => {
			const tau = t - im.t;
			if (tau < 0 || tau > 0.8) return null;
			const a = 1 - tau / 0.35, s = eob(pr(tau, 0, 0.2)), ta = 1 - pr(tau, 0.5, 0.8), b = im.bed;
			return (
				<g key={n}>
					{tau < 0.35
						? [[b.cx - b.r, 560], [b.cx + b.r, 560]].flatMap(([x, y], pi) =>
								[-2, -1, 0, 1, 2].map((j) => {
									const an = (pi ? 0 : Math.PI) + j * 0.42, r1 = 8 + 40 * eo(tau / 0.35), r2 = r1 + 14 * a;
									return <line key={`${pi}${j}`} x1={x + Math.cos(an) * r1} y1={y + Math.sin(an) * r1} x2={x + Math.cos(an) * r2} y2={y + Math.sin(an) * r2} stroke={INK} strokeOpacity={a} strokeWidth={2.6} strokeLinecap="round" />;
								}),
							)
						: null}
					<g transform={`translate(${b.cx + 110} 240) rotate(-7) scale(${s})`} opacity={ta}>
						<text fontFamily={KR} fontWeight={900} fontSize={54} textAnchor="middle" dominantBaseline="middle" fill="#f59e0b" stroke={INK} strokeWidth={3} paintOrder="stroke" strokeLinejoin="round">착!</text>
					</g>
				</g>
			);
		})}
	</g>
);
const Blueprint: React.FC<{t: number}> = ({t}) => {
	const a = pr(t, 0.1, 0.6) * (1 - pr(t, 4.4, 5.2));
	if (a <= 0) return null;
	return (
		<g opacity={a * 0.8} fill="none" stroke="#3b82f6" strokeWidth={1.8} strokeDasharray="8 6">
			{BEDS.map((b) => <rect key={b.key} x={b.cx - b.r} y={b.top} width={2 * b.r} height={b.bot - b.top} rx={b.r} ry={b.r * 0.55} />)}
			{NET.map((s, i) => <path key={i} d={poly(s)} />)}
		</g>
	);
};
const shake = (t: number) => IMPACTS.reduce((y, im) => {
	const tau = t - im.t;
	return tau > 0 && tau < 0.45 ? y + 6 * Math.exp(-12 * tau) * Math.sin(55 * tau) : y;
}, 0);

export const Psa2D: React.FC<{t: number; width: number; height: number}> = ({t, width, height}) => {
	const z = 0.9, fx = 470, fy = 440 - shake(t), vh = 860 / z, vw = (vh * width) / height;
	const la = pr(t, ASM.labels[0], ASM.labels[1]);
	return (
		<svg width={width} height={height} viewBox={`${fx - 430 / z} ${fy - 430 / z} ${vw} ${vh}`} style={{position: 'absolute', inset: 0}}>
			<defs>
				<pattern id="grid" width={40} height={40} patternUnits="userSpaceOnUse">
					<path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59,130,246,.09)" strokeWidth={1} />
				</pattern>
			</defs>
			<rect x={-3000} y={-3000} width={8000} height={8000} fill="url(#grid)" />
			<rect x={-3000} y={Y.floor} width={8000} height={1000} fill="#e7ecf2" />
			<line x1={-3000} y1={Y.floor} x2={5000} y2={Y.floor} stroke={INK} strokeWidth={2} />
			<Blueprint t={t} />
			<Pipes t={t} />
			<Snap tr={snapT(t, ASM.bedA[0], ASM.bedA[1], 0, -700, 0.08)} px={BEDS[0].cx} py={BEDS[0].bot}><BedView b={BEDS[0]} t={t} /></Snap>
			<Snap tr={snapT(t, ASM.bedB[0], ASM.bedB[1], 0, -700, 0.08)} px={BEDS[1].cx} py={BEDS[1].bot}><BedView b={BEDS[1]} t={t} /></Snap>
			{VALVES.map((v) => <Snap key={v.key} tr={popT(t, v.t)} px={v.x} py={v.y}><Valve v={v} t={t} /></Snap>)}
			{BEDS.map((b) => <BedSide key={b.key} b={b} t={t} />)}
			<Label x={20} y={684} a={la} anchor="start" size={20} color="#475569">원료 가스</Label>
			<Label x={920} y={64} a={la} anchor="end" size={20} color="#0e7490">제품 H₂ →</Label>
			<Label x={920} y={826} a={la} anchor="end" size={20} color="#b91c1c">탈착 가스 →</Label>
			<Impacts t={t} />
		</svg>
	);
};
