# 같은 CCS를 도구별로 (짧은 예시)

같은 내용(MEA 흡수 → 재생 → 압축)을 네 가지 도구로 10~17초씩 만들어 느낌을 비교한다.
수치와 입자 비율은 모두 보기 좋게 정한 예시값이다.

| 폴더 | 도구 | 길이 | 느낌 | 잘 맞는 용도 |
|---|---|---|---|---|
| `01_Remotion` | Remotion (React + SVG) | 14 s | 평면 일러스트 · 설명 패널 · 장 구성. 교육 영상·홍보 영상 | 공정 소개 영상, 발표 영상 |
| `02_Manim` | Manim CE 0.21 (Python) | 17 s | 검은 배경 · 도형이 그려지고 수식이 변형됨. 강의 느낌 | 원리·반응식·개념 설명 |
| `03_matplotlib` | matplotlib FuncAnimation (Python) | 14 s | 흰 배경 · 축과 눈금 · 색 지도. 논문/보고서 그림이 움직이는 느낌 | 계산 결과 시각화, 프로파일·추세 |
| `04_Blender` | Blender 5.0 (EEVEE, bpy 스크립트) | 9 s | 사실적 조명 · 유리 단면 · 빛나는 입자 · 카메라 회전. 제품 렌더 느낌 | 표지 영상, 설비 외관 |

`01_Remotion/ccs_remotion.mp4`는 P3(`../P3_ccs_remotion`) 결과 `out/ccs-capture-60fps.mp4`의 10~24초를 잘라낸 것이다.

이 저장소에서 결과 영상 4개는 `videos/P5_0*_ccs_*.mp4`에 있다. 01_Remotion 폴더는 영상뿐이라 넣지 않았다. `.venv`, `frames/`, `media/`도 넣지 않았다.

## 도구별 특징 (직접 만들어 보며 느낀 점)

- **Remotion**
  - 화면 배치·글자·장 전환이 가장 자유롭다.
  - 코드 양이 가장 많다. 대신 수정은 파일 몇 줄로 끝난다.
- **Manim**
  - `Create`, `Transform`, `MoveAlongPath` 같은 동작 이름으로 장면을 적는다.
  - 선이 그려지는 느낌이 강점이다.
  - 복잡한 설비 그림에는 맞지 않는다.
  - 한글은 `Text(..., font="Malgun Gothic")`로 쓴다(LaTeX 불필요).
- **matplotlib**
  - 실제 계산 결과(배열)를 그대로 움직일 수 있다. 시뮬레이터 결과를 붙이기 가장 쉽다.
  - 꾸밈 효과는 약하다.
- **Blender**
  - 재질·조명·그림자·빛 번짐(bloom)이 들어가 가장 실감 난다.
  - 렌더링 시간이 가장 길다(1920×1080 EEVEE, 이 PC에서 9초 영상 270프레임에 약 3분 40초, 프레임당 약 0.8초).
  - 글자 배치와 설명은 불편해서, 설명 영상에는 다른 도구로 만든 화면과 섞어 쓰는 편이 낫다.

## 실행

```bash
# 공통: 이 폴더의 .venv (Manim 포함) 또는 matplotlib·imageio-ffmpeg가 있는 Python
.venv/Scripts/python -m manim -qh --fps 30 02_Manim/ccs_manim.py CcsManim
python 03_matplotlib/ccs_matplotlib.py
"C:/Program Files/Blender Foundation/Blender 5.0/blender.exe" -b -P 04_Blender/ccs_blender.py   # PNG → 04_Blender/frames/
ffmpeg -framerate 30 -i 04_Blender/frames/f_%04d.png -c:v libx264 -crf 20 -pix_fmt yuv420p 04_Blender/ccs_blender.mp4
```

주의
- Blender UI가 한국어이면 노드 이름도 한국어가 되므로, 스크립트에서 노드를 이름이 아니라 종류(`type`)로 찾는다.
- `CCS_STILL=150`을 주면 Blender가 150프레임 한 장만 렌더링한다(점검용).
