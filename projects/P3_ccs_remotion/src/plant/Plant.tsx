// The capture plant, drawn as flat 2D SVG in "world" units (see sim.ts for geometry).
import React from 'react';
import {KR} from '../fonts';
import {
	ABS, ASM, COL, COMPS, CND, COOLER, CY, Col, DRUM, FLOOR, HX, ICS, IMPACTS, INK, LOOP, M, MOLC, PIPES, PUMPS, Pipe, Pt, REB, STR,
	Tr, camera, eio, eo, eob, flueSpecies, h1, lerp, mixHex, pipeLen, pointAt, poly, popT, pr, shake, snapT, trStr,
} from '../sim';

const HALO = {paintOrder: 'stroke' as const, stroke: '#f8fafc', strokeWidth: 6, strokeLinejoin: 'round' as const};
const STOPS: [number, string][] = [
	[0, M.body], [0.18, M.body], [0.18, M.light], [0.265, M.light], [0.265, M.body], [0.31, M.body],
	[0.31, '#eef3f7'], [0.335, '#eef3f7'], [0.335, M.body], [0.71, M.body], [0.71, M.shade], [1, M.shade],
];
const MetalGrad: React.FC<{id: string; x0: number; x1: number}> = ({id, x0, x1}) => (
	<defs>
		<linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x0} x2={x1} y1={0} y2={0}>
			{STOPS.map(([o, c], i) => <stop key={i} offset={o} stopColor={c} />)}
		</linearGradient>
	</defs>
);
const HGrad: React.FC<{id: string; y0: number; y1: number}> = ({id, y0, y1}) => (
	<defs>
		<linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} x2={0} y1={y0} y2={y1}>
			<stop offset={0} stopColor={M.light} /><stop offset={0.3} stopColor={M.body} /><stop offset={0.72} stopColor={M.body} />
			<stop offset={0.72} stopColor={M.shade} /><stop offset={1} stopColor={M.shade} />
		</linearGradient>
	</defs>
);
const Snap: React.FC<{tr: Tr | null; px: number; py: number; children: React.ReactNode}> = ({tr, px, py, children}) =>
	tr ? <g transform={trStr(tr, px, py)}>{children}</g> : null;
const Label: React.FC<{x: number; y: number; a?: number; anchor?: 'start' | 'middle' | 'end'; size?: number; children: React.ReactNode; color?: string}> = ({x, y, a = 1, anchor = 'middle', size = 21, children, color = '#18212c'}) =>
	a > 0 ? <text x={x} y={y} opacity={a} fontFamily={KR} fontSize={size} fontWeight={900} fill={color} textAnchor={anchor} style={HALO}>{children}</text> : null;
const MolDot: React.FC<{x: number; y: number; sp: string; r?: number; op?: number}> = ({x, y, sp, r = 4, op = 1}) => (
	<circle cx={x} cy={y} r={sp === 'H2O' ? r * 0.8 : r} fill={MOLC[sp as keyof typeof MOLC]} stroke="#fff" strokeWidth={1.2} opacity={op} />
);
// a liquid body filling `clip` up to level y, with a gently moving surface
const Liquid: React.FC<{clip: string; x0: number; x1: number; y: number; bottom: number; fill: string; t: number; amp?: number}> = ({clip, x0, x1, y, bottom, fill, t, amp = 1.6}) => {
	const n = Math.max(6, Math.round((x1 - x0) / 8));
	const top = Array.from({length: n + 1}, (_, i) => {
		const x = lerp(x0, x1, i / n);
		return [x, y + amp * Math.sin(x / 9 + t * 4) + amp * 0.6 * Math.sin(x / 5 - t * 6)] as Pt;
	});
	return (
		<g clipPath={`url(#${clip})`}>
			<path d={poly([...top, [x1, bottom], [x0, bottom]], true)} fill={fill} />
			<path d={poly(top)} fill="none" stroke="rgba(255,255,255,.8)" strokeWidth={2} />
			<path d={poly(top)} fill="none" stroke={INK} strokeWidth={1} opacity={0.35} transform="translate(0 2)" />
		</g>
	);
};

const CUT = ASM.cut;

// ---------- columns ----------
const Column: React.FC<{c: Col; id: string; t: number; children?: React.ReactNode}> = ({c, id, t, children}) => {
	const cut = pr(t, CUT[0], CUT[1]);
	const ix = c.cx - c.r + 6, iw = 2 * c.r - 12, ih = c.bot - c.top - 12;
	return (
		<g>
			<MetalGrad id={id} x0={c.cx - c.r} x1={c.cx + c.r} />
			<defs><clipPath id={`${id}-in`}><rect x={ix} y={c.top + 6} width={iw} height={ih} rx={c.r - 6} ry={(c.r - 6) * 0.55} /></clipPath></defs>
			<rect x={c.cx - c.r} y={c.top} width={2 * c.r} height={c.bot - c.top} rx={c.r} ry={c.r * 0.55} fill={`url(#${id})`} stroke={INK} strokeWidth={2.4} />
			{cut > 0 ? (
				<g opacity={cut}>
					<rect x={ix} y={c.top + 6} width={iw} height={ih} rx={c.r - 6} ry={(c.r - 6) * 0.55} fill="#eef3f8" stroke={INK} strokeWidth={1.2} />
					{children}
				</g>
			) : null}
		</g>
	);
};
const Packing: React.FC<{c: Col; y0: number; y1: number}> = ({c, y0, y1}) => (
	<g>
		<rect x={c.cx - c.r + 6} y={y0} width={2 * c.r - 12} height={y1 - y0} fill="url(#packing)" />
		<line x1={c.cx - c.r + 6} y1={y0} x2={c.cx + c.r - 6} y2={y0} stroke={INK} strokeWidth={1.4} opacity={0.5} />
		<line x1={c.cx - c.r + 6} y1={y1} x2={c.cx + c.r - 6} y2={y1} stroke={INK} strokeWidth={2.4} opacity={0.6} />
	</g>
);
// liquid distributor: header pipe with drip holes under it
const Distributor: React.FC<{c: Col; y: number}> = ({c, y}) => (
	<g>
		<line x1={c.cx - c.r + 12} y1={y} x2={c.cx + c.r - 6} y2={y} stroke={INK} strokeWidth={6} strokeLinecap="round" />
		{Array.from({length: 6}, (_, i) => <line key={i} x1={c.cx - c.r + 20 + i * ((2 * c.r - 36) / 5)} y1={y + 3} x2={c.cx - c.r + 20 + i * ((2 * c.r - 36) / 5)} y2={y + 8} stroke={INK} strokeWidth={2.4} />)}
	</g>
);
// liquid falls through the packing at LIQ, gas rises at GAS (kept slow so the pick-up / release reads)
const LIQ = 72, GAS = 48, CO2R = 4.8;
const laneX = (c: Col, i: number, lanes: number) => c.cx - c.r + 20 + (i * (2 * c.r - 40)) / (lanes - 1);
const wob = (y: number, i: number) => 2.5 * Math.sin(y / 14 + i);
// liquid trickling down a packed bed; colour shifts from `from` (top) to `to` (bottom)
const Trickle: React.FC<{c: Col; t: number; t0: number; y0: number; y1: number; from: string; to: string; lanes?: number; speed?: number}> = ({c, t, t0, y0, y1, from, to, lanes = 6, speed = LIQ}) => {
	if (t < t0) return null;
	const span = y1 - y0, front = y0 + (t - t0) * speed, out: React.ReactNode[] = [];
	for (let i = 0; i < lanes; i++) {
		const x = laneX(c, i, lanes);
		for (let k = 0; k < span / 24 + 1; k++) {
			const y = y0 + ((k * 24 + (t - t0) * speed + h1(i) * 24) % span);
			if (y > front) continue;
			const u = (y - y0) / span;
			out.push(<ellipse key={`${i}-${k}`} cx={x + wob(y, i)} cy={y} rx={3} ry={4.2} fill={mixHex(from, to, u)} stroke="rgba(39,49,61,.5)" strokeWidth={0.8} />);
		}
	}
	return <g>{out}</g>;
};
// a CO₂ molecule carried inside a falling droplet
const Carried: React.FC<{x: number; y: number; u: number; op?: number}> = ({x, y, u, op = 1}) => (
	<g opacity={op}>
		<ellipse cx={x} cy={y + 1} rx={8} ry={10} fill="#fff7ed" stroke={COL.richDeep} strokeWidth={2.4} />
		<circle cx={x} cy={y} r={lerp(CO2R, 4, u)} fill={mixHex('#dc2626', '#b91c1c', u)} stroke="#fff" strokeWidth={1.2} />
	</g>
);

// Absorber: gas up, lean MEA down; each caught CO₂ hops onto a droplet and rides it down into the sump
const AbsInside: React.FC<{t: number}> = ({t}) => {
	const c = ABS, gas: React.ReactNode[] = [], caught: React.ReactNode[] = [];
	const RATE = 9, T0 = 12.3, LANES = 6;
	if (t >= T0)
		for (let n = Math.max(0, Math.floor((t - T0 - 15) * RATE)); n <= (t - T0) * RATE; n++) {
			// more CO₂ than the real ~4 % so the pick-up is easy to follow
			const q = h1(n * 2.9 + 11), sp = q < 0.32 ? 'CO2' : q < 0.72 ? 'N2' : q < 0.88 ? 'O2' : 'H2O';
			const ts = T0 + n / RATE;
			const x0 = c.cx + (h1(n * 3.1) * 2 - 1) * (c.r - 16);
			let y = 684 - GAS * (t - ts), op = 1;
			if (sp === 'CO2') {
				const u = h1(n * 5.7);
				if (u < 0.9) {
					const yc = Math.max(290, 640 - 340 * Math.min(1, -Math.log(1 - (u / 0.9) * 0.95) * 0.45));
					const tc = ts + (684 - yc) / GAS;
					if (t > tc) {
						const li = Math.round(((x0 - laneX(c, 0, LANES)) / (laneX(c, LANES - 1, LANES) - laneX(c, 0, LANES))) * (LANES - 1));
						const xl = laneX(c, Math.max(0, Math.min(LANES - 1, li)), LANES);
						const hop = eo(pr(t, tc, tc + 0.4)), tr = Math.max(0, t - tc - 0.4);
						const yy = yc + 8 * hop + LIQ * tr;
						if (yy > 700) continue;
						const xg = x0 + 4 * Math.sin(yc / 20 + n);
						const xx = lerp(xg, xl + wob(yy, li), hop);
						if (t - tc < 0.5) caught.push(<circle key={`r${n}`} cx={xg} cy={yc} r={5 + 14 * ((t - tc) / 0.5)} fill="none" stroke={COL.richDeep} strokeWidth={2} opacity={1 - (t - tc) / 0.5} />);
						caught.push(<Carried key={n} x={xx} y={yy} u={pr(yy, yc, 700)} op={1 - pr(yy, 684, 700)} />);
						continue;
					}
				}
			}
			const x = x0 + 4 * Math.sin(y / 20 + n);
			if (y < 128) { op = pr(y, 112, 128); if (op <= 0) continue; }
			gas.push(<MolDot key={n} x={x} y={y} sp={sp} op={op} r={sp === 'CO2' ? CO2R : 4} />);
		}
	return (
		<g>
			<Liquid clip="g-abs-in" x0={c.cx - c.r} x1={c.cx + c.r} y={704} bottom={c.bot} fill={COL.rich} t={t} />
			<Packing c={c} y0={148} y1={200} />
			<Packing c={c} y0={262} y1={655} />
			<Distributor c={c} y={240} />
			<Trickle c={c} t={t} t0={12.4} y0={150} y1={228} from={COL.cw} to={COL.cw} lanes={4} speed={60} />
			<Trickle c={c} t={t} t0={12.4} y0={248} y1={702} from={COL.leanDeep} to={COL.richDeep} lanes={LANES} />
			{gas}
			{caught}
		</g>
	);
};

// Stripper: rich solvent down, reboiler vapour up; CO₂ rides a droplet down, pops out and rises
const StrInside: React.FC<{t: number}> = ({t}) => {
	const c = STR, up: React.ReactNode[] = [];
	const T0 = 35.0, RATE = 7, LANES = 5, RISE = 55, RIDE = 1.3;
	if (t >= T0 - RIDE) {
		for (let n = Math.max(0, Math.floor((t - T0 - 9) * RATE)); n <= (t - T0 + RIDE) * RATE; n++) {
			const ts = T0 + n / RATE, y0 = 596 - 300 * Math.pow(h1(n * 2.3), 1.4);
			const li = n % LANES, xl = laneX(c, li, LANES);
			if (t < ts) {
				// still dissolved: riding down inside a droplet
				const y = y0 - LIQ * (ts - t);
				if (y < 268 || t < ts - RIDE) continue;
				up.push(<Carried key={`c${n}`} x={xl + wob(y, li)} y={y} u={1 - pr(t, ts - RIDE, ts)} op={pr(t, ts - RIDE, ts - RIDE + 0.2)} />);
				continue;
			}
			const age = t - ts, y = y0 - RISE * age;
			if (y < 186) continue;
			const xg = c.cx + (h1(n * 4.1) * 2 - 1) * (c.r - 16);
			const x = lerp(xl + wob(y0, li), xg, eo(Math.min(1, age / 0.8))) + 3 * Math.sin(y / 16 + n) * Math.min(1, age);
			if (age < 0.5) up.push(<circle key={`r${n}`} cx={xl} cy={y0} r={5 + 14 * (age / 0.5)} fill="none" stroke={MOLC.CO2} strokeWidth={2} opacity={1 - age / 0.5} />);
			up.push(<MolDot key={n} x={x} y={y} sp="CO2" r={CO2R} />);
		}
		// reboiler vapour enters at the side nozzle (y 650) and rises
		for (let n = Math.max(0, Math.floor((t - T0 - 9) * 5)); n <= (t - T0) * 5; n++) {
			const ts = T0 + n / 5, y = 646 - 60 * (t - ts);
			if (t < ts || y < 186) continue;
			const x = lerp(c.cx + c.r - 14, c.cx + (h1(n * 6.7) * 2 - 1) * (c.r - 16), eo(Math.min(1, (t - ts) / 0.8)));
			up.push(<circle key={`s${n}`} cx={x} cy={y} r={5} fill="#fff" stroke="#94a3b8" strokeWidth={1.2} opacity={0.85} />);
		}
	}
	return (
		<g>
			<Liquid clip="g-str-in" x0={c.cx - c.r} x1={c.cx + c.r} y={672} bottom={c.bot} fill={COL.lean} t={t} />
			<Packing c={c} y0={280} y1={600} />
			<Distributor c={c} y={260} />
			<Distributor c={c} y={205} />
			<Trickle c={c} t={t} t0={30.8} y0={268} y1={670} from={COL.richDeep} to={COL.leanDeep} lanes={LANES} />
			<Trickle c={c} t={t} t0={37.8} y0={212} y1={252} from={COL.water} to={COL.water} lanes={3} speed={55} />
			{up}
		</g>
	);
};

// ---------- lean/rich exchanger (shell & tube) ----------
const TUBES = [510, 520, 530, 540, 550];
const BAFFLES: [number, 'top' | 'bot'][] = [[497, 'bot'], [532, 'top'], [567, 'bot']];
const LEAN_PATH: Pt[] = [[595, 558], [590, 511], [552, 511], [548, 553], [514, 553], [508, 508], [475, 503]];
const Hx: React.FC<{t: number}> = ({t}) => {
	const cut = pr(t, CUT[0], CUT[1]), rich = pr(t, 29.8, 30.3), lean = pr(t, 30.5, 31.0);
	const shellId = 'g-hx', r = (HX.y1 - HX.y0) / 2, cy = HX.y0 + r;
	return (
		<g>
			<HGrad id={shellId} y0={HX.y0} y1={HX.y1} />
			<defs>
				<linearGradient id="g-hx-rich" gradientUnits="userSpaceOnUse" x1={HX.x0} x2={HX.x1} y1={0} y2={0}>
					<stop offset={0} stopColor={COL.rich} /><stop offset={1} stopColor={COL.richHot} />
				</linearGradient>
				<linearGradient id="g-hx-lean" gradientUnits="userSpaceOnUse" x1={HX.x1} x2={HX.x0} y1={0} y2={0}>
					<stop offset={0} stopColor={COL.leanHot} /><stop offset={1} stopColor={COL.leanCool} />
				</linearGradient>
				<clipPath id="g-hx-in"><rect x={HX.x0} y={HX.y0 + 5} width={HX.x1 - HX.x0} height={HX.y1 - HX.y0 - 10} /></clipPath>
			</defs>
			{/* saddles */}
			{[505, 565].map((x) => (
				<g key={x}>
					<rect x={x - 5} y={HX.y1 + 10} width={10} height={FLOOR - HX.y1 - 14} fill={M.shade} stroke={INK} strokeWidth={1.6} />
					<path d={`M ${x - 16} ${HX.y1 + 14} L ${x - 12} ${HX.y1 - 2} L ${x + 12} ${HX.y1 - 2} L ${x + 16} ${HX.y1 + 14} Z`} fill={M.body} stroke={INK} strokeWidth={1.6} />
				</g>
			))}
			{/* shell side nozzles (lean): bottom-right in, top-left out */}
			<rect x={588} y={HX.y1 - 2} width={14} height={16} fill={M.body} stroke={INK} strokeWidth={1.6} />
			<rect x={468} y={HX.y0 - 14} width={14} height={16} fill={M.body} stroke={INK} strokeWidth={1.6} />
			{/* bonnets (rich channel heads) */}
			<path d={`M ${HX.x0} ${HX.y0 + 2} H ${HX.hl + 10} Q ${HX.hl} ${HX.y0 + 2} ${HX.hl} ${cy - 18} V ${cy + 18} Q ${HX.hl} ${HX.y1 - 2} ${HX.hl + 10} ${HX.y1 - 2} H ${HX.x0} Z`} fill={rich > 0 ? mixHex(M.body, COL.rich, rich) : M.body} stroke={INK} strokeWidth={2} />
			<path d={`M ${HX.x1} ${HX.y0 + 2} H ${HX.hr - 10} Q ${HX.hr} ${HX.y0 + 2} ${HX.hr} ${cy - 18} V ${cy + 18} Q ${HX.hr} ${HX.y1 - 2} ${HX.hr - 10} ${HX.y1 - 2} H ${HX.x1} Z`} fill={rich > 0 ? mixHex(M.body, COL.richHot, rich) : M.body} stroke={INK} strokeWidth={2} />
			<rect x={HX.hl - 14} y={cy - 7} width={14} height={14} fill={M.body} stroke={INK} strokeWidth={1.6} />
			<rect x={HX.hr} y={cy - 7} width={14} height={14} fill={M.body} stroke={INK} strokeWidth={1.6} />
			{/* shell */}
			<rect x={HX.x0} y={HX.y0} width={HX.x1 - HX.x0} height={HX.y1 - HX.y0} fill={`url(#${shellId})`} stroke={INK} strokeWidth={2.2} />
			{[HX.x0, HX.x1].map((x) => <rect key={x} x={x - 4} y={HX.y0 - 4} width={8} height={HX.y1 - HX.y0 + 8} rx={2} fill={M.shade} stroke={INK} strokeWidth={1.6} />)}
			{cut > 0 ? (
				<g opacity={cut}>
					<rect x={HX.x0 + 4} y={HX.y0 + 5} width={HX.x1 - HX.x0 - 8} height={HX.y1 - HX.y0 - 10} fill="#eef3f8" />
					<g clipPath="url(#g-hx-in)">
						{lean > 0 ? (
							<g opacity={lean}>
								<path d={poly(LEAN_PATH)} fill="none" stroke="url(#g-hx-lean)" strokeWidth={13} strokeLinejoin="round" strokeLinecap="round" opacity={0.45} />
								<path d={poly(LEAN_PATH)} fill="none" stroke="url(#g-hx-lean)" strokeWidth={3.5} strokeLinejoin="round" strokeDasharray="7 7" strokeDashoffset={-t * 36} />
							</g>
						) : null}
						{TUBES.map((y) => (
							<g key={y}>
								<line x1={HX.x0 + 4} y1={y} x2={HX.x1 - 4} y2={y} stroke={INK} strokeWidth={4.4} opacity={0.75} />
								<line x1={HX.x0 + 4} y1={y} x2={HX.x1 - 4} y2={y} stroke={rich > 0 ? 'url(#g-hx-rich)' : '#e2e8f0'} strokeWidth={2.4} />
								{rich > 0 ? <line x1={HX.x0 + 4} y1={y} x2={HX.x1 - 4} y2={y} stroke="#fff" strokeWidth={1.4} strokeDasharray="3 11" strokeDashoffset={-t * 44 - y} opacity={0.9 * rich} /> : null}
							</g>
						))}
						{BAFFLES.map(([x, side]) => (
							<rect key={x} x={x - 2} y={side === 'top' ? HX.y0 + 5 : HX.y0 + 18} width={4} height={HX.y1 - HX.y0 - 23} fill={INK} opacity={0.8} />
						))}
					</g>
				</g>
			) : null}
		</g>
	);
};

// ---------- kettle reboiler ----------
const Reboiler: React.FC<{t: number}> = ({t}) => {
	const cut = pr(t, CUT[0], CUT[1]), on = pr(t, 34.8, 35.4), h = REB.y1 - REB.y0, bubbles: React.ReactNode[] = [];
	if (t > 34.8)
		for (let n = 0; n < 16; n++) {
			const ph = ((t - 34.8) * 1.3 + h1(n)) % 1;
			bubbles.push(<circle key={n} cx={REB.x0 + 16 + h1(n * 3) * (REB.weir - REB.x0 - 30)} cy={742 - ph * 28} r={2.2 + ph * 1.6} fill="#fff" stroke="#94a3b8" strokeWidth={0.8} opacity={on * (1 - ph)} />);
		}
	return (
		<g>
			<HGrad id="g-reb" y0={REB.y0} y1={REB.y1} />
			<defs><clipPath id="g-reb-in"><rect x={REB.x0 + 5} y={REB.y0 + 5} width={REB.x1 - REB.x0 - 10} height={h - 10} rx={h * 0.42} ry={h / 2 - 5} /></clipPath></defs>
			{/* steam channel head */}
			<path d={`M ${REB.x1 - 4} ${REB.y0 + 8} H ${REB.ch - 8} Q ${REB.ch} ${REB.y0 + 8} ${REB.ch} ${REB.y0 + 20} V ${REB.y1 - 20} Q ${REB.ch} ${REB.y1 - 8} ${REB.ch - 8} ${REB.y1 - 8} H ${REB.x1 - 4} Z`} fill={M.body} stroke={INK} strokeWidth={2} />
			<line x1={REB.x1 + 2} y1={726} x2={REB.ch - 2} y2={726} stroke={INK} strokeWidth={1.6} />
			<rect x={REB.x0} y={REB.y0} width={REB.x1 - REB.x0} height={h} rx={h * 0.45} ry={h / 2} fill="url(#g-reb)" stroke={INK} strokeWidth={2.2} />
			{cut > 0 ? (
				<g opacity={cut}>
					<rect x={REB.x0 + 5} y={REB.y0 + 5} width={REB.x1 - REB.x0 - 10} height={h - 10} rx={h * 0.42} ry={h / 2 - 5} fill="#eef3f8" />
					{/* pool over the bundle, and the overflow compartment past the weir */}
					<Liquid clip="g-reb-in" x0={REB.x0} x1={REB.weir} y={713} bottom={REB.y1} fill={COL.lean} t={t} amp={on > 0 ? 2.2 : 1.2} />
					<Liquid clip="g-reb-in" x0={REB.weir} x1={REB.x1} y={738} bottom={REB.y1} fill={COL.leanHot} t={t} amp={1} />
					<rect x={REB.weir - 2} y={709} width={4} height={REB.y1 - 709 - 4} fill={INK} />
					{/* U-tube bundle */}
					<path d={`M ${REB.x1 - 2} 722 H ${REB.x0 + 26} a 8 8 0 0 0 0 16 H ${REB.x1 - 2}`} fill="none" stroke={INK} strokeWidth={5} />
					<path d={`M ${REB.x1 - 2} 722 H ${REB.x0 + 26} a 8 8 0 0 0 0 16 H ${REB.x1 - 2}`} fill="none" stroke={on > 0 ? mixHex('#e2e8f0', '#ef4444', on) : '#e2e8f0'} strokeWidth={2.6} />
					{bubbles}
				</g>
			) : null}
		</g>
	);
};

// ---------- condenser, drum, cooler, pumps, compressors ----------
const HCap: React.FC<{id: string; b: {x0: number; x1: number; y0: number; y1: number}; children?: React.ReactNode}> = ({id, b, children}) => {
	const h = b.y1 - b.y0;
	return (
		<g>
			<HGrad id={id} y0={b.y0} y1={b.y1} />
			<defs><clipPath id={`${id}-in`}><rect x={b.x0 + 5} y={b.y0 + 5} width={b.x1 - b.x0 - 10} height={h - 10} rx={h * 0.4} ry={h / 2 - 5} /></clipPath></defs>
			<rect x={b.x0} y={b.y0} width={b.x1 - b.x0} height={h} rx={h * 0.45} ry={h / 2} fill={`url(#${id})`} stroke={INK} strokeWidth={2.2} />
			{children}
		</g>
	);
};
const Chevrons: React.FC<{x0: number; x1: number; y: number; t: number; t0: number; color?: string; dir?: number}> = ({x0, x1, y, t, t0, color = '#0891b2', dir = 1}) => {
	if (t < t0) return null;
	const n = Math.floor((x1 - x0) / 16), out: React.ReactNode[] = [];
	for (let i = 0; i < n; i++) {
		const u = (i * 16 + (t - t0) * 40) % (x1 - x0), x = dir > 0 ? x0 + u : x1 - u;
		out.push(<path key={i} d={`M ${x - 4 * dir} ${y - 5} L ${x + 2 * dir} ${y} L ${x - 4 * dir} ${y + 5}`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />);
	}
	return <g>{out}</g>;
};
const Condenser: React.FC<{t: number}> = ({t}) => {
	const cut = pr(t, CUT[0], CUT[1]);
	return (
		<HCap id="g-cnd" b={CND}>
			{cut > 0 ? (
				<g opacity={cut}>
					<rect x={CND.x0 + 5} y={CND.y0 + 5} width={CND.x1 - CND.x0 - 10} height={CND.y1 - CND.y0 - 10} rx={16} fill="#eef3f8" />
					{[112, 120, 128].map((y) => <line key={y} x1={CND.x0 + 16} y1={y} x2={CND.x1 - 16} y2={y} stroke={t > 36 ? '#22d3ee' : INK} strokeWidth={2} opacity={0.8} />)}
					<Chevrons x0={CND.x0 + 20} x1={CND.x1 - 20} y={120} t={t} t0={36.2} dir={-1} />
				</g>
			) : null}
		</HCap>
	);
};
const Drum: React.FC<{t: number}> = ({t}) => {
	const cut = pr(t, CUT[0], CUT[1]), drops: React.ReactNode[] = [];
	if (t > 36.8)
		for (let n = 0; n < 4; n++) {
			const ph = ((t - 36.8) * 1.6 + n / 4) % 1;
			drops.push(<ellipse key={n} cx={980} cy={208 + ph * 24} rx={2.6} ry={3.6} fill={COL.leanDeep} opacity={1 - ph * 0.6} />);
		}
	return (
		<HCap id="g-drum" b={DRUM}>
			{cut > 0 ? (
				<g opacity={cut}>
					<rect x={DRUM.x0 + 5} y={DRUM.y0 + 5} width={DRUM.x1 - DRUM.x0 - 10} height={DRUM.y1 - DRUM.y0 - 10} rx={18} fill="#eef3f8" />
					<Liquid clip="g-drum-in" x0={DRUM.x0} x1={DRUM.x1} y={lerp(247, 232, pr(t, 36.9, 38.5))} bottom={DRUM.y1} fill={COL.water} t={t} />
					{drops}
				</g>
			) : null}
		</HCap>
	);
};
const Cooler: React.FC<{t: number}> = ({t}) => {
	const on = t > 30.4;
	return (
		<g>
			<rect x={COOLER.x0} y={COOLER.y0} width={COOLER.x1 - COOLER.x0} height={COOLER.y1 - COOLER.y0} rx={5} fill={M.body} stroke={INK} strokeWidth={2} />
			<path d={poly(Array.from({length: 7}, (_, i) => [COOLER.x0 + (i % 2 ? 22 : 6), COOLER.y0 + 6 + i * 8] as Pt))} fill="none" stroke={on ? '#22d3ee' : INK} strokeWidth={2.4} />
		</g>
	);
};
const Pump: React.FC<{x: number; y: number; t: number; on: number}> = ({x, y, t, on}) => {
	const a = t > on ? (t - on) * 540 : 0;
	return (
		<g>
			<rect x={x - 16} y={y + 8} width={32} height={10} rx={2} fill={M.shade} stroke={INK} strokeWidth={1.6} />
			<circle cx={x} cy={y} r={14} fill={M.body} stroke={INK} strokeWidth={2} />
			<g transform={`rotate(${a} ${x} ${y})`}>
				{[0, 90, 180, 270].map((d) => <line key={d} x1={x} y1={y} x2={x + 9 * Math.cos((d * Math.PI) / 180)} y2={y + 9 * Math.sin((d * Math.PI) / 180)} stroke={INK} strokeWidth={2} />)}
			</g>
		</g>
	);
};
const Compressor: React.FC<{x: number; t: number; on: number; stage: number}> = ({x, t, on, stage}) => {
	const a = t > on ? (t - on) * 900 : 0, y = CY;
	const g = pr(t, on + 0.3, on + 1.3) * (0.3 + 0.3 * stage);
	const an = ((-220 + 260 * g) * Math.PI) / 180;
	return (
		<g>
			<rect x={x - 26} y={y + 26} width={52} height={16} rx={3} fill={M.shade} stroke={INK} strokeWidth={1.8} />
			<path d={`M ${x} ${y - 24} H ${x + 24} V ${y - 8}`} fill={M.body} stroke={INK} strokeWidth={2} />
			<circle cx={x} cy={y} r={24} fill={M.body} stroke={INK} strokeWidth={2.2} />
			<g transform={`rotate(${a} ${x} ${y})`}>
				{Array.from({length: 6}, (_, i) => {
					const d = (i * Math.PI) / 3;
					return <path key={i} d={`M ${x} ${y} Q ${x + 10 * Math.cos(d + 0.5)} ${y + 10 * Math.sin(d + 0.5)} ${x + 17 * Math.cos(d)} ${y + 17 * Math.sin(d)}`} fill="none" stroke={INK} strokeWidth={2} />;
				})}
			</g>
			<circle cx={x} cy={y} r={4} fill={INK} />
			<line x1={x} y1={y - 24} x2={x} y2={y - 42} stroke={INK} strokeWidth={2} />
			<circle cx={x} cy={y - 56} r={14} fill="#fff" stroke={INK} strokeWidth={2.4} />
			<line x1={x} y1={y - 56} x2={x + 10 * Math.cos(an)} y2={y - 56 + 10 * Math.sin(an)} stroke={t > on ? '#dc2626' : INK} strokeWidth={2.2} strokeLinecap="round" />
			<circle cx={x} cy={y - 56} r={2} fill={INK} />
		</g>
	);
};
const Intercooler: React.FC<{x: number; t: number; on: number}> = ({x, t, on}) => (
	<g>
		<rect x={x - 20} y={CY - 16} width={40} height={32} rx={5} fill={M.body} stroke={INK} strokeWidth={2} />
		<Chevrons x0={x - 16} x1={x + 16} y={CY} t={t} t0={on} />
	</g>
);

// ---------- pipes with flowing contents ----------
const Flange: React.FC<{p: Pt; q: Pt}> = ({p, q}) => {
	// flange at p, perpendicular to the segment p→q
	const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
	const c: Pt = [p[0] + ux * 4, p[1] + uy * 4], nx = -uy * 11, ny = ux * 11;
	return <line x1={c[0] + nx} y1={c[1] + ny} x2={c[0] - nx} y2={c[1] - ny} stroke={INK} strokeWidth={6} strokeLinecap="round" />;
};
const PipeBody: React.FC<{p: Pipe; f: number}> = ({p, f}) => {
	const d = poly(p.pts), n = p.pts.length;
	return (
		<g fill="none" strokeLinejoin="round">
			<path d={d} stroke={INK} strokeWidth={12} pathLength={1} strokeDasharray={`${f} 2`} />
			<path d={d} stroke={M.body} strokeWidth={8} pathLength={1} strokeDasharray={`${f} 2`} />
			{f >= 1 && p.ends?.[0] ? <Flange p={p.pts[0]} q={p.pts[1]} /> : null}
			{f >= 1 && p.ends?.[1] ? <Flange p={p.pts[n - 1]} q={p.pts[n - 2]} /> : null}
		</g>
	);
};
const PipeFlow: React.FC<{p: Pipe; t: number}> = ({p, t}) => {
	if (t < p.t0) return null;
	const L = pipeLen(p), fill = pr(t, p.t0, p.t0 + p.dur), d = poly(p.pts), out: React.ReactNode[] = [];
	if (p.dots && p.speed && p.gap) {
		const head = (t - p.t0) * p.speed;
		for (let k = Math.max(0, Math.ceil((head - L) / p.gap)); k <= head / p.gap; k++) {
			const s = head - k * p.gap;
			if (s < 0 || s > L * fill) continue;
			const [x, y] = pointAt(p.pts, s);
			const kind = p.dots;
			if (kind === 'flue') out.push(<MolDot key={k} x={x} y={y} sp={flueSpecies(k + 37)} r={3.6} />);
			else if (kind === 'treated') {
				const sp = flueSpecies(k + 71);
				out.push(<MolDot key={k} x={x} y={y} sp={sp === 'CO2' && h1(k) > 0.15 ? 'N2' : sp} r={3.6} />);
			} else if (kind === 'co2') out.push(<MolDot key={k} x={x} y={y} sp="CO2" r={3.8} />);
			else if (kind === 'overhead') out.push(<MolDot key={k} x={x} y={y} sp={h1(k * 1.7) < 0.35 ? 'H2O' : 'CO2'} r={3.6} />);
			else if (kind === 'steam') out.push(<circle key={k} cx={x} cy={y} r={4.2} fill="#fff" stroke="#94a3b8" strokeWidth={1} />);
			else {
				const c = kind === 'lean' ? COL.leanDeep : kind === 'rich' ? COL.richDeep : kind === 'cw' ? '#0891b2' : '#0284c7';
				out.push(<circle key={k} cx={x} cy={y} r={2.8} fill={c} stroke="#fff" strokeWidth={0.8} />);
			}
		}
	}
	return (
		<g>
			<path d={d} fill="none" stroke={p.fluid} strokeWidth={6} strokeLinejoin="round" pathLength={1} strokeDasharray={`${fill} 2`} />
			{out}
		</g>
	);
};

// ---------- overlays ----------
const Impacts: React.FC<{t: number}> = ({t}) => (
	<g>
		{IMPACTS.map((im, k) => {
			const tau = t - im.t;
			if (tau < 0 || tau > 0.8) return null;
			const a = 1 - tau / 0.35, s = eob(pr(tau, 0, 0.2)), ta = 1 - pr(tau, 0.5, 0.8);
			return (
				<g key={k}>
					{tau < 0.35
						? im.pts.flatMap(([x, y], pi) => {
								const base = pi % 2 === 0 ? Math.PI : 0;
								return [-2, -1, 0, 1, 2].map((j) => {
									const an = base + j * 0.42, r1 = 8 + 40 * eo(tau / 0.35), r2 = r1 + 14 * a;
									return <line key={`${pi}${j}`} x1={x + Math.cos(an) * r1} y1={y + Math.sin(an) * r1} x2={x + Math.cos(an) * r2} y2={y + Math.sin(an) * r2} stroke={INK} strokeOpacity={a} strokeWidth={2.6} strokeLinecap="round" />;
								});
							})
						: null}
					{im.txt && im.at ? (
						<g transform={`translate(${im.at[0]} ${im.at[1]}) rotate(-7) scale(${s})`} opacity={ta}>
							<text fontFamily={KR} fontWeight={900} fontSize={im.big ? 54 : 38} textAnchor="middle" dominantBaseline="middle" fill="#f59e0b" stroke={INK} strokeWidth={3} paintOrder="stroke" strokeLinejoin="round">{im.txt}</text>
						</g>
					) : null}
				</g>
			);
		})}
	</g>
);
const Blueprint: React.FC<{t: number}> = ({t}) => {
	const a = pr(t, 0.1, 0.6) * (1 - pr(t, 4.8, 5.6));
	if (a <= 0) return null;
	return (
		<g opacity={a * 0.8} fill="none" stroke="#3b82f6" strokeWidth={1.8} strokeDasharray="8 6">
			{[ABS, STR].map((c) => <rect key={c.cx} x={c.cx - c.r} y={c.top} width={2 * c.r} height={c.bot - c.top} rx={c.r} ry={c.r * 0.55} />)}
			<rect x={HX.hl} y={HX.y0} width={HX.hr - HX.hl} height={HX.y1 - HX.y0} rx={10} />
			<rect x={REB.x0} y={REB.y0} width={REB.ch - REB.x0} height={REB.y1 - REB.y0} rx={20} />
			{[CND, DRUM, COOLER].map((b, i) => <rect key={i} x={b.x0} y={b.y0} width={b.x1 - b.x0} height={b.y1 - b.y0} rx={8} />)}
			{COMPS.map((c) => <circle key={c.x} cx={c.x} cy={CY} r={24} />)}
			{ICS.map((c) => <rect key={c.x} x={c.x - 20} y={CY - 16} width={40} height={32} />)}
		</g>
	);
};
const LoopGlow: React.FC<{t: number}> = ({t}) => {
	const a = pr(t, 46.2, 46.8) * (1 - pr(t, 50.4, 51));
	if (a <= 0) return null;
	return (
		<g opacity={a} fill="none" strokeLinejoin="round" strokeLinecap="round">
			<path d={poly(LOOP)} stroke="#facc15" strokeWidth={14} opacity={0.35} />
			<path d={poly(LOOP)} stroke="#f59e0b" strokeWidth={6} pathLength={1} strokeDasharray="0.08 0.92" strokeDashoffset={-(t - 46.2) * 0.22} />
		</g>
	);
};

export const Plant: React.FC<{t: number; width: number; height: number}> = ({t, width, height}) => {
	const [fx, fy0, z] = camera(t);
	const fy = fy0 - shake(t), vh = 860 / z, vw = (vh * width) / height;
	const pipeF = eio(pr(t, ASM.pipes[0], ASM.pipes[1]));
	const la = pr(t, ASM.labels[0], ASM.labels[1]);
	const act = (t0: number) => pr(t, t0, t0 + 0.5);
	return (
		<svg width={width} height={height} viewBox={`${fx - 430 / z} ${fy - 430 / z} ${vw} ${vh}`} style={{position: 'absolute', inset: 0}}>
			<defs>
				<pattern id="grid" width={40} height={40} patternUnits="userSpaceOnUse">
					<path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59,130,246,.09)" strokeWidth={1} />
				</pattern>
				<pattern id="packing" width={14} height={14} patternUnits="userSpaceOnUse">
					<path d="M 0 14 L 14 0 M 0 0 L 14 14" stroke="rgba(39,49,61,.22)" strokeWidth={1.2} />
				</pattern>
			</defs>
			<rect x={-3000} y={-3000} width={8000} height={8000} fill="url(#grid)" />
			<rect x={-3000} y={FLOOR} width={8000} height={1000} fill="#e7ecf2" />
			<line x1={-3000} y1={FLOOR} x2={5000} y2={FLOOR} stroke={INK} strokeWidth={2} />
			<Blueprint t={t} />
			{PIPES.map((p) => <PipeBody key={p.key} p={p} f={pipeF} />)}
			{PIPES.map((p) => <PipeFlow key={`f${p.key}`} p={p} t={t} />)}
			<LoopGlow t={t} />
			<Snap tr={snapT(t, ASM.abs[0], ASM.abs[1], 0, -700, 0.08)} px={ABS.cx} py={ABS.bot}><Column c={ABS} id="g-abs" t={t}><AbsInside t={t} /></Column></Snap>
			<Snap tr={snapT(t, ASM.str[0], ASM.str[1], 0, -700, 0.08)} px={STR.cx} py={STR.bot}><Column c={STR} id="g-str" t={t}><StrInside t={t} /></Column></Snap>
			<Snap tr={snapT(t, ASM.hx[0], ASM.hx[1], 0, -420, 0.14)} px={535} py={HX.y1}><Hx t={t} /></Snap>
			<Snap tr={snapT(t, ASM.reb[0], ASM.reb[1], 320, 0, 0.14)} px={REB.x0} py={726}><Reboiler t={t} /></Snap>
			<Snap tr={snapT(t, ASM.cnd[0], ASM.cnd[1], 0, -320, 0.16)} px={880} py={CND.y1}><Condenser t={t} /></Snap>
			<Snap tr={snapT(t, ASM.drum[0], ASM.drum[1], 0, -320, 0.16)} px={1005} py={DRUM.y1}><Drum t={t} /></Snap>
			<Snap tr={popT(t, ASM.cooler)} px={475} py={360}><Cooler t={t} /></Snap>
			{PUMPS.map((p) => <Snap key={p.x} tr={popT(t, p.t)} px={p.x} py={p.y}><Pump x={p.x} y={p.y} t={t} on={p.on} /></Snap>)}
			{COMPS.map((c, i) => <Snap key={c.x} tr={popT(t, c.t)} px={c.x} py={CY}><Compressor x={c.x} t={t} on={c.on} stage={i} /></Snap>)}
			{ICS.map((c, i) => <Snap key={c.x} tr={popT(t, c.t)} px={c.x} py={CY}><Intercooler x={c.x} t={t} on={57.0 + i * 0.8} /></Snap>)}
			{/* equipment names */}
			<Label x={414} y={138} a={la} anchor="start">흡수탑</Label>
			<Label x={270} y={180} a={la * pr(t, 12.4, 13)} anchor="end" size={17}>수세 구간</Label>
			<Label x={652} y={160} a={la} anchor="end">재생탑</Label>
			<Label x={535} y={476} a={la}>열교환기</Label>
			<Label x={900} y={684} a={la}>리보일러</Label>
			<Label x={880} y={92} a={la}>응축기</Label>
			<Label x={1070} y={232} a={la} anchor="start">환류 드럼</Label>
			<Label x={453} y={366} a={la} anchor="end" size={17}>쿨러</Label>
			{COMPS.map((c, i) => <Label key={c.x} x={c.x} y={CY + 68} a={la} size={17}>{`압축기 ${i + 1}단`}</Label>)}
			{/* stream names, as each stream starts */}
			<Label x={150} y={672} a={act(12.0)} size={19} color="#475569">배가스</Label>
			<Label x={356} y={42} a={act(14.8)} anchor="start" size={19} color="#475569">처리 가스</Label>
			<Label x={486} y={300} a={act(12.0)} anchor="start" size={19} color="#1d4ed8">린 용액</Label>
			<Label x={375} y={798} a={act(29.0)} size={19} color="#c2410c">리치 용액</Label>
			<Label x={1026} y={688} a={act(34.3)} anchor="start" size={19} color="#475569">스팀</Label>
			<Label x={935} y={318} a={act(37.2)} size={17} color="#0369a1">응축수</Label>
			<Label x={794} y={70} a={act(36.4)} anchor="end" size={17} color="#0e7490">냉각수</Label>
			<Label x={1094} y={190} a={act(56.0)} anchor="start" size={19} color="#b91c1c">CO₂</Label>
			<Label x={1196} y={428} a={act(58.9)} anchor="start" size={19} color="#b91c1c">고압 CO₂ → 파이프라인</Label>
			<Impacts t={t} />
		</svg>
	);
};
