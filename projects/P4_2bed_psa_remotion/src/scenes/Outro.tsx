import React from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {KR} from '../fonts';
import {INK, MODE, STEPS} from '../sim';

// Summary: both beds' six steps side by side.
export const Outro: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{backgroundColor: '#f8fafc', fontFamily: KR, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 56}}>
			<Interactive.Div
				name="Outro title"
				style={{
					fontSize: 120, fontWeight: 900, color: '#18212c', letterSpacing: '-0.03em',
					scale: interpolate(frame, [0, 0.6 * fps], [0.7, 1], {easing: Easing.spring({damping: 11}), output: 'perceptual-scale', extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
					opacity: interpolate(frame, [0, 0.25 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
				}}
			>
				2탑 PSA 사이클
			</Interactive.Div>
			<div style={{display: 'flex', flexDirection: 'column', gap: 22}}>
				{(['A', 'B'] as const).map((bed, r) => (
					<div key={bed} style={{display: 'flex', alignItems: 'center', gap: 16}}>
						<div style={{width: 120, fontSize: 58, fontWeight: 900, color: '#18212c'}}>{bed}탑</div>
						{STEPS.map((s, i) => (
							<div
								key={i}
								style={{
									width: 200 * (s.dur / 7) + 60, height: 96, borderRadius: 22, border: `4px solid ${INK}`, boxShadow: `6px 6px 0 ${INK}`,
									backgroundColor: MODE[s[bed]].color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 900, color: '#18212c',
									opacity: interpolate(frame, [(0.3 + r * 0.2 + i * 0.1) * fps, (0.6 + r * 0.2 + i * 0.1) * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
									translate: interpolate(frame, [(0.3 + r * 0.2 + i * 0.1) * fps, (0.9 + r * 0.2 + i * 0.1) * fps], ['0px 40px', '0px 0px'], {easing: Easing.spring({damping: 200}), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
								}}
							>
								{MODE[s[bed]].name}
							</div>
						))}
					</div>
				))}
			</div>
			<Interactive.Div
				name="Outro note"
				style={{fontSize: 52, fontWeight: 700, color: '#2563eb', opacity: interpolate(frame, [1.6 * fps, 2 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}
			>
				한 탑이 흡착하는 동안 다른 탑은 재생됩니다
			</Interactive.Div>
		</AbsoluteFill>
	);
};
