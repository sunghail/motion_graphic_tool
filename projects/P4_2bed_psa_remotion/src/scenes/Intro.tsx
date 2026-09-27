import React from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {KR} from '../fonts';
import {GASC, INK, h1} from '../sim';

// Title card with H₂ / impurity molecules drifting behind it.
export const Intro: React.FC<{tag: string}> = ({tag}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	return (
		<AbsoluteFill style={{backgroundColor: '#f8fafc', fontFamily: KR, justifyContent: 'center', alignItems: 'center'}}>
			<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
				{Array.from({length: 60}, (_, i) => {
					const x = h1(i * 3.1) * width, y = height + 40 - ((t * (50 + 70 * h1(i * 5.3)) + h1(i * 7.7) * height) % (height + 80));
					return <circle key={i} cx={x + 20 * Math.sin(t + i)} cy={y} r={h1(i * 2.2) < 0.3 ? 13 : 9} fill={h1(i * 2.2) < 0.3 ? GASC.IMP : GASC.H2} stroke={INK} strokeWidth={3} opacity={0.35} />;
				})}
			</svg>
			<Interactive.Div
				name="Intro card"
				style={{
					backgroundColor: '#ffffff', border: '4px solid #27313d', borderRadius: 40, boxShadow: '12px 12px 0 #27313d', padding: '64px 96px', textAlign: 'center',
					scale: interpolate(frame, [0, 0.7 * fps], [0.7, 1], {easing: Easing.spring({damping: 11}), output: 'perceptual-scale', extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
					opacity: interpolate(frame, [0, 0.25 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
				}}
			>
				<Interactive.Div name="Intro title" style={{fontSize: 150, fontWeight: 900, color: '#18212c', letterSpacing: '-0.03em', lineHeight: 1.1}}>
					2탑 PSA
				</Interactive.Div>
				<Interactive.Div
					name="Intro subtitle"
					style={{
						marginTop: 18, fontSize: 66, fontWeight: 700, color: '#2563eb',
						opacity: interpolate(frame, [0.4 * fps, 0.8 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
						translate: interpolate(frame, [0.4 * fps, 1 * fps], ['0px 30px', '0px 0px'], {easing: Easing.spring({damping: 200}), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
					}}
				>
					두 흡착탑이 번갈아 H₂를 만드는 원리
				</Interactive.Div>
				<Interactive.Div
					name="Intro note"
					style={{marginTop: 34, fontSize: 40, fontWeight: 500, color: '#5d6876', opacity: interpolate(frame, [0.9 * fps, 1.3 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}
				>
					압력 변동 흡착 · 6단계 사이클 예시 · {tag}
				</Interactive.Div>
			</Interactive.Div>
		</AbsoluteFill>
	);
};
