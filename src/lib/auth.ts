import { createClient } from "@farcaster/quick-auth";
import { sdk } from "@farcaster/frame-sdk";

const quickAuth = createClient();

export async function verifyAuth(request: Request): Promise<number | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  try {
    const payload = await quickAuth.verifyJwt({
      token: auth.split(" ")[1],
      domain: new URL(process.env.NEXT_PUBLIC_URL!).hostname,
    });

    return Number(payload.sub);
  } catch (error) {
    console.error("Auth verification failed:", error);
    return null;
  }
}

// Helper to get user info from Farcaster API
export async function getUserInfo(fid: number) {
  try {
    const response = await fetch(
      `https://api.farcaster.xyz/fc/primary-address?fid=${fid}&protocol=ethereum`
    );
    if (!response.ok) return null;

    const data = await response.json();
    return {
      fid,
      address: data?.result?.address?.address,
    };
  } catch (error) {
    console.error("Failed to fetch user info:", error);
    return null;
  }
}

// Helper function to make authenticated requests
export async function fetchWithAuth(url: string, options?: RequestInit) {
  try {
    console.log("🔐 fetchWithAuth called:", {
      url,
      method: options?.method || "GET",
    });

    // Ensure SDK is initialized
    if (!sdk.quickAuth) {
      console.error("❌ QuickAuth SDK not initialized");
      throw new Error("QuickAuth SDK not initialized");
    }

    console.log("✅ QuickAuth SDK is available");

    // If options include a body, ensure Content-Type is set
    if (options?.body && !options.headers) {
      options.headers = {
        "Content-Type": "application/json",
      };
    }

    console.log("📤 Making authenticated request...");

    // Make the request
    const response = await sdk.quickAuth.fetch(url, options);

    console.log("📥 Response received:", {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => "Unable to read response");
      console.error("❌ Request failed:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        body: errorText,
      });
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    console.log("✅ Request successful");
    return response;
  } catch (error) {
    console.error("❌ fetchWithAuth error:", error);

    // Add more detailed error logging
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    // Check if this is a COOP-related error
    if (
      error instanceof Error &&
      error.message.includes("Cross-Origin-Opener-Policy")
    ) {
      console.warn(
        "⚠️ COOP error detected - this may be related to Farcaster SDK initialization"
      );
    }

    throw error; // Re-throw to let the caller handle it
  }
}
