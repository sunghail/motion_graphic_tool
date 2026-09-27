import React from 'react';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {CcsStory} from './scenes/CcsStory';
import {Intro} from './scenes/Intro';
import {Outro} from './scenes/Outro';

// Intro (3.5 s) → story (59 s) → outro (5.5 s), crossfaded.
export const CcsVideo: React.FC = () => (
	<TransitionSeries>
		<TransitionSeries.Sequence durationInFrames={210} name="Intro">
			<Intro />
		</TransitionSeries.Sequence>
		<TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 30})} />
		<TransitionSeries.Sequence durationInFrames={3540} name="CcsStory">
			<CcsStory />
		</TransitionSeries.Sequence>
		<TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 36})} />
		<TransitionSeries.Sequence durationInFrames={330} name="Outro">
			<Outro />
		</TransitionSeries.Sequence>
	</TransitionSeries>
);
