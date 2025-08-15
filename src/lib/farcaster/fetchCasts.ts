export async function fetchUserCasts(
  fid: string,
  limit: number,
  includeReplies: boolean
) {
  try {
    const url = new URL("https://api.neynar.com/v2/farcaster/feed/user/casts");

    // Add query parameters
    url.searchParams.append("fid", fid);
    url.searchParams.append("limit", limit.toString());
    url.searchParams.append("include_replies", includeReplies.toString());

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
    const castsText = data.casts.map((cast: any) => cast.text);
    const authorBio = data.casts[0]?.author?.profile?.bio?.text || "";

    return {
      castsText,
      authorBio,
    };
  } catch (error) {
    console.error("Error fetching Farcaster casts:", error);
    throw error;
  }
}
