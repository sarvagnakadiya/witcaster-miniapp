import { NextResponse } from "next/server";
import connectDB from "~/lib/db";
import Reply from "~/lib/models/Reply";

interface PostReplyRequest {
  replierFid: string;
  targetFid: string;
  targetHash: string;
  replyText: string;
}

export async function POST(request: Request) {
  try {
    const body: PostReplyRequest = await request.json();

    const { replierFid, targetFid, targetHash, replyText } = body;

    // Validate required parameters
    if (!replierFid || !targetFid || !targetHash || !replyText) {
      return NextResponse.json(
        {
          error: "Missing required fields: replierFid, targetFid, targetHash, and replyText are required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the reply document
    const replyDoc = await Reply.findOne({
      replierFid: replierFid,
      targetFid: targetFid,
      targetHash: targetHash,
    });

    if (!replyDoc) {
      return NextResponse.json(
        {
          error: "Reply not found. Make sure the reply was generated first.",
        },
        { status: 404 }
      );
    }

    // Find the matching reply option by text (fuzzy match to handle minor differences)
    const matchingReply = replyDoc.replies.find(
      (r) => r.text.trim().toLowerCase() === replyText.trim().toLowerCase()
    );

    if (!matchingReply) {
      // If exact match not found, try to find closest match
      const closestMatch = replyDoc.replies.find((r) =>
        r.text.trim().toLowerCase().includes(replyText.trim().toLowerCase()) ||
        replyText.trim().toLowerCase().includes(r.text.trim().toLowerCase())
      );

      if (closestMatch) {
        closestMatch.posted = true;
        closestMatch.postedAt = new Date();
        await replyDoc.save();

        return NextResponse.json({
          success: true,
          message: "Reply marked as posted",
        });
      }

      return NextResponse.json(
        {
          error: "Reply text not found in stored replies",
        },
        { status: 404 }
      );
    }

    // Mark as posted
    matchingReply.posted = true;
    matchingReply.postedAt = new Date();
    await replyDoc.save();

    return NextResponse.json({
      success: true,
      message: "Reply marked as posted",
    });
  } catch (error) {
    console.error("Error marking reply as posted:", error);
    return NextResponse.json(
      { error: "Failed to mark reply as posted" },
      { status: 500 }
    );
  }
}

