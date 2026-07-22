import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";

const { fontFamily } = loadFont();

const BG = "#141110";
const GOLD = "#D9B24A";
const FONT = 600;

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Splash = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const vOpacity = interpolate(frame, [6, 30], [0, 1], clamp);
  const vY = interpolate(frame, [6, 30], [64, 0], { ...clamp, easing: ease });
  const mOpacity = interpolate(frame, [24, 48], [0, 1], clamp);
  const mY = interpolate(frame, [24, 48], [64, 0], { ...clamp, easing: ease });

  const settle =
    frame < 48
      ? 1.06
      : spring({ frame: frame - 48, fps, from: 1.06, to: 1, config: { damping: 16, stiffness: 120 } });

  const glyph = {
    fontFamily,
    fontWeight: 700,
    fontSize: FONT,
    lineHeight: `${FONT}px`,
    color: GOLD,
    display: "inline-block",
  } as const;

  return (
    <AbsoluteFill style={{ backgroundColor: BG, justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", transform: `scale(${settle})` }}>
        <span style={{ ...glyph, opacity: vOpacity, transform: `translateY(${vY}px)` }}>V</span>
        <span style={{ ...glyph, opacity: mOpacity, transform: `translateY(${mY}px)` }}>M</span>
      </div>
    </AbsoluteFill>
  );
};
