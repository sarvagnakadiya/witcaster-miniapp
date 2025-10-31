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
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Witcaster</h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Be more active on Farcaster and create cool replies. Witcaster helps you 
            craft engaging responses to casts with AI-powered suggestions tailored to 
            your style and the conversation context.
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
