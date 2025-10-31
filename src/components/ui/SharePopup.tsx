"use client";

import { ShareButton } from "./Share";
import { APP_URL } from "~/lib/constants";
import { X } from "lucide-react";

interface SharePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SharePopup({ isOpen, onClose }: SharePopupProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Share Witcaster!</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Share Witcaster on your feed to let others know you're using it to be more 
          active on Farcaster and creating cool replies!
        </p>

        <div className="space-y-3">
          <ShareButton
            buttonText="Share on Feed"
            cast={{
              text: "I'm using @witcaster to be more active on Farcaster and creating cool replies 🚀",
              embeds: [APP_URL],
            }}
            className="w-full"
          />
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
