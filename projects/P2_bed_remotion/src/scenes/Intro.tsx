import React from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {KR} from '../fonts';
import {LAYERS, h1} from '../sim';

// Title card with a light rain of adsorbent beads behind it.
export const Intro: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const beads = Array.from({length: 70}, (_, i) => {
		const L = LAYERS[1 + (i % 3)];
		const x = h1(i * 3.1) * width, t0 = h1(i * 7.7) * 2.2 - 0.4, r = L.r * 2.6;
		const y = -40 + 0.5 * 1500 * Math.max(0, t - t0) ** 2;
		return {x, y, r, L, key: i};
	});
	return (
		<AbsoluteFill style={{backgroundColor: '#f8fafc', fontFamily: KR, justifyContent: 'center', alignItems: 'center'}}>
			<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
				{beads.map((b) =>
					b.y < height + 40 ? (
						<g key={b.key} opacity={0.5}>
							<circle cx={b.x} cy={b.y} r={b.r} fill={b.L.base} stroke="#27313d" strokeWidth={3} />
							<circle cx={b.x - b.r * 0.36} cy={b.y - b.r * 0.36} r={b.r * 0.28} fill={`rgba(255,255,255,${b.L.hi})`} />
						</g>
					) : null,
				)}
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
					PSA 흡착탑
				</Interactive.Div>
				<Interactive.Div
					name="Intro subtitle"
					style={{
						marginTop: 18,
						fontSize: 78,
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
					한 기가 만들어지기까지
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
					조립 → 충전 → 가스 흐름 · H₂ PSA 3층 충전 예시
				</Interactive.Div>
			</Interactive.Div>
		</AbsoluteFill>
	);
};
