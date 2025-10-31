import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fetchConversationCasts } from "~/lib/farcaster/fetchConversation";
import { fetchUserCasts } from "~/lib/farcaster/fetchCasts";
import connectDB from "~/lib/db";
import Reply from "~/lib/models/Reply";

interface GenerateRepliesRequest {
  targetCasthash?: string;
  targetFid?: string;
  replierFid?: string;
  includeUserCasts?: boolean;
  includeConversation?: boolean;
  customInput?: string;
}

interface ConversationReply {
  text: string;
  nestedReplies?: string[];
}

export async function POST(request: Request) {
  try {
    const body: GenerateRepliesRequest = await request.json();

    // Log the request body
    console.log("Received request body:", body);

    const {
      targetCasthash,
      targetFid,
      replierFid,
      includeUserCasts = true,
      includeConversation = true,
      customInput,
    } = body;

    // Validate required parameters
    if (!targetCasthash && !targetFid) {
      return NextResponse.json(
        { error: "Either targetCasthash or targetFid is required" },
        { status: 400 }
      );
    }

    // Fetch data based on parameters
    let targetUserCasts = null;
    let conversationData = null;
    let currentUserCasts = null;

    // 1. Fetch target cast and conversation
    if (targetCasthash && includeConversation) {
      conversationData = await fetchConversationCasts(targetCasthash);
    }

    // 2. Fetch target user's casts if requested
    if (targetFid && includeUserCasts) {
      targetUserCasts = await fetchUserCasts(targetFid, 25, true);
    }

    // 3. Fetch replier's casts if available
    if (replierFid && includeUserCasts) {
      currentUserCasts = await fetchUserCasts(replierFid, 25, true);
    }
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });

    // Prepare data for the prompt
    const originalCast = conversationData
      ? { text: conversationData.mainCast }
      : { text: "No cast data available" };

    // Parse the replies from conversation data
    const conversationThread = conversationData
      ? conversationData.replies.map((reply: ConversationReply) => ({
          username: reply.text.split(":")[0].trim(),
          text: reply.text.split(":").slice(1).join(":").trim(),
          nestedReplies: reply.nestedReplies || [],
        }))
      : [];

    // Format target user casts
    const formattedTargetUserCasts = targetUserCasts
      ? {
          castsText: targetUserCasts.castsText,
          authorBio: targetUserCasts.authorBio,
        }
      : { castsText: [], authorBio: "" };

    // Format current user casts (replier)
    const formattedCurrentUserCasts = currentUserCasts
      ? {
          castsText: currentUserCasts.castsText,
          authorBio: currentUserCasts.authorBio,
        }
      : { castsText: [], authorBio: "" };

    // Build the prompt
    const prompt = `You are crafting engaging, natural, and personalized replies for a Farcaster conversation. The goal is to help the user sound like themselves — witty, relatable, and context-aware — while fitting naturally into the ongoing conversation.

### Original Cast Being Replied To:
"${originalCast.text}"

### Conversation Thread:
${conversationThread
  .map((c: { username: string; text: string }) => `${c.username}: ${c.text}`)
  .join("\n")}
${conversationThread
  .flatMap((c: { nestedReplies?: string[] }) => c.nestedReplies || [])
  .map((reply: string) => `- ${reply}`)
  .join("\n")}

### Target User (Person Being Replied To):
Profile Bio: "${formattedTargetUserCasts.authorBio}"

Recent Casts by Target User:
${formattedTargetUserCasts.castsText.slice(0, 10).join("\n\n")}

### Current User (Person Making the Reply):
Profile Bio: "${formattedCurrentUserCasts.authorBio}"

Recent Casts by Current User:
${formattedCurrentUserCasts.castsText.slice(0, 10).join("\n\n")}

### Core Behavioral Rules:
1. Prioritize the *conversation context* and tone of recent comments over anything else.
2. Use previous casts only to understand writing style, humor level, and personality — **not** to directly reference past topics unless they’re genuinely relevant.
3. Avoid overconnecting unrelated things (e.g., referencing coding when the cast is about someone’s new phone).
4. Use natural, Gen Z / Crypto Twitter phrasing. Think playful, casual, confident, sometimes ironic — not try-hard or overly formal.
5. Keep replies short, usually less than one-liners. Engaging and scroll-stopping, not essay-length.
6. When unsure, default to a fun, friendly, or witty tone rather than over-contextualizing.
7. Use crypto-native expressions, slang, and tone common on Farcaster or Crypto Twitter when appropriate (e.g., “vibes,” “based,” “ngl,” “alpha,” “mid,” “drip,” “fired up,” etc.).

---

${
  customInput
    ? `The user has drafted the following reply:
"${customInput}"

Enhance this reply by:
1. Keeping the user's intent intact.
2. Making it sound natural, witty, and scroll-worthy.
3. Adding subtle contextual touches if they *genuinely* fit the ongoing conversation.
4. Using crypto / Farcaster tone and slang naturally.
5. Staying concise and human (no AI-sounding phrases or filler).

Return your response in JSON only:
{
  "enhancedReply": "The enhanced reply text",
  "personalization": "Brief note on how tone and context were adapted"
}`
    : `Generate 3 different reply options that:
1. Match the current user’s tone and vibe.
2. Fit naturally in the conversation (prioritize the cast + comment thread heavily).
3. Reflect crypto-twitter / Farcaster tone — witty, casual, relatable.
4. Avoid forced callbacks to unrelated previous topics.
5. Keep them short, mostly one-liners, easy to imagine being actually cast.
6. Vary in tone: one witty/fun, one chill/supportive, one playful/smart, one very short and similar to other conversation but unique.

Before writing, briefly analyze:
- The target user’s tone and posting vibe.
- The current user’s typical style and phrasing patterns.

Then return your response in JSON only:
{
  "replies": [
    {
      "text": "First reply option",
      "personalization": "How this connects to the current conversation tone"
    },
    {
      "text": "Second reply option",
      "personalization": "How this fits both users’ styles"
    },
    {
      "text": "Third reply option",
      "personalization": "How it aligns with crypto-twitter / Farcaster vibe"
    },
    {
      "text": "Fourth reply option",
      "personalization": "How it similar to other comments(conversation) still unique and witty"
    }
  ]
}`
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
      system:
        "Always respond with valid JSON only. No other text or explanations.",
    });

    console.log("clear Response:", response);

    let responseText = "";
    if (response.content && response.content.length > 0) {
      // Check if the content block has a 'text' type
      const textBlock = response.content.find((block) => block.type === "text");
      if (textBlock && "text" in textBlock) {
        responseText = textBlock.text;
      } else {
        // Fallback: try to get content from the first block
        responseText =
          response.content[0]?.type === "text"
            ? (response.content[0] as any).text
            : JSON.stringify(response.content);
      }
    }

    // Parse the JSON from the response
    let result;

    try {
      result = JSON.parse(responseText);
    } catch (e) {
      // If the response isn't valid JSON, try to extract JSON from the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        console.log(e);
        throw new Error("Failed to parse response as JSON: " + responseText);
      }
    }

    // Store replies in MongoDB
    try {
      // Ensure we have required fields for storing
      if (targetCasthash && replierFid && targetFid) {
        await connectDB();

        // Convert result to reply options array
        const replyOptions: Array<{
          text: string;
          personalization?: string;
        }> = [];

        if ("replies" in result && Array.isArray(result.replies)) {
          // Regular replies (3 options)
          replyOptions.push(
            ...result.replies.map((r: any) => ({
              text: r.text,
              personalization: r.personalization,
            }))
          );
        } else if ("enhancedReply" in result) {
          // Enhanced reply (single)
          replyOptions.push({
            text: result.enhancedReply,
            personalization: result.personalization,
          });
        }

        if (replyOptions.length > 0) {
          // Find existing reply document or create new one
          const existingReply = await Reply.findOne({
            replierFid: replierFid,
            targetFid: targetFid,
            targetHash: targetCasthash,
          });

          if (existingReply) {
            // Append new replies to existing ones (avoid duplicates based on text)
            const existingTexts = new Set(
              existingReply.replies.map((r) => r.text)
            );
            const newReplies = replyOptions.filter(
              (r) => !existingTexts.has(r.text)
            );

            if (newReplies.length > 0) {
              existingReply.replies.push(...newReplies);
              await existingReply.save();
            }
          } else {
            // Create new reply document
            await Reply.create({
              replierFid: replierFid,
              targetFid: targetFid,
              targetHash: targetCasthash,
              replies: replyOptions,
            });
          }
        }
      }
    } catch (dbError) {
      // Log error but don't fail the request
      console.error("Error storing replies in MongoDB:", dbError);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 400 }
    );
  }
}
