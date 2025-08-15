"use client";

import dynamic from "next/dynamic";
import { APP_NAME } from "~/lib/constants";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";

// note: dynamic import is required for components that use the Frame SDK
const AIChat = dynamic(() => import("~/components/ui/AIChat"), {
  ssr: false,
});

export default function App(
  {
    title,
    castShareParams,
  }: {
    title?: string;
    castShareParams?: {
      castHash?: string;
      castFid?: string;
      viewerFid?: string;
    };
  } = { title: APP_NAME }
) {
  console.log("🚀 App component rendering with title:", title);

  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-foreground mb-4">{title}</h1>
            <p className="text-muted-foreground mb-6">
              The app encountered an error while initializing. This might be due
              to browser security settings.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      }
    >
      <AIChat title={title} castShareParams={castShareParams} />
    </ErrorBoundary>
  );
}
