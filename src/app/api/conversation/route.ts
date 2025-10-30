import { fetchConversationCasts } from "~/lib/farcaster/fetchConversation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get("identifier");
    const type = searchParams.get("type") as "hash" | "url" | null;
    const replyDepth = searchParams.get("replyDepth");
    const includeChronologicalParentCasts = searchParams.get(
      "includeChronologicalParentCasts"
    );
    const limit = searchParams.get("limit");

    if (!identifier) {
      return NextResponse.json(
        { error: "Identifier is required" },
        { status: 400 }
      );
    }

    const conversation = await fetchConversationCasts(
      identifier,
      type || "hash",
      replyDepth ? parseInt(replyDepth) : 25,
      includeChronologicalParentCasts === "true",
      limit ? parseInt(limit) : 20
    );

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
