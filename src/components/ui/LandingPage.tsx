"use client";

import { useEffect, useState } from "react";
import { useMiniApp } from "@neynar/react";
import { Button } from "./Button";
import { ShareButton } from "./Share";
import { APP_URL } from "~/lib/constants";
import { isMobile } from "~/lib/devices";

const FARCASTER_MINIAPP_URL =
  "https://farcaster.xyz/miniapps/YgE7dG5g0HTU/witcaster";

export function LandingPage() {
  const { actions, added, context } = useMiniApp();
  const [isLandscape, setIsLandscape] = useState(false);

  // Check if we're in a miniapp context
  // Context exists only when running inside Farcaster client
  const isInMiniApp = !!(context?.user || context?.client);

  // Detect screen orientation and size
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== "undefined") {
        const isLandscapeOrientation = window.innerWidth > window.innerHeight;
        const isNotMobile = !isMobile();
        setIsLandscape(isLandscapeOrientation && isNotMobile);
      }
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  useEffect(() => {
    if (isInMiniApp && !added) {
      actions.addMiniApp();
    }
  }, [added, actions, isInMiniApp]);

  // Determine which image to use
  const imageSrc = isInMiniApp
    ? "/landing-page.png"
    : isLandscape
    ? "/website.png"
    : "/landing-page.png";

  const handleVisitWitcaster = () => {
    window.location.href = FARCASTER_MINIAPP_URL;
  };

  return (
    <div className="min-h-[100dvh] relative">
      {/* Full screen image */}
      <img
        src={imageSrc}
        alt="How to use Witcaster"
        className="w-full h-full object-cover object-center"
      />

      {/* Action Buttons - Fixed navbar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 w-full px-6 py-4 space-y-4 z-10">
        {!isInMiniApp ? (
          <Button
            onClick={handleVisitWitcaster}
            className="w-full"
            variant="primary"
            size="lg"
          >
            Visit Witcaster
          </Button>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
