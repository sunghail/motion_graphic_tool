// 3D camera path and the world mapping shared by the 3D scene and its HTML labels.
import * as THREE from 'three';
import {Pt, clamp, eio, lerp} from '../sim';

// 2D world units → 3D metres-ish: x right, y down  →  X right, Y up (floor at Y = 0)
export const X = (x: number) => (x - 460) / 100;
export const Yw = (y: number) => (800 - y) / 100;
export const to3 = (p: Pt, z = 0): [number, number, number] => [X(p[0]), Yw(p[1]), z];

// [t, azimuth°, elevation°, distance, target x, target y]
const KEYS: [number, number, number, number, number, number][] = [
	[0, -40, 20, 25, 0.5, 3.5],
	[6.5, -22, 12, 20.8, 0.5, 3.9],
	[37, 14, 10, 20.2, 0.5, 3.9],
	[57, 28, 14, 21.2, 0.5, 3.9],
];
export const CAM_FOV = 28;
export function camPose(t: number, shakeY = 0) {
	let i = 0;
	while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++;
	const a = KEYS[i], b = KEYS[i + 1], u = eio(clamp((t - a[0]) / (b[0] - a[0])));
	const az = (lerp(a[1], b[1], u) * Math.PI) / 180, el = (lerp(a[2], b[2], u) * Math.PI) / 180, d = lerp(a[3], b[3], u);
	const target: [number, number, number] = [lerp(a[4], b[4], u), lerp(a[5], b[5], u) + shakeY, 0];
	const pos: [number, number, number] = [target[0] + d * Math.sin(az) * Math.cos(el), target[1] + d * Math.sin(el), d * Math.cos(az) * Math.cos(el)];
	return {pos, target};
}
// project a 3D point to pixels of the square canvas (size × size)
const cam = new THREE.PerspectiveCamera(CAM_FOV, 1, 0.1, 200);
export function project(t: number, p: [number, number, number], size: number, shakeY = 0): [number, number, boolean] {
	const {pos, target} = camPose(t, shakeY);
	cam.position.set(...pos);
	cam.lookAt(...target);
	cam.updateMatrixWorld();
	cam.updateProjectionMatrix();
	const v = new THREE.Vector3(...p).project(cam);
	return [((v.x + 1) / 2) * size, ((1 - v.y) / 2) * size, v.z < 1];
}
