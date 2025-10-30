interface CastReply {
  text: string;
  author: {
    username: string;
  };
  direct_replies?: CastReply[];
}

interface FormattedReply {
  text: string;
  nestedReplies?: string[];
}

export async function fetchConversationCasts(
  identifier: string,
  type: "hash" | "url" = "hash",
  replyDepth: number = 25,
  includeChronologicalParentCasts: boolean = false,
  limit: number = 20
) {
  try {
    const url = new URL(
      "https://api.neynar.com/v2/farcaster/cast/conversation"
    );

    // Add query parameters
    url.searchParams.append("identifier", identifier);
    url.searchParams.append("type", type);
    url.searchParams.append("reply_depth", replyDepth.toString());
    url.searchParams.append(
      "include_chronological_parent_casts",
      includeChronologicalParentCasts.toString()
    );
    url.searchParams.append("limit", limit.toString());

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-api-key": process.env.NEYNAR_API_KEY || "",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Extract texts from the conversation
    const mainCast = `${data.conversation.cast.author.username}: ${data.conversation.cast.text}`;

    const replies = data.conversation.cast.direct_replies.map(
      (reply: CastReply): FormattedReply => {
        const replyText = `${reply.author.username}: ${reply.text}`;
        const replyData: FormattedReply = {
          text: replyText,
        };

        if (reply.direct_replies && reply.direct_replies.length > 0) {
          replyData.nestedReplies = reply.direct_replies.map(
            (nestedReply: CastReply) =>
              `${nestedReply.author.username}: ${nestedReply.text}`
          );
        }

        return replyData;
      }
    );

    console.log("Main cast:", mainCast);
    console.log("\nDirect replies:");
    replies.forEach((reply: FormattedReply) => {
      console.log(reply.text);
      if (reply.nestedReplies && reply.nestedReplies.length > 0) {
        console.log("  Nested replies:");
        reply.nestedReplies.forEach((nested: string) => {
          console.log(`    ${nested}`);
        });
      }
    });

    return {
      mainCast,
      replies,
    };
  } catch (error) {
    console.error("Error fetching conversation casts:", error);
    throw error;
  }
}
