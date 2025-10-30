"use client";

import { useMiniApp } from "@neynar/react";

type AppProps = {
  title?: string;
};

type ShareLocation = {
  type: "cast_share";
  cast: {
    author: { username: string };
    hash: string;
  };
};

function App({ title }: AppProps) {
  const { context } = useMiniApp();

  const location = context?.location as ShareLocation | undefined;
  const sharedCast = location?.type === "cast_share" ? location.cast : null;

  if (sharedCast) {
    return (
      <div>
        <h1>Cast from @{sharedCast.author.username}</h1>
        <p>Analyzing cast {sharedCast.hash}...</p>
      </div>
    );
  }

  return <div>{title || "Your regular app UI"}</div>;
}

export default App;
