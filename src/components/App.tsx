"use client";

import { useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import CastCard from "./ui/CastCard";
import BottomInputBar from "./ui/BottomInputBar";
import { DEMO_LOCATION, DEMO_CHAT } from "./DummyData.js";
import { SystemChatBubble, UserChatBubble } from "./ui/ChatBubble";

// ------------------ TYPES ------------------

interface UserInfo {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  location: {
    placeId: string;
    description: string;
  };
}

interface CastInfo {
  hash: string;
  author: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
  };
  text: string;
  embeds?: string[];
}

interface ClientInfo {
  platformType: string;
  clientFid: number;
  added: boolean;
}

interface ContextInfo {
  user: UserInfo;
  cast: CastInfo;
  client: ClientInfo;
}

function App() {
  const [theContext, setContext] = useState<ContextInfo | null>(null);

  useEffect(() => {
    const checkContext = async () => {
      try {
        await sdk.actions.ready();
        const sdkContext = await (sdk as any).context;
        if (sdkContext?.location?.type === "cast_share") {
          console.log("sdkContext", sdkContext);
          const castLocation = sdkContext.location as any;
          console.log("castLocation", castLocation);
          setContext(castLocation);
        }
      } catch (_e) {
        // ignore SDK init errors and fall back to default UI
      }
    };
    checkContext();
  }, []);

  if (theContext != null) {
    return (
      <div className="min-h-[100dvh] pb-32 max-w-2xl mx-auto p-4">
        {location && <CastCard location={location} />}
        <h1>Cast from {theContext?.user.displayName}</h1>
        <p>cast {theContext?.cast.hash}</p>
        <p>cast author {theContext?.cast.author.displayName}</p>
        <BottomInputBar />
      </div>
    );
  }

  // Demo mode for local testing
  return (
    <div className="min-h-[100dvh] pb-32 max-w-2xl mx-auto p-4">
      <CastCard location={DEMO_LOCATION} />

      <h1>Cast from @{DEMO_LOCATION.cast.author.username}</h1>
      <p>Analyzing cast {DEMO_LOCATION.cast.hash}...</p>

      <div className="mt-6 flex flex-col gap-4">
        {DEMO_CHAT.map((m, idx) =>
          m.role === "user" ? (
            <UserChatBubble
              key={idx}
              name={m.name}
              text={m.text}
              avatarUrl={m.avatarUrl || ""}
            />
          ) : (
            <SystemChatBubble key={idx} text={m.text} />
          )
        )}
      </div>
      <BottomInputBar />
    </div>
  );
}

export default App;
