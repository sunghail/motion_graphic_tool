// Right-hand text panel shared by the 2D and the 3D versions.
import React from 'react';
import {Audio} from '@remotion/media';
import {mouseClick, uiSwitch, whoosh} from '@remotion/sfx';
import {Easing, Interactive, interpolate, Sequence, Series, useCurrentFrame, useVideoConfig} from 'remotion';
import {KR} from '../fonts';
import {CHAPTERS, CYCLE, GASC, INK, MODE, STEPS, STEP_T0, T_END, VALVES, WALK, cycleState, pr, pressureAt} from '../sim';
import {ChapterCard} from './ChapterCard';

export const PanelBackdrop: React.FC<{dark?: boolean}> = ({dark}) => (
	<div style={{position: 'absolute', left: 1080, top: 0, width: 840, height: 1080, backgroundColor: dark ? '#f1f5f9' : '#f8fafc', borderLeft: `4px solid ${INK}`}} />
);

// durations are inline so the Studio can edit them; they follow CHAPTERS (story seconds × 60)
export const ChapterSeries: React.FC = () => (
	<Series>
		<Series.Sequence durationInFrames={420} name="2탑 PSA 설비" premountFor={30}><ChapterCard step={1} group={CHAPTERS[0].g} title={CHAPTERS[0].title} desc={CHAPTERS[0].desc} /></Series.Sequence>
		<Series.Sequence durationInFrames={240} name="1. 가압 · 탈압" premountFor={30}><ChapterCard step={2} group={CHAPTERS[1].g} title={CHAPTERS[1].title} desc={CHAPTERS[1].desc} /></Series.Sequence>
		<Series.Sequence durationInFrames={420} name="2. 흡착 · 퍼지" premountFor={30}><ChapterCard step={3} group={CHAPTERS[2].g} title={CHAPTERS[2].title} desc={CHAPTERS[2].desc} /></Series.Sequence>
		<Series.Sequence durationInFrames={240} name="3. 균압" premountFor={30}><ChapterCard step={4} group={CHAPTERS[3].g} title={CHAPTERS[3].title} desc={CHAPTERS[3].desc} /></Series.Sequence>
		<Series.Sequence durationInFrames={240} name="4. 탈압 · 가압" premountFor={30}><ChapterCard step={5} group={CHAPTERS[4].g} title={CHAPTERS[4].title} desc={CHAPTERS[4].desc} /></Series.Sequence>
		<Series.Sequence durationInFrames={420} name="5. 퍼지 · 흡착" premountFor={30}><ChapterCard step={6} group={CHAPTERS[5].g} title={CHAPTERS[5].title} desc={CHAPTERS[5].desc} /></Series.Sequence>
		<Series.Sequence durationInFrames={240} name="6. 균압" premountFor={30}><ChapterCard step={7} group={CHAPTERS[6].g} title={CHAPTERS[6].title} desc={CHAPTERS[6].desc} /></Series.Sequence>
		<Series.Sequence durationInFrames={1200} name="연속 운전" premountFor={30}><ChapterCard step={8} group={CHAPTERS[7].g} title={CHAPTERS[7].title} desc={CHAPTERS[7].desc} /></Series.Sequence>
	</Series>
);

// cycle Gantt (A/B rows) + pressure traces, with a cursor at the current cycle time
const GX0 = 96, GW = 588;
export const CycleChart: React.FC<{t: number}> = ({t}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const running = t >= WALK[0], {ct} = cycleState(t);
	const cx = GX0 + (ct / CYCLE) * GW;
	const upto = t < WALK[1] ? (running ? ct : 0) : CYCLE;
	const trace = (bed: 'A' | 'B') =>
		Array.from({length: 121}, (_, i) => (i / 120) * CYCLE)
			.filter((c) => c <= upto + 1e-6)
			.map((c) => `${(GX0 + (c / CYCLE) * GW).toFixed(1)},${(118 - pressureAt(bed, c) * 96).toFixed(1)}`)
			.join(' ');
	return (
		<Interactive.Div
			name="Cycle chart card"
			style={{
				position: 'absolute', left: 1120, top: 548, width: 720, height: 392, fontFamily: KR,
				backgroundColor: '#ffffff', border: '3px solid #27313d', borderRadius: 28, boxShadow: '8px 8px 0 #27313d',
				opacity: interpolate(frame, [6 * fps, 6.6 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
				translate: interpolate(frame, [6 * fps, 6.8 * fps], ['0px 50px', '0px 0px'], {easing: Easing.spring({damping: 200}), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
			}}
		>
			<svg width={720} height={392} style={{position: 'absolute', left: -3, top: -3}}>
				<text x={30} y={46} fontSize={28} fontWeight={900} fill="#5d6876">사이클</text>
				<g fontSize={24} fontWeight={700} fill="#18212c">
					<circle cx={500} cy={37} r={9} fill={GASC.H2} stroke={INK} strokeWidth={2} /><text x={516} y={46}>H₂</text>
					<circle cx={578} cy={37} r={9} fill={GASC.IMP} stroke={INK} strokeWidth={2} /><text x={594} y={46}>불순물</text>
				</g>
				{(['A', 'B'] as const).map((bed, r) => (
					<g key={bed} transform={`translate(0 ${70 + r * 56})`}>
						<text x={30} y={31} fontSize={24} fontWeight={900} fill="#18212c">{bed}탑</text>
						{STEPS.map((s, i) => {
							const x = GX0 + (STEP_T0[i] / CYCLE) * GW, w = (s.dur / CYCLE) * GW, m = MODE[s[bed]];
							const on = running && cycleState(t).k === i;
							return (
								<g key={i}>
									<rect x={x + 1.5} y={0} width={w - 3} height={44} rx={8} fill={m.color} stroke={INK} strokeWidth={on ? 3.5 : 2} opacity={on || !running ? 1 : 0.75} />
									<text x={x + w / 2} y={30} fontSize={s.dur > 5 ? 23 : 19} fontWeight={900} fill="#18212c" textAnchor="middle">{m.name}</text>
								</g>
							);
						})}
					</g>
				))}
				<g transform="translate(0 204)">
					<text x={30} y={28} fontSize={20} fontWeight={700} fill="#5d6876">고압</text>
					<text x={30} y={122} fontSize={20} fontWeight={700} fill="#5d6876">저압</text>
					<line x1={GX0} y1={118} x2={GX0 + GW} y2={118} stroke={INK} strokeWidth={2} />
					<line x1={GX0} y1={22} x2={GX0} y2={118} stroke={INK} strokeWidth={2} />
					<line x1={GX0} y1={22} x2={GX0 + GW} y2={22} stroke="#e2e8f0" strokeWidth={2} strokeDasharray="6 6" />
					<polyline points={trace('A')} fill="none" stroke="#2563eb" strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
					<polyline points={trace('B')} fill="none" stroke="#ea580c" strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
					<g fontSize={22} fontWeight={900}>
						<line x1={GX0 + 360} y1={160} x2={GX0 + 392} y2={160} stroke="#2563eb" strokeWidth={5} /><text x={GX0 + 400} y={168} fill="#18212c">A탑 압력</text>
						<line x1={GX0 + 500} y1={160} x2={GX0 + 532} y2={160} stroke="#ea580c" strokeWidth={5} /><text x={GX0 + 540} y={168} fill="#18212c">B탑 압력</text>
					</g>
				</g>
				{running ? <line x1={cx} y1={62} x2={cx} y2={330} stroke={INK} strokeWidth={3} strokeDasharray="8 5" /> : null}
				{running ? <circle cx={cx} cy={204 + 118 - pressureAt('A', ct) * 96} r={7} fill="#2563eb" stroke="#fff" strokeWidth={2.5} /> : null}
				{running ? <circle cx={cx} cy={204 + 118 - pressureAt('B', ct) * 96} r={7} fill="#ea580c" stroke="#fff" strokeWidth={2.5} /> : null}
			</svg>
		</Interactive.Div>
	);
};

// 8 chapter ticks grouped as 설비 / 사이클 / 운전
export const ProgressTrack: React.FC<{t: number}> = ({t}) => (
	<div style={{position: 'absolute', left: 1120, top: 968, width: 720, fontFamily: KR}}>
		<div style={{display: 'flex', gap: 8}}>
			{CHAPTERS.map((c, i) => {
				const end = i < CHAPTERS.length - 1 ? CHAPTERS[i + 1].t : T_END;
				return (
					<div key={c.title} style={{flex: 1, height: 14, borderRadius: 999, border: `2.5px solid ${INK}`, backgroundColor: '#e6ebf1', overflow: 'hidden'}}>
						<div style={{width: `${pr(t, c.t, end) * 100}%`, height: '100%', backgroundColor: '#2563eb'}} />
					</div>
				);
			})}
		</div>
		<div style={{display: 'flex', marginTop: 10, fontSize: 26, fontWeight: 700, color: '#5d6876'}}>
			<div style={{flex: 1}}>설비</div>
			<div style={{flex: 6}}>사이클</div>
			<div style={{flex: 1}}>운전</div>
		</div>
	</div>
);

// Assembly snaps, valve pop-ins, and a valve "clack" at every step change of the slow cycle.
const SFX: [number, string, number][] = [
	[0.95, whoosh, 0.35], [1.45, uiSwitch, 0.9], [1.55, whoosh, 0.35], [2.05, uiSwitch, 0.9],
	...VALVES.map((v) => [v.t, mouseClick, 0.45] as [number, string, number]),
	...STEP_T0.map((s) => [WALK[0] + s, uiSwitch, 0.55] as [number, string, number]),
];
export const SoundEffects: React.FC = () => (
	<>
		{SFX.map(([time, src, volume]) => (
			<Sequence key={`${time}`} name="SFX" from={Math.round(time * 60)} durationInFrames={120} layout="none">
				<Audio src={src} volume={volume} />
			</Sequence>
		))}
	</>
);
