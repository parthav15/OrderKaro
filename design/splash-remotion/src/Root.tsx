import { Composition } from "remotion";
import { Splash } from "./Splash";

export const RemotionRoot = () => {
  return (
    <Composition
      id="Splash"
      component={Splash}
      durationInFrames={92}
      fps={30}
      width={1170}
      height={2532}
    />
  );
};
