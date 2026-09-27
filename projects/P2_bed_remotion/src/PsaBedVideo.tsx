import React from 'react';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {BedStory} from './scenes/BedStory';
import {Intro} from './scenes/Intro';
import {Outro} from './scenes/Outro';

// Intro (3.5 s) → story (50 s) → outro (5.5 s), crossfaded.
export const PsaBedVideo: React.FC = () => (
	<TransitionSeries>
		<TransitionSeries.Sequence durationInFrames={210} name="Intro">
			<Intro />
		</TransitionSeries.Sequence>
		<TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 30})} />
		<TransitionSeries.Sequence durationInFrames={3000} name="BedStory">
			<BedStory />
		</TransitionSeries.Sequence>
		<TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 36})} />
		<TransitionSeries.Sequence durationInFrames={330} name="Outro">
			<Outro />
		</TransitionSeries.Sequence>
	</TransitionSeries>
);
