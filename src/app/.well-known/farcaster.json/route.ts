import { NextResponse } from "next/server";

export async function GET() {
  console.log("📋 Serving Farcaster manifest");

  try {
    const manifest = {
      accountAssociation: {
        header:
          "eyJmaWQiOjg4NDgyMywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDM2YTMxMkEzRjkxOTVCMkIwNmRiOTVmRUQxQzU2RDI4ZEY5N2MzMzQifQ",
        payload: "eyJkb21haW4iOiJ3aXRjYXN0ZXItbWluaWFwcC52ZXJjZWwuYXBwIn0",
        signature:
          "MHg3Y2Q5MjY5NjY3NzJlZjM1MDI5ZDhiNWNkZGUwOGEwMjg3ODAxODNmMWNhM2JkZThjZDcxOWI3ODRlMjYwYWFjMGE4NzY4YjRlNjY5YzlmMTAzODUyZDgxMjUyYzc0ZjYxMGQxZDljMzY1ZTQ5YjdjODVmMWI2NmNkNjUxMjIxOTFi",
      },
      frame: {
        version: "1",
        name: "witcaster",
        iconUrl: "https://witcaster-miniapp.vercel.app/icon.png",
        homeUrl: "https://witcaster-miniapp.vercel.app",
        imageUrl: "https://witcaster-miniapp.vercel.app/api/opengraph-image",
        buttonTitle: "help-generate",
        splashImageUrl: "https://witcaster-miniapp.vercel.app/splash.png",
        splashBackgroundColor: "#f7f7f7",
        webhookUrl:
          "https://api.neynar.com/f/app/372ffebf-8028-4a7d-ac46-2347990e25a3/event",
        castShareUrl: "https://witcaster-miniapp.vercel.app/share",
        subtitle: "create replies",
        description: "create replies",
        primaryCategory: "utility",
      },
    };

    return NextResponse.json(manifest, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("❌ Error serving Farcaster manifest:", error);
    return NextResponse.json(
      { error: "Failed to load manifest" },
      { status: 500 }
    );
  }
}
