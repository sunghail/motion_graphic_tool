// Molecule close-ups (screen space): MEA picks up CO₂ in the absorber, lets it go in the stripper.
import React from 'react';
import {KR} from '../fonts';
import {INK, Pt, ZOOMS, clamp, eio, eo, eob, h1, lerp, pr, toScreen} from '../sim';

const C0: Pt = [720, 520]; // lens centre (px)
const RL = 300; // lens radius (px)
const ATOM = {O: {r: 17, c: '#ef4444', t: '#fff'}, C: {r: 16, c: '#4b5563', t: '#fff'}, N: {r: 17, c: '#3b82f6', t: '#fff'}, H: {r: 9, c: '#ffffff', t: INK}};
type El = keyof typeof ATOM;

const Atom: React.FC<{x: number; y: number; el: El}> = ({x, y, el}) => {
	const a = ATOM[el];
	return (
		<g>
			<circle cx={x} cy={y} r={a.r} fill={a.c} stroke={INK} strokeWidth={2.4} />
			<circle cx={x - a.r * 0.35} cy={y - a.r * 0.35} r={a.r * 0.26} fill="rgba(255,255,255,.55)" />
			{el !== 'H' ? <text x={x} y={y + 6} fontFamily={KR} fontSize={16} fontWeight={900} fill={a.t} textAnchor="middle">{el}</text> : null}
		</g>
	);
};
const Bond: React.FC<{a: Pt; b: Pt; double?: boolean}> = ({a, b, double}) => {
	if (!double) return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={INK} strokeWidth={6} strokeLinecap="round" />;
	const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = (-dy / L) * 5, ny = (dx / L) * 5;
	return (
		<g stroke={INK} strokeWidth={4.5} strokeLinecap="round">
			<line x1={a[0] + nx} y1={a[1] + ny} x2={b[0] + nx} y2={b[1] + ny} />
			<line x1={a[0] - nx} y1={a[1] - ny} x2={b[0] - nx} y2={b[1] - ny} />
		</g>
	);
};
// MEA skeleton: HO–C–C–N(H₂); returns the N position so CO₂ / H⁺ can attach there
const add = (p: Pt, q: Pt): Pt => [p[0] + q[0], p[1] + q[1]];
const MEA: React.FC<{at: Pt; hN: number; jit?: Pt}> = ({at, hN, jit = [0, 0]}) => {
	const o = add(at, jit), O = add(o, [-70, 0]), C1 = add(o, [-30, 0]), C2 = add(o, [10, 0]), N = add(o, [50, 0]);
	const hs: Pt[] = [add(N, [16, -18]), add(N, [16, 18]), add(N, [-2, -26])].slice(0, hN);
	return (
		<g>
			<Bond a={O} b={C1} /><Bond a={C1} b={C2} /><Bond a={C2} b={N} /><Bond a={O} b={add(O, [-20, -14])} />
			{hs.map((h, i) => <Bond key={i} a={N} b={h} />)}
			<Atom x={O[0] - 20} y={O[1] - 14} el="H" />
			{hs.map((h, i) => <Atom key={i} x={h[0]} y={h[1]} el="H" />)}
			<Atom x={O[0]} y={O[1]} el="O" /><Atom x={C1[0]} y={C1[1]} el="C" /><Atom x={C2[0]} y={C2[1]} el="C" /><Atom x={N[0]} y={N[1]} el="N" />
		</g>
	);
};
// CO₂ with a bend: 0 = linear O=C=O, 1 = bent carboxylate (as when bound to N)
const CO2: React.FC<{c: Pt; bend: number; rot?: number}> = ({c, bend, rot = 0}) => {
	const ang = lerp(Math.PI, (2 * Math.PI) / 3, bend) / 2, d = 36;
	const o1: Pt = [c[0] + d * Math.cos(rot - ang), c[1] + d * Math.sin(rot - ang)];
	const o2: Pt = [c[0] + d * Math.cos(rot + ang), c[1] + d * Math.sin(rot + ang)];
	return (
		<g>
			<Bond a={c} b={o1} double /><Bond a={c} b={o2} double={bend < 0.5} />
			<Atom x={o1[0]} y={o1[1]} el="O" /><Atom x={o2[0]} y={o2[1]} el="O" /><Atom x={c[0]} y={c[1]} el="C" />
		</g>
	);
};
const Charge: React.FC<{x: number; y: number; s: string; a: number}> = ({x, y, s, a}) =>
	a > 0 ? (
		<g transform={`translate(${x} ${y}) scale(${eob(a)})`}>
			<circle r={13} fill="#fff" stroke={INK} strokeWidth={2.2} />
			<text y={7} fontFamily={KR} fontSize={22} fontWeight={900} textAnchor="middle" fill={s === '+' ? '#2563eb' : '#dc2626'}>{s}</text>
		</g>
	) : null;
const Tag: React.FC<{x: number; y: number; a: number; children: React.ReactNode}> = ({x, y, a, children}) =>
	a > 0 ? <text x={x} y={y} opacity={a} fontFamily={KR} fontSize={26} fontWeight={900} fill="#18212c" textAnchor="middle" style={{paintOrder: 'stroke', stroke: '#fff', strokeWidth: 6, strokeLinejoin: 'round'}}>{children}</text> : null;

// positions inside the lens (lens-local px, origin at centre)
const M1: Pt = [-90, 40], M2: Pt = [60, 130];
const N1 = add(M1, [50, 0]), N2 = add(M2, [50, 0]);
const BOUND = add(N1, [44, -14]); // carbon of CO₂ when bound to N1
const HFROM = add(N1, [16, 18]), HTO = add(N2, [-2, -26]);
const IFACE = -40; // gas above, liquid below

const Scene: React.FC<{tau: number; mode: 'absorb' | 'release'}> = ({tau, mode}) => {
	const ab = mode === 'absorb';
	// progress of "bound" state: 0 = free CO₂ + 2 MEA, 1 = MEA–COO⁻ + MEAH⁺
	const bindU = ab ? pr(tau, 2.6, 3.0) : 1 - pr(tau, 2.0, 2.4);
	const hU = ab ? eio(pr(tau, 2.9, 3.7)) : 1 - eio(pr(tau, 2.1, 2.9));
	let co2: Pt, rot = 0;
	if (ab) {
		const u = eio(pr(tau, 0.6, 2.6));
		co2 = [lerp(-190, BOUND[0], u) + 10 * Math.sin(tau * 5) * (1 - u), lerp(-230, BOUND[1], u)];
		rot = lerp(0.4, -0.35, u);
	} else {
		const u = eio(pr(tau, 2.0, 3.6));
		co2 = [lerp(BOUND[0], -170, u), lerp(BOUND[1], -250, u)];
		rot = lerp(-0.35, 0.5, u);
	}
	const jit: Pt = !ab && tau > 0.8 && tau < 2.0 ? [4 * Math.sin(tau * 70) * pr(tau, 0.8, 1.6), 3 * Math.cos(tau * 83) * pr(tau, 0.8, 1.6)] : [0, 0];
	const hPos: Pt = [lerp(HFROM[0], HTO[0], hU), lerp(HFROM[1], HTO[1], hU) - 40 * Math.sin(Math.PI * hU)];
	const labelBound = ab ? pr(tau, 3.8, 4.2) : 1 - pr(tau, 2.8, 3.2);
	const burst = ab ? tau - 2.6 : tau - 2.0;
	const waters = Array.from({length: 14}, (_, i) => [lerp(-250, 250, h1(i * 3.3)), lerp(-10, 270, h1(i * 7.9))] as Pt);
	return (
		<g>
			<rect x={-RL} y={-RL} width={2 * RL} height={RL + IFACE} fill="#f5f9ff" />
			<path d={`M ${-RL} ${IFACE} ${Array.from({length: 13}, (_, i) => `Q ${-RL + i * 55 + 27} ${IFACE + (i % 2 ? 8 : -8) * Math.sin(tau * 3)} ${-RL + (i + 1) * 55} ${IFACE}`).join(' ')} V ${RL} H ${-RL} Z`} fill="#d6ebff" />
			{waters.map((w, i) => (
				<g key={i} opacity={0.35} transform={`translate(${w[0]} ${w[1] + 4 * Math.sin(tau * 2 + i)})`}>
					<circle r={9} fill="#ef4444" stroke={INK} strokeWidth={1.4} />
					<circle cx={-10} cy={-7} r={5} fill="#fff" stroke={INK} strokeWidth={1.2} />
					<circle cx={10} cy={-7} r={5} fill="#fff" stroke={INK} strokeWidth={1.2} />
				</g>
			))}
			{/* heat from the reboiler */}
			{!ab && tau > 0.4 && tau < 3.8
				? Array.from({length: 5}, (_, i) => {
						const ph = ((tau - 0.4) * 0.8 + i / 5) % 1, x = -220 + i * 110;
						return <path key={i} d={`M ${x} ${RL - 20 - ph * 200} q 10 -15 0 -30 q -10 -15 0 -30`} fill="none" stroke="#ef4444" strokeWidth={4} strokeLinecap="round" opacity={(1 - ph) * pr(tau, 0.4, 0.8) * (1 - pr(tau, 3.4, 3.8))} />;
					})
				: null}
			<g transform="scale(1.3)">
			{/* bonds that come and go are drawn first, so atoms always sit on top of them */}
			{hU <= 0.001 ? <Bond a={add(N1, jit)} b={add(HFROM, jit)} /> : null}
			{hU >= 0.999 ? <Bond a={N2} b={HTO} /> : null}
			{bindU > 0.5 ? <Bond a={add(N1, jit)} b={add(BOUND, jit)} /> : null}
			<MEA at={M1} hN={1} jit={jit} />
			<MEA at={M2} hN={2} />
			<CO2 c={bindU > 0.5 ? add(co2, jit) : co2} bend={bindU} rot={rot} />
			{hU < 0.999 && hU > 0.001 ? <Atom x={hPos[0]} y={hPos[1]} el="H" /> : null}
			{hU <= 0.001 ? <Atom x={HFROM[0] + jit[0]} y={HFROM[1] + jit[1]} el="H" /> : null}
			{hU >= 0.999 ? <Atom x={HTO[0]} y={HTO[1]} el="H" /> : null}
			{burst > 0 && burst < 0.35
				? [0, 1, 2, 3, 4, 5].map((j) => {
						const an = (j * Math.PI) / 3, r1 = 30 + 60 * eo(burst / 0.35);
						return <line key={j} x1={BOUND[0] + Math.cos(an) * r1} y1={BOUND[1] + Math.sin(an) * r1} x2={BOUND[0] + Math.cos(an) * (r1 + 16)} y2={BOUND[1] + Math.sin(an) * (r1 + 16)} stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={1 - burst / 0.35} />;
					})
				: null}
			<Charge x={BOUND[0] + 34} y={BOUND[1] + 30} s="−" a={ab ? pr(tau, 3.6, 3.9) : 1 - pr(tau, 2.0, 2.3)} />
			<Charge x={N2[0] + 24} y={N2[1] - 40} s="+" a={ab ? pr(tau, 3.7, 4.0) : 1 - pr(tau, 2.2, 2.5)} />
			<Tag x={M1[0] - 10} y={M1[1] + 62} a={1 - labelBound}>MEA</Tag>
			<Tag x={M2[0] - 10} y={M2[1] + 62} a={1 - labelBound}>MEA</Tag>
			<Tag x={M1[0] + 10} y={M1[1] + 62} a={labelBound}>MEA–COO⁻</Tag>
			<Tag x={M2[0] - 10} y={M2[1] + 62} a={labelBound}>MEAH⁺</Tag>
			<Tag x={co2[0]} y={co2[1] - 34} a={ab ? 1 - pr(tau, 2.2, 2.6) : pr(tau, 2.6, 3.0)}>CO₂</Tag>
			</g>
		</g>
	);
};

export const Zoom: React.FC<{t: number}> = ({t}) => {
	const z = ZOOMS.find((q) => t >= q.t0 && t < q.t1);
	if (!z) return null;
	const tau = t - z.t0, dur = z.t1 - z.t0;
	const s = eob(pr(tau, 0, 0.6)) * (1 - eio(pr(tau, dur - 0.6, dur)));
	if (s <= 0.001) return null;
	const tp = toScreen(t, z.target), ang = Math.atan2(tp[1] - C0[1], tp[0] - C0[0]);
	const edge: Pt = [C0[0] + RL * s * Math.cos(ang), C0[1] + RL * s * Math.sin(ang)];
	const eq = pr(tau, z.mode === 'absorb' ? 3.9 : 3.0, z.mode === 'absorb' ? 4.3 : 3.4) * (1 - pr(tau, dur - 0.7, dur - 0.3));
	return (
		<svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
			<defs><clipPath id="lens"><circle cx={0} cy={0} r={RL} /></clipPath></defs>
			<line x1={tp[0]} y1={tp[1]} x2={edge[0]} y2={edge[1]} stroke={INK} strokeWidth={3} strokeDasharray="10 7" opacity={clamp(s)} />
			<circle cx={tp[0]} cy={tp[1]} r={16} fill="none" stroke={INK} strokeWidth={3} opacity={clamp(s)} />
			<g transform={`translate(${C0[0]} ${C0[1]}) scale(${s})`}>
				<circle cx={10} cy={10} r={RL} fill={INK} />
				<g clipPath="url(#lens)"><Scene tau={tau} mode={z.mode} /></g>
				<circle r={RL} fill="none" stroke={INK} strokeWidth={5} />
			</g>
			{eq > 0 ? (
				<g opacity={eq} transform={`translate(${C0[0]} ${C0[1] + RL + 56})`} fontFamily={KR}>
					<rect x={-320} y={-38} width={640} height={76} rx={38} fill="#fff" stroke={INK} strokeWidth={3} />
					{z.mode === 'absorb' ? (
						<text y={12} fontSize={34} fontWeight={900} textAnchor="middle" fill="#18212c">2 MEA + CO₂ → MEA–COO⁻ + MEAH⁺</text>
					) : (
						<>
							<text y={12} fontSize={34} fontWeight={900} textAnchor="middle" fill="#18212c">MEA–COO⁻ + MEAH⁺ → 2 MEA + CO₂</text>
							<circle cx={-322} cy={0} r={30} fill="#ef4444" stroke={INK} strokeWidth={3} />
							<text x={-322} y={10} fontSize={28} fontWeight={900} textAnchor="middle" fill="#fff">열</text>
						</>
					)}
				</g>
			) : null}
		</svg>
	);
};
