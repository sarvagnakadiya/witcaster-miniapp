"use client";

import dynamic from "next/dynamic";
import { APP_NAME } from "~/lib/constants";

// note: dynamic import is required for components that use the Frame SDK
const AIChat = dynamic(() => import("~/components/ui/AIChat"), {
  ssr: false,
});

export default function App(
  { title }: { title?: string } = { title: APP_NAME }
) {
  return <AIChat title={title} />;
}
