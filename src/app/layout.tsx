import type { Metadata } from "next";

import "~/app/globals.css";
import { Providers } from "~/app/providers";
import { APP_NAME, APP_DESCRIPTION } from "~/lib/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

// Global error handler
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    console.error("🚨 Global error caught:", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });

    // Check if this is a COOP-related error
    if (event.message?.includes("Cross-Origin-Opener-Policy")) {
      console.warn("⚠️ COOP error detected globally");
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("🚨 Unhandled promise rejection:", event.reason);

    // Check if this is a COOP-related error
    if (event.reason?.message?.includes("Cross-Origin-Opener-Policy")) {
      console.warn("⚠️ COOP error in promise rejection");
    }
  });
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
