import React from 'react';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {Intro} from './scenes/Intro';
import {Outro} from './scenes/Outro';
import {Story2D} from './scenes/Story2D';
import {Story3D} from './scenes/Story3D';

// Intro (3.5 s) → story (57 s) → outro (5.5 s), crossfaded. Same timeline for both versions.
export const Video2D: React.FC = () => (
	<TransitionSeries>
		<TransitionSeries.Sequence durationInFrames={210} name="Intro"><Intro tag="2D" /></TransitionSeries.Sequence>
		<TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 30})} />
		<TransitionSeries.Sequence durationInFrames={3420} name="Story2D"><Story2D /></TransitionSeries.Sequence>
		<TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 36})} />
		<TransitionSeries.Sequence durationInFrames={330} name="Outro"><Outro /></TransitionSeries.Sequence>
	</TransitionSeries>
);
export const Video3D: React.FC = () => (
	<TransitionSeries>
		<TransitionSeries.Sequence durationInFrames={210} name="Intro"><Intro tag="3D" /></TransitionSeries.Sequence>
		<TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 30})} />
		<TransitionSeries.Sequence durationInFrames={3420} name="Story3D"><Story3D /></TransitionSeries.Sequence>
		<TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 36})} />
		<TransitionSeries.Sequence durationInFrames={330} name="Outro"><Outro /></TransitionSeries.Sequence>
	</TransitionSeries>
);
