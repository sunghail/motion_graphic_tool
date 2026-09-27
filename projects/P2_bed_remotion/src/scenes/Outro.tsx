import React from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {KR} from '../fonts';
import {LAYERS} from '../sim';

// Summary card: the finished layer stack, top to bottom.
export const Outro: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const rows = [...LAYERS].reverse();
	return (
		<AbsoluteFill style={{backgroundColor: '#f8fafc', fontFamily: KR, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 90}}>
			<div>
				<Interactive.Div
					name="Outro title"
					style={{
						fontSize: 130,
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
					BED A 완성
				</Interactive.Div>
				<Interactive.Div
					name="Outro subtitle"
					style={{
						marginTop: 20,
						fontSize: 52,
						fontWeight: 700,
						color: '#2563eb',
						opacity: interpolate(frame, [0.4 * fps, 0.8 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
					}}
				>
					원료 ↑ 아래에서 · H₂ ↑ 위로
				</Interactive.Div>
			</div>
			<div style={{width: 760, border: '4px solid #27313d', borderRadius: 36, boxShadow: '12px 12px 0 #27313d', backgroundColor: '#ffffff', overflow: 'hidden'}}>
				{rows.map((L, i) => (
					<div
						key={L.key}
						style={{
							display: 'flex', alignItems: 'center', gap: 26, padding: '0 36px', height: 124,
							borderTop: i ? '3px solid #27313d' : 'none',
							backgroundColor: i % 2 ? '#ffffff' : '#f7f9fb',
							opacity: interpolate(frame, [(0.3 + i * 0.15) * fps, (0.6 + i * 0.15) * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
							translate: interpolate(frame, [(0.3 + i * 0.15) * fps, (0.9 + i * 0.15) * fps], ['60px 0px', '0px 0px'], {
								easing: Easing.spring({damping: 200}),
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
							}),
						}}
					>
						<div style={{width: 58, height: 58, borderRadius: 999, backgroundColor: L.base, border: '4px solid #27313d', flex: 'none'}} />
						<div>
							<div style={{fontSize: 48, fontWeight: 900, color: '#18212c', lineHeight: 1.15}}>{L.name}</div>
							<div style={{fontSize: 34, fontWeight: 500, color: '#566170'}}>{L.role}</div>
						</div>
					</div>
				))}
			</div>
		</AbsoluteFill>
	);
};
