"""CCS absorption example in the Manim (3Blue1Brown) style: dark canvas, shapes and equations that morph.

Render:  ..\\.venv\\Scripts\\python -m manim -qh --fps 30 ccs_manim.py CcsManim
"""
from manim import (
    BLUE, BLUE_E, DOWN, GREY_B, LEFT, ORANGE, RED, RIGHT, UP, WHITE, YELLOW, Arrow, Circle, Create, CurvedArrow, Dot,
    FadeIn, FadeOut, Group, GrowArrow, LaggedStart, MoveAlongPath, Rectangle, RoundedRectangle, Scene, Text, Transform,
    VGroup, Write, config, linear, rate_functions,
)

config.background_color = "#101418"
FONT = "Malgun Gothic"


def label(s, size=30, color=WHITE):
    return Text(s, font=FONT, font_size=size, color=color)


def co2(scale=1.0):
    """O=C=O as three balls."""
    c = Circle(0.13, color=GREY_B, fill_opacity=1, stroke_width=2)
    o1 = Circle(0.12, color=RED, fill_opacity=1, stroke_width=2).next_to(c, LEFT, buff=0.02)
    o2 = Circle(0.12, color=RED, fill_opacity=1, stroke_width=2).next_to(c, RIGHT, buff=0.02)
    return VGroup(o1, c, o2).scale(scale)


class CcsManim(Scene):
    def construct(self):
        title = label("CO₂ 포집 — Manim 예시", 44).to_edge(UP)
        self.play(Write(title), run_time=1.2)

        # --- process as blocks that draw themselves ---
        absorber = RoundedRectangle(corner_radius=0.35, width=1.5, height=3.8, color=BLUE, fill_opacity=0.15).shift(LEFT * 3.2 + DOWN * 0.1)
        stripper = RoundedRectangle(corner_radius=0.35, width=1.3, height=3.2, color=ORANGE, fill_opacity=0.15).shift(RIGHT * 1.2 + DOWN * 0.1)
        comp = Rectangle(width=1.4, height=0.9, color=YELLOW, fill_opacity=0.15).shift(RIGHT * 4.6 + UP * 1.3)
        names = VGroup(
            label("흡수탑", 28).move_to(absorber.get_center() + UP * 0.9),
            label("재생탑", 28).move_to(stripper.get_center() + UP * 0.7),
            label("압축", 26).next_to(comp, UP, buff=0.15),
        )
        self.play(LaggedStart(Create(absorber), Create(stripper), Create(comp), lag_ratio=0.3), run_time=1.6)
        self.play(FadeIn(names, shift=UP * 0.2), run_time=0.6)

        feed = Arrow(absorber.get_left() + LEFT * 2.0 + DOWN * 1.4, absorber.get_left() + DOWN * 1.4, buff=0, color=GREY_B)
        feed_t = label("배가스", 24, GREY_B).next_to(feed, UP, buff=0.1)
        rich = CurvedArrow(absorber.get_bottom() + RIGHT * 0.3, stripper.get_bottom() + LEFT * 0.3, angle=1.2, color=ORANGE)
        lean = CurvedArrow(stripper.get_top() + LEFT * 0.3, absorber.get_top() + RIGHT * 0.3, angle=1.1, color=BLUE)
        to_comp = Arrow(stripper.get_top() + RIGHT * 0.2, comp.get_left(), buff=0.1, color=RED)
        self.play(GrowArrow(feed), FadeIn(feed_t), run_time=0.8)
        self.play(Create(rich), Create(lean), run_time=1.2)
        self.play(GrowArrow(to_comp), run_time=0.6)

        # --- CO2 travels: in with the gas, carried by the rich solvent, released, compressed ---
        path_in = feed.copy()
        dots = [co2(0.9) for _ in range(3)]
        gap = 0.0
        for d in dots:
            d.move_to(feed.get_start())
        self.add(*dots)
        self.play(LaggedStart(*[MoveAlongPath(d, path_in, rate_func=linear) for d in dots], lag_ratio=0.5), run_time=1.6)
        self.play(*[d.animate.move_to(absorber.get_center() + DOWN * (1.2 - i * 0.6)).set_color(ORANGE) for i, d in enumerate(dots)], run_time=0.7)
        self.play(*[MoveAlongPath(d, rich, rate_func=rate_functions.smooth) for d in dots], run_time=1.3)
        self.play(*[d.animate.move_to(stripper.get_top() + UP * 0.3) for d in dots], run_time=0.7)
        self.play(*[MoveAlongPath(d, to_comp.copy(), rate_func=linear) for d in dots], run_time=0.8)
        self.play(*[d.animate.scale(0.6).move_to(comp.get_center() + RIGHT * (i - 1) * 0.28) for i, d in enumerate(dots)], run_time=0.5)

        # --- the chemistry: the equation morphs from absorption to regeneration ---
        eq1 = label("2 MEA + CO₂  →  MEA–COO⁻ + MEAH⁺", 34, YELLOW).to_edge(DOWN, buff=0.25)
        eq2 = label("MEA–COO⁻ + MEAH⁺  →  2 MEA + CO₂   (열)", 34, ORANGE).to_edge(DOWN, buff=0.25)
        self.play(Write(eq1), run_time=1.2)
        self.wait(0.6)
        self.play(Transform(eq1, eq2), run_time=1.0)
        self.wait(0.8)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.8)
        end = VGroup(label("배가스 → 흡수 → 재생 → 압축", 40), Dot(color=BLUE_E)).arrange(DOWN)
        self.play(FadeIn(end[0], shift=UP * 0.3), run_time=0.8)
        self.wait(0.6)
