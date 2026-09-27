// The bed itself, drawn as flat 2D SVG in "world" units (see sim.ts for geometry).
import React from 'react';
import {KR} from '../fonts';
import {
	ASM, BAG_OUT, FLOOR, FUN, HD, IMPACTS, INK, LAYERS, Layer, M, MOLS, PATH, R, RF, RI, RN, RY, SCREENS, TILT, Tr, WALL,
	ZONES, camera, cx, cylPath, eio, ell, eo, eob, hopperPos, lerp, molPos, nAt, poly, pr, profilePath, shake, snapT,
	trStr, vesselPos, yBot, yTop, zoneAt,
} from '../sim';

const PI = Math.PI;
const HALO = {paintOrder: 'stroke' as const, stroke: '#f8fafc', strokeWidth: 6, strokeLinejoin: 'round' as const};

// ---------- primitives ----------
const STOPS: [number, string][] = [
	[0, M.body], [0.18, M.body], [0.18, M.light], [0.265, M.light], [0.265, M.body], [0.31, M.body],
	[0.31, '#eef3f7'], [0.335, '#eef3f7'], [0.335, M.body], [0.71, M.body], [0.71, M.shade], [1, M.shade],
];
// flat metal = body colour + light stripes on the left + shade band on the right + ink outline
const Metal: React.FC<{id: string; d: string; x: number; r: number; lw?: number}> = ({id, d, x, r, lw = 2}) => (
	<>
		<defs>
			<linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x - r} x2={x + r} y1={0} y2={0}>
				{STOPS.map(([o, c], i) => <stop key={i} offset={o} stopColor={c} />)}
			</linearGradient>
		</defs>
		<path d={d} fill={`url(#${id})`} stroke={INK} strokeWidth={lw} strokeLinejoin="round" />
	</>
);
const Face: React.FC<{x: number; y: number; r: number; bore?: number; solid?: boolean}> = ({x, y, r, bore, solid}) => (
	<g>
		<ellipse cx={x} cy={y} rx={r} ry={r * TILT} fill={M.top} stroke={INK} strokeWidth={1.6} />
		{bore ? <ellipse cx={x} cy={y} rx={bore} ry={bore * TILT} fill={M.inner} stroke={INK} strokeWidth={1.6} /> : null}
		{Array.from({length: 8}, (_, j) => {
			const a = (j * PI) / 4 + PI / 8;
			return (
				<ellipse key={j} cx={x + (r - 6) * Math.cos(a)} cy={y + (r - 6) * TILT * Math.sin(a)} rx={solid ? 2.8 : 2} ry={solid ? 1.7 : 1.1}
					fill={solid ? M.body : INK} stroke={solid ? INK : 'none'} strokeWidth={0.9} />
			);
		})}
	</g>
);
const Snap: React.FC<{tr: Tr | null; px: number; py: number; children: React.ReactNode}> = ({tr, px, py, children}) =>
	tr ? <g transform={trStr(tr, px, py)}>{children}</g> : null;

// ---------- blueprint ----------
const Blueprint: React.FC<{t: number}> = ({t}) => {
	const prog = eio(pr(t, 0.2, 2.0));
	const ghostA = (t < 2.5 ? 0.9 : lerp(0.9, 0.5, pr(t, 2.5, 3.0))) * (1 - pr(t, 7.0, 7.6));
	const dimA = pr(t, 0.9, 1.6) * (1 - pr(t, 2.4, 2.9));
	const xd = cx - R - 52;
	const blue = '#3b82f6';
	const head = (x: number, y: number, ang: number) =>
		poly([[x, y], [x - 11 * Math.cos(ang - 0.38), y - 11 * Math.sin(ang - 0.38)], [x - 11 * Math.cos(ang + 0.38), y - 11 * Math.sin(ang + 0.38)]], true);
	return (
		<g>
			<defs>
				<clipPath id="bp-clip"><rect x={-500} y={-500} width={2600} height={590 + prog * 760} /></clipPath>
			</defs>
			{ghostA > 0 ? (
				<g opacity={ghostA} clipPath="url(#bp-clip)" fill="none" stroke={blue} strokeWidth={1.8} strokeDasharray="8 6">
					<path d={PATH.silhouette} />
					<rect x={cx - RN} y={112} width={2 * RN} height={42} />
					<rect x={cx - RF} y={104} width={2 * RF} height={10} />
					<rect x={cx - RN} y={684} width={2 * RN} height={44} />
					<rect x={cx - RF} y={728} width={2 * RF} height={10} />
					{[cx - R - 9, cx + R + 9].map((x) => (
						<g key={x}>
							<rect x={x - 10} y={556} width={20} height={48} />
							<rect x={x - 7} y={604} width={14} height={FLOOR - 609} />
						</g>
					))}
					<line x1={cx} y1={80} x2={cx} y2={760} strokeWidth={1} strokeDasharray="16 4 3 4" />
				</g>
			) : null}
			{dimA > 0 ? (
				<g opacity={dimA} stroke="#1d4ed8" fill="#1d4ed8" strokeWidth={1.4} fontFamily={KR}>
					<path d={`M ${cx - R - 6} ${yTop} H ${xd - 8} M ${cx - R - 6} ${yBot} H ${xd - 8} M ${xd} ${yTop} V ${yBot} M ${cx - R} 420 H ${cx + R}`} fill="none" />
					<path d={head(xd, yTop, -PI / 2) + head(xd, yBot, PI / 2) + head(cx - R, 420, PI) + head(cx + R, 420, 0)} stroke="none" />
					<g stroke="none" fontWeight={900}>
						<text x={xd - 12} y={(yTop + yBot) / 2 - 10} fontSize={26} textAnchor="end">L</text>
						<text x={xd - 12} y={(yTop + yBot) / 2 + 16} fontSize={16} fontWeight={700} textAnchor="end">직관부</text>
						<text x={cx} y={404} fontSize={26} textAnchor="middle">Ø D</text>
					</g>
					<path d={`M ${cx + R * 0.72} ${yTop - HD * 0.69} L ${cx + R + 40} 150 H ${cx + R + 52}`} fill="none" />
					<g stroke="none" fontWeight={700} fontSize={19}>
						<text x={cx + R + 58} y={156}>2:1 반타원형 경판</text>
						<text x={cx + R + 58} y={180} fontSize={16} fontWeight={500}>깊이 = D/4</text>
					</g>
				</g>
			) : null}
		</g>
	);
};

// ---------- outer skin ----------
const Nameplate: React.FC<{t: number}> = ({t}) => {
	const u = pr(t, 8.9, 9.2);
	if (u <= 0) return null;
	return (
		<g transform={`translate(${cx - 62} 455) scale(${eob(u)})`} fontFamily={KR} textAnchor="middle">
			<rect x={-32} y={-17} width={64} height={34} rx={4} fill="#fff7e0" stroke={INK} strokeWidth={1.6} />
			{[[-27, -12], [27, -12], [-27, 12], [27, 12]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={1.5} fill={INK} />)}
			<text y={-3} fontSize={6.5} fontWeight={700} fill={INK}>PSA ADSORBER</text>
			<text y={10} fontSize={11} fontWeight={900} fill={INK}>BED A</text>
		</g>
	);
};
const star = (x: number, y: number, r: number) =>
	poly(Array.from({length: 8}, (_, i) => {
		const a = (i * PI) / 4 - PI / 2, rr = i % 2 ? r * 0.3 : r;
		return [x + Math.cos(a) * rr, y + Math.sin(a) * rr] as [number, number];
	}), true);
const Skin: React.FC<{t: number}> = ({t}) => (
	<g>
		<Snap tr={snapT(t, ASM.bowl[0], ASM.bowl[1], 0, 420, 0.16)} px={cx} py={yBot}>
			<ellipse cx={cx} cy={yBot} rx={R} ry={RY} fill={M.inner} stroke={INK} strokeWidth={2} />
			<Metal id="g-bowl" d={PATH.bowl} x={cx} r={R} />
		</Snap>
		<Snap tr={snapT(t, ASM.shell[0], ASM.shell[1], 0, -620, 0.06)} px={cx} py={(yTop + yBot) / 2}>
			<Metal id="g-shell" d={PATH.shellFront} x={cx} r={R} />
			<ellipse cx={cx} cy={yTop} rx={R} ry={RY} fill={M.inner} stroke={INK} strokeWidth={2} />
		</Snap>
		<Snap tr={snapT(t, ASM.dome[0], ASM.dome[1], 0, -420, 0.16)} px={cx} py={yTop}>
			<Metal id="g-dome" d={PATH.dome} x={cx} r={R} />
			<path d={poly(ell(cx, yTop, R * 0.8, HD * 0.74, PI * 1.1, PI * 1.4))} stroke="#fff" strokeWidth={4} strokeLinecap="round" fill="none" />
		</Snap>
		<Nameplate t={t} />
		{[[cx - 70, 190, 7.1], [cx - 58, 330, 7.3], [cx + 30, 600, 7.45], [cx - 50, 660, 7.6]].map(([x, y, t0]) => {
			const u = pr(t, t0, t0 + 0.6);
			return u > 0 && u < 1 ? <path key={t0} d={star(x, y, 13 * Math.sin(PI * u))} fill="#fff" stroke={INK} strokeWidth={1.4} /> : null;
		})}
	</g>
);
const Nozzles: React.FC<{t: number}> = ({t}) => (
	<g>
		<Snap tr={snapT(t, ASM.nzT[0], ASM.nzT[1], 0, -320, 0.18)} px={cx} py={154}>
			<Metal id="g-nzt" d={cylPath(cx, 112, 154, RN)} x={cx} r={RN} />
			<Metal id="g-flt" d={cylPath(cx, 104, 114, RF)} x={cx} r={RF} />
			<Face x={cx} y={104} r={RF} bore={RN - 3} />
		</Snap>
		<Snap tr={snapT(t, ASM.nzB[0], ASM.nzB[1], 0, 300, 0.18)} px={cx} py={684}>
			<Metal id="g-flb" d={cylPath(cx, 728, 738, RF)} x={cx} r={RF} />
			<Face x={cx} y={728} r={RF} />
			<Metal id="g-nzb" d={cylPath(cx, 684, 728, RN)} x={cx} r={RN} />
		</Snap>
	</g>
);
const PORTS = [520, 420, 320];
const Ports: React.FC<{t: number}> = ({t}) => (
	<g fontFamily={KR}>
		{PORTS.map((y, i) => {
			if (t < ASM.ports[i]) return null;
			const s = eob(pr(t, ASM.ports[i], ASM.ports[i] + 0.35));
			return (
				<g key={y}>
					<g transform={`translate(${cx - R} ${y}) scale(${s})`} stroke={INK} strokeWidth={1.4}>
						<rect x={-17} y={-4} width={18} height={8} rx={1} fill={M.body} />
						<rect x={-13} y={-6.5} width={6} height={13} rx={1} fill={M.shade} />
					</g>
					{s > 0.9 ? <text x={cx - R - 24} y={y + 5} fontSize={14} fontWeight={700} fill="#5d6876" textAnchor="end">TE</text> : null}
				</g>
			);
		})}
	</g>
);
const Leg: React.FC<{x: number; id: string}> = ({x, id}) => (
	<g>
		<Metal id={`${id}-c`} d={`M ${x - 7} 598 H ${x + 7} V ${FLOOR - 5} H ${x - 7} Z`} x={x} r={7} lw={1.6} />
		<Metal id={`${id}-p`} d={`M ${x - 10} 556 H ${x + 10} V 604 H ${x - 10} Z`} x={x} r={10} lw={1.6} />
		<rect x={x - 18} y={FLOOR - 6} width={36} height={6} fill={M.shade} stroke={INK} strokeWidth={1.6} />
	</g>
);
const Legs: React.FC<{t: number}> = ({t}) => (
	<g>
		<Snap tr={snapT(t, ASM.legL[0], ASM.legL[1], -300, 0, 0.14)} px={cx - R - 9} py={580}><Leg x={cx - R - 9} id="g-legL" /></Snap>
		<Snap tr={snapT(t, ASM.legR[0], ASM.legR[1], 300, 0, 0.14)} px={cx + R + 9} py={580}><Leg x={cx + R + 9} id="g-legR" /></Snap>
	</g>
);

// ---------- hydro-test ----------
const Gauge: React.FC<{t: number}> = ({t}) => {
	const s = eob(pr(t, 9.0, 9.3)), x = cx, y = 62;
	const v = eob(pr(t, 9.3, 10.0)) * 6.4, an = ((-225 + 27 * v) * PI) / 180;
	const b = pr(t, 10.0, 10.25);
	return (
		<g>
			<g transform={`translate(${x} 96) scale(${s}) translate(${-x} -96)`}>
				<rect x={x - 3} y={78} width={6} height={18} fill={M.body} stroke={INK} strokeWidth={1.4} />
				<circle cx={x} cy={y} r={18} fill="#fff" stroke={INK} strokeWidth={3} />
				{Array.from({length: 11}, (_, j) => {
					const a = ((-225 + 27 * j) * PI) / 180;
					return <line key={j} x1={x + Math.cos(a) * 11} y1={y + Math.sin(a) * 11} x2={x + Math.cos(a) * 14} y2={y + Math.sin(a) * 14} stroke={INK} strokeWidth={1} />;
				})}
				<path d={poly(ell(x, y, 12.5, 12.5, ((-225 + 27 * 7.5) * PI) / 180, (45 * PI) / 180, 12))} stroke="#ef4444" strokeWidth={2.2} fill="none" />
				<line x1={x} y1={y} x2={x + Math.cos(an) * 12} y2={y + Math.sin(an) * 12} stroke={INK} strokeWidth={2} strokeLinecap="round" />
				<circle cx={x} cy={y} r={2.4} fill={INK} />
			</g>
			{b > 0 ? (
				<g transform={`translate(${x + 96} ${y}) scale(${eob(b)})`} fontFamily={KR}>
					<rect x={-68} y={-17} width={136} height={34} rx={17} fill="#dcfce7" stroke={INK} strokeWidth={1.8} />
					<text y={6} fontSize={17} fontWeight={900} fill="#15803d" textAnchor="middle">✓ 수압시험 통과</text>
				</g>
			) : null}
		</g>
	);
};
const BlindFlange: React.FC<{t: number}> = ({t}) => {
	if (t < 8.3 || t > 12.2) return null;
	const rem = eio(pr(t, 11.7, 12.2));
	return (
		<g opacity={1 - pr(t, 11.95, 12.2)} transform={`translate(${160 * rem} ${-60 * rem})`}>
			<Snap tr={snapT(t, 8.3, 8.6, 0, -220, 0.2)} px={cx} py={104}>
				<Metal id="g-blind" d={cylPath(cx, 96, 104, RF)} x={cx} r={RF} />
				<Face x={cx} y={96} r={RF} solid />
				{t >= 9.0 ? <Gauge t={t} /> : null}
			</Snap>
		</g>
	);
};

// ---------- cut-away ----------
const Cavity: React.FC = () => (
	<g>
		<defs>
			<linearGradient id="g-cav" gradientUnits="userSpaceOnUse" x1={cx - RI} x2={cx + RI} y1={0} y2={0}>
				<stop offset={0} stopColor="#7b8796" /><stop offset={0.07} stopColor="#7b8796" /><stop offset={0.07} stopColor="#8b97a5" />
				<stop offset={0.84} stopColor="#8b97a5" /><stop offset={0.84} stopColor="#7d8998" /><stop offset={1} stopColor="#7d8998" />
			</linearGradient>
		</defs>
		<path d={PATH.cavity} fill="url(#g-cav)" />
		{[yTop, yBot].map((y) => (
			<path key={y} d={poly(ell(cx, y, RI, (RY * RI) / R, PI, 2 * PI))} fill="none" stroke="rgba(39,49,61,.35)" strokeWidth={1.4} />
		))}
		<rect x={cx - RN + 4} y={104} width={2 * RN - 8} height={52} fill="#4b5563" />
		<rect x={cx - RN + 4} y={682} width={2 * RN - 8} height={56} fill="#4b5563" />
	</g>
);
const Section: React.FC = () => (
	<g>
		{[-1, 1].map((s) => (
			<g key={s} fill="none">
				<path d={profilePath(s, R - WALL / 2, HD - WALL / 2)} stroke="#8795a5" strokeWidth={WALL} />
				<path d={profilePath(s, R, HD)} stroke={INK} strokeWidth={2} />
				<path d={profilePath(s, RI, HD - WALL)} stroke={INK} strokeWidth={1.4} />
			</g>
		))}
		{[[112, 154, 104, 114], [684, 728, 728, 738]].flatMap(([nA, nB, fA, fB]) =>
			[[cx - RN, 4, nA, nB], [cx + RN - 4, 4, nA, nB], [cx - RF, RF - RN + 4, fA, fB], [cx + RN - 4, RF - RN + 4, fA, fB]].map(([x, w, y0, y1]) => (
				<rect key={`${x}-${y0}`} x={x} y={y0} width={w} height={y1 - y0} fill="#8795a5" stroke={INK} strokeWidth={1.4} />
			)),
		)}
	</g>
);
const BeadDefs: React.FC = () => (
	<defs>
		{LAYERS.map((L) => (
			<g key={L.key} id={`bead-${L.key}`}>
				<circle r={L.r} fill={L.base} stroke="rgba(32,38,48,.9)" strokeWidth={0.85} />
				<circle cx={-L.r * 0.36} cy={-L.r * 0.36} r={L.r * 0.28} fill={`rgba(255,255,255,${L.hi})`} />
			</g>
		))}
		<pattern id="mesh" width={5} height={3} patternUnits="userSpaceOnUse">
			<path d="M 0 0 V 3 M 0 0 H 5" stroke="rgba(39,49,61,.55)" strokeWidth={0.8} />
		</pattern>
	</defs>
);
const Screen: React.FC<{y: number; t0: number; t1: number; t: number}> = ({y: yS, t0, t1, t}) => {
	if (t < t0) return null;
	const u = pr(t, t0, t1), y = lerp(160, yS, eo(Math.min(1, u * 1.15))), sx = lerp(0.18, 1, eob(pr(u, 0.35, 1)));
	return (
		<g>
			<ellipse cx={cx} cy={y} rx={RI * sx} ry={6 * sx + 1} fill="#b8c2cd" />
			<ellipse cx={cx} cy={y} rx={RI * sx} ry={6 * sx + 1} fill="url(#mesh)" stroke={INK} strokeWidth={1.8} />
		</g>
	);
};
const Contents: React.FC<{t: number}> = ({t}) => (
	<g>
		{LAYERS.map((L, li) => {
			const landed: React.ReactNode[] = [], flying: React.ReactNode[] = [];
			if (t >= L.parts[0].ts)
				for (const p of L.parts) {
					if (t < p.ts) break; // sorted by release time
					if (t >= p.tl) landed.push(<use key={p.i} href={`#bead-${L.key}`} x={p.x} y={p.y} />);
					else {
						const q = vesselPos(p, t);
						flying.push(<use key={p.i} href={`#bead-${L.key}`} x={q[0]} y={q[1]} />);
					}
				}
			return (
				<g key={L.key}>
					{landed}
					{flying}
					{SCREENS.filter((S) => S.after === li).map((S) => <Screen key={S.y} {...S} t={t} />)}
				</g>
			);
		})}
		<Molecules t={t} />
	</g>
);
// Captured molecules stay where they stopped, so each loaded zone visibly grows up from its layer bottom.
const Molecules: React.FC<{t: number}> = ({t}) => (
	<g>
		{Object.entries(ZONES).map(([zk, zone]) => {
			const z = zoneAt(zk, t);
			return z[0] > z[1] ? <rect key={zk} x={cx - RI} y={z[1]} width={2 * RI} height={z[0] - z[1]} fill={zone.col} opacity={0.2} /> : null;
		})}
		{MOLS.map((m, k) => {
			if (t < m.ts) return null;
			const d = (t - m.ts) * m.speed;
			let ring = 0, pos, caught = false;
			if (d < m.len) pos = molPos(m, d);
			else {
				if (!m.sp.stop) return null;
				const age = t - m.tCap, e = m.pts[m.pts.length - 1];
				pos = [e[0] + 2.6 * Math.sin(m.len / 8 + m.ph), e[1]];
				ring = age < 0.5 ? age / 0.5 : 0;
				caught = true;
			}
			return (
				<g key={k}>
					{ring > 0 ? <circle cx={pos[0]} cy={pos[1]} r={3 + 10 * ring} fill="none" stroke={m.sp.col} strokeWidth={1.8} opacity={1 - ring} /> : null}
					<circle cx={pos[0]} cy={pos[1]} r={m.sp.k === 'H2' ? 3 : caught ? 3.4 : 4} fill={m.sp.col} stroke="#fff" strokeWidth={1.4} />
				</g>
			);
		})}
	</g>
);

// ---------- hopper & bulk bags ----------
const hopperTr = (t: number): Tr | null => {
	if (t < 11.9 || t > 39.6) return null;
	const tr = snapT(t, 11.9, 12.5, 0, -320, 0.14)!;
	return {...tr, dy: tr.dy - 320 * eio(pr(t, 39.0, 39.6))};
};
const HopperBack: React.FC<{t: number}> = ({t}) => (
	<Snap tr={hopperTr(t)} px={cx} py={104}>
		<path d={poly([[cx - FUN.rT, FUN.yT], [cx - FUN.rB, FUN.yB], [cx - FUN.rB, FUN.yExit], [cx + FUN.rB, FUN.yExit], [cx + FUN.rB, FUN.yB], [cx + FUN.rT, FUN.yT]], true)} fill="#e3e9ef" />
		<path d={poly(ell(cx, FUN.yT, FUN.rT, FUN.rT * TILT, PI, 2 * PI))} fill="none" stroke={INK} strokeWidth={1.6} />
	</Snap>
);
const HopperFront: React.FC<{t: number}> = ({t}) => (
	<Snap tr={hopperTr(t)} px={cx} py={104}>
		{[-1, 1].map((s) => {
			const d = poly([[cx + s * (FUN.rT + 3), FUN.yT], [cx + s * (FUN.rB + 3), FUN.yB], [cx + s * (FUN.rB + 3), FUN.yExit]]);
			return (
				<g key={s}>
					<path d={d} fill="none" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
					<path d={d} fill="none" stroke={M.shade} strokeWidth={4.5} strokeLinejoin="round" />
					<rect x={s < 0 ? cx - RF : cx + FUN.rB + 5} y={96} width={RF - FUN.rB - 5} height={8} rx={1.5} fill={M.shade} stroke={INK} strokeWidth={1.5} />
				</g>
			);
		})}
		<text x={cx - FUN.rT - 16} y={FUN.yT + 22} fontFamily={KR} fontSize={19} fontWeight={700} fill="#5d6876" textAnchor="end">충전 호퍼</text>
	</Snap>
);
const HopperBeads: React.FC<{t: number}> = ({t}) => (
	<g>
		{LAYERS.map((L) => {
			if (t < L.tB || t > L.S[L.S.length - 1]) return null;
			const nNow = nAt(L.S, t);
			return (
				<g key={L.key}>
					{L.parts.map((p) => {
						if (t < p.tb || t >= p.ts) return null;
						const q = hopperPos(L, p, t, nNow);
						return <use key={p.i} href={`#bead-${L.key}`} x={q[0]} y={q[1]} />;
					})}
				</g>
			);
		})}
	</g>
);
const Bag: React.FC<{L: Layer; t: number}> = ({L, t}) => {
	if (t < L.tB || t > L.bagEnd + 0.8) return null;
	const arr = snapT(t, L.tB, L.tB + 0.45, 0, -340, 0.08)!;
	const dy = arr.dy - 360 * eio(pr(t, L.bagEnd + 0.15, L.bagEnd + 0.8));
	let lo = 0, hi = L.tbSorted.length;
	while (lo < hi) {
		const m = (lo + hi) >> 1;
		if (L.tbSorted[m] <= t) lo = m + 1; else hi = m;
	}
	const rem = 1 - lo / L.tbSorted.length;
	const hb = 74 * (0.35 + 0.65 * rem), wb = 112 + 10 * rem, yb = BAG_OUT - 12, yt = yb - hb;
	const sack = `M ${cx - wb / 2 + 8} ${yt} L ${cx + wb / 2 - 8} ${yt} Q ${cx + wb / 2 + 4} ${yt + hb * 0.45} ${cx + wb / 2 - 6} ${yb - 6} Q ${cx} ${yb + 8} ${cx - wb / 2 + 6} ${yb - 6} Q ${cx - wb / 2 - 4} ${yt + hb * 0.45} ${cx - wb / 2 + 8} ${yt} Z`;
	const lh = Math.min(24, hb * 0.42);
	return (
		<g transform={`translate(0 ${dy}) translate(${cx} ${yb}) scale(${arr.sx} ${arr.sy}) translate(${-cx} ${-yb})`}>
			<defs><clipPath id={`bag-${L.key}`}><path d={sack} /></clipPath></defs>
			<line x1={cx} y1={-700} x2={cx} y2={-166} stroke={INK} strokeWidth={2} />
			<path d={poly(ell(cx, -158, 8, 8, -PI / 2, PI * 0.9, 16))} fill="none" stroke={INK} strokeWidth={3} />
			<path d={`M ${cx - wb / 2 + 12} ${yt + 4} L ${cx - 3} -152 L ${cx + 3} -152 L ${cx + wb / 2 - 12} ${yt + 4}`} fill="none" stroke="#3b82f6" strokeWidth={2.4} />
			<path d={sack} fill="#f4f1e8" />
			<g clipPath={`url(#bag-${L.key})`}>
				{Array.from({length: Math.ceil(wb / 6)}, (_, j) => (
					<line key={j} x1={cx - wb / 2 + j * 6} y1={yt} x2={cx - wb / 2 + j * 6} y2={yb + 10} stroke="rgba(39,49,61,.12)" strokeWidth={1} />
				))}
				<rect x={cx + wb * 0.22} y={yt} width={wb} height={hb + 20} fill="rgba(39,49,61,.08)" />
			</g>
			<path d={sack} fill="none" stroke={INK} strokeWidth={2} />
			<rect x={cx - 48} y={yt + hb * 0.5 - lh / 2} width={96} height={lh} rx={4} fill={L.base} stroke={INK} strokeWidth={1.4} />
			<text x={cx} y={yt + hb * 0.5 + lh * 0.2} fontFamily={KR} fontSize={Math.min(13, lh * 0.55)} fontWeight={900} textAnchor="middle" fill={L.key === 'ac' ? '#fff' : INK}>{L.name}</text>
			<rect x={cx - 7} y={yb - 2} width={14} height={BAG_OUT - yb + 2} fill="#e8e3d6" stroke={INK} strokeWidth={1.6} />
		</g>
	);
};

// ---------- piping & gas flow ----------
const Pipe: React.FC<{pts: [number, number][]}> = ({pts}) => {
	const d = poly(pts);
	return (
		<g fill="none" strokeLinejoin="round">
			<path d={d} stroke={INK} strokeWidth={17} />
			<path d={d} stroke={M.body} strokeWidth={12.5} />
			<path d={d} stroke={M.light} strokeWidth={3} transform="translate(-2.5 -2.5)" />
		</g>
	);
};
const Spools: React.FC<{t: number; which: 'top' | 'bottom'}> = ({t, which}) =>
	which === 'top' ? (
		<Snap tr={snapT(t, 39.6, 40.1, 0, -220, 0.18)} px={cx} py={104}>
			<Pipe pts={[[cx, 98], [cx, 60], [22, 60]]} />
			<Metal id="g-spt" d={cylPath(cx, 96, 104, RF)} x={cx} r={RF} />
			<Face x={cx} y={96} r={RF} solid />
		</Snap>
	) : (
		<Snap tr={snapT(t, 39.9, 40.4, 0, 170, 0.18)} px={cx} py={742}>
			<Pipe pts={[[cx, 742], [cx, 772], [22, 772]]} />
			<Metal id="g-spb" d={cylPath(cx, 738, 746, RF)} x={cx} r={RF} />
		</Snap>
	);
const Flow: React.FC<{t: number}> = ({t}) => {
	const a = pr(t, 41.2, 41.8);
	if (a <= 0) return null;
	return (
		<g opacity={a} fontFamily={KR} fontWeight={900}>
			<g fill="none" strokeWidth={3.4} strokeDasharray="10 14" strokeDashoffset={-t * 60}>
				<path d={`M 22 772 H ${cx} V 740`} stroke="#475569" />
				<path d={`M ${cx} 100 V 60 H 22`} stroke="#0891b2" />
			</g>
			<text x={24} y={748} fontSize={21} fill="#334155">원료 가스 ↗</text>
			<text x={24} y={38} fontSize={21} fill="#0e7490">↖ H₂ 제품</text>
		</g>
	);
};

// ---------- overlays ----------
const CutLine: React.FC<{t: number}> = ({t}) => {
	const u = pr(t, 10.4, 11.6);
	if (u <= 0 || u >= 1) return null;
	const x = lerp(cx - R - 30, cx + R + 30, eio(u));
	return (
		<g>
			<line x1={x} y1={90} x2={x} y2={750} stroke="rgba(239,68,68,.18)" strokeWidth={14} />
			<line x1={x} y1={90} x2={x} y2={750} stroke="#ef4444" strokeWidth={2.4} strokeDasharray="10 5" />
			<text x={x} y={772} fontFamily={KR} fontSize={20} fontWeight={900} fill="#dc2626" textAnchor="middle">단면 A–A</text>
		</g>
	);
};
const Impacts: React.FC<{t: number}> = ({t}) => (
	<g>
		{IMPACTS.map((im, k) => {
			const tau = t - im.t;
			if (tau < 0 || tau > 0.8) return null;
			const a = 1 - tau / 0.35;
			const s = eob(pr(tau, 0, 0.2)), ta = 1 - pr(tau, 0.5, 0.8);
			return (
				<g key={k}>
					{tau < 0.35
						? im.pts.flatMap(([x, y], pi) => {
								const base = x < cx ? PI : 0;
								return [-2, -1, 0, 1, 2].map((j) => {
									const an = base + j * 0.42, r1 = 8 + 40 * eo(tau / 0.35), r2 = r1 + 14 * a;
									return <line key={`${pi}${j}`} x1={x + Math.cos(an) * r1} y1={y + Math.sin(an) * r1} x2={x + Math.cos(an) * r2} y2={y + Math.sin(an) * r2} stroke={INK} strokeOpacity={a} strokeWidth={2.6} strokeLinecap="round" />;
								});
							})
						: null}
					{im.txt && im.at ? (
						<g transform={`translate(${im.at[0]} ${im.at[1]}) rotate(-7) scale(${s})`} opacity={ta}>
							<text fontFamily={KR} fontWeight={900} fontSize={im.big ? 46 : 34} textAnchor="middle" dominantBaseline="middle"
								fill="#f59e0b" stroke={INK} strokeWidth={3} paintOrder="stroke" strokeLinejoin="round">{im.txt}</text>
						</g>
					) : null}
				</g>
			);
		})}
	</g>
);
const Callouts: React.FC<{t: number}> = ({t}) => (
	<g fontFamily={KR}>
		{LAYERS.map((L) => {
			const a = pr(t, L.tDone - 0.1, L.tDone + 0.4);
			if (a <= 0) return null;
			const ym = (L.yLo + L.yHi) / 2, xr = cx + R + 30 + 24 * (1 - eo(a));
			return (
				<g key={L.key} opacity={a}>
					<line x1={cx + RI - 16} y1={ym} x2={xr} y2={ym} stroke={INK} strokeWidth={1.5} />
					<circle cx={cx + RI - 16} cy={ym} r={3.4} fill="#fff" stroke={INK} strokeWidth={1.5} />
					<g transform={`translate(${xr + 16} ${ym - 8}) scale(${9 / L.r})`}><use href={`#bead-${L.key}`} x={0} y={0} /></g>
					<text x={xr + 34} y={ym} fontSize={28} fontWeight={900} fill="#18212c" style={HALO}>{L.name}</text>
					<text x={xr + 34} y={ym + 26} fontSize={21} fontWeight={500} fill="#566170" style={HALO}>{L.role}</text>
				</g>
			);
		})}
		{SCREENS.map((S) => {
			const a = pr(t, S.t1, S.t1 + 0.5);
			if (a <= 0) return null;
			return (
				<g key={S.y} opacity={a}>
					<line x1={cx - RI + 16} y1={S.y} x2={cx - R - 34} y2={S.y} stroke={INK} strokeWidth={1.5} />
					<circle cx={cx - RI + 16} cy={S.y} r={3.4} fill="#fff" stroke={INK} strokeWidth={1.5} />
					<text x={cx - R - 42} y={S.y + 8} fontSize={24} fontWeight={900} fill="#18212c" textAnchor="end" style={HALO}>메시 스크린</text>
				</g>
			);
		})}
	</g>
);

// ---------- the whole world, framed by the story camera ----------
export const BedWorld: React.FC<{t: number; width: number; height: number}> = ({t, width, height}) => {
	const [fx, fy0, z] = camera(t);
	const fy = fy0 - shake(t);
	const vh = 860 / z, vw = (vh * width) / height;
	const cutU = pr(t, 10.4, 11.6), sx = lerp(cx - R - 30, cx + R + 30, eio(cutU));
	const legShadow = pr(t, ASM.legR[1], ASM.legR[1] + 0.3);
	return (
		<svg width={width} height={height} viewBox={`${fx - 430 / z} ${fy - 430 / z} ${vw} ${vh}`} style={{position: 'absolute', inset: 0}}>
			<defs>
				<pattern id="grid" width={40} height={40} patternUnits="userSpaceOnUse">
					<path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59,130,246,.09)" strokeWidth={1} />
				</pattern>
				<clipPath id="skin-clip"><rect x={sx} y={-900} width={4000} height={4000} /></clipPath>
				<clipPath id="sec-clip"><rect x={-1500} y={-900} width={sx + 1500} height={4000} /></clipPath>
			</defs>
			<BeadDefs />
			<rect x={-2000} y={-2000} width={6000} height={6000} fill="url(#grid)" />
			<rect x={-2000} y={FLOOR} width={6000} height={800} fill="#e7ecf2" />
			<line x1={-2000} y1={FLOOR} x2={4000} y2={FLOOR} stroke={INK} strokeWidth={2} />
			<Blueprint t={t} />
			{legShadow > 0 ? <ellipse cx={cx} cy={FLOOR + 3} rx={R + 46} ry={11} fill="#0f172a" opacity={0.13 * legShadow} /> : null}
			<Spools t={t} which="bottom" />
			{t < 10.4 ? (
				<>
					<Skin t={t} />
					<Nozzles t={t} />
				</>
			) : (
				<>
					<Cavity />
					<Contents t={t} />
					{cutU < 1 ? (
						<g clipPath="url(#skin-clip)">
							<Skin t={t} />
							<Nozzles t={t} />
						</g>
					) : null}
					<g clipPath="url(#sec-clip)"><Section /></g>
				</>
			)}
			<Ports t={t} />
			<Legs t={t} />
			<BlindFlange t={t} />
			<HopperBack t={t} />
			<HopperBeads t={t} />
			<HopperFront t={t} />
			{LAYERS.map((L) => <Bag key={L.key} L={L} t={t} />)}
			<Spools t={t} which="top" />
			<CutLine t={t} />
			<Flow t={t} />
			<Impacts t={t} />
			<Callouts t={t} />
		</svg>
	);
};
