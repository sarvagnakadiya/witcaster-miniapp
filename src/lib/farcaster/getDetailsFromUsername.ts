export async function getDetailsFromUsername(username: string) {
  try {
    const url = new URL(
      `https://api.neynar.com/v2/farcaster/user/by_username/${username}`
    );

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

    const bio = data.user.bio.text;
    const fid = data.user.fid;
    const displayName = data.user.display_name;
    const pfp = data.user.pfp_url;

    return {
      bio,
      fid,
      displayName,
      pfp,
    };
  } catch (error) {
    console.error("Error fetching Farcaster casts:", error);
    throw error;
  }
}
