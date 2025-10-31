import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Read the static og-image.png file from the public folder
    const imagePath = join(process.cwd(), "public", "og-image.png");
    const imageBuffer = await readFile(imagePath);

    // Return the image with appropriate headers
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error loading og-image.png:", error);
    return new Response("Image not found", { status: 404 });
  }
}
