"""CCS absorption example in the 'engineering plot' style (matplotlib FuncAnimation → MP4).

Left: absorber / stripper schematic coloured by solvent CO2 loading, with CO2 markers.
Right: gas-phase CO2 along the absorber height and the lean/rich loading over time.
All numbers are illustrative (example values), not model results.
"""
from pathlib import Path

import imageio_ffmpeg
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib import animation, patches

plt.rcParams.update({
    "font.family": "Malgun Gothic",
    "axes.unicode_minus": False,
    "animation.ffmpeg_path": imageio_ffmpeg.get_ffmpeg_exe(),
    "axes.grid": True,
    "grid.alpha": 0.3,
})

FPS, DUR = 30, 14.0
N = int(FPS * DUR)
Y_IN, CAPTURE = 4.0, 0.9                 # flue-gas CO2 [vol%], capture fraction (example)
K = -np.log(1 - CAPTURE)                 # so that y_out = (1 - capture) * y_in
A_LEAN, A_RICH = 0.20, 0.45              # MEA loading [mol CO2 / mol MEA] (example)
z = np.linspace(0, 1, 120)               # absorber height, 0 = bottom
rng = np.random.default_rng(3)


def ramp(t, a, b):
    return float(np.clip((t - a) / (b - a), 0, 1))


def smooth(u):
    return u * u * (3 - 2 * u)


def gas_profile(t):
    a = smooth(ramp(t, 2.0, 5.0))        # solvent reaches the packing → profile develops
    return Y_IN * np.exp(-K * z * a)


def loading_profile(t):
    y = gas_profile(t)
    y_out = y[-1]
    frac = (y - y_out) / max(Y_IN - y_out, 1e-9)
    return A_LEAN + (A_RICH - A_LEAN) * frac * smooth(ramp(t, 2.0, 5.0))


fig = plt.figure(figsize=(16, 9), dpi=120, facecolor="white")
gs = fig.add_gridspec(2, 2, width_ratios=[1.15, 1], left=0.04, right=0.97, top=0.88, bottom=0.08, wspace=0.18, hspace=0.38)
ax_s = fig.add_subplot(gs[:, 0])
ax_y = fig.add_subplot(gs[0, 1])
ax_a = fig.add_subplot(gs[1, 1])
title = fig.suptitle("CO₂ 포집 (MEA 흡수) — matplotlib 예시", fontsize=26, fontweight="bold", x=0.04, ha="left")
sub = fig.text(0.04, 0.905, "예시값 · 흡수탑 CO₂ 분포와 용액 로딩", fontsize=15, color="#555")

# ---- schematic ----
ax_s.set_xlim(0, 10)
ax_s.set_ylim(0, 10)
ax_s.set_aspect("equal")
ax_s.axis("off")
ABS = (1.6, 1.2, 1.6, 7.0)               # x, y, w, h
STR = (6.2, 2.2, 1.4, 5.6)
cmap = plt.get_cmap("coolwarm")
norm = matplotlib.colors.Normalize(A_LEAN, A_RICH)
abs_img = ax_s.imshow(np.zeros((120, 1)), extent=(ABS[0], ABS[0] + ABS[2], ABS[1], ABS[1] + ABS[3]), origin="lower", cmap=cmap, norm=norm, aspect="auto", zorder=1)
str_img = ax_s.imshow(np.zeros((120, 1)), extent=(STR[0], STR[0] + STR[2], STR[1], STR[1] + STR[3]), origin="lower", cmap=cmap, norm=norm, aspect="auto", zorder=1)
for (x, y, w, h), name, img in [(ABS, "흡수탑", abs_img), (STR, "재생탑", str_img)]:
    box = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0,rounding_size=0.5", fill=False, lw=3, ec="#222", zorder=3)
    ax_s.add_patch(box)
    img.set_clip_path(box)  # keep the colour field inside the rounded vessel
    ax_s.text(x + w / 2, y + h + 0.35, name, ha="center", fontsize=18, fontweight="bold")
# piping
kw = dict(lw=3, color="#666", zorder=2, solid_capstyle="round")
ax_s.plot([0.2, ABS[0]], [1.8, 1.8], **kw)                                      # flue gas in
ax_s.plot([ABS[0] + ABS[2] / 2] * 2, [ABS[1] + ABS[3], 9.6], **kw)              # treated gas out
ax_s.plot([ABS[0] + ABS[2] / 2, ABS[0] + ABS[2] / 2, 4.6, 4.6, STR[0]], [ABS[1], 0.6, 0.6, 7.2, 7.2], **kw)   # rich
ax_s.plot([STR[0] + STR[2] / 2, STR[0] + STR[2] / 2, 5.4, 5.4, ABS[0] + ABS[2]], [STR[1], 1.2, 1.2, 7.6, 7.6], **kw)  # lean
ax_s.plot([STR[0] + STR[2] / 2] * 2 + [9.6], [STR[1] + STR[3], 9.0, 9.0], **kw)                               # CO2 to compression
ax_s.text(0.2, 2.1, "배가스", fontsize=14)
ax_s.text(ABS[0] + ABS[2] / 2 + 0.15, 9.3, "처리 가스", fontsize=14)
ax_s.text(4.7, 4.0, "리치", fontsize=13, color="#b2182b", rotation=90)
ax_s.text(5.5, 4.0, "린", fontsize=13, color="#2166ac", rotation=90)
ax_s.text(8.4, 9.25, "CO₂ → 압축", fontsize=14, color="#b2182b", fontweight="bold")
cb = fig.colorbar(abs_img, ax=ax_s, fraction=0.03, pad=0.01)
cb.set_label("용액 CO₂ 로딩 (mol/mol)", fontsize=12)
gas_sc = ax_s.scatter([], [], s=34, c="#d62728", ec="white", lw=0.8, zorder=5)
co2_sc = ax_s.scatter([], [], s=34, c="#d62728", ec="white", lw=0.8, zorder=5)

# ---- right: profiles ----
ax_y.set_xlim(0, Y_IN * 1.1)
ax_y.set_ylim(0, 1)
ax_y.set_xlabel("가스 중 CO₂ (vol%)", fontsize=13)
ax_y.set_ylabel("흡수탑 높이 (바닥 → 꼭대기)", fontsize=13)
ax_y.set_title("흡수탑 안 CO₂ 분포", fontsize=16, fontweight="bold", loc="left")
(line_y,) = ax_y.plot([], [], lw=3.5, color="#d62728")
out_txt = ax_y.text(0.97, 0.9, "", transform=ax_y.transAxes, ha="right", fontsize=14)

ax_a.set_xlim(0, DUR)
ax_a.set_ylim(0.1, 0.55)
ax_a.set_xlabel("시간 (s)", fontsize=13)
ax_a.set_ylabel("로딩 (mol/mol)", fontsize=13)
ax_a.set_title("용액 로딩: 리치(흡수탑 바닥) · 린(재생탑 바닥)", fontsize=16, fontweight="bold", loc="left")
(line_r,) = ax_a.plot([], [], lw=3.5, color="#b2182b", label="리치")
(line_l,) = ax_a.plot([], [], lw=3.5, color="#2166ac", label="린")
ax_a.legend(loc="lower right", fontsize=12)
T_HIST = np.linspace(0, DUR, N)

# CO2 markers: rise in the absorber until caught; released ones rise in the stripper
M = 60
m_x = ABS[0] + 0.25 + rng.random(M) * (ABS[2] - 0.5)
m_phase = rng.random(M)
m_catch = np.clip(-np.log(1 - rng.random(M) * 0.95) / K, 0, 1.2)   # catch height (fraction of column)
s_x = STR[0] + 0.25 + rng.random(M) * (STR[2] - 0.5)
s_phase = rng.random(M)


def frame(i):
    t = i / FPS
    title.set_alpha(1)
    y = gas_profile(t)
    a = loading_profile(t)
    abs_img.set_data(a[:, None])
    reg = smooth(ramp(t, 5.0, 7.5))
    str_img.set_data((A_RICH - (A_RICH - A_LEAN) * reg * z[::-1] ** 0.6)[:, None] if t > 5 else np.full((120, 1), A_LEAN))
    line_y.set_data(y, z)
    out_txt.set_text(f"출구 {y[-1]:.2f}%  (포집률 {100 * (1 - y[-1] / Y_IN):.0f}%)")
    hist = T_HIST[: i + 1]
    rich = np.array([loading_profile(s)[0] for s in hist])
    # lean solvent: fresh at start, a small bump while the stripper warms up, then back to the lean loading
    lean = np.array([A_LEAN + 0.05 * np.sin(np.pi * ramp(s, 5.0, 8.5)) for s in hist])
    line_r.set_data(hist, rich)
    line_l.set_data(hist, lean)
    # absorber markers (appear once gas flows)
    if t > 1.5:
        h = ((t * 0.12 + m_phase) % 1.0)
        a_on = smooth(ramp(t, 2.0, 5.0))
        vis = h < np.where(a_on > 0.2, m_catch / 1.2, 1.0)
        gas_sc.set_offsets(np.c_[m_x[vis], ABS[1] + h[vis] * ABS[3]])
    # stripper markers (released CO2 rising to the top)
    if t > 5.5:
        h = ((t * 0.15 + s_phase) % 1.0)
        on = s_phase < smooth(ramp(t, 5.5, 8.0))
        co2_sc.set_offsets(np.c_[s_x[on], STR[1] + h[on] * STR[3]])
    return abs_img, str_img, line_y, line_r, line_l, gas_sc, co2_sc, out_txt


if __name__ == "__main__":
    out = Path(__file__).with_name("ccs_matplotlib.mp4")
    ani = animation.FuncAnimation(fig, frame, frames=N, interval=1000 / FPS, blit=False)
    ani.save(out, writer=animation.FFMpegWriter(fps=FPS, bitrate=6000, codec="libx264", extra_args=["-pix_fmt", "yuv420p"]))
    print("wrote", out)
