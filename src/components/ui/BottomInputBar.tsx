"use client";

import { useEffect, useRef, useState } from "react";

type BottomInputBarProps = {
  onSubmit?: (value: string) => void;
  placeholder?: string;
};

export default function BottomInputBar({
  onSubmit,
  placeholder = "Add custom reply..",
}: BottomInputBarProps) {
  const [value, setValue] = useState("");
  const [viewportOffset, setViewportOffset] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Best-effort adjustment for iOS/Safari virtual keyboard so the bar stays visible.
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    if (!vv) return;

    const handleResize = () => {
      const bottomInset = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop
      );
      setViewportOffset(bottomInset);
    };

    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    handleResize();
    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, []);

  const submit = () => {
    if (!value.trim()) return;
    onSubmit?.(value.trim());
    setValue("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50"
      style={{
        // Keep above iOS home indicator and lift when keyboard shows
        paddingBottom: `calc(env(safe-area-inset-bottom) + 8px + ${viewportOffset}px)`,
      }}
    >
      <div className="max-w-2xl mx-auto px-3">
        <div className="relative rounded-full bg-gray-100 border border-gray-200 shadow-sm">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent outline-none px-2 pr-14 py-4 text-gray-800 placeholder-gray-500"
          />
          <button
            type="button"
            aria-label="Send"
            onClick={submit}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black text-white flex items-center justify-center active:scale-95"
          >
            {/* Up arrow */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5l6 6m-6-6l-6 6m6-6v14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
