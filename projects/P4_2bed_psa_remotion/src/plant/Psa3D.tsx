// 3D (realistic) two-bed PSA scene for <ThreeCanvas>. All motion is a pure function of story time t.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
	BEDS, BED_IN, Bed, NET, PATHS, Pt, STEPS, VALVES, WALK, Y, bedDots, cycleState, eo, eob, flowAlpha, frontAt, h1, pathLen,
	pointAt, pr, pressureAt, valveAt,
} from '../sim';
import {CAM_FOV, X, Yw, camPose, to3} from './cam3d';

export const ASM3 = {bedA: [1.0, 1.45], bedB: [1.6, 2.05], pipes: [2.3, 3.6], labels: [4.8, 5.5], cut: [5.3, 6.1]} as const;
export const shake3 = (t: number) =>
	[ASM3.bedA[1], ASM3.bedB[1]].reduce((y, t1) => {
		const tau = t - t1;
		return tau > 0 && tau < 0.45 ? y + 0.07 * Math.exp(-12 * tau) * Math.sin(55 * tau) : y;
	}, 0);

const R = 0.58, HEAD = 0.32, WALLT = 0.032, PIPE_R = 0.078;
const BY = {bot: Yw(582), top: Yw(178)}; // vessel bottom tip / top tip
const IN = {bot: Yw(BED_IN.bot), top: Yw(BED_IN.top)}; // adsorbent between the support screens
const PLAT_Y = BY.top - HEAD - 0.08; // top platform deck
type V3 = [number, number, number];

// ---------- procedural textures (gravel, concrete, sky) ----------
const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	draw(c.getContext('2d')!);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	if (repeat) {
		tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
		tex.repeat.set(...repeat);
	}
	tex.anisotropy = 8;
	return tex;
};
const speckle = (g: CanvasRenderingContext2D, n: number, cols: string[], size: [number, number], seed: number) => {
	for (let i = 0; i < n; i++) {
		g.fillStyle = cols[Math.floor(h1(i * 1.3 + seed) * cols.length)];
		const s = size[0] + h1(i * 2.7 + seed) * (size[1] - size[0]);
		g.fillRect(h1(i * 3.9 + seed) * 512, h1(i * 5.1 + seed) * 512, s, s);
	}
};
let TEX: {gravel: THREE.Texture; concrete: THREE.Texture; sky: THREE.Texture} | null = null;
const textures = () =>
	(TEX ??= {
		gravel: canvasTex(512, 512, (g) => {
			g.fillStyle = '#b3ada1';
			g.fillRect(0, 0, 512, 512);
			speckle(g, 9000, ['#9a9487', '#c9c3b7', '#8a8478', '#d6d1c6', '#a39d91'], [1, 3.5], 11);
		}, [120, 120]),
		concrete: canvasTex(512, 512, (g) => {
			g.fillStyle = '#c7cacc';
			g.fillRect(0, 0, 512, 512);
			speckle(g, 5000, ['#bdc0c2', '#d0d3d5', '#b4b7ba'], [1, 2.5], 29);
			g.strokeStyle = '#9fa3a7';
			g.lineWidth = 3;
			for (let k = 0; k <= 512; k += 256) {
				g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 512); g.stroke();
				g.beginPath(); g.moveTo(0, k); g.lineTo(512, k); g.stroke();
			}
		}, [5, 3]),
		sky: canvasTex(4, 256, (g) => {
			const gr = g.createLinearGradient(0, 0, 0, 256);
			gr.addColorStop(0, '#a9c8e6');
			gr.addColorStop(0.55, '#d5e3ef');
			gr.addColorStop(1, '#e6ecf1');
			g.fillStyle = gr;
			g.fillRect(0, 0, 4, 256);
		}),
	});

// ---------- materials (shared, created once) ----------
const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);
const MAT = {
	paint: std({color: '#dde1dc', metalness: 0.15, roughness: 0.48, side: THREE.DoubleSide}),
	paintFront: std({color: '#dde1dc', metalness: 0.15, roughness: 0.48, transparent: true}),
	inner: std({color: '#8f99a4', metalness: 0.35, roughness: 0.6, side: THREE.BackSide}),
	section: std({color: '#56606b', metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide}),
	seam: std({color: '#b9bdb7', metalness: 0.2, roughness: 0.55}),
	seamFront: std({color: '#b9bdb7', metalness: 0.2, roughness: 0.55, transparent: true}),
	steel: std({color: '#a7b0ba', metalness: 0.75, roughness: 0.3}),
	pipe: std({color: '#9aa4ae', metalness: 0.55, roughness: 0.34}),
	flange: std({color: '#7d8792', metalness: 0.65, roughness: 0.32}),
	dark: std({color: '#3f4752', metalness: 0.55, roughness: 0.45}),
	galv: std({color: '#9ea6ae', metalness: 0.6, roughness: 0.5}),
	grating: std({color: '#8a929a', metalness: 0.5, roughness: 0.6, side: THREE.DoubleSide}),
	rail: std({color: '#f2c230', metalness: 0.15, roughness: 0.5}),
	bead: std({color: '#d8c49b', roughness: 0.85}),
	screen: std({color: '#8b98a6', metalness: 0.7, roughness: 0.35, side: THREE.DoubleSide}),
	load: std({color: '#ef4444', transparent: true, opacity: 0.32, depthWrite: false, roughness: 0.6, side: THREE.DoubleSide}),
	mtz: std({color: '#ef4444', transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide}),
	h2: std({color: '#22d3ee', emissive: '#0891b2', emissiveIntensity: 0.9, roughness: 0.3}),
	imp: std({color: '#ef4444', emissive: '#b91c1c', emissiveIntensity: 0.7, roughness: 0.3}),
	actuator: std({color: '#1e40af', metalness: 0.3, roughness: 0.35}),
	indicator: std({color: '#facc15', roughness: 0.4}),
	face: std({color: '#ffffff', roughness: 0.4}),
	needle: std({color: '#dc2626', roughness: 0.4}),
	transmitter: std({color: '#e5e7eb', metalness: 0.2, roughness: 0.4}),
	concrete: std({color: '#ffffff', roughness: 0.92}),
	gravel: std({color: '#ffffff', roughness: 1}),
	block: std({color: '#bfc3c6', roughness: 0.9}),
};
const BAND = {feed: std({color: '#6b7280'}), h2: std({color: '#0284c7'}), tail: std({color: '#a16207'}), eq: std({color: '#0891b2'})};
const ARROW = {
	feed: std({color: '#64748b', emissive: '#334155', emissiveIntensity: 0.4}),
	h2: std({color: '#22d3ee', emissive: '#0891b2', emissiveIntensity: 0.9}),
	tail: std({color: '#ef4444', emissive: '#b91c1c', emissiveIntensity: 0.7}),
};

// ---------- geometry ----------
const profile = (() => {
	const pts: THREE.Vector2[] = [];
	for (let i = 0; i <= 10; i++) {
		const q = ((i / 10) * Math.PI) / 2;
		pts.push(new THREE.Vector2(Math.max(1e-3, R * Math.sin(q)), BY.bot + HEAD * (1 - Math.cos(q))));
	}
	for (let i = 10; i >= 0; i--) {
		const q = ((i / 10) * Math.PI) / 2;
		pts.push(new THREE.Vector2(Math.max(1e-3, R * Math.sin(q)), BY.top - HEAD * (1 - Math.cos(q))));
	}
	return pts;
})();
// the cut face of the shell wall on each side of the section plane
const wallSection = (side: number) => {
	const s = new THREE.Shape();
	profile.forEach((p, i) => (i ? s.lineTo(side * p.x, p.y) : s.moveTo(side * p.x, p.y)));
	[...profile].reverse().forEach((p) => s.lineTo(side * Math.max(1e-3, p.x - WALLT), p.y));
	s.closePath();
	return new THREE.ShapeGeometry(s, 4);
};
const hoop = (r: number, arc: number, start: number) => new THREE.TorusGeometry(r, 0.012, 6, 32, arc).rotateZ(start).rotateX(-Math.PI / 2);
const GEO = {
	back: new THREE.LatheGeometry(profile, 56, Math.PI / 2, Math.PI),
	front: new THREE.LatheGeometry(profile, 56, -Math.PI / 2, Math.PI),
	inner: new THREE.LatheGeometry(profile.map((p) => new THREE.Vector2(Math.max(1e-3, p.x - WALLT), p.y)), 56, Math.PI / 2, Math.PI),
	secR: wallSection(1),
	secL: wallSection(-1),
	halfDisc: new THREE.CircleGeometry(R - 0.04, 40, 0, Math.PI).rotateX(-Math.PI / 2),
	halfCyl: new THREE.CylinderGeometry(R - 0.045, R - 0.045, 1, 40, 1, true, Math.PI / 2, Math.PI),
	cutFace: new THREE.PlaneGeometry(2 * (R - 0.045), 1),
	bead: new THREE.SphereGeometry(0.036, 10, 8),
	dot: new THREE.SphereGeometry(1, 12, 10),
	cyl: new THREE.CylinderGeometry(1, 1, 1, 24),
	box: new THREE.BoxGeometry(1, 1, 1),
	sphere: new THREE.SphereGeometry(1, 24, 16),
	cone: new THREE.ConeGeometry(0.065, 0.17, 14),
	seamBack: new THREE.TorusGeometry(R + 0.004, 0.012, 6, 48, Math.PI).rotateX(-Math.PI / 2),
	seamFront: new THREE.TorusGeometry(R + 0.004, 0.012, 6, 48, Math.PI).rotateX(Math.PI / 2),
	deck: new THREE.RingGeometry(R + 0.05, 1.05, 40, 1, 0, Math.PI).rotateX(-Math.PI / 2),
	rail: new THREE.TorusGeometry(1.03, 0.016, 6, 40, Math.PI).rotateX(-Math.PI / 2),
	cage: hoop(0.36, 4.2, -2.1),
	gravel: new THREE.PlaneGeometry(600, 600),
};

// primitives
const Rod: React.FC<{a: V3; b: V3; r: number; mat: THREE.Material; f?: number; shadow?: boolean}> = ({a, b, r, mat, f = 1, shadow = true}) => {
	const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length();
	if (L < 1e-6 || f <= 0) return null;
	const dir = d.clone().normalize(), len = L * f;
	const mid = new THREE.Vector3(...a).addScaledVector(dir, len / 2);
	const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
	return <mesh geometry={GEO.cyl} material={mat} position={mid} quaternion={q} scale={[r, len, r]} castShadow={shadow} receiveShadow />;
};
const Box: React.FC<{p: V3; s: V3; mat: THREE.Material; rot?: V3}> = ({p, s, mat, rot}) => (
	<mesh geometry={GEO.box} material={mat} position={p} scale={s} rotation={rot} castShadow receiveShadow />
);
const Ball: React.FC<{p: V3; r: number; mat: THREE.Material}> = ({p, r, mat}) => <mesh geometry={GEO.sphere} material={mat} position={p} scale={r} castShadow receiveShadow />;
// bolted flange; axis = unit vector of the pipe
const Flange: React.FC<{p: V3; axis: V3; r?: number}> = ({p, axis, r = 0.14}) => {
	const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...axis));
	return (
		<group position={p} quaternion={q}>
			<mesh geometry={GEO.cyl} material={MAT.flange} scale={[r, 0.045, r]} castShadow />
			{Array.from({length: 8}, (_, i) => {
				const a = (i / 8) * Math.PI * 2;
				return <mesh key={i} geometry={GEO.cyl} material={MAT.dark} position={[Math.cos(a) * r * 0.78, 0, Math.sin(a) * r * 0.78]} scale={[0.014, 0.075, 0.014]} />;
			})}
		</group>
	);
};

// ---------- scene setup ----------
const Env: React.FC = () => {
	const {gl, scene} = useThree();
	useLayoutEffect(() => {
		const pm = new THREE.PMREMGenerator(gl);
		const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
		scene.environment = env;
		scene.environmentIntensity = 0.7;
		scene.background = textures().sky;
		scene.fog = new THREE.Fog('#e6ecf1', 26, 95);
		MAT.concrete.map = textures().concrete;
		MAT.gravel.map = textures().gravel;
		MAT.concrete.needsUpdate = MAT.gravel.needsUpdate = true;
		return () => {
			env.dispose();
			pm.dispose();
		};
	}, [gl, scene]);
	return null;
};
const CameraRig: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	useLayoutEffect(() => {
		const {pos, target} = camPose(t, shake3(t));
		camera.position.set(...pos);
		camera.lookAt(...target);
		(camera as THREE.PerspectiveCamera).fov = CAM_FOV;
		camera.updateProjectionMatrix();
	}, [t, camera]);
	return null;
};

// ---------- beds ----------
const beadMatrices = (() => {
	const out: THREE.Matrix4[] = [];
	const m = new THREE.Matrix4();
	let row = 0;
	for (let y = IN.bot + 0.04; y < IN.top - 0.03; y += 0.072, row++)
		for (let x = -0.52 + (row % 2) * 0.04; x <= 0.52; x += 0.078)
			for (let z = -0.52 + ((row + 1) % 2) * 0.04; z <= -0.012; z += 0.078) {
				if (x * x + z * z > 0.5 * 0.5) continue;
				m.makeTranslation(x + (h1(out.length) - 0.5) * 0.012, y, z);
				out.push(m.clone());
			}
	return out;
})();
const Beads: React.FC = () => {
	const ref = useRef<THREE.InstancedMesh>(null);
	useLayoutEffect(() => {
		const mesh = ref.current;
		if (!mesh) return;
		beadMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
		mesh.instanceMatrix.needsUpdate = true;
	}, []);
	return <instancedMesh ref={ref} args={[GEO.bead, MAT.bead, beadMatrices.length]} castShadow receiveShadow />;
};
// caged ladder from grade to the top platform, on the far side of the bed (local frame: +X = radial out)
const Ladder: React.FC = () => {
	const top = PLAT_Y + 1.0, rungs: React.ReactNode[] = [], hoops: React.ReactNode[] = [];
	for (let y = 0.3; y < top - 0.1; y += 0.3) rungs.push(<Rod key={y} a={[1.08, y, -0.19]} b={[1.08, y, 0.19]} r={0.012} mat={MAT.rail} shadow={false} />);
	for (let y = 2.3; y < top; y += 0.62) hoops.push(<mesh key={y} geometry={GEO.cage} material={MAT.rail} position={[1.4, y, 0]} />);
	return (
		<group>
			{[-0.2, 0.2].map((z) => <Rod key={z} a={[1.08, 0, z]} b={[1.08, top, z]} r={0.018} mat={MAT.rail} />)}
			{rungs}
			{hoops}
			{[-0.3, 0, 0.3].map((z) => <Rod key={`c${z}`} a={[1.4 + 0.33 * Math.cos(Math.asin(z / 0.36)), 2.3, z]} b={[1.4 + 0.33 * Math.cos(Math.asin(z / 0.36)), top, z]} r={0.01} mat={MAT.rail} shadow={false} />)}
		</group>
	);
};
const Platform: React.FC<{ladderAt: number}> = ({ladderAt}) => (
	<group position={[0, PLAT_Y, 0]}>
		<mesh geometry={GEO.deck} material={MAT.grating} castShadow receiveShadow />
		{[0.5, 1.0].map((h) => <mesh key={h} geometry={GEO.rail} material={MAT.rail} position={[0, h, 0]} />)}
		{Array.from({length: 7}, (_, i) => {
			const a = (i / 6) * Math.PI;
			return <Rod key={i} a={[1.03 * Math.cos(a), 0, -1.03 * Math.sin(a)]} b={[1.03 * Math.cos(a), 1.0, -1.03 * Math.sin(a)]} r={0.016} mat={MAT.rail} />;
		})}
		{/* brackets under the deck */}
		{[0.3, 0.7].map((u) => {
			const a = u * Math.PI;
			return <Rod key={u} a={[(R + 0.02) * Math.cos(a), -0.35, -(R + 0.02) * Math.sin(a)]} b={[0.95 * Math.cos(a), -0.02, -0.95 * Math.sin(a)]} r={0.02} mat={MAT.galv} />;
		})}
		<group rotation={[0, ladderAt, 0]} position={[0, -PLAT_Y, 0]}><Ladder /></group>
	</group>
);
const Vessel: React.FC<{b: Bed; t: number; t0: number; t1: number}> = ({b, t, t0, t1}) => {
	if (t < t0) return null;
	const cx = X(b.cx), running = t >= WALK[0], {ct} = cycleState(t);
	const drop = t < t1 ? (1 - Math.pow(pr(t, t0, t1), 2)) * 7.5 : 0.12 * Math.exp(-8 * (t - t1)) * Math.sin(22 * (t - t1));
	const cut = pr(t, ASM3.cut[0], ASM3.cut[1]);
	const f = frontAt(b.key, running ? ct : 0), hLoad = f * (IN.top - IN.bot);
	const side = b.key === 'A' ? -1 : 1, p = running ? pressureAt(b.key, ct) : 0.5;
	const needle = ((220 - 260 * p) * Math.PI) / 180;
	const la = pr(t, ASM3.labels[0], ASM3.labels[1]);
	return (
		<group position={[cx, drop, 0]}>
			{/* H-section legs with pad plates, base plates and anchor bolts */}
			{[45, 135, 225, 315].map((deg) => {
				const a = (deg * Math.PI) / 180, lx = 0.56 * Math.cos(a), lz = 0.56 * Math.sin(a);
				return (
					<group key={deg}>
						<Box p={[lx, (BY.bot + 0.55) / 2, lz]} s={[0.1, BY.bot + 0.55, 0.1]} mat={MAT.paint} rot={[0, -a, 0]} />
						<Box p={[lx, 0.015, lz]} s={[0.26, 0.03, 0.26]} mat={MAT.dark} rot={[0, -a, 0]} />
						{[-1, 1].flatMap((i) => [-1, 1].map((j) => <mesh key={`${i}${j}`} geometry={GEO.cyl} material={MAT.dark} position={[lx + i * 0.09, 0.05, lz + j * 0.09]} scale={[0.014, 0.05, 0.014]} />))}
					</group>
				);
			})}
			{/* shell: back half always, front half fades for the cut-away */}
			<mesh geometry={GEO.back} material={MAT.paint} castShadow receiveShadow />
			{cut > 0 ? <mesh geometry={GEO.inner} material={MAT.inner} /> : null}
			{cut < 1 ? <mesh geometry={GEO.front} material={MAT.paintFront} castShadow material-opacity={1 - cut} /> : null}
			{cut > 0 ? <mesh geometry={GEO.secR} material={MAT.section} /> : null}
			{cut > 0 ? <mesh geometry={GEO.secL} material={MAT.section} /> : null}
			{[BY.bot + HEAD, BY.top - HEAD].map((y) => (
				<group key={y} position={[0, y, 0]}>
					<mesh geometry={GEO.seamBack} material={MAT.seam} />
					{cut < 1 ? <mesh geometry={GEO.seamFront} material={MAT.seamFront} material-opacity={1 - cut} /> : null}
				</group>
			))}
			{/* process nozzles top & bottom */}
			<Rod a={[0, BY.top - 0.03, 0]} b={[0, BY.top + 0.12, 0]} r={0.085} mat={MAT.paint} />
			<Flange p={[0, BY.top + 0.14, 0]} axis={[0, 1, 0]} />
			<Rod a={[0, BY.bot + 0.03, 0]} b={[0, BY.bot - 0.12, 0]} r={0.085} mat={MAT.paint} />
			<Flange p={[0, BY.bot - 0.14, 0]} axis={[0, 1, 0]} />
			{/* manhole and lifting lugs on the top head (far side) */}
			<Rod a={[0.24 * side, BY.top - 0.12, -0.24]} b={[0.24 * side, BY.top + 0.08, -0.24]} r={0.12} mat={MAT.paint} />
			<Flange p={[0.24 * side, BY.top + 0.1, -0.24]} axis={[0, 1, 0]} r={0.17} />
			{[-1, 1].map((s) => <Box key={s} p={[s * 0.52, BY.top - HEAD + 0.06, -0.18]} s={[0.03, 0.16, 0.12]} mat={MAT.paint} />)}
			{/* internals */}
			{cut > 0 ? (
				<group>
					<Beads />
					{[IN.bot, IN.top].map((y) => <mesh key={y} geometry={GEO.halfDisc} material={MAT.screen} position={[0, y, 0]} />)}
					{hLoad > 0.01 ? (
						<group>
							<mesh geometry={GEO.halfCyl} material={MAT.load} position={[0, IN.bot + hLoad / 2, 0]} scale={[1, hLoad, 1]} />
							<mesh geometry={GEO.cutFace} material={MAT.load} position={[0, IN.bot + hLoad / 2, 0.004]} scale={[1, hLoad, 1]} />
							<mesh geometry={GEO.halfCyl} material={MAT.mtz} position={[0, IN.bot + hLoad + 0.16, 0]} scale={[1, 0.32, 1]} />
							<mesh geometry={GEO.cutFace} material={MAT.mtz} position={[0, IN.bot + hLoad + 0.16, 0.004]} scale={[1, 0.32, 1]} />
						</group>
					) : null}
				</group>
			) : null}
			{/* top platform + caged ladder on the outer far side */}
			<Platform ladderAt={side < 0 ? Math.PI * 0.82 : Math.PI * 0.18} />
			{/* pressure gauge and transmitter on the outer side */}
			{la > 0 ? (
				<group scale={eob(la)} position={[side * (R + 0.44), 4.6, 0.04]}>
					<Rod a={[-side * 0.44, 0, -0.04]} b={[-side * 0.12, 0, -0.04]} r={0.02} mat={MAT.steel} />
					<mesh geometry={GEO.cyl} material={MAT.dark} rotation={[Math.PI / 2, 0, 0]} scale={[0.2, 0.07, 0.2]} />
					<mesh geometry={GEO.cyl} material={MAT.face} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.036]} scale={[0.172, 0.01, 0.172]} />
					<mesh geometry={GEO.box} material={MAT.needle} position={[0, 0, 0.05]} rotation={[0, 0, needle]} scale={[0.27, 0.018, 0.01]} />
					<Ball p={[0, 0, 0.055]} r={0.02} mat={MAT.dark} />
					<group position={[0, 0.62, -0.04]}>
						<Rod a={[-side * 0.44, 0, 0]} b={[0, 0, 0]} r={0.018} mat={MAT.steel} />
						<Box p={[0, -0.02, 0]} s={[0.1, 0.14, 0.1]} mat={MAT.transmitter} />
						<mesh geometry={GEO.cyl} material={MAT.transmitter} position={[0, 0.09, 0.02]} rotation={[Math.PI / 2, 0, 0]} scale={[0.07, 0.07, 0.07]} />
					</group>
				</group>
			) : null}
		</group>
	);
};

// ---------- pipes, supports, flow arrows ----------
const TEES: Pt[] = [[280, Y.prod], [600, Y.prod], [280, Y.eq], [600, Y.eq], [280, Y.feed], [600, Y.feed], [280, Y.tail], [600, Y.tail]];
const BANDS: [Pt, keyof typeof BAND][] = [[[120, Y.feed], 'feed'], [[760, Y.tail], 'tail'], [[760, Y.prod], 'h2'], [[360, Y.eq], 'eq']];
const Pipes: React.FC<{t: number}> = ({t}) => {
	const f = eo(pr(t, ASM3.pipes[0], ASM3.pipes[1]));
	return (
		<group>
			{NET.map((s, i) => <Rod key={i} a={to3(s[0])} b={to3(s[1])} r={PIPE_R} mat={MAT.pipe} f={f} />)}
			{f >= 1 ? (
				<group>
					{TEES.map((p) => <Ball key={`${p}`} p={to3(p)} r={PIPE_R * 1.02} mat={MAT.pipe} />)}
					{BANDS.map(([p, k]) => <mesh key={k} geometry={GEO.cyl} material={BAND[k]} position={to3(p)} rotation={[0, 0, Math.PI / 2]} scale={[PIPE_R * 1.07, 0.16, PIPE_R * 1.07]} />)}
					{/* open ends of the headers */}
					<Flange p={to3([20, Y.feed])} axis={[1, 0, 0]} />
					<Flange p={to3([920, Y.prod])} axis={[1, 0, 0]} />
					<Flange p={to3([920, Y.tail])} axis={[1, 0, 0]} />
				</group>
			) : null}
		</group>
	);
};
// structures that carry the pipes
const Supports: React.FC<{t: number}> = ({t}) => {
	const a = pr(t, ASM3.pipes[0] - 0.4, ASM3.pipes[0]);
	if (a <= 0) return null;
	const portal = (x: number, mid: boolean) => (
		<group key={x}>
			{[-0.45, 0.45].map((z) => <Box key={z} p={[x, (Yw(Y.prod) - PIPE_R) / 2, z]} s={[0.1, Yw(Y.prod) - PIPE_R, 0.1]} mat={MAT.galv} />)}
			<Box p={[x, Yw(Y.prod) - PIPE_R - 0.04, 0]} s={[0.1, 0.08, 1.0]} mat={MAT.galv} />
			{mid ? <Box p={[x, Yw(Y.eq) - PIPE_R - 0.04, 0]} s={[0.1, 0.08, 1.0]} mat={MAT.galv} /> : null}
			{[-0.45, 0.45].map((z) => <Box key={`b${z}`} p={[x, 0.015, z]} s={[0.24, 0.03, 0.24]} mat={MAT.dark} />)}
		</group>
	);
	return (
		<group scale={[1, a, 1]}>
			{portal(X(470), true)}
			{portal(X(900), false)}
			{/* low stands under the feed header, sleepers under the tail header */}
			{[80, 420].map((x) => (
				<group key={x}>
					<Box p={[X(x), (Yw(Y.feed) - PIPE_R) / 2, 0]} s={[0.07, Yw(Y.feed) - PIPE_R, 0.07]} mat={MAT.galv} />
					<Box p={[X(x), Yw(Y.feed) - PIPE_R - 0.02, 0]} s={[0.07, 0.04, 0.34]} mat={MAT.galv} />
					<Box p={[X(x), 0.015, 0]} s={[0.2, 0.03, 0.2]} mat={MAT.dark} />
				</group>
			))}
			{[440, 700, 860].map((x) => <Box key={x} p={[X(x), (Yw(Y.tail) - PIPE_R) / 2, 0]} s={[0.22, Yw(Y.tail) - PIPE_R, 0.55]} mat={MAT.block} />)}
		</group>
	);
};
// arrows riding just in front of the active lines
const FlowArrows: React.FC<{t: number}> = ({t}) => {
	if (t < WALK[0]) return null;
	const {k, tau} = cycleState(t), fa = flowAlpha(tau, STEPS[k].dur);
	if (fa <= 0.01) return null;
	const out: React.ReactNode[] = [];
	STEPS[k].flows.forEach((fl, fi) => {
		const pts = PATHS[fl.path], L = pathLen(pts), gap = 85 / fl.rate, head = tau * 150;
		for (let j = Math.max(0, Math.ceil((head - L) / gap)); j <= head / gap; j++) {
			const s = head - j * gap;
			if (s < 0 || s > L - 4) continue;
			const [x, y] = pointAt(pts, s), [x2, y2] = pointAt(pts, s + 4);
			const dir = new THREE.Vector3(x2 - x, -(y2 - y), 0).normalize();
			const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
			out.push(<mesh key={`${fi}-${j}`} geometry={GEO.cone} material={ARROW[fl.kind]} position={[X(x), Yw(y), PIPE_R + 0.09]} quaternion={q} scale={fa} />);
		}
	});
	return <group>{out}</group>;
};

// ---------- valves: flanged ball valve + rack-and-pinion actuator ----------
const Valve3: React.FC<{v: (typeof VALVES)[number]; t: number}> = ({v, t}) => {
	if (t < v.t) return null;
	const s = eob(pr(t, v.t, v.t + 0.35)), o = valveAt(v.key, t);
	const axis: V3 = v.dir === 'h' ? [1, 0, 0] : [0, 1, 0];
	const stem: V3 = v.dir === 'h' ? [0, 1, 0] : [0, 0, 1];
	const at = (d: number): V3 => [stem[0] * d, stem[1] * d, stem[2] * d];
	const bodyRot: V3 = v.dir === 'h' ? [0, 0, Math.PI / 2] : [0, 0, 0];
	const actRot: V3 = v.dir === 'h' ? [0, 0, 0] : [Math.PI / 2, 0, 0];
	return (
		<group position={to3([v.x, v.y])} scale={s}>
			<mesh geometry={GEO.cyl} material={MAT.dark} rotation={bodyRot} scale={[0.12, 0.22, 0.12]} castShadow />
			<Ball p={[0, 0, 0]} r={0.135} mat={MAT.dark} />
			{[-0.13, 0.13].map((d) => <Flange key={d} p={[axis[0] * d, axis[1] * d, 0]} axis={axis} r={0.145} />)}
			<Rod a={at(0.1)} b={at(0.24)} r={0.035} mat={MAT.steel} />
			{/* actuator body (long side along the pipe), end caps, solenoid, position indicator */}
			<group position={at(0.33)} rotation={actRot}>
				<mesh geometry={GEO.box} material={MAT.actuator} scale={v.dir === 'h' ? [0.34, 0.13, 0.15] : [0.15, 0.13, 0.34]} castShadow />
				{[-1, 1].map((e) => (
					<mesh key={e} geometry={GEO.box} material={MAT.dark} position={v.dir === 'h' ? [e * 0.18, 0, 0] : [0, 0, e * 0.18]} scale={v.dir === 'h' ? [0.03, 0.15, 0.17] : [0.17, 0.15, 0.03]} />
				))}
				<mesh geometry={GEO.box} material={MAT.dark} position={v.dir === 'h' ? [0, 0, 0.1] : [0.1, 0, 0]} scale={[0.07, 0.07, 0.07]} />
				<mesh geometry={GEO.cyl} material={MAT.indicator} position={[0, 0.085, 0]} scale={[0.05, 0.04, 0.05]} />
				<mesh geometry={GEO.box} material={MAT.dark} position={[0, 0.108, 0]} rotation={[0, o * (Math.PI / 2), 0]} scale={[0.09, 0.012, 0.018]} />
			</group>
		</group>
	);
};

// ---------- gas particles inside the cut-away beds (instanced) ----------
const CAP = 600;
const Particles: React.FC<{t: number}> = ({t}) => {
	const h2 = useRef<THREE.InstancedMesh>(null), imp = useRef<THREE.InstancedMesh>(null);
	const dots = useMemo(
		() => (t < ASM3.cut[1] ? [] : BEDS.flatMap((b) => bedDots(b, t).map((d) => ({p: [X(d.x), Yw(d.y), 0.03 + Math.abs(d.z) * 0.06] as V3, imp: d.imp, s: 0.052 * d.op})))),
		[t],
	);
	useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		for (const [ref, want] of [[h2, false], [imp, true]] as const) {
			const mesh = ref.current;
			if (!mesh) continue;
			let n = 0;
			for (const d of dots) {
				if (d.imp !== want || d.s < 0.004 || n >= CAP) continue;
				m.makeScale(d.s, d.s, d.s).setPosition(...d.p);
				mesh.setMatrixAt(n++, m);
			}
			mesh.count = n;
			mesh.instanceMatrix.needsUpdate = true;
		}
	}, [dots]);
	return (
		<group>
			<instancedMesh ref={h2} args={[GEO.dot, MAT.h2, CAP]} frustumCulled={false} />
			<instancedMesh ref={imp} args={[GEO.dot, MAT.imp, CAP]} frustumCulled={false} />
		</group>
	);
};

export const Psa3DScene: React.FC<{t: number}> = ({t}) => (
	<>
		<Env />
		<CameraRig t={t} />
		<ambientLight intensity={0.25} />
		<hemisphereLight args={['#dbeafe', '#8b8579', 0.6]} />
		<directionalLight
			position={[7, 14, 10]}
			intensity={2.3}
			color="#fff7ea"
			castShadow
			shadow-mapSize={[4096, 4096]}
			shadow-camera-left={-10}
			shadow-camera-right={10}
			shadow-camera-top={11}
			shadow-camera-bottom={-5}
			shadow-bias={-0.0003}
			shadow-normalBias={0.02}
			shadow-radius={4}
		/>
		<directionalLight position={[-9, 6, 6]} intensity={0.5} color="#dbeafe" />
		{/* site: gravel yard with a concrete slab */}
		<mesh geometry={GEO.gravel} material={MAT.gravel} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow />
		<mesh geometry={GEO.box} material={MAT.concrete} position={[0.2, -0.06, -0.3]} scale={[11.6, 0.12, 5.2]} receiveShadow />
		{BEDS.map((b) => <Box key={b.key} p={[X(b.cx), 0.06, 0]} s={[1.5, 0.12, 1.5]} mat={MAT.block} />)}
		<Supports t={t} />
		<Pipes t={t} />
		<FlowArrows t={t} />
		<Vessel b={BEDS[0]} t={t} t0={ASM3.bedA[0]} t1={ASM3.bedA[1]} />
		<Vessel b={BEDS[1]} t={t} t0={ASM3.bedB[0]} t1={ASM3.bedB[1]} />
		{VALVES.map((v) => <Valve3 key={v.key} v={v} t={t} />)}
		<Particles t={t} />
	</>
);
