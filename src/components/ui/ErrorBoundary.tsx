"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error("🚨 ErrorBoundary caught an error:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🚨 ErrorBoundary details:", {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
    });

    // Check if this is a COOP-related error
    if (error.message.includes("Cross-Origin-Opener-Policy")) {
      console.warn("⚠️ COOP error detected in ErrorBoundary");
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[200px] p-4 bg-card rounded-lg border border-border">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Something went wrong
              </h2>
              <p className="text-muted-foreground mb-4">
                {this.state.error?.message.includes(
                  "Cross-Origin-Opener-Policy"
                )
                  ? "There's a browser security issue. Please refresh the page to continue."
                  : "An unexpected error occurred. Please try refreshing the page."}
              </p>
              <button
                onClick={() => {
                  console.log("🔄 Resetting error boundary");
                  this.setState({ hasError: false, error: undefined });
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    console.error("🚨 useErrorHandler caught error:", {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
    });

    // Check if this is a COOP-related error
    if (error.message.includes("Cross-Origin-Opener-Policy")) {
      console.warn("⚠️ COOP error detected in useErrorHandler");
    }
  };
}
