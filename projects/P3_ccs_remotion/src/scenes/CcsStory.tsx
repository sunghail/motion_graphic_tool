import React from 'react';
import {Audio} from '@remotion/media';
import {mouseClick, uiSwitch, whoosh} from '@remotion/sfx';
import {AbsoluteFill, Easing, Interactive, interpolate, Sequence, Series, useCurrentFrame, useVideoConfig} from 'remotion';
import {KR} from '../fonts';
import {Plant} from '../plant/Plant';
import {Zoom} from '../plant/Zoom';
import {CHAPTERS, COL, INK, MOLC, SKIP_AT, T_END, pr, storyTime, videoTime} from '../sim';
import {ChapterCard} from './ChapterCard';

// Continuous story: assembly → flue-gas cooling → absorption → regeneration → CO₂ compression.
export const CcsStory: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = storyTime(frame / fps); // story clock (skips the removed 7-12 s chapter)
	return (
		<AbsoluteFill style={{backgroundColor: '#f8fafc'}}>
			<Plant t={t} width={width} height={height} />
			<Zoom t={t} />
			{/* the right third is the text panel; the plant only shows on the left */}
			<div style={{position: 'absolute', left: 1080, top: 0, width: 840, height: 1080, backgroundColor: '#f8fafc', borderLeft: `4px solid ${INK}`}} />
			<Series>
				<Series.Sequence durationInFrames={420} name="포집 설비 조립" premountFor={30}><ChapterCard step={1} group={CHAPTERS[0].g} title={CHAPTERS[0].title} desc={CHAPTERS[0].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={420} name="흡수" premountFor={30}><ChapterCard step={2} group={CHAPTERS[1].g} title={CHAPTERS[1].title} desc={CHAPTERS[1].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={360} name="분자로 보면 (흡수)" premountFor={30}><ChapterCard step={3} group={CHAPTERS[2].g} title={CHAPTERS[2].title} desc={CHAPTERS[2].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={240} name="처리 가스 배출" premountFor={30}><ChapterCard step={4} group={CHAPTERS[3].g} title={CHAPTERS[3].title} desc={CHAPTERS[3].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={300} name="열 회수" premountFor={30}><ChapterCard step={5} group={CHAPTERS[4].g} title={CHAPTERS[4].title} desc={CHAPTERS[4].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={420} name="탈거" premountFor={30}><ChapterCard step={6} group={CHAPTERS[5].g} title={CHAPTERS[5].title} desc={CHAPTERS[5].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={300} name="분자로 보면 (재생)" premountFor={30}><ChapterCard step={7} group={CHAPTERS[6].g} title={CHAPTERS[6].title} desc={CHAPTERS[6].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={300} name="용액 순환" premountFor={30}><ChapterCard step={8} group={CHAPTERS[7].g} title={CHAPTERS[7].title} desc={CHAPTERS[7].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={300} name="수분 제거" premountFor={30}><ChapterCard step={9} group={CHAPTERS[8].g} title={CHAPTERS[8].title} desc={CHAPTERS[8].desc} /></Series.Sequence>
				<Series.Sequence durationInFrames={480} name="압축" premountFor={30}><ChapterCard step={10} group={CHAPTERS[9].g} title={CHAPTERS[9].title} desc={CHAPTERS[9].desc} /></Series.Sequence>
			</Series>
			<Sequence name="범례" from={420} durationInFrames={3120} premountFor={30}><Legend /></Sequence>
			<ProgressTrack t={t} />
			<SoundEffects />
		</AbsoluteFill>
	);
};

const STREAMS: [string, string][] = [
	['배가스', COL.flue], ['처리 가스', COL.treated], ['린 용액', COL.lean], ['리치 용액', COL.rich],
	['스팀', COL.steam], ['CO₂', COL.co2], ['응축수', COL.water], ['냉각수', COL.cw],
];
const MOLS: [string, string][] = [['CO₂', MOLC.CO2], ['N₂', MOLC.N2], ['O₂', MOLC.O2], ['H₂O', MOLC.H2O]];

const Legend: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<Interactive.Div
			name="Legend card"
			style={{
				position: 'absolute', left: 1120, top: 580, width: 720, padding: '22px 30px',
				backgroundColor: '#ffffff', border: '3px solid #27313d', borderRadius: 28, boxShadow: '8px 8px 0 #27313d', fontFamily: KR,
				opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
				translate: interpolate(frame, [0, 0.7 * fps], ['0px 60px', '0px 0px'], {easing: Easing.spring({damping: 200}), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
			}}
		>
			<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 10, columnGap: 20}}>
				{STREAMS.map(([name, c]) => (
					<div key={name} style={{display: 'flex', alignItems: 'center', gap: 14}}>
						<div style={{width: 46, height: 16, borderRadius: 8, backgroundColor: c, border: `3px solid ${INK}`}} />
						<div style={{fontSize: 30, fontWeight: 700, color: '#18212c'}}>{name}</div>
					</div>
				))}
			</div>
			<div style={{height: 3, backgroundColor: '#e2e8f0', margin: '16px 0 14px'}} />
			<div style={{display: 'flex', justifyContent: 'space-between'}}>
				{MOLS.map(([name, c]) => (
					<div key={name} style={{display: 'flex', alignItems: 'center', gap: 10}}>
						<div style={{width: 24, height: 24, borderRadius: 999, backgroundColor: c, border: '3px solid #fff', boxShadow: `0 0 0 2px ${INK}`}} />
						<div style={{fontSize: 32, fontWeight: 900, color: '#18212c'}}>{name}</div>
					</div>
				))}
			</div>
		</Interactive.Div>
	);
};

// 10 chapter ticks grouped as 설비 / 포집 / 재생 / 압축.
const ProgressTrack: React.FC<{t: number}> = ({t}) => (
	<div style={{position: 'absolute', left: 1120, top: 968, width: 720, fontFamily: KR}}>
		<div style={{display: 'flex', gap: 8}}>
			{CHAPTERS.map((c, i) => {
				const end = i === 0 ? SKIP_AT : i < CHAPTERS.length - 1 ? CHAPTERS[i + 1].t : T_END;
				return (
					<div key={`${c.title}${i}`} style={{flex: 1, height: 14, borderRadius: 999, border: `2.5px solid ${INK}`, backgroundColor: '#e6ebf1', overflow: 'hidden'}}>
						<div style={{width: `${pr(t, c.t, end) * 100}%`, height: '100%', backgroundColor: '#2563eb'}} />
					</div>
				);
			})}
		</div>
		<div style={{display: 'flex', marginTop: 10, fontSize: 26, fontWeight: 700, color: '#5d6876'}}>
			<div style={{flex: 1}}>설비</div>
			<div style={{flex: 3}}>포집</div>
			<div style={{flex: 4}}>재생</div>
			<div style={{flex: 2}}>압축</div>
		</div>
	</div>
);

// Fly-in whooshes and snap clicks during assembly; clicks as the compressor stages start (story seconds).
const SFX: [number, string, number][] = [
	[0.95, whoosh, 0.35], [1.45, uiSwitch, 0.9], [1.55, whoosh, 0.35], [2.05, uiSwitch, 0.9],
	[2.65, mouseClick, 0.6], [3.05, mouseClick, 0.6], [3.4, mouseClick, 0.6], [3.7, mouseClick, 0.6],
	[3.8, mouseClick, 0.4], [4.3, mouseClick, 0.4], [4.6, mouseClick, 0.4], [4.8, mouseClick, 0.4], [5.0, mouseClick, 0.4],
	[21.6, uiSwitch, 0.6], [43.0, uiSwitch, 0.6], [56.8, uiSwitch, 0.5], [57.6, uiSwitch, 0.5], [58.4, uiSwitch, 0.5],
];
const SoundEffects: React.FC = () => (
	<>
		{SFX.map(([time, src, volume]) => (
			<Sequence key={`${time}`} name="SFX" from={Math.round(videoTime(time) * 60)} durationInFrames={120} layout="none">
				<Audio src={src} volume={volume} />
			</Sequence>
		))}
	</>
);
