"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useMiniApp } from "@neynar/react";
import sdk from "@farcaster/miniapp-sdk";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
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
};

export default function AIChat({ title = "Reply Assistant" }: AIChatProps) {
  const { isSDKLoaded, context, actions } = useMiniApp();
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sharedCast, setSharedCast] = useState<MiniAppCast | null>(null);
  const [isShareContext, setIsShareContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if we're in a share context and get the cast
  useEffect(() => {
    const checkContext = async () => {
      try {
        await sdk.actions.ready();
        const sdkContext = await sdk.context;
        if (sdkContext.location && sdkContext.location.type === "cast_share") {
          setIsShareContext(true);
          // Type assertion since we know it's cast_share type
          const castLocation = sdkContext.location as any;
          if (castLocation.cast) {
            setSharedCast(castLocation.cast);
          }
        }
      } catch (error) {
        console.error("Failed to get SDK context:", error);
      }
    };

    checkContext();
  }, []);

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
      if (!sharedCast) return;

      setIsLoading(true);
      try {
        const response = await fetchWithAuth("/api/generate-replies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetCasthash: sharedCast.hash,
            targetFid: sharedCast.author.fid.toString(),
            customInput,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate replies");
        }

        const data: GenerateRepliesResponse | EnhancedReplyResponse =
          await response.json();

        if (customInput && "data" in data && "enhancedReply" in data.data) {
          // Handle enhanced reply response
          const enhancedData = data as EnhancedReplyResponse;
          const replyMessage: Message = {
            id: Date.now().toString(),
            type: "reply",
            content: enhancedData.data.enhancedReply,
            timestamp: new Date(),
            personalization: enhancedData.data.personalization,
          };
          setMessages([replyMessage]);
        } else if (!customInput && "data" in data && "replies" in data.data) {
          // Handle multiple replies response
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
        }
      } catch (error) {
        console.error("Error generating replies:", error);
        const errorMessage: Message = {
          id: "error",
          type: "assistant",
          content:
            "Sorry, I couldn't generate replies right now. Please try again.",
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
      } finally {
        setIsLoading(false);
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
      className="h-[100dvh] bg-background flex flex-col"
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">{title}</h1>
              <p className="text-xs text-muted-foreground">
                {isShareContext && sharedCast
                  ? `Replying to @${
                      sharedCast.author.username || sharedCast.author.fid
                    }`
                  : "AI Assistant"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isShareContext && sharedCast && (
              <button
                onClick={() => generateReplies()}
                disabled={isLoading}
                className="h-8 w-8 p-0 rounded border border-border bg-background hover:bg-accent disabled:opacity-50 flex items-center justify-center"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>
            )}
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
        </div>

        {/* Cast Info */}
        {isShareContext && sharedCast && (
          <div className="px-4 pb-4">
            <div className="bg-muted rounded-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">
                  @{sharedCast.author.username || sharedCast.author.fid}
                </span>
                <span className="text-xs text-muted-foreground">
                  Cast {sharedCast.hash.slice(0, 8)}...
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {sharedCast.text}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading && (
          <div className="flex justify-center">
            <div className="bg-muted rounded-2xl px-4 py-3 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]"></div>
                </div>
                <span className="text-sm">Generating replies...</span>
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id}>
            {message.type === "reply" ? (
              // Special rendering for reply suggestions
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-card-foreground">
                    Suggested Reply
                  </span>
                </div>
                <p className="text-card-foreground leading-relaxed">
                  {message.content}
                </p>
                {message.style && (
                  <p className="text-xs text-muted-foreground">
                    <strong>Style:</strong> {message.style}
                  </p>
                )}
                {message.personalization && (
                  <p className="text-xs text-muted-foreground">
                    <strong>Why this works:</strong> {message.personalization}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleSendMessage(message.content, true)}
                    disabled={isSending}
                    className="flex-1 py-2 text-sm"
                  >
                    {isSending ? "Sending..." : "Use This Reply"}
                  </Button>
                  <button
                    onClick={() => setInputText(message.content)}
                    className="px-4 py-2 text-sm rounded border border-border bg-background hover:bg-accent"
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
                }`}
              >
                <div
                  className={`max-w-[85%] ${
                    message.type === "user" ? "order-2" : "order-1"
                  }`}
                >
                  <div
                    className={`
                      rounded-2xl px-4 py-3 text-sm leading-relaxed
                      ${
                        message.type === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md shadow-lg"
                          : "bg-muted text-muted-foreground rounded-bl-md border border-border"
                      }
                    `}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                  <div
                    className={`text-xs text-muted-foreground mt-1 px-1 ${
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
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">
                Quick suggestions
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isSending}
                  className="
                    text-left p-3 rounded-xl border border-border bg-card hover:bg-accent
                    transition-all duration-200 hover:shadow-md hover:scale-[1.02]
                    active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                    text-sm text-card-foreground
                  "
                >
                  <div className="flex items-center justify-between">
                    <span>{suggestion}</span>
                    <ArrowUp className="w-4 h-4 text-muted-foreground opacity-60" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {isSending && (
          <div className="flex justify-start">
            <div className="max-w-[85%]">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                  <span className="text-sm">Sending...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isShareContext && sharedCast
                  ? "Type your own reply idea..."
                  : "Message AI Assistant..."
              }
              className="
                pr-12 py-3 rounded-2xl border-border bg-background text-foreground
                placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20
                resize-none min-h-[44px] max-h-32
              "
              disabled={isSending || isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputText);
                }
              }}
            />
          </div>
          <Button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || isSending || isLoading}
            className="
              w-11 h-11 rounded-full p-0 bg-primary hover:bg-primary/90
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 hover:scale-105 active:scale-95
              shadow-lg
            "
            aria-label="Send message"
          >
            {isSending || isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </Button>
        </div>

        {/* Helpful hint */}
        <div className="mt-2 px-1">
          <p className="text-xs text-muted-foreground">
            {isShareContext && sharedCast
              ? "Enter custom text to get personalized reply suggestions"
              : "Press Enter to send • Shift + Enter for new line"}
          </p>
        </div>
      </div>
    </div>
  );
}
