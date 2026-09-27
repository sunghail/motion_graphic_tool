import React from 'react';
import {Composition, Folder} from 'remotion';
import {CcsVideo} from './CcsVideo';
import {CcsStory} from './scenes/CcsStory';
import {Intro} from './scenes/Intro';
import {Outro} from './scenes/Outro';

export const RemotionRoot: React.FC = () => (
	<>
		<Folder name="Ccs-Scenes">
			<Composition id="Intro" component={Intro} durationInFrames={210} fps={60} width={1920} height={1080} />
			<Composition id="CcsStory" component={CcsStory} durationInFrames={3540} fps={60} width={1920} height={1080} />
			<Composition id="Outro" component={Outro} durationInFrames={330} fps={60} width={1920} height={1080} />
		</Folder>
		<Composition id="CcsCapture" component={CcsVideo} durationInFrames={4014} fps={60} width={1920} height={1080} />
	</>
);
