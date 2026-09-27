import React from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {KR} from '../fonts';
import {INK, MOLC, h1} from '../sim';

// Title card with CO₂ molecules drifting up behind it.
export const Intro: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	return (
		<AbsoluteFill style={{backgroundColor: '#f8fafc', fontFamily: KR, justifyContent: 'center', alignItems: 'center'}}>
			<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
				{Array.from({length: 34}, (_, i) => {
					const x = h1(i * 3.1) * width, y = height + 60 - ((t * (60 + 60 * h1(i * 5.3)) + h1(i * 7.7) * height) % (height + 120));
					const rot = t * 30 * (h1(i) - 0.5) + h1(i * 2) * 180;
					return (
						<g key={i} opacity={0.35} transform={`translate(${x} ${y}) rotate(${rot})`}>
							<line x1={-26} y1={0} x2={26} y2={0} stroke={INK} strokeWidth={5} />
							<circle cx={-26} r={13} fill={MOLC.CO2} stroke={INK} strokeWidth={3} />
							<circle cx={26} r={13} fill={MOLC.CO2} stroke={INK} strokeWidth={3} />
							<circle r={12} fill="#4b5563" stroke={INK} strokeWidth={3} />
						</g>
					);
				})}
			</svg>
			<Interactive.Div
				name="Intro card"
				style={{
					backgroundColor: '#ffffff',
					border: '4px solid #27313d',
					borderRadius: 40,
					boxShadow: '12px 12px 0 #27313d',
					padding: '64px 96px',
					textAlign: 'center',
					scale: interpolate(frame, [0, 0.7 * fps], [0.7, 1], {
						easing: Easing.spring({damping: 11}),
						output: 'perceptual-scale',
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					}),
					opacity: interpolate(frame, [0, 0.25 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
				}}
			>
				<Interactive.Div name="Intro title" style={{fontSize: 150, fontWeight: 900, color: '#18212c', letterSpacing: '-0.03em', lineHeight: 1.1}}>
					CO₂ 포집
				</Interactive.Div>
				<Interactive.Div
					name="Intro subtitle"
					style={{
						marginTop: 18,
						fontSize: 62,
						fontWeight: 700,
						color: '#2563eb',
						opacity: interpolate(frame, [0.4 * fps, 0.8 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
						translate: interpolate(frame, [0.4 * fps, 1 * fps], ['0px 30px', '0px 0px'], {
							easing: Easing.spring({damping: 200}),
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						}),
					}}
				>
					LNG 복합발전 배가스에서 CO₂를 잡아 압축하기까지
				</Interactive.Div>
				<Interactive.Div
					name="Intro note"
					style={{
						marginTop: 34,
						fontSize: 40,
						fontWeight: 500,
						color: '#5d6876',
						opacity: interpolate(frame, [0.9 * fps, 1.3 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
					}}
				>
					MEA 흡수 공정 예시
				</Interactive.Div>
			</Interactive.Div>
		</AbsoluteFill>
	);
};
