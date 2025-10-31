"use client";

import { useMiniApp } from "@neynar/react";
import { Button } from "./Button";
import { ShareButton } from "./Share";
import { APP_URL } from "~/lib/constants";

export function LandingPage() {
  const { actions, added, context: _context } = useMiniApp();

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full flex flex-col items-center gap-8">
        {/* Description Section */}
        <div className="text-center space-y-4 flex flex-col items-center">
          <div className="flex justify-center">
            <img
              src="/demo.GIF"
              alt="Witcaster demo"
              className="w-32 h-32 mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Witcaster</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Bring your Farcaster replies to life with{" "}
            <span className="font-medium text-gray-800">Witcaster</span> — your
            AI sidekick for crafting smart, engaging responses that match your
            tone and the conversation vibe.
            <br />
            <br />
            1. Add the Witcaster miniapp to start creating replies.
            <br />
            2. On any cast, tap{" "}
            <span className="font-medium">
              Share → Witcaster → Create Replies
            </span>
            .<br />
            3. Boom. Your replies are ready, and you can tweak or enhance them
            however you like.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-4">
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
    </div>
  );
}
