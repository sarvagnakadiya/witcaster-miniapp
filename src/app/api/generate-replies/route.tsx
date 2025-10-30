import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fetchConversationCasts } from "~/lib/farcaster/fetchConversation";
import { fetchUserCasts } from "~/lib/farcaster/fetchCasts";

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
    let prompt = `You are helping craft contextual, personalized replies for a Farcaster conversation.

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

### Instructions:`;

    if (customInput) {
      prompt += `
The user has drafted the following reply:
"${customInput}"

Enhance this reply while:
1. Maintaining the user's original message and intent
2. Adding subtle contextual elements that would resonate with the recipient
3. Keeping a natural, human tone
4. Making it more engaging (but not dramatically different)
5. keep the replies short and concise (mostly 1 liner)
6. take recent events posted on cast into account to generate the reply
7. Treat profile bios as optional background context only; do not rely on them or reference them unless clearly relevant. Prioritize the conversation content and recent casts.

Analyze both users' communication styles and interests to make this enhancement effective.

Return your response in this JSON format (and only JSON, no other text):
{
  "enhancedReply": "The enhanced reply text",
  "personalization": "Brief explanation of how this was personalized"
}`;
    } else {
      prompt += `
Generate 3 different reply options that:
1. Match the current user's writing style and tone
2. Will likely resonate with the recipient based on their interests and persona
3. Are contextually appropriate to the conversation
4. Vary in approach (e.g., one humorous, one thoughtful, one concise)
5. Feel authentic and not AI-generated
6. keep the replies short and concise (less than 1 line)
7. Treat profile bios as optional background context; avoid referencing or relying on them unless they provide clear, relevant signal. Prefer the conversation content and recent casts.

First, briefly analyze both users to understand:
- The target user's interests, common topics, and communication style
- The current user's typical tone and writing patterns

Then create the 3 reply options based on this analysis.

Return your response in this JSON format (and only JSON, no other text):
{
  "replies": [
    {
      "text": "First reply option",
      "style": "Brief description of this reply's approach",
      "personalization": "How this connects to recipient"
    },
    {
      "text": "Second reply option",
      "style": "Brief description of this reply's approach",
      "personalization": "How this connects to recipient"
    },
    {
      "text": "Third reply option",
      "style": "Brief description of this reply's approach",
      "personalization": "How this connects to recipient"
    }
  ]
}`;
    }

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
        throw new Error("Failed to parse response as JSON: " + responseText);
      }
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
