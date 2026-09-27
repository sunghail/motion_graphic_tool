# motion_graphic_tool

공정(PSA·CCS) 설명용 모션그래픽 모음과 제작 기록.
만든 영상의 소스 코드, 만든 방법, 쓴 도구, 겪은 문제와 해결을 정리했다.

> 영상 속 수치·입자 비율·단계 시간은 **보기 좋게 정한 설명용 값**이며 공정 모델의 계산 결과가 아니다.

## 결과물

| # | 내용 | 도구 | 소스 | 영상 |
|---|---|---|---|---|
| P1 | PSA 흡착탑 조립·충전 (브라우저 재생, 52 s) | HTML + Canvas 2D | [projects/P1_bed_canvas](projects/P1_bed_canvas/) | `index.html`을 브라우저로 열기 |
| P2 | PSA 흡착탑 조립·충전 (57.9 s) | Remotion + SVG | [projects/P2_bed_remotion](projects/P2_bed_remotion/) | [videos/P2_psa-bed-60fps.mp4](videos/P2_psa-bed-60fps.mp4) |
| P3 | CCS: MEA CO₂ 흡수 → 재생 → 압축 (66.9 s) | Remotion + SVG | [projects/P3_ccs_remotion](projects/P3_ccs_remotion/) | 58.7 MiB라 저장소에 넣지 않음 (소스로 렌더링) |
| P4 | 2탑 PSA 6단계 사이클, 2D·3D (각 64.9 s) | Remotion + SVG / Three.js | [projects/P4_2bed_psa_remotion](projects/P4_2bed_psa_remotion/) | 2D: [videos/P4_psa-2bed-2d-60fps.mp4](videos/P4_psa-2bed-2d-60fps.mp4) · 3D는 49.3 MiB라 넣지 않음 |
| P5 | 같은 CCS를 4개 도구로 (9~17 s) | Remotion · Manim · matplotlib · Blender | [projects/P5_ccs_tool_examples](projects/P5_ccs_tool_examples/) | [01 Remotion](videos/P5_01_ccs_remotion.mp4) · [02 Manim](videos/P5_02_ccs_manim.mp4) · [03 matplotlib](videos/P5_03_ccs_matplotlib.mp4) · [04 Blender](videos/P5_04_ccs_blender.mp4) |

모든 영상은 1920×1080이다. P2~P4는 60fps, P5는 30fps(Remotion 클립만 60fps)다.

## 문서

| 문서 | 내용 |
|---|---|
| [docs/01_작업목록과_이력.md](docs/01_작업목록과_이력.md) | 만든 영상 목록, 날짜, 요청과 수정 이력, 정해진 표현 방향 |
| [docs/02_도구와_환경.md](docs/02_도구와_환경.md) | 도구·버전·설치, Remotion Agent Skills, Windows에서의 주의점 |
| [docs/03_제작원칙과_기법.md](docs/03_제작원칙과_기법.md) | 공통 설계 원칙과 애니메이션 기법(코드 위치 포함) |
| [docs/04_작업흐름_검증_렌더링.md](docs/04_작업흐름_검증_렌더링.md) | 작업 순서, 명령 모음, 오류와 해결, 확인 목록 |
| [docs/05_새작업_시작하기.md](docs/05_새작업_시작하기.md) | 새 모션그래픽 시작 절차와 뼈대 |
| [docs/projects/](docs/projects/) | 프로젝트별 상세 기록 (장면 문구, 데이터, 파일, 기법) |

## 실행

**Remotion (P2~P4)**: Node.js가 필요하다.

```bash
cd projects/P2_bed_remotion        # 또는 P3_ccs_remotion, P4_2bed_psa_remotion
npm install
npm run dev                        # Remotion Studio 미리보기
npm run render                     # out/*.mp4 (P4 3D는 npm run render3d)
```

- 렌더링할 때 Google Fonts(Noto Sans KR)와 remotion.media 효과음을 받아 오므로 인터넷이 필요하다.
- Remotion Agent Skills는 저장소에 넣지 않았다. 각 프로젝트의 `skills-lock.json`에 출처가 있다. 필요하면 프로젝트 폴더에서 설치한다:
  ```bash
  npx skills add remotion-dev/skills -a claude-code -s '*' -y --copy
  ```

**P5**: 명령은 [projects/P5_ccs_tool_examples/README.md](projects/P5_ccs_tool_examples/README.md)에 있다. 필요한 것은 Manim CE 0.21, matplotlib + imageio-ffmpeg, Blender 5.0이다.

## 라이선스 메모

- Remotion은 개인과 소규모 팀은 무료이고, 일정 규모 이상의 회사는 유료 라이선스가 필요하다([remotion.dev/license](https://remotion.dev/license)).
- 글꼴(Noto Sans KR)과 효과음은 각 제공처의 조건을 따른다.
