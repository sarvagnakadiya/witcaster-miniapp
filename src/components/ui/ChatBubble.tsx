import React from "react";

const BaseChatBubble = ({
  children,
  avatarUrl,
  name,
  className = "",
}: {
  children: React.ReactNode;
  avatarUrl?: string;
  name?: string;
  className?: string;
}) => {
  return (
    <div
      className={`relative bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm ${className}`}
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
    </div>
  );
};

// System (Witcaster) Message
export const SystemChatBubble = ({ text }: { text: string }) => {
  return (
    <div className="flex justify-start mb-3">
      <BaseChatBubble
        name="Witcaster"
        avatarUrl="/icon.png" // replace with your actual logo
        className="max-w-2xl"
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

// User Message
export const UserChatBubble = ({
  name,
  text,
  avatarUrl,
}: {
  name: string;
  text: string;
  avatarUrl: string;
}) => {
  return (
    <div className="flex justify-end mb-3">
      <BaseChatBubble name={name} avatarUrl={avatarUrl} className="max-w-2xl">
        <p className="text-right text-gray-900 leading-relaxed">{text}</p>
      </BaseChatBubble>
    </div>
  );
};

export default { SystemChatBubble, UserChatBubble };
