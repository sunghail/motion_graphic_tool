# 2탑 PSA — 2D / 3D Remotion 영상

흡착탑 두 기가 6단계 사이클을 번갈아 도는 2탑 PSA 설명 영상. 같은 사이클 로직으로 두 버전을 만든다.

| 버전 | 컴포지션 | 출력 |
|---|---|---|
| 평면 2D (03·04 영상과 같은 스타일) | `Psa2Bed` | `out/psa-2bed-2d-60fps.mp4` |
| 3D (Three.js, 실제 설비 형태) | `Psa2Bed3D` | `out/psa-2bed-3d-60fps.mp4` |

1920×1080 · 60fps · 약 65초(3894프레임).

## 구성

| 구간 | 내용 |
|---|---|
| Intro 3.5 s | 제목 카드 |
| 설비 0–7 s | 흡착탑 A·B 조립, 배관(원료·탈착 가스·제품 헤더, 균압/퍼지 라인), 밸브 V1–V7, 단면으로 내부 공개 |
| 사이클 7–37 s | 6단계를 한 단계씩: ① A 가압 / B 탈압 ② A 흡착 / B 퍼지 ③ 균압 A→B ④ A 탈압 / B 가압 ⑤ A 퍼지 / B 흡착 ⑥ 균압 B→A |
| 운전 37–57 s | 같은 사이클을 3배속으로 두 번 |
| Outro 5.5 s | A·B 단계 표 요약 |

화면에 나오는 것
- 단계마다 밸브 개폐(열림 초록, 조절 연두, 닫힘 회색/빨강), 배관 속 H₂(청록)·불순물(빨강) 흐름.
- 탑 안: 흡착제, 불순물이 잡힌 구간(빨간 음영, 흡착 때 올라가고 탈압·퍼지 때 내려감), 가스 입자.
- 탑 옆 압력계와 현재 단계 표시. 오른쪽 패널에 사이클 막대(A/B)와 압력 곡선이 실시간으로 그려진다.

## 사이클 가정 (설명용)

- 압력은 0(저압)–1(고압)로만 표시: 가압 0.5→1, 흡착 1, 균압↓ 1→0.5, 탈압 0.5→0, 퍼지 0, 균압↑ 0→0.5.
- 가압은 원료 가스로, 퍼지는 흡착 중인 탑의 제품 H₂ 일부로(V7 조절 개도) 한다.
- 단계 시간(4·7·4·4·7·4 s), 불순물 구간 높이, 입자 비율은 보기 좋게 정한 값이며 모델 결과가 아니다.

## 실행

```bash
npm install
npm run dev        # Remotion Studio (Psa2Bed, Psa2Bed3D, Psa2Bed-Scenes/Story2D·Story3D)
npm run render     # 2D
npm run render3d   # 3D (--gl=angle, 동시 작업 4)
```

## 파일

- `src/sim.ts` — 공통: 설비 배치, 밸브, 6단계 사이클(밸브 개도·압력·불순물 구간), 가스 입자 생성, 장 제목.
- `src/plant/Psa2D.tsx` — 2D 설비 SVG.
- `src/plant/Psa3D.tsx`, `src/plant/cam3d.ts` — 3D 장면(용기·배관·밸브 액추에이터·압력계·흡착제 인스턴스), 카메라 경로와 3D→화면 좌표 변환(HTML 라벨용).
- `src/scenes/Panel.tsx` — 공통 오른쪽 패널(장 카드, 사이클 차트, 진행 막대, 효과음).
- `src/scenes/Story2D.tsx`, `Story3D.tsx`, `Intro.tsx`, `Outro.tsx`, `src/Video.tsx`, `src/Root.tsx`.

Remotion Agent Skills는 이 폴더의 `.claude/skills/`에만 있다(전역 설치 없음).
