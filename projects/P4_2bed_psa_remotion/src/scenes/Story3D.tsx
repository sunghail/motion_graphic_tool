import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {KR} from '../fonts';
import {ASM3, Psa3DScene, shake3} from '../plant/Psa3D';
import {Yw, X, project} from '../plant/cam3d';
import {BEDS, INK, MODE, VALVES, WALK, Y, cycleState, eob, modeOf, pr} from '../sim';
import {ChapterSeries, CycleChart, PanelBackdrop, ProgressTrack, SoundEffects} from './Panel';

const S = 1080; // the 3D view is the left square; the text panel sits on the right

// HTML labels pinned to 3D points
const Tag: React.FC<{t: number; p: [number, number, number]; a: number; children: React.ReactNode; style?: React.CSSProperties}> = ({t, p, a, children, style}) => {
	if (a <= 0) return null;
	const [x, y, ok] = project(t, p, S, shake3(t));
	if (!ok) return null;
	return (
		<div style={{position: 'absolute', left: x, top: y, translate: '-50% -50%', opacity: a, fontFamily: KR, fontWeight: 900, whiteSpace: 'nowrap', ...style}}>
			{children}
		</div>
	);
};
const pill = (bg: string, size: number): React.CSSProperties => ({
	fontSize: size, color: '#18212c', backgroundColor: bg, border: `3px solid ${INK}`, borderRadius: 999, padding: '4px 16px', boxShadow: `4px 4px 0 ${INK}`,
});
const halo: React.CSSProperties = {textShadow: '0 0 6px #fff, 0 0 6px #fff, 0 0 10px #fff'};

export const Story3D: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, height} = useVideoConfig();
	const t = frame / fps;
	const la = pr(t, ASM3.labels[0], ASM3.labels[1]), running = t >= WALK[0], {k} = cycleState(t);
	return (
		<AbsoluteFill style={{backgroundColor: '#eef2f7'}}>
			<ThreeCanvas width={S} height={height} shadows="soft" style={{position: 'absolute', left: 0, top: 0}} camera={{fov: 28, near: 0.1, far: 200, position: [0, 6, 20]}}>
				<Psa3DScene t={t} />
			</ThreeCanvas>
			<div style={{position: 'absolute', left: 0, top: 0, width: S, height: S, overflow: 'hidden'}}>
				{BEDS.map((b) => (
					<React.Fragment key={b.key}>
						<Tag t={t} p={[X(b.cx) + (b.key === 'A' ? -1.05 : 1.05), 5.45, 0.05]} a={la} style={pill('#ffffff', 30)}>{b.key}탑</Tag>
						{running ? (
							<Tag t={t} p={[X(b.cx) + (b.key === 'A' ? -1.0 : 1.0), 3.9, 0.05]} a={1} style={pill(MODE[modeOf(b.key, k)].color, 28)}>
								{MODE[modeOf(b.key, k)].name}
							</Tag>
						) : null}
					</React.Fragment>
				))}
				{VALVES.map((v) => (
					<Tag key={v.key} t={t} p={[X(v.x) + (v.dir === 'v' ? (v.x < 440 ? -0.34 : 0.34) : 0), Yw(v.y) + (v.dir === 'h' ? (v.key === 'V7' ? -0.3 : 0.42) : 0), 0]} a={la} style={{fontSize: 18, color: '#18212c', ...halo}}>
						{v.key} <span style={{color: '#5d6876', fontWeight: 700}}>{v.name}</span>
					</Tag>
				))}
				<Tag t={t} p={[X(40), Yw(Y.feed) + 0.34, 0]} a={la} style={{fontSize: 26, color: '#475569', ...halo}}>원료 가스</Tag>
				<Tag t={t} p={[X(860), Yw(Y.prod) + 0.34, 0]} a={la} style={{fontSize: 26, color: '#0e7490', ...halo}}>제품 H₂ →</Tag>
				<Tag t={t} p={[X(850), Yw(Y.tail) + 0.34, 0]} a={la} style={{fontSize: 26, color: '#b91c1c', ...halo}}>탈착 가스 →</Tag>
				{[ASM3.bedA[1], ASM3.bedB[1]].map((t1, i) => {
					const tau = t - t1;
					if (tau < 0 || tau > 0.8) return null;
					return (
						<Tag key={i} t={t} p={[X(BEDS[i].cx) + 1.2, 5.6, 0]} a={1 - pr(tau, 0.5, 0.8)} style={{fontSize: 64, color: '#f59e0b', WebkitTextStroke: `3px ${INK}`, scale: String(eob(pr(tau, 0, 0.2))), rotate: '-7deg'}}>
							착!
						</Tag>
					);
				})}
			</div>
			<PanelBackdrop dark />
			<ChapterSeries />
			<CycleChart t={t} />
			<ProgressTrack t={t} />
			<SoundEffects />
		</AbsoluteFill>
	);
};
