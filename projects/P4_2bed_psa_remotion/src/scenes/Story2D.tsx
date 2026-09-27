import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Psa2D} from '../plant/Psa2D';
import {ChapterSeries, CycleChart, PanelBackdrop, ProgressTrack, SoundEffects} from './Panel';

// Flat 2D version: assembly → one slow 6-step cycle → continuous operation at 3×.
export const Story2D: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	return (
		<AbsoluteFill style={{backgroundColor: '#f8fafc'}}>
			<Psa2D t={t} width={width} height={height} />
			<PanelBackdrop />
			<ChapterSeries />
			<CycleChart t={t} />
			<ProgressTrack t={t} />
			<SoundEffects />
		</AbsoluteFill>
	);
};
