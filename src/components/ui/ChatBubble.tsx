import React from "react";

const BaseChatBubble = ({
  children,
  avatarUrl,
  name,
  className = "",
  onPost,
  showTapToPost = false,
}: {
  children: React.ReactNode;
  avatarUrl?: string;
  name?: string;
  className?: string;
  onPost?: () => void;
  showTapToPost?: boolean;
}) => {
  return (
    <div
      className={`relative bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm ${
        onPost ? "cursor-pointer" : ""
      } ${className}`}
      onClick={onPost}
    >
      {(avatarUrl || name) && (
        <div className="flex items-center mb-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-6 h-6 rounded-full object-cover mr-2"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
              <span className="text-gray-600 font-medium text-xs">
                {name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="font-semibold text-gray-900 truncate">{name}</span>
        </div>
      )}
      {children}
      {showTapToPost && (
        <div className="mt-2 text-xs text-gray-400 select-none">
          Tap to post
        </div>
      )}
    </div>
  );
};

// System (Witcaster) Message
export const SystemChatBubble = ({
  text,
  onPost,
}: {
  text: string;
  onPost?: () => void;
}) => {
  return (
    <div className="flex justify-start mb-3">
      <BaseChatBubble
        name="Witcaster"
        avatarUrl="/icon.png" // replace with your actual logo
        className="max-w-2xl"
        onPost={onPost}
        showTapToPost={Boolean(onPost)}
      >
        <img
          src="/star.svg"
          alt="Star"
          className="absolute top-3 right-3 w-6 h-6 text-purple-400"
        />
        <p className="text-gray-900 leading-relaxed mt-1">{text}</p>
      </BaseChatBubble>
    </div>
  );
};

// System Loading (Creating reply…)
export const SystemLoadingBubble = ({ text }: { text: string }) => {
  return (
    <div className="flex justify-start mb-3">
      <BaseChatBubble
        name="Witcaster"
        avatarUrl="/icon.png"
        className="max-w-2xl"
      >
        <p className="leading-relaxed mt-1">
          <span
            className="relative inline-block bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #8A63D2 0%, #9e9e9e 50%, #8A63D2 100%)",
              backgroundSize: "200% 100%",
              animation: "wit-shimmer 1.6s ease-in-out infinite",
            }}
          >
            {text}
          </span>
          <style jsx>{`
            @keyframes wit-shimmer {
              0% {
                background-position: 200% 0;
              }
              50% {
                background-position: 100% 0;
              }
              100% {
                background-position: 0% 0;
              }
            }
          `}</style>
        </p>
      </BaseChatBubble>
    </div>
  );
};

// User Message
export const UserChatBubble = ({
  name,
  text,
  avatarUrl,
  onPost,
}: {
  name: string;
  text: string;
  avatarUrl: string;
  onPost?: () => void;
}) => {
  return (
    <div className="flex justify-end mb-3">
      <BaseChatBubble
        name={name}
        avatarUrl={avatarUrl}
        className="max-w-2xl"
        onPost={onPost}
        showTapToPost={Boolean(onPost)}
      >
        <p className="text-right text-gray-900 leading-relaxed">{text}</p>
      </BaseChatBubble>
    </div>
  );
};

export default { SystemChatBubble, UserChatBubble };
