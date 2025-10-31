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
        <div className="text-center space-y-6 flex flex-col items-center">
          <div className="flex justify-center">
            <img
              src="/demo.GIF"
              alt="Witcaster demo"
              className="w-32 h-32 mx-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Witcaster</h1>

          <p className="text-base text-gray-700 leading-relaxed max-w-md">
            Bring your Farcaster replies to life with{" "}
            <span className="font-semibold text-gray-900 text-lg text-purple-600">
              Witcaster
            </span>
            , your AI sidekick for crafting smart, engaging responses that match
            your tone and the conversation vibe.
          </p>

          <div className="text-left space-y-3 w-full max-w-md text-gray-700">
            <div className="flex gap-3">
              <span className="font-semibold text-purple-600 flex-shrink-0">
                1.
              </span>
              <p className="text-sm leading-relaxed">
                Add the Witcaster miniapp to start creating replies.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-purple-600 flex-shrink-0">
                2.
              </span>
              <p className="text-sm leading-relaxed">
                On any cast, tap{" "}
                <span className="font-medium text-gray-900">
                  Share → Witcaster → Create Replies
                </span>
                .
              </p>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-purple-600 flex-shrink-0">
                3.
              </span>
              <p className="text-sm leading-relaxed">
                Boom. Your replies are ready, and you can tweak or enhance them
                however you like.
              </p>
            </div>
          </div>
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
