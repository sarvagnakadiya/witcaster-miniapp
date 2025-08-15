"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useMiniApp } from "@neynar/react";
import sdk from "@farcaster/miniapp-sdk";
import { Button } from "~/components/ui/Button";
import { Textarea } from "~/components/ui/textarea";
import {
  Send,
  Sparkles,
  MessageSquare,
  ArrowUp,
  RefreshCw,
} from "lucide-react";
import { fetchWithAuth } from "~/lib/auth";
import type {
  MiniAppCast,
  GenerateRepliesResponse,
  EnhancedReplyResponse,
} from "~/types/miniapp";

type Message = {
  id: string;
  type: "user" | "assistant" | "suggestion" | "reply";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  style?: string;
  personalization?: string;
};

type AIChatProps = {
  title?: string;
  castShareParams?: { castHash?: string; castFid?: string; viewerFid?: string };
};

export default function AIChat({
  title = "Reply Assistant",
  castShareParams,
}: AIChatProps) {
  const { isSDKLoaded, context, actions } = useMiniApp();
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sharedCast, setSharedCast] = useState<MiniAppCast | null>(null);
  const [isShareContext, setIsShareContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check if we're in a share context and get the cast
  useEffect(() => {
    const checkContext = async () => {
      try {
        console.log("🔄 Initializing Farcaster SDK...");
        await sdk.actions.ready();
        console.log("✅ Farcaster SDK ready");

        const sdkContext = await sdk.context;
        console.log("📋 SDK Context:", sdkContext);

        if (sdkContext.location && sdkContext.location.type === "cast_share") {
          console.log("📤 Share context detected via SDK");
          setIsShareContext(true);
          // Type assertion since we know it's cast_share type
          const castLocation = sdkContext.location as any;
          if (castLocation.cast) {
            console.log("📝 Cast data found:", castLocation.cast);
            setSharedCast(castLocation.cast);
          }
        } else if (castShareParams?.castHash || castShareParams?.castFid) {
          console.log(
            "📤 Share context detected via URL parameters:",
            castShareParams
          );
          setIsShareContext(true);

          // Try to fetch cast data using the URL parameters
          if (castShareParams.castHash) {
            try {
              const response = await fetch(
                `/api/share?castHash=${castShareParams.castHash}&castFid=${
                  castShareParams.castFid || ""
                }&viewerFid=${castShareParams.viewerFid || ""}`
              );
              const shareData = await response.json();

              if (shareData.success && shareData.data.castData) {
                console.log(
                  "📝 Cast data fetched from API:",
                  shareData.data.castData
                );

                // Convert API response to MiniAppCast format
                const castData = shareData.data.castData;
                if (castData.mainCast) {
                  const mockCast: MiniAppCast = {
                    hash: castShareParams.castHash,
                    text: castData.mainCast,
                    author: {
                      fid: parseInt(castShareParams.castFid || "0"),
                      username: "user", // This would need to be fetched separately
                    },
                  };
                  setSharedCast(mockCast);
                }
              }
            } catch (apiError) {
              console.error("❌ Failed to fetch cast data from API:", apiError);
            }
          }
        } else {
          console.log("🏠 Regular context detected");
        }
      } catch (error) {
        console.error("❌ Failed to get SDK context:", error);
        // Add more detailed error logging
        if (error instanceof Error) {
          console.error("Error name:", error.name);
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        // Continue gracefully even if SDK fails
      }
      await sdk.actions.ready();
    };

    checkContext();
  }, [castShareParams]);

  // Heuristics to discover the cast hash to reply to, if available
  const parentCastHash = useMemo(() => {
    if (sharedCast) return sharedCast.hash;

    const anyContext = context as unknown as Record<string, any> | undefined;
    return (
      anyContext?.cast?.hash ||
      anyContext?.message?.cast?.hash ||
      anyContext?.frame?.castId?.hash ||
      undefined
    );
  }, [context, sharedCast]);

  // Function to generate replies for the shared cast
  const generateReplies = useCallback(
    async (customInput?: string) => {
      if (!sharedCast) {
        console.warn("⚠️ No shared cast available for reply generation");
        return;
      }

      console.log("🎯 Generating replies for cast:", {
        hash: sharedCast.hash,
        authorFid: sharedCast.author.fid,
        customInput: customInput || "auto-generated",
      });

      setIsLoading(true);
      try {
        const requestPayload = {
          targetCasthash: sharedCast.hash,
          targetFid: sharedCast.author.fid.toString(),
          customInput,
        };

        console.log(
          "📤 Sending request to generate-replies API:",
          requestPayload
        );

        const response = await fetchWithAuth("/api/generate-replies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          console.error("❌ Generate replies API failed:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          });
          throw new Error(
            `Failed to generate replies: ${response.status} ${response.statusText}`
          );
        }

        console.log("✅ Generate replies API response received");
        const data: GenerateRepliesResponse | EnhancedReplyResponse =
          await response.json();

        console.log("📋 Parsed response data:", data);

        if (customInput && "data" in data && "enhancedReply" in data.data) {
          // Handle enhanced reply response
          console.log("🔧 Processing enhanced reply");
          const enhancedData = data as EnhancedReplyResponse;
          const replyMessage: Message = {
            id: Date.now().toString(),
            type: "reply",
            content: enhancedData.data.enhancedReply,
            timestamp: new Date(),
            personalization: enhancedData.data.personalization,
          };
          setMessages([replyMessage]);
          console.log("✅ Enhanced reply added to messages");
        } else if (!customInput && "data" in data && "replies" in data.data) {
          // Handle multiple replies response
          console.log(
            "🔧 Processing multiple replies:",
            data.data.replies.length
          );
          const repliesData = data as GenerateRepliesResponse;
          const replyMessages: Message[] = repliesData.data.replies.map(
            (reply, index) => ({
              id: `reply-${index}`,
              type: "reply",
              content: reply.text,
              timestamp: new Date(),
              style: reply.style,
              personalization: reply.personalization,
            })
          );
          setMessages(replyMessages);
          console.log("✅ Multiple replies added to messages");
        } else {
          console.warn("⚠️ Unexpected response format:", data);
        }
      } catch (error) {
        console.error("❌ Error generating replies:", error);

        // Add more detailed error logging
        if (error instanceof Error) {
          console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        }

        let errorContent =
          "Sorry, I couldn't generate replies right now. Please try again.";

        // Provide more specific error messages based on error type
        if (error instanceof Error) {
          if (error.message.includes("QuickAuth SDK not initialized")) {
            errorContent =
              "Authentication system is initializing. Please wait a moment and try again.";
          } else if (error.message.includes("Cross-Origin-Opener-Policy")) {
            errorContent =
              "There's a browser security issue. Please refresh the page and try again.";
          } else if (error.message.includes("404")) {
            errorContent =
              "API endpoint not found. Please check if the app is properly deployed.";
          } else if (
            error.message.includes("401") ||
            error.message.includes("Unauthorized")
          ) {
            errorContent =
              "Authentication failed. Please refresh and try again.";
          }
        }

        const errorMessage: Message = {
          id: "error",
          type: "assistant",
          content: errorContent,
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
      } finally {
        setIsLoading(false);
        console.log("🏁 Generate replies process completed");
      }
    },
    [sharedCast]
  );

  // AI-powered suggestions with more engaging copy
  const suggestions = useMemo(
    () => [
      "Love this! Here's my take:",
      "Great point! Adding some thoughts:",
      "Interesting perspective. My view:",
      "Thanks for sharing! Quick thoughts:",
      "Totally agree! Building on this:",
      "Fascinating! Here's another angle:",
    ],
    []
  );

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize based on context
  useEffect(() => {
    if (isSDKLoaded && isShareContext && sharedCast && messages.length === 0) {
      // Automatically generate replies for the shared cast
      generateReplies();
    } else if (isSDKLoaded && !isShareContext && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        type: "assistant",
        content: parentCastHash
          ? "Hi! I'm here to help you craft the perfect reply. Choose a suggestion below or write your own message."
          : "Hi! I'm your AI assistant. I'll help you compose engaging messages. What would you like to say?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [
    isSDKLoaded,
    isShareContext,
    sharedCast,
    parentCastHash,
    messages.length,
    generateReplies,
  ]);

  if (!isSDKLoaded) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground text-sm">
            Initializing AI Assistant...
          </p>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (
    messageText: string,
    isFromSuggestion = false
  ) => {
    if (!messageText.trim() || isSending) return;

    // If we're in share context, generate enhanced reply instead of sending directly
    if (isShareContext && sharedCast) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: messageText.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputText("");

      // Generate enhanced reply based on custom input
      await generateReplies(messageText.trim());
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsSending(true);

    try {
      await actions.composeCast(
        {
          text: messageText.trim(),
          parent: parentCastHash,
          close: true,
        },
        isFromSuggestion ? "ai-suggestion-send" : "ai-chat-send"
      );

      // Add success message
      const successMessage: Message = {
        id: Date.now().toString() + "_success",
        type: "assistant",
        content: "Perfect! Your message has been sent successfully. 🎉",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, successMessage]);
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString() + "_error",
        type: "assistant",
        content: "Oops! Something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion, true);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className="h-[100dvh] bg-gradient-to-br from-background via-background to-background/95 flex flex-col relative overflow-hidden"
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />

      {/* Header */}
      <div className="relative border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 shadow-sm">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background shadow-sm animate-pulse"></div>
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                {isShareContext && sharedCast
                  ? `Replying to @${
                      sharedCast.author.username || sharedCast.author.fid
                    }`
                  : "Powered by AI • Always ready to help"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isShareContext && sharedCast && (
              <button
                onClick={() => generateReplies()}
                disabled={isLoading}
                className="h-10 w-10 p-0 rounded-xl border border-border/50 bg-background/50 hover:bg-accent/50 disabled:opacity-50 flex items-center justify-center transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 backdrop-blur-sm"
              >
                <RefreshCw
                  className={`w-4 h-4 text-muted-foreground ${
                    isLoading ? "animate-spin" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Cast Info */}
        {isShareContext && sharedCast && (
          <div className="px-6 pb-6">
            <div className="bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/30 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {(
                      sharedCast.author.username ||
                      sharedCast.author.fid.toString()
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-sm text-card-foreground">
                    @{sharedCast.author.username || sharedCast.author.fid}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2 bg-muted/50 px-2 py-1 rounded-full">
                    {sharedCast.hash.slice(0, 8)}...
                  </span>
                </div>
              </div>
              <p className="text-sm text-card-foreground/80 leading-relaxed line-clamp-3 font-medium">
                {sharedCast.text}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 relative">
        {isLoading && (
          <div className="flex justify-center animate-fade-in">
            <div className="bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm rounded-3xl px-6 py-4 border border-border/30 shadow-lg">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></div>
                </div>
                <span className="text-sm font-medium">
                  Generating replies...
                </span>
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={message.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {message.type === "reply" ? (
              // Special rendering for reply suggestions
              <div className="bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/40 rounded-3xl p-6 space-y-4 shadow-lg shadow-primary/5 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.01]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-card-foreground tracking-wide">
                    Suggested Reply
                  </span>
                </div>
                <p className="text-card-foreground leading-relaxed font-medium text-base">
                  {message.content}
                </p>
                {message.style && (
                  <div className="bg-muted/50 rounded-2xl p-3">
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-primary">Style:</strong>{" "}
                      {message.style}
                    </p>
                  </div>
                )}
                {message.personalization && (
                  <div className="bg-primary/5 rounded-2xl p-3 border border-primary/10">
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-primary">Why this works:</strong>{" "}
                      {message.personalization}
                    </p>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleSendMessage(message.content, true)}
                    disabled={isSending}
                    className="flex-1 py-3 text-sm font-semibold rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isSending ? "Sending..." : "Use This Reply"}
                  </Button>
                  <button
                    onClick={() => setInputText(message.content)}
                    className="px-6 py-3 text-sm font-medium rounded-2xl border border-border/50 bg-background/50 hover:bg-accent/50 backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              // Regular message rendering
              <div
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                } group`}
              >
                <div
                  className={`max-w-[85%] ${
                    message.type === "user" ? "order-2" : "order-1"
                  }`}
                >
                  <div
                    className={`
                      rounded-3xl px-5 py-4 text-sm leading-relaxed font-medium shadow-lg transition-all duration-300 group-hover:shadow-xl
                      ${
                        message.type === "user"
                          ? "bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground rounded-br-lg shadow-primary/20 group-hover:shadow-primary/30"
                          : "bg-gradient-to-br from-card/90 via-card to-card/95 text-card-foreground rounded-bl-lg border border-border/30 backdrop-blur-sm group-hover:scale-[1.01]"
                      }
                    `}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                  <div
                    className={`text-xs text-muted-foreground/70 mt-2 px-2 font-medium ${
                      message.type === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Suggestions - only show for non-share context */}
        {!isShareContext && messages.length <= 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 px-2">
              <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                <MessageSquare className="w-3 h-3 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground font-bold tracking-wide">
                Quick Suggestions
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isSending}
                  className="
                    text-left p-4 rounded-2xl border border-border/40 bg-gradient-to-r from-card/80 to-card/60 hover:from-accent/50 hover:to-accent/30
                    transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02] hover:border-primary/20
                    active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                    text-sm text-card-foreground font-medium backdrop-blur-sm
                    group
                  "
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="leading-relaxed">{suggestion}</span>
                    <ArrowUp className="w-4 h-4 text-muted-foreground/50 transition-all duration-200 group-hover:text-primary group-hover:transform group-hover:-translate-y-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {isSending && (
          <div className="flex justify-start animate-fade-in">
            <div className="max-w-[85%]">
              <div className="bg-gradient-to-br from-card/90 via-card to-card/95 rounded-3xl rounded-bl-lg px-5 py-4 border border-border/30 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                  <span className="text-sm font-medium">Sending...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative border-t border-border/30 bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 p-6">
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

        <div className="relative flex items-end gap-4">
          <div className="flex-1 relative">
            <div className="relative group">
              <Textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isShareContext && sharedCast
                    ? "Type your own reply idea..."
                    : "Message AI Assistant..."
                }
                className="
                  pr-16 py-4 px-5 rounded-3xl border-2 border-border/40 bg-gradient-to-br from-card/80 to-card/60 text-foreground shadow-lg
                  placeholder:text-muted-foreground/70 focus:ring-4 focus:ring-primary/10 focus:border-primary/60
                  resize-none min-h-[56px] max-h-32 leading-relaxed font-medium
                  transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5
                  backdrop-blur-sm group-hover:scale-[1.01] focus:scale-[1.01]
                "
                disabled={isSending || isLoading}
                rows={1}
                style={
                  {
                    field_sizing: "content",
                  } as any
                }
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height =
                    Math.min(target.scrollHeight, 128) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputText);
                  }
                }}
              />
              {/* Character count indicator */}
              {inputText.length > 200 && (
                <div className="absolute bottom-3 right-20 text-xs text-muted-foreground/80 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full border border-border/30 shadow-sm">
                  {inputText.length}/280
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || isSending || isLoading}
            className="
              w-14 h-14 rounded-3xl p-0 bg-gradient-to-br from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary flex-shrink-0
              disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
              transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-3
              shadow-xl hover:shadow-2xl shadow-primary/20 hover:shadow-primary/30 border-2 border-primary/20
              group relative overflow-hidden
            "
            aria-label="Send message"
          >
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

            {isSending || isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <Send className="w-5 h-5 text-white transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            )}
          </Button>
        </div>

        {/* Helpful hint */}
        <div className="mt-4 px-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground/80 font-medium">
              {isShareContext && sharedCast
                ? "✨ Enter custom text to get personalized reply suggestions"
                : "💡 Press Enter to send • Shift + Enter for new line"}
            </p>
            {inputText.length > 0 && (
              <p className="text-xs text-muted-foreground/80 font-medium">
                {inputText.length > 250 ? (
                  <span
                    className={`px-2 py-1 rounded-full ${
                      inputText.length > 280
                        ? "text-destructive bg-destructive/10"
                        : "text-amber-600 bg-amber-500/10"
                    }`}
                  >
                    {280 - inputText.length} characters remaining
                  </span>
                ) : null}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
