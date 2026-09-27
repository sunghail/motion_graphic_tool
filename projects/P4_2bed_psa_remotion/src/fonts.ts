import {loadFont} from '@remotion/google-fonts/NotoSansKR';

// Korean glyphs come in ~100 unicode-range slices; three weights is enough for everything on screen.
export const {fontFamily: KR} = loadFont('normal', {
	weights: ['500', '700', '900'],
	subsets: ['korean', 'latin'],
	ignoreTooManyRequestsWarning: true,
});
