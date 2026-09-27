# PSA Bed 조립·충전 — Remotion 영상판

[P1_bed_canvas](../P1_bed_canvas/)(브라우저 캔버스판)을 Remotion Agent Skills 규칙에 맞춰 영상용으로 다시 만든 것.
1920×1080 · 60fps · 약 58초(3474프레임).

## 구성

| 장면 | 길이 | 내용 |
|---|---|---|
| Intro | 3.5 s | 제목 카드, 배경에 흡착제 구슬 낙하 |
| BedStory | 50 s | 설계 도면 → 흡착탑 조립 → 점검 → 단면 → 톤백·호퍼 충전 5층 → 배관 → 가스 흐름 (12장). 가스 흐름에서는 각 성분이 자기 층 아래쪽부터 잡혀 잡힌 구간이 위로 차오름 |
| Outro | 5.5 s | 완성된 층 구성 요약 |

장면 사이는 `TransitionSeries` 페이드. 오른쪽 패널(장 제목·설명·층 쌓기 현황·성분 범례·진행 막대)은 영상용 큰 글자로 따로 두었다.
효과음: 부품이 날아올 때 whoosh, 끼워질 때 click, 수압시험 통과 ding (`@remotion/sfx`, 재생·렌더 때 remotion.media에서 받아옴).

## 실행

```bash
npm install
npm run dev        # Remotion Studio (타임라인에서 장면별 확인·수정)
npm run render     # out/psa-bed-60fps.mp4
```

Studio 왼쪽 목록의 `PsaBed-Scenes` 폴더에 Intro / BedStory / Outro가 따로 등록되어 있어 장면만 따로 볼 수 있다.

## 파일

- `src/sim.ts` — 형상·시간표·구슬 궤적(톤백 → 호퍼 더미 → 노즐 → 낙하 → 굴러 안착)·가스 분자. 모든 값이 시각 t의 순수 함수.
- `src/bed/BedWorld.tsx` — 탑 본체 SVG(평면 2D 스타일).
- `src/scenes/` — Intro, BedStory(패널·효과음 포함), ChapterCard, Outro.
- `src/PsaBedVideo.tsx`, `src/Root.tsx` — 장면 연결과 컴포지션 등록.

## Remotion Agent Skills (이 폴더 전용)

`npx skills add remotion-dev/skills -a claude-code -s '*' -y --copy`로 **이 폴더의 `.claude/skills/`에만** 설치했다(전역 `~/.claude/skills`에는 설치하지 않음). 목록은 `skills-lock.json`.
Claude Code를 이 폴더에서 열면 `remotion-*` 스킬이 잡힌다. 지우려면 이 폴더에서 `npx skills remove --all`.

## 주의

- 층 구성·성분별 흡착 위치는 H₂ PSA 3층 충전을 예로 든 설명용 그림이며 모델 결과와 연결되어 있지 않다.
- 글꼴(Noto Sans KR)은 Google Fonts에서, 효과음은 remotion.media에서 받아오므로 Studio·렌더 때 인터넷이 필요하다.
- Remotion은 개인·소규모 팀은 무료, 일정 규모 이상 회사는 유료 라이선스 대상이다(remotion.dev/license 확인).
