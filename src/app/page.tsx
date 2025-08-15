import { Metadata } from "next";
import App from "./app";
import { APP_NAME, APP_DESCRIPTION, APP_OG_IMAGE_URL } from "~/lib/constants";
import { getFrameEmbedMetadata } from "~/lib/utils";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: APP_NAME,
    openGraph: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [APP_OG_IMAGE_URL],
    },
    other: {
      "fc:frame": JSON.stringify(getFrameEmbedMetadata()),
    },
  };
}

export default function Home({
  searchParams,
}: {
  searchParams: { castHash?: string; castFid?: string; viewerFid?: string };
}) {
  // Pass cast share parameters as props if they exist
  const hasShareParams = searchParams.castHash || searchParams.castFid || searchParams.viewerFid;
  
  return (<App 
    title={hasShareParams ? "Reply Assistant" : undefined}
    castShareParams={hasShareParams ? searchParams : undefined}
  />);
}
