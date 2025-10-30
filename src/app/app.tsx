"use client";

import dynamic from "next/dynamic";
import { APP_NAME } from "~/lib/constants";

// note: dynamic import is required for components that use the Frame SDK
const AppComponent = dynamic(() => import("~/components/App"), {
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
  return <AppComponent title={title} castShareParams={castShareParams} />;
}
