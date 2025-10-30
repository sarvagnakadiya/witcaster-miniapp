import { Metadata } from "next";
import App from "./app";
import { APP_NAME, APP_DESCRIPTION, APP_OG_IMAGE_URL } from "~/lib/constants";
import { getMiniAppEmbedMetadata } from "~/lib/utils";

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
      "fc:frame": JSON.stringify(getMiniAppEmbedMetadata()),
    },
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    castHash?: string;
    castFid?: string;
    viewerFid?: string;
  }>;
}) {
  // Await the searchParams promise
  const params = await searchParams;

  // Pass cast share parameters as props if they exist
  const hasShareParams = params.castHash || params.castFid || params.viewerFid;

  return (
    <App
      title={hasShareParams ? "Reply Assistant" : undefined}
      castShareParams={hasShareParams ? params : undefined}
    />
  );
}