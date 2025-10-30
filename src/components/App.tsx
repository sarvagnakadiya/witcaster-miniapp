"use client";

import { useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import CastCard from "./ui/CastCard";
import BottomInputBar from "./ui/BottomInputBar";
import { DEMO_LOCATION, DEMO_CHAT } from "./DummyData.js";
import { SystemChatBubble, UserChatBubble } from "./ui/ChatBubble";
import { SystemLoadingBubble } from "./ui/ChatBubble";

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

interface GeneratedReplyOption {
  text: string;
  style: string;
  personalization: string;
}

interface GenerateRepliesSuccess {
  success: true;
  data:
    | {
        replies: GeneratedReplyOption[];
      }
    | {
        enhancedReply: string;
        personalization: string;
      };
}

function App() {
  const [theContext, setContext] = useState<ContextInfo | null>(null);
  const [replies, setReplies] = useState<GeneratedReplyOption[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<
    { role: "system" | "user"; text: string }[]
  >([]);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);

  useEffect(() => {
    const checkContext = async () => {
      try {
        const sdkContext = await (sdk as any).context;
        if (sdkContext?.location?.type === "cast_share") {
          console.log("sdkContext", sdkContext);
          const castLocation = sdkContext.location as any;
          console.log("castLocation", castLocation);
          // Normalize context: user/client live on root context, cast under location
          const normalized: ContextInfo = {
            user: sdkContext.user,
            client: sdkContext.client,
            cast: castLocation.cast,
          } as ContextInfo;
          setContext(normalized);

          try {
            setIsLoading(true);
            if (
              !normalized?.cast?.hash ||
              !normalized?.cast?.author?.fid ||
              !normalized?.user?.fid
            ) {
              throw new Error(
                "Missing required context fields for reply generation"
              );
            }

            const payload = {
              targetCasthash: normalized.cast.hash,
              targetFid: String(normalized.cast.author.fid),
              replierFid: String(normalized.user.fid),
              includeUserCasts: true,
              includeConversation: true,
            };

            console.log("payload", payload);

            const res = await fetch("/api/generate-replies", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to generate replies");
            const data: GenerateRepliesSuccess = await res.json();

            if (
              "replies" in data.data &&
              Array.isArray((data.data as any).replies)
            ) {
              setReplies((data.data as any).replies as GeneratedReplyOption[]);
              const sys = (
                (data.data as any).replies as GeneratedReplyOption[]
              ).map((r) => ({ role: "system" as const, text: r.text }));
              setMessages(sys);
            } else if ("enhancedReply" in data.data) {
              const single = data.data as any;
              setReplies([
                {
                  text: single.enhancedReply,
                  style: "Enhanced",
                  personalization: single.personalization ?? "",
                },
              ]);
              setMessages([
                { role: "system", text: String(single.enhancedReply) },
              ]);
            }
          } catch (e) {
            console.error(e);
          } finally {
            try {
              await sdk.actions.ready();
            } catch (_e) {}
            setIsLoading(false);
          }
        }
      } catch (_e) {
        // ignore SDK init errors and fall back to default UI
      }
    };
    checkContext();
  }, []);

  const handleUserSubmit = async (value: string) => {
    if (!theContext) return;
    // Append user's message immediately
    setMessages((prev) => [...prev, { role: "user", text: value }]);

    try {
      setIsEnhancing(true);
      if (
        !theContext?.cast?.hash ||
        !theContext?.cast?.author?.fid ||
        !theContext?.user?.fid
      ) {
        throw new Error("Missing required context fields for enhancing reply");
      }

      const payload = {
        targetCasthash: theContext.cast.hash,
        targetFid: String(theContext.cast.author.fid),
        replierFid: String(theContext.user.fid),
        includeUserCasts: true,
        includeConversation: true,
        customInput: value,
      };

      const res = await fetch("/api/generate-replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to enhance reply");
      const data: GenerateRepliesSuccess = await res.json();

      if ("enhancedReply" in data.data) {
        setMessages((prev) => [
          ...prev,
          { role: "system", text: (data.data as any).enhancedReply },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  if (theContext != null) {
    return (
      <div className="min-h-[100dvh] pb-16">
        <div className="max-w-2xl mx-auto p-4 overflow-y-auto">
          <div className="flex flex-col gap-0.5">
            <CastCard location={theContext} />
            {isLoading && <SystemLoadingBubble text="Generating replies…" />}
            {!isLoading && messages.length > 0 && (
              <div className="flex flex-col gap-0.5">
                {messages.map((m, idx) =>
                  m.role === "user" ? (
                    <UserChatBubble
                      key={idx}
                      name={theContext.user.displayName}
                      text={m.text}
                      avatarUrl={theContext.user.pfpUrl || ""}
                    />
                  ) : (
                    <SystemChatBubble key={idx} text={m.text} />
                  )
                )}
                {isEnhancing && <SystemLoadingBubble text="Enhancing reply…" />}
              </div>
            )}
          </div>
        </div>
        <BottomInputBar onSubmit={handleUserSubmit} />
      </div>
    );
  }

  // Demo mode for local testing
  return (
    <div className="min-h-[100dvh] pb-32 max-w-2xl mx-auto p-4">
      <CastCard location={DEMO_LOCATION} />

      <div className="mt-2 flex flex-col gap-0.5">
        {DEMO_CHAT.map((m, idx) =>
          m.role === "user" ? (
            <UserChatBubble
              key={idx}
              name={m.name}
              text={m.text}
              avatarUrl={m.avatarUrl || ""}
            />
          ) : (
            <>
              <SystemChatBubble key={idx} text={m.text} />
              <SystemLoadingBubble key={idx} text="Generating replies…" />
            </>
          )
        )}
      </div>
      <BottomInputBar />
    </div>
  );
}

export default App;
