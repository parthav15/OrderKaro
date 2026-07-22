import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";

const { fontFamily } = loadFont();

const W = 1170;
const H = 2532;
const BG = "#141110";

const REST_LEFT = 72;
const REST_TOP = 219;
const REST_FONT = 144;
const BLOCK_W = 234;
const BLOCK_H = 156;
const BIG = 4.2;

const TX_BIG = W / 2 - (BLOCK_W * BIG) / 2 - REST_LEFT;
const TY_BIG = H / 2 - (BLOCK_H * BIG) / 2 - REST_TOP;

const ease = Easing.bezier(0.22, 1, 0.36, 1);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Splash = () => {
  const frame = useCurrentFrame();

  const vOpacity = interpolate(frame, [6, 28], [0, 1], clamp);
  const vY = interpolate(frame, [6, 28], [44, 0], { ...clamp, easing: ease });
  const mOpacity = interpolate(frame, [22, 44], [0, 1], clamp);
  const mY = interpolate(frame, [22, 44], [44, 0], { ...clamp, easing: ease });

  const sc = interpolate(frame, [52, 82], [BIG, 1], { ...clamp, easing: ease });
  const tx = interpolate(frame, [52, 82], [TX_BIG, 0], { ...clamp, easing: ease });
  const ty = interpolate(frame, [52, 82], [TY_BIG, 0], { ...clamp, easing: ease });

  const gold = {
    fontFamily,
    fontWeight: 700,
    fontSize: REST_FONT,
    lineHeight: `${BLOCK_H}px`,
    color: "#D9B24A",
    display: "inline-block",
  } as const;

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <div
        style={{
          position: "absolute",
          left: REST_LEFT,
          top: REST_TOP,
          transformOrigin: "top left",
          transform: `translate(${tx}px, ${ty}px) scale(${sc})`,
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <span style={{ ...gold, opacity: vOpacity, transform: `translateY(${vY}px)` }}>V</span>
        <span style={{ ...gold, opacity: mOpacity, transform: `translateY(${mY}px)` }}>M</span>
      </div>
    </AbsoluteFill>
  );
};
