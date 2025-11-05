"use client";

import { useEffect } from "react";
import { useMiniApp } from "@neynar/react";
import { Button } from "./Button";
import { ShareButton } from "./Share";
import { APP_URL } from "~/lib/constants";

export function LandingPage() {
  const { actions, added, context: _context } = useMiniApp();

  useEffect(() => {
    if (!added) {
      actions.addMiniApp();
    }
  }, [added, actions]);

  return (
    <div className="min-h-[100dvh] relative">
      {/* Full screen image */}
      <img
        src="/landing-page.png"
        alt="How to use Witcaster"
        className="w-full h-full object-cover object-center"
      />

      {/* Action Buttons - Fixed navbar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 w-full px-6 py-4 space-y-4 z-10">
        {!added && (
          <Button
            onClick={actions.addMiniApp}
            className="w-full"
            variant="primary"
            size="lg"
          >
            Add MiniApp
          </Button>
        )}

        <ShareButton
          buttonText="Share Witcaster"
          cast={{
            text: "I'm using @witcaster to be more active on Farcaster and creating cool replies 🚀",
            embeds: [APP_URL],
          }}
          className="w-full"
        />
      </div>
    </div>
  );
}
