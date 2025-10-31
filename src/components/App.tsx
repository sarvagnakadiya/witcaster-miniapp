"use client";

import { useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import CastCard from "./ui/CastCard";
import BottomInputBar from "./ui/BottomInputBar";
import { SystemChatBubble, UserChatBubble } from "./ui/ChatBubble";
import { SystemLoadingBubble } from "./ui/ChatBubble";
import { LandingPage } from "./ui/LandingPage";
import { SharePopup } from "./ui/SharePopup";

// ------------------ TYPES ------------------

export interface AppProps {
  title?: string;
}

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

export default function App(
  { title: _title }: AppProps = { title: "Witcaster" }
) {
  const [theContext, setContext] = useState<ContextInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<
    { role: "system" | "user"; text: string }[]
  >([]);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [showSharePopup, setShowSharePopup] = useState<boolean>(false);

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
              const sys = (
                (data.data as any).replies as GeneratedReplyOption[]
              ).map((r) => ({ role: "system" as const, text: r.text }));
              setMessages(sys);
            } else if ("enhancedReply" in data.data) {
              const single = data.data as any;
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

  const handlePostText = async (text: string) => {
    try {
      if (
        !theContext?.cast?.hash ||
        !theContext?.cast?.author?.fid ||
        !theContext?.user?.fid
      )
        return;
      const actions = (sdk as any).actions;
      if (actions?.composeCast) {
        console.log("composeCast", {
          text,
          parent: {
            type: "cast",
            hash: theContext.cast.hash.toString(),
          },
        });
        await actions.composeCast({
          text,
          parent: {
            type: "cast",
            hash: theContext.cast.hash.toString(),
          },
        });

        // Track that this reply was posted
        try {
          await fetch("/api/replies/post", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              replierFid: String(theContext.user.fid),
              targetFid: String(theContext.cast.author.fid),
              targetHash: theContext.cast.hash,
              replyText: text,
            }),
          });
        } catch (trackError) {
          // Log error but don't fail the post operation
          console.error("Error tracking reply post:", trackError);
        }

        // Show share popup after successful post
        setShowSharePopup(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // If we have context from cast_share, show main app (don't check added status)
  // Landing page is only shown when there's no context (replaces demo data)
  if (theContext == null) {
    return <LandingPage />;
  }

  // Main app view when context is available (cast_share)
  return (
    <>
      <div className="min-h-[100dvh] pb-32">
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex flex-col gap-1">
            <CastCard location={theContext} />
            {isLoading && <SystemLoadingBubble text="Generating replies…" />}
            {!isLoading && messages.length > 0 && (
              <div className="flex flex-col gap-1">
                {messages.map((m, idx) =>
                  m.role === "user" ? (
                    <UserChatBubble
                      key={idx}
                      name={theContext.user.displayName}
                      text={m.text}
                      avatarUrl={theContext.user.pfpUrl || ""}
                      onPost={() => handlePostText(m.text)}
                    />
                  ) : (
                    <SystemChatBubble
                      key={idx}
                      text={m.text}
                      onPost={() => handlePostText(m.text)}
                    />
                  )
                )}
                {isEnhancing && <SystemLoadingBubble text="Enhancing reply…" />}
              </div>
            )}
          </div>
        </div>
        {/* Spacer to ensure content never hides behind the fixed input bar */}
        <div className="h-24" />
        <BottomInputBar onSubmit={handleUserSubmit} />
      </div>
      <SharePopup
        isOpen={showSharePopup}
        onClose={() => setShowSharePopup(false)}
      />
    </>
  );
}
