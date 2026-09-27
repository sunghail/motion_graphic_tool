# CO₂ 포집(CCS) — MEA 흡수 공정 Remotion 영상

[P2_bed_remotion](../P2_bed_remotion/)과 같은 형식(평면 2D, 오른쪽 설명 패널, 효과음)으로 만든 CCS 흡수 공정 영상.
LNG 복합발전 배가스 → MEA 흡수·재생 → CO₂ 압축까지. 1920×1080 · 60fps · 약 67초(4014프레임).

## 구성

| 장면 | 길이 | 내용 |
|---|---|---|
| Intro | 3.5 s | 제목 카드 |
| CcsStory | 59 s | 10장: 설비 조립 → 흡수 → 분자(흡수) → 처리 가스 배출 → 열 회수 → 탈거 → 분자(재생) → 용액 순환 → 수분 제거 → 압축 |
| Outro | 5.5 s | 배가스 → 흡수 → 재생 → 압축 요약 |

- 흡수탑: 배가스(분자 점)가 위로, MEA 용액(린 파랑 → 리치 주황)이 아래로 흐르며 CO₂ 점이 용액에 잡힘.
- 재생탑: 리보일러 스팀으로 가열, CO₂ 점이 용액에서 떨어져 올라가 응축기 → 환류 드럼 → 압축기 3단.
- 분자 장면: 확대 원 안에서 2 MEA + CO₂ → MEA–COO⁻ + MEAH⁺, 재생 때 열을 받아 역반응.
- 배가스 냉각 장은 뺐다. 이후 장의 시각을 그대로 두려고 이야기 시계가 7초에서 12초로 건너뛴다(`sim.ts`의 `SKIP_AT`·`SKIP`).
- 수치(농도·온도·압력)는 넣지 않았다. 점의 성분 비율은 보기 좋게 정한 것이며 실제 조성이 아니다.

## 실행

```bash
npm install
npm run dev        # Remotion Studio
npm run render     # out/ccs-capture-60fps.mp4 (동시 작업 4 — 이 PC에서 기본값은 브라우저가 멈춤)
```

## 파일

- `src/sim.ts` — 설비 위치, 배관 경로와 흐름 시작 시각, 카메라, 장 제목·설명.
- `src/plant/Plant.tsx` — 공정 설비 SVG(조립 애니메이션, 탑 내부 흐름, 배관 속 점).
- `src/plant/Zoom.tsx` — 분자 확대 장면.
- `src/scenes/` — CcsStory(패널·범례·효과음), Intro, Outro, ChapterCard.

Remotion Agent Skills는 이 폴더의 `.claude/skills/`에만 있다(03 폴더에서 복사, 전역 설치 없음).
