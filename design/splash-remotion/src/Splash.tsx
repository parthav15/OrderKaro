import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";

const { fontFamily } = loadFont();

const H = 2532;
const BG = "#141110";
const GOLD = "#D9B24A";
const REST_FONT = 144;
const REST_TOP = 219;
const BLOCK_H = 156;
const BIG = 4.2;
const ASSEMBLE_TOP = H / 2 - (BLOCK_H * BIG) / 2;

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Splash = () => {
  const frame = useCurrentFrame();

  const vOpacity = interpolate(frame, [6, 30], [0, 1], clamp);
  const vY = interpolate(frame, [6, 30], [64, 0], { ...clamp, easing: ease });
  const mOpacity = interpolate(frame, [24, 48], [0, 1], clamp);
  const mY = interpolate(frame, [24, 48], [64, 0], { ...clamp, easing: ease });

  const sc = interpolate(frame, [54, 84], [BIG, 1], { ...clamp, easing: ease });
  const topY = interpolate(frame, [54, 84], [ASSEMBLE_TOP, REST_TOP], { ...clamp, easing: ease });

  const glyph = {
    fontFamily,
    fontWeight: 700,
    fontSize: REST_FONT,
    lineHeight: `${BLOCK_H}px`,
    color: GOLD,
    display: "inline-block",
  } as const;

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          transform: `translateY(${topY}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", transformOrigin: "top center", transform: `scale(${sc})` }}>
          <span style={{ ...glyph, opacity: vOpacity, transform: `translateY(${vY}px)` }}>V</span>
          <span style={{ ...glyph, opacity: mOpacity, transform: `translateY(${mY}px)` }}>M</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
