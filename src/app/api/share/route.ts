import { NextResponse } from "next/server";
import { fetchConversationCasts } from "~/lib/farcaster/fetchConversation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const castHash = searchParams.get("castHash");
    const castFid = searchParams.get("castFid"); 
    const viewerFid = searchParams.get("viewerFid");

    console.log("Share API called with params:", { castHash, castFid, viewerFid });

    if (!castHash && !castFid) {
      return NextResponse.json(
        { error: "Either castHash or castFid is required" },
        { status: 400 }
      );
    }

    let castData = null;

    // If we have a castHash, fetch the full cast data
    if (castHash) {
      try {
        castData = await fetchConversationCasts(castHash, "hash", 1, false, 1);
      } catch (error) {
        console.error("Failed to fetch cast data:", error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        castHash,
        castFid: castFid ? parseInt(castFid) : null,
        viewerFid: viewerFid ? parseInt(viewerFid) : null,
        castData,
      },
    });
  } catch (error) {
    console.error("Error in share API:", error);
    return NextResponse.json(
      { error: "Failed to process share request" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { castHash, castFid, viewerFid } = body;

    console.log("Share API POST called with body:", { castHash, castFid, viewerFid });

    // This could be used for more complex share processing
    // For now, just return the same data as GET
    
    return NextResponse.json({
      success: true,
      data: {
        castHash,
        castFid,
        viewerFid,
        message: "Share data processed successfully",
      },
    });
  } catch (error) {
    console.error("Error in share API POST:", error);
    return NextResponse.json(
      { error: "Failed to process share request" },
      { status: 500 }
    );
  }
}