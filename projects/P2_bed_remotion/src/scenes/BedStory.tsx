import React from 'react';
import {Audio} from '@remotion/media';
import {ding, mouseClick, shutterModern, uiSwitch, whoosh} from '@remotion/sfx';
import {AbsoluteFill, Easing, Interactive, interpolate, Sequence, Series, useCurrentFrame, useVideoConfig} from 'remotion';
import {BedWorld} from '../bed/BedWorld';
import {KR} from '../fonts';
import {CHAPTERS, INK, LAYERS, SPECIES, T_END, landedFraction, pr} from '../sim';
import {ChapterCard} from './ChapterCard';

// Continuous story: blueprint → snap assembly → hydro-test → cut-away → loading → gas flow.
export const BedStory: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	return (
		<AbsoluteFill style={{backgroundColor: '#f8fafc'}}>
			<BedWorld t={t} width={width} height={height} />
			<Series>
				<Series.Sequence durationInFrames={150} name="설계 도면" premountFor={30}><ChapterCard step={1} group={CHAPTERS[0].g} title={CHAPTERS[0].title} desc={CHAPTERS[0].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={348} name="흡착탑 조립" premountFor={30}><ChapterCard step={2} group={CHAPTERS[1].g} title={CHAPTERS[1].title} desc={CHAPTERS[1].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={126} name="점검" premountFor={30}><ChapterCard step={3} group={CHAPTERS[2].g} title={CHAPTERS[2].title} desc={CHAPTERS[2].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={78} name="단면 보기" premountFor={30}><ChapterCard step={4} group={CHAPTERS[3].g} title={CHAPTERS[3].title} desc={CHAPTERS[3].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={90} name="충전 준비" premountFor={30}><ChapterCard step={5} group={CHAPTERS[4].g} title={CHAPTERS[4].title} desc={CHAPTERS[4].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={252} name="하부 지지층" premountFor={30}><ChapterCard step={6} group={CHAPTERS[5].g} title={CHAPTERS[5].title} desc={CHAPTERS[5].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={300} name="활성 알루미나" premountFor={30}><ChapterCard step={7} group={CHAPTERS[6].g} title={CHAPTERS[6].title} desc={CHAPTERS[6].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={372} name="활성탄" premountFor={30}><ChapterCard step={8} group={CHAPTERS[7].g} title={CHAPTERS[7].title} desc={CHAPTERS[7].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={360} name="제올라이트 5A" premountFor={30}><ChapterCard step={9} group={CHAPTERS[8].g} title={CHAPTERS[8].title} desc={CHAPTERS[8].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={264} name="상부 고정층" premountFor={30}><ChapterCard step={10} group={CHAPTERS[9].g} title={CHAPTERS[9].title} desc={CHAPTERS[9].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={132} name="배관 연결" premountFor={30}><ChapterCard step={11} group={CHAPTERS[10].g} title={CHAPTERS[10].title} desc={CHAPTERS[10].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={528} name="가스 흐름" premountFor={30}><ChapterCard step={12} group={CHAPTERS[11].g} title={CHAPTERS[11].title} desc={CHAPTERS[11].desc} /></Series.Sequence>
			</Series>
			<Sequence name="층 쌓기 현황" from={792} durationInFrames={1680} premountFor={30}><LayerStack /></Sequence>
			<Sequence name="성분 범례" from={2472} durationInFrames={528} premountFor={30}><SpeciesLegend /></Sequence>
			<ProgressTrack t={t} />
			<SoundEffects />
		</AbsoluteFill>
	);
};

// Filling progress of each layer while loading (top of the bed first, like the bed itself).
const LayerStack: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = 13.2 + frame / fps;
	const order = [...LAYERS].reverse();
	return (
		<Interactive.Div
			name="Layer stack card"
			style={{
				position: 'absolute', left: 1120, top: 556, width: 720, padding: '24px 34px',
				backgroundColor: '#ffffff', border: '3px solid #27313d', borderRadius: 28, boxShadow: '8px 8px 0 #27313d', fontFamily: KR,
				opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
				translate: interpolate(frame, [0, 0.7 * fps], ['0px 60px', '0px 0px'], {easing: Easing.spring({damping: 200}), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
			}}
		>
			<div style={{fontSize: 30, fontWeight: 900, color: '#5d6876', marginBottom: 14}}>층 쌓기 (위 → 아래)</div>
			{order.map((L) => {
				const f = landedFraction(L, t);
				const active = t >= L.tB && f < 1;
				return (
					<div key={L.key} style={{display: 'flex', alignItems: 'center', gap: 18, height: 56, opacity: f > 0 || active ? 1 : 0.35}}>
						<div style={{width: 34, height: 34, borderRadius: 999, backgroundColor: L.base, border: `3px solid ${INK}`, flex: 'none'}} />
						<div style={{width: 260, fontSize: 34, fontWeight: active ? 900 : 700, color: '#18212c', whiteSpace: 'nowrap'}}>{L.name}</div>
						<div style={{flex: 1, height: 22, borderRadius: 999, border: `3px solid ${INK}`, backgroundColor: '#eef2f6', overflow: 'hidden'}}>
							<div style={{width: `${f * 100}%`, height: '100%', backgroundColor: active ? '#2563eb' : '#94a3b8'}} />
						</div>
					</div>
				);
			})}
		</Interactive.Div>
	);
};

const SpeciesLegend: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<Interactive.Div
			name="Species legend card"
			style={{
				position: 'absolute', left: 1120, top: 520, width: 720, padding: '26px 34px',
				backgroundColor: '#ffffff', border: '3px solid #27313d', borderRadius: 28, boxShadow: '8px 8px 0 #27313d', fontFamily: KR,
				opacity: interpolate(frame, [0.4 * fps, 0.9 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
				translate: interpolate(frame, [0.4 * fps, 1.1 * fps], ['0px 60px', '0px 0px'], {easing: Easing.spring({damping: 200}), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
			}}
		>
			<div style={{fontSize: 30, fontWeight: 900, color: '#5d6876', marginBottom: 10}}>성분 → 잡히는 층</div>
			{SPECIES.map((s, i) => (
				<div key={s.k} style={{
					display: 'flex', alignItems: 'center', gap: 20, height: 52,
					opacity: interpolate(frame, [(0.8 + i * 0.12) * fps, (1.1 + i * 0.12) * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
				}}>
					<div style={{width: 26, height: 26, borderRadius: 999, backgroundColor: s.col, border: '3px solid #fff', boxShadow: `0 0 0 2px ${INK}`}} />
					<div style={{width: 110, fontSize: 38, fontWeight: 900, color: '#18212c'}}>{s.label}</div>
					<div style={{fontSize: 34, fontWeight: 500, color: '#3a4553'}}>{s.to}</div>
				</div>
			))}
		</Interactive.Div>
	);
};

// 12 chapter ticks grouped as 제작 / 충전 / 운전.
const ProgressTrack: React.FC<{t: number}> = ({t}) => (
	<div style={{position: 'absolute', left: 1120, top: 968, width: 720, fontFamily: KR}}>
		<div style={{display: 'flex', gap: 8}}>
			{CHAPTERS.map((c, i) => {
				const end = i < CHAPTERS.length - 1 ? CHAPTERS[i + 1].t : T_END;
				const f = pr(t, c.t, end);
				return (
					<div key={c.title} style={{flex: 1, height: 14, borderRadius: 999, border: `2.5px solid ${INK}`, backgroundColor: '#e6ebf1', overflow: 'hidden'}}>
						<div style={{width: `${f * 100}%`, height: '100%', backgroundColor: '#2563eb'}} />
					</div>
				);
			})}
		</div>
		<div style={{display: 'flex', marginTop: 10, fontSize: 26, fontWeight: 700, color: '#5d6876'}}>
			<div style={{flex: 3}}>제작</div>
			<div style={{flex: 7}}>충전</div>
			<div style={{flex: 2}}>운전</div>
		</div>
	</div>
);

// Fly-in whooshes, "착" clicks at each snap, a ding when the test passes.
const SFX: [number, string, number][] = [
	[2.45, whoosh, 0.35], [3.05, uiSwitch, 0.9], [3.25, whoosh, 0.3], [3.75, uiSwitch, 0.9], [3.95, whoosh, 0.3], [4.45, uiSwitch, 0.9],
	[5.15, mouseClick, 0.7], [5.45, mouseClick, 0.7], [5.75, mouseClick, 0.5], [5.9, mouseClick, 0.5], [6.05, mouseClick, 0.5],
	[6.62, uiSwitch, 0.7], [6.78, uiSwitch, 0.7], [8.6, mouseClick, 0.7], [10.0, ding, 0.6], [10.4, shutterModern, 0.45],
	[11.9, whoosh, 0.3], [12.5, uiSwitch, 0.7], [40.1, uiSwitch, 0.7], [40.4, uiSwitch, 0.7],
];
const SoundEffects: React.FC = () => (
	<>
		{SFX.map(([time, src, volume]) => (
			<Sequence key={`${time}`} name="SFX" from={Math.round(time * 60)} durationInFrames={120} layout="none">
				<Audio src={src} volume={volume} />
			</Sequence>
		))}
	</>
);
