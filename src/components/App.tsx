"use client";

import { useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";

function App() {
  const [sharedCast, setSharedCast] = useState<{
    author: { username: string };
    hash: string;
  } | null>(null);
  const [isShareContext, setIsShareContext] = useState(false);

  useEffect(() => {
    const checkContext = async () => {
      try {
        await sdk.actions.ready();
        const sdkContext = await (sdk as any).context;
        if (sdkContext?.location?.type === "cast_share") {
          console.log("sdkContext", sdkContext);
          setIsShareContext(true);
          const castLocation = sdkContext.location as any;
          console.log("castLocation", castLocation);
          if (castLocation?.cast) {
            console.log("castLocation.cast", castLocation.cast);
            setSharedCast(castLocation.cast);
            return;
          }
        }
      } catch (_e) {
        // ignore SDK init errors and fall back to default UI
      }
    };
    checkContext();
  }, []);

  if (isShareContext && sharedCast) {
    return (
      <div>
        <h1>Cast from @{sharedCast.author.username}</h1>
        <p>Analyzing cast {sharedCast.hash}...</p>
      </div>
    );
  }

  return <div>{"Your regular app UI"}</div>;
}

export default App;
