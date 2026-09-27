import React from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {KR} from '../fonts';
import {COL} from '../sim';

// Summary: the four stages of the line, left to right.
const STAGES: [string, string][] = [['배가스', COL.flue], ['흡수', COL.rich], ['재생', COL.lean], ['압축', COL.co2]];

export const Outro: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{backgroundColor: '#f8fafc', fontFamily: KR, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 80}}>
			<Interactive.Div
				name="Outro title"
				style={{
					fontSize: 140,
					fontWeight: 900,
					color: '#18212c',
					letterSpacing: '-0.03em',
					scale: interpolate(frame, [0, 0.6 * fps], [0.7, 1], {
						easing: Easing.spring({damping: 11}),
						output: 'perceptual-scale',
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					}),
					opacity: interpolate(frame, [0, 0.25 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
				}}
			>
				CO₂ 포집 완료
			</Interactive.Div>
			<div style={{display: 'flex', alignItems: 'center', gap: 28}}>
				{STAGES.map(([name, c], i) => (
					<React.Fragment key={name}>
						{i > 0 ? (
							<div style={{
								fontSize: 70, fontWeight: 900, color: '#27313d',
								opacity: interpolate(frame, [(0.45 + i * 0.2) * fps, (0.7 + i * 0.2) * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
							}}>→</div>
						) : null}
						<div style={{
							padding: '34px 52px', fontSize: 70, fontWeight: 900, color: '#18212c', backgroundColor: c,
							border: '4px solid #27313d', borderRadius: 30, boxShadow: '10px 10px 0 #27313d',
							opacity: interpolate(frame, [(0.3 + i * 0.2) * fps, (0.6 + i * 0.2) * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
							translate: interpolate(frame, [(0.3 + i * 0.2) * fps, (0.9 + i * 0.2) * fps], ['0px 50px', '0px 0px'], {
								easing: Easing.spring({damping: 200}),
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
							}),
						}}>{name}</div>
					</React.Fragment>
				))}
			</div>
		</AbsoluteFill>
	);
};
