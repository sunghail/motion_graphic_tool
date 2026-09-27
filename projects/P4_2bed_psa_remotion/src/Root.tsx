import React from 'react';
import {Composition, Folder} from 'remotion';
import {Video2D, Video3D} from './Video';
import {Story2D} from './scenes/Story2D';
import {Story3D} from './scenes/Story3D';

export const RemotionRoot: React.FC = () => (
	<>
		<Folder name="Psa2Bed-Scenes">
			<Composition id="Story2D" component={Story2D} durationInFrames={3420} fps={60} width={1920} height={1080} />
			<Composition id="Story3D" component={Story3D} durationInFrames={3420} fps={60} width={1920} height={1080} />
		</Folder>
		<Composition id="Psa2Bed" component={Video2D} durationInFrames={3894} fps={60} width={1920} height={1080} />
		<Composition id="Psa2Bed3D" component={Video3D} durationInFrames={3894} fps={60} width={1920} height={1080} />
	</>
);
