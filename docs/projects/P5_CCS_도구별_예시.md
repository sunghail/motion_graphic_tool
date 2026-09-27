# P5 같은 CCS를 도구별로 — Remotion · Manim · matplotlib · Blender

- 소스: [`projects/P5_ccs_tool_examples/`](../../projects/P5_ccs_tool_examples/) (원래 작업 폴더 이름: `06_CCS_도구별_예시`)
- 만든 날: 2026-09-24 (17:38–17:51)
- 요청: "각각의 도구마다 느낌이 다르잖아? 같은 CCS를 다른 도구로, 약간 예시 느낌으로 조금만."

## 결과 비교

| 폴더 | 도구 | 길이 | fps | 크기 | 느낌 | 잘 맞는 용도 |
|---|---|---|---|---|---|---|
| `01_Remotion` | Remotion (React + SVG) | 14.0 s (840 f) | 60 | 6.2 MiB | 평면 일러스트, 설명 패널, 장 구성. 교육·홍보 영상 | 공정 소개, 발표 영상 |
| `02_Manim` | Manim CE 0.21 | 17.4 s (522 f) | 30 | 0.8 MiB | 검은 배경에 선이 그려지고 반응식이 변형됨. 강의 영상 | 원리, 반응식, 개념 설명 |
| `03_matplotlib` | matplotlib 3.10.7 | 14.0 s (420 f) | 30 | 3.3 MiB | 흰 배경, 축·눈금·색 지도. 논문 그림이 움직이는 느낌 | 계산 결과 시각화, 프로파일·추세 |
| `04_Blender` | Blender 5.0 EEVEE | 9.0 s (270 f) | 30 | 1.9 MiB | 조명·유리 단면·빛나는 입자·카메라 회전. 제품 렌더 | 표지 영상, 설비 외관 |

모두 1920×1080이다. 소리는 Remotion 클립에만 있다(효과음).

### 직접 만들어 보며 느낀 점

- **Remotion**
  - 배치·글자·장 전환이 가장 자유롭다. 긴 설명 영상에 맞다.
  - 코드가 가장 많다. 대신 수정은 몇 줄로 끝난다.
- **Manim**
  - `Create`, `Transform`, `MoveAlongPath`처럼 동작 이름으로 장면을 적는다. 짧은 코드(77줄)로 금방 만든다.
  - 선이 그려지고 식이 바뀌는 연출이 강점이다.
  - 복잡한 설비 그림에는 맞지 않는다.
- **matplotlib**
  - 실제 계산 배열을 그대로 움직일 수 있다. **PSA 시뮬레이터 결과(압력·조성 프로파일)를 영상으로 만들 때 가장 쉽다.**
  - 꾸밈은 약하다.
- **Blender**
  - 재질·조명·그림자·빛 번짐으로 가장 실감 난다.
  - 글자 배치와 설명은 불편하다. 설명 영상에서는 다른 도구 화면과 섞어 쓰는 편이 낫다.
  - 렌더 시간이 가장 길다(270프레임에 3분 37초).

## 01 Remotion — 기존 영상 잘라내기

- P3 `out/ccs-capture-60fps.mp4`의 10–24 s를 잘라 냈다.
  ```bash
  "$FF" -y -ss 10 -to 24 -i ccs-capture-60fps.mp4 -c:v libx264 -crf 22 ccs_remotion.mp4
  ```
- 이 구간은 이야기 시각 약 12–26 s다. "흡수", "분자로 보면(흡수 반응)", "처리 가스 배출" 시작 부분이 들어 있다.
- 효과음 트랙이 함께 들어 있다(대부분 조용함).

## 02 Manim — `ccs_manim.py` (77줄)

**설정**
- `config.background_color = "#101418"`.
- 한글은 `Text(..., font="Malgun Gothic")`로 쓴다. LaTeX는 쓰지 않는다.
- `co2()`는 O=C=O를 원 3개로 만든다(C 회색 r 0.13, O 빨강 r 0.12).

**장면 순서** (누적 시각)

| 끝 s | 동작 | 내용 |
|---|---|---|
| 1.2 | `Write` | 제목 "CO₂ 포집 — Manim 예시" |
| 2.8 | `LaggedStart(Create ×3)` | 흡수탑(파랑 둥근 사각형), 재생탑(주황), 압축(노랑 사각형)이 그려짐 |
| 3.4 | `FadeIn` | 이름 "흡수탑", "재생탑", "압축" |
| 4.2 | `GrowArrow` | 배가스 화살표, "배가스" |
| 5.4 | `Create` | 곡선 화살표: 리치(흡수탑 아래 → 재생탑, 주황), 린(재생탑 위 → 흡수탑, 파랑) |
| 6.0 | `GrowArrow` | 재생탑 → 압축 (빨강) |
| 7.6 | `MoveAlongPath` | CO₂ 분자 3개가 배가스 화살표를 따라 들어옴 |
| 8.3 | `.animate` | 흡수탑 안에 쌓이며 주황으로 변함(잡힘) |
| 9.6 | `MoveAlongPath` | 리치 곡선을 따라 재생탑으로 |
| 10.3 | `.animate` | 재생탑 위로 나옴(떨어짐) |
| 11.1 | `MoveAlongPath` | 압축기로 |
| 11.6 | `.animate.scale(0.6)` | 압축기 안에 좁게 모임 |
| 12.8 | `Write` | "2 MEA + CO₂  →  MEA–COO⁻ + MEAH⁺" (노랑) |
| 14.4 | `Transform` | → "MEA–COO⁻ + MEAH⁺  →  2 MEA + CO₂   (열)" (주황) |
| 16.0 | `FadeOut(Group(...))` | 전부 사라짐 |
| 17.4 | `FadeIn` | "배가스 → 흡수 → 재생 → 압축" |

**실행**

```bash
.venv/Scripts/python -m manim -qh --fps 30 --disable_caching 02_Manim/ccs_manim.py CcsManim
# 결과: 02_Manim/media/videos/ccs_manim/1080p30/CcsManim.mp4 → 02_Manim/ccs_manim.mp4로 복사
```

- `.venv`는 `06_CCS_도구별_예시/` 바로 아래에 있다: Python 3.11.9, Manim 0.21.0, numpy 2.4.6.
- 고친 점:
  - 전체 페이드아웃에 `VGroup` 대신 `Group`을 써야 했다(TypeError).
  - 탑 이름·반응식·"압축" 글자가 겹쳐서 배치를 옮겼다.
- 남은 흔적: `gap = 0.0`은 쓰이지 않는다. `end`의 점(`Dot`)은 화면에 나오지 않는다.

## 03 matplotlib — `ccs_matplotlib.py` (157줄)

**설정**
- `matplotlib.use("Agg")`, 글꼴 "Malgun Gothic", `axes.unicode_minus=False`.
- ffmpeg 경로는 `imageio_ffmpeg.get_ffmpeg_exe()`다.

**예시 모델** (시각 t의 순수 함수, 값은 설명용)
- 입구 CO₂ 4.0 vol%, 포집률 0.9, `K = −ln(1−0.9)`.
- 가스 CO₂ 분포는 `Y_IN·exp(−K·z·a)`다. `a = smooth(ramp(t, 2, 5))`라서 2–5 s에 분포가 생긴다.
- 용액 로딩은 린 0.20에서 리치 0.45 mol/mol 사이를 가스 분포에 비례해 보간한다.

**화면** (16×9 in × dpi 120 = 1920×1080)
- 제목 "CO₂ 포집 (MEA 흡수) — matplotlib 예시", 부제 "예시값 · 흡수탑 CO₂ 분포와 용액 로딩".
- **왼쪽 도식**
  - 흡수탑·재생탑을 `imshow`(coolwarm, 로딩 0.20–0.45)로 칠하고 `FancyBboxPatch` 둥근 테두리를 둘렀다.
  - **`img.set_clip_path(box)`**로 색이 둥근 탑 밖으로 나가지 않게 했다.
  - 배관은 선으로, 라벨은 배가스·처리 가스·리치·린·"CO₂ → 압축"이다.
  - 색 막대 "용액 CO₂ 로딩 (mol/mol)", CO₂ 표시점(`scatter`)이 있다.
- **오른쪽 위**: "흡수탑 안 CO₂ 분포". 높이별 CO₂ 곡선과 실시간 글자 "출구 0.40% (포집률 90%)".
- **오른쪽 아래**: "용액 로딩: 리치(흡수탑 바닥) · 린(재생탑 바닥)". 시간 곡선 두 개다.
  - 린에는 5–8.5 s에 재생탑이 데워지는 동안의 작은 봉우리가 있다: `0.05·sin(π·ramp)`.
- **표시점**
  - 흡수탑: 60개가 1.5 s부터 오르다 각자의 잡힘 높이에서 사라진다.
  - 재생탑: 5.5 s부터 떨어진 CO₂가 오른다.

**저장**
- `FuncAnimation(frames=420)`.
- `FFMpegWriter(fps=30, bitrate=6000, codec="libx264", extra_args=["-pix_fmt","yuv420p"])`.

**실행**: `python 03_matplotlib/ccs_matplotlib.py` (시스템 Python: matplotlib 3.10.7, numpy 1.26.2, imageio-ffmpeg 0.6.0)

**고친 점**
- 린 곡선이 5 s에서 튀어서 부드러운 봉우리 식으로 바꿨다.
- 색이 둥근 테두리 밖으로 삐져나와 clip을 넣었다.

## 04 Blender — `ccs_blender.py` (322줄)

**설정**
- 30fps, 9 s(270 f), 1920×1080.
- 엔진은 `"BLENDER_EEVEE"`를 먼저 시도하고 안 되면 `"BLENDER_EEVEE_NEXT"`를 쓴다. 4.x와 5.x 이름이 달라서다.
- 옵션: `taa_render_samples=48`, 레이트레이싱, 그림자(`hasattr`로 있을 때만).
- 색 관리: AgX + "AgX - Medium High Contrast"(있을 때).
- 결과: PNG → `frames/f_####.png` → ffmpeg로 MP4.
- 무작위 대신 `h1(i)` 해시를 쓴다.

**장면**
- 월드: 어두운 남색 (0.035, 0.045, 0.07). 바닥은 어두운 반광택 판(400×400)이다.
- **재질**: `mat()` 함수가 Principled BSDF를 **`n.type == "BSDF_PRINCIPLED"`로 찾는다**. UI가 한국어라 노드 이름도 한국어이기 때문이다.
  - 구조 재질: 강철, 짙은 금속, 유리(투명도 0.18)
  - 충전물: 반투명(0.55) 파랑·갈색
  - 배관: 리치 주황, 린 파랑, 가스 회색
  - 발광: CO₂(세기 25), 용액(10), 열(8), 글자(2)
- **흡수탑** x −2.4, r 0.8, 높이 0.9–6.4 / **재생탑** x 2.4, r 0.65, 높이 1.2–5.6.
  - 유리 원통 껍데기(단면처럼 보임), 강철 경판(구를 납작하게)·플랜지 고리
  - 반투명 충전층 2개, 분배판 2개, 다리 4개
- **배관**: 커브 객체에 `bevel_depth`를 줘 둥근 관으로 만들었다. 배가스, 처리 가스, 리치, 린, CO₂ → 압축 순이다.
- **기타 설비**: 열교환기 상자, 받침대 위의 압축기 상자, 리보일러 원통(안쪽 발광 원통).
- **3D 글자**: `malgunbd.ttf`로 만든 글자 객체 "흡수탑", "재생탑", "압축", "배가스". X축으로 90° 세웠다.
- **조명**: 태양광 1.2와 면광원 3개(700/500/900 W, 차가운색·따뜻한색).
- **입자** (`keyed(o, fn, step=2)`: t의 함수로 2프레임마다 위치·크기 키프레임)
  - 흡수탑 CO₂ 46개: 오르다 각자의 잡힘 높이에서 줄어들며 사라진다. 잡힘 높이는 아래로 치우친다.
  - 흡수탑 용액 방울 40개: 청록 발광, 떨어진다.
  - 재생탑 CO₂ 36개: 1.5–3.5 s에 나타나서 올라 모이고, 압축 배관을 따라 이동한 뒤 사라진다.
- **카메라**: 렌즈 26 mm, 피사계 심도 f/5.6, 초점 19. 목표 (1.6, 0, 3.9) 주위를 −118°에서 −68°로 돌며, 거리는 21에서 18로 다가간다.
- **빛 번짐(bloom)** `add_bloom()`
  - Blender 5는 `scene.compositing_node_group`에 새 `CompositorNodeTree`를 넣고, Render Layers → Glare → `NodeGroupOutput`으로 잇는다.
  - 옛 버전은 `scene.use_nodes` + `Composite`를 쓴다.
  - Glare는 옛 속성(`glare_type` 등)과 Blender 5의 입력 소켓(`Type`, `Threshold`, `Size`, `Strength`)을 모두 설정한다.
  - 로그에 "bloom ok"가 찍혔다.
- `ccs_blender.blend`를 저장한 뒤 렌더한다. 환경변수 `CCS_STILL=150`을 주면 150프레임 한 장만 `still.png`로 만든다.

**실행**

```bash
CCS_STILL=150 "C:/Program Files/Blender Foundation/Blender 5.0/blender.exe" -b -P 04_Blender/ccs_blender.py   # 확인용 한 장
"C:/Program Files/Blender Foundation/Blender 5.0/blender.exe" -b -P 04_Blender/ccs_blender.py > render.log 2>&1
"$FF" -framerate 30 -i 04_Blender/frames/f_%04d.png -c:v libx264 -crf 20 -pix_fmt yuv420p 04_Blender/ccs_blender.mp4
```

- 렌더 시간: 270프레임에 3분 37초, 프레임당 약 0.8 s(`render.log`).
- 로그의 `World.use_nodes`와 `Material.use_nodes` 경고는 Blender 6.0에서 제거 예정이라는 뜻이다.

**고친 점**
- 노드 이름 KeyError가 나서 type으로 찾게 했다.
- 첫 시험 렌더가 너무 밝아 발광이 묻혔다. 배경을 어둡게 하고, 발광 세기를 올리고, bloom을 넣었다.
- 카메라를 뒤로 빼 압축기까지 화면에 담고, 떠 있던 압축기에 받침대를 달았다.

**남은 점**
- 3D 글자가 한 방향(−Y)만 보고 있어서 카메라가 돌면 끝부분에서 비스듬해진다.
- 마지막 구도에서 설비가 화면 왼쪽으로 쏠린다.
- 정식으로 쓸 거라면 글자를 카메라 쪽으로 돌게 하고(Track To 제약) 회전 폭을 줄이면 된다.

## 파일 정리 메모

| 항목 | 크기 | 지워도 되나 |
|---|---|---|
| `.venv/` | 약 383 MB | Manim을 다시 쓸 거면 유지 |
| `04_Blender/frames/` | PNG 270장, 약 558 MB | MP4가 있으니 지워도 됨(스크립트로 다시 만들 수 있음) |
| `04_Blender/ccs_blender.blend`, `.blend1` | 각 약 0.8 MB | `.blend1`은 자동 백업 |
| `02_Manim/media/` | 캐시 | 지워도 다시 만들어짐 |
