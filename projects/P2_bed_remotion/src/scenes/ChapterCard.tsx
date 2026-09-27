import React from 'react';
import {Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {KR} from '../fonts';

// One chapter's text. Lives inside a <Series.Sequence>, so frame 0 = chapter start.
export const ChapterCard: React.FC<{step: number; group: string; title: string; desc: string}> = ({step, group, title, desc}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<div style={{position: 'absolute', left: 1120, top: 96, width: 720, fontFamily: KR}}>
			<Interactive.Div
				name="Step label"
				style={{
					display: 'inline-block',
					fontSize: 30,
					fontWeight: 900,
					color: '#ffffff',
					backgroundColor: '#2563eb',
					border: '3px solid #27313d',
					borderRadius: 999,
					padding: '6px 22px',
					opacity: interpolate(frame, [0, 0.3 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
					scale: interpolate(frame, [0, 0.45 * fps], [0.6, 1], {
						easing: Easing.spring({damping: 12}),
						output: 'perceptual-scale',
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					}),
				}}
			>
				STEP {String(step).padStart(2, '0')} · {group}
			</Interactive.Div>
			<Interactive.Div
				name="Chapter title"
				style={{
					marginTop: 22,
					fontSize: 96,
					fontWeight: 900,
					lineHeight: 1.1,
					color: '#18212c',
					letterSpacing: '-0.02em',
					opacity: interpolate(frame, [0.05 * fps, 0.4 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
					translate: interpolate(frame, [0.05 * fps, 0.6 * fps], ['0px 48px', '0px 0px'], {
						easing: Easing.spring({damping: 200}),
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					}),
				}}
			>
				{title}
			</Interactive.Div>
			<Interactive.Div
				name="Chapter description"
				style={{
					marginTop: 26,
					fontSize: 50,
					fontWeight: 500,
					lineHeight: 1.38,
					color: '#3a4553',
					wordBreak: 'keep-all',
					opacity: interpolate(frame, [0.3 * fps, 0.8 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
					translate: interpolate(frame, [0.3 * fps, 0.9 * fps], ['0px 30px', '0px 0px'], {
						easing: Easing.spring({damping: 200}),
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					}),
				}}
			>
				{desc}
			</Interactive.Div>
		</div>
	);
};
