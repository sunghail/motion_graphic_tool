import React from 'react';
import {Composition, Folder} from 'remotion';
import {PsaBedVideo} from './PsaBedVideo';
import {BedStory} from './scenes/BedStory';
import {Intro} from './scenes/Intro';
import {Outro} from './scenes/Outro';

export const RemotionRoot: React.FC = () => (
	<>
		<Folder name="PsaBed-Scenes">
			<Composition id="Intro" component={Intro} durationInFrames={210} fps={60} width={1920} height={1080} />
			<Composition id="BedStory" component={BedStory} durationInFrames={3000} fps={60} width={1920} height={1080} />
			<Composition id="Outro" component={Outro} durationInFrames={330} fps={60} width={1920} height={1080} />
		</Folder>
		<Composition id="PsaBed" component={PsaBedVideo} durationInFrames={3474} fps={60} width={1920} height={1080} />
	</>
);
