import { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_NAME, APP_DESCRIPTION, APP_OG_IMAGE_URL } from "~/lib/constants";
import { getFrameEmbedMetadata } from "~/lib/utils";

export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { castHash?: string; castFid?: string; viewerFid?: string };
}): Promise<Metadata> {
  const { castHash, castFid } = searchParams;
  
  // Create a dynamic image URL if we have cast parameters
  const imageUrl = castHash && castFid 
    ? `${process.env.NEXT_PUBLIC_URL || 'https://witcaster-miniapp.vercel.app'}/api/opengraph-image?castHash=${castHash}&castFid=${castFid}`
    : APP_OG_IMAGE_URL;

  return {
    title: `${APP_NAME} - Share`,
    openGraph: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [imageUrl],
    },
    other: {
      "fc:frame": JSON.stringify(getFrameEmbedMetadata(imageUrl)),
    },
  };
}

export default function SharePage({
  searchParams,
}: {
  searchParams: { castHash?: string; castFid?: string; viewerFid?: string };
}) {
  const { castHash, castFid, viewerFid } = searchParams;
  
  // Build the URL with parameters to pass to the main app
  const params = new URLSearchParams();
  if (castHash) params.set('castHash', castHash);
  if (castFid) params.set('castFid', castFid);
  if (viewerFid) params.set('viewerFid', viewerFid);
  
  const redirectUrl = params.toString() ? `/?${params.toString()}` : '/';
  
  // Redirect to home page with cast parameters
  redirect(redirectUrl);
}