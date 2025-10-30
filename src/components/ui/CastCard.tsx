import React from "react";

const CastCard = ({ location }: { location: any }) => {
  const { cast } = location;
  const { author, text, embeds = [], timestamp } = cast;

  // Format timestamp
  const formatDate = (ts: any) => {
    if (!ts) return "Date unavailable";
    const date = new Date(ts);
    // Check if date is valid
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Detect embed type
  const getEmbedType = (url: any) => {
    if (!url) return "none";
    if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
    if (url.includes(".m3u8") || url.includes("stream.farcaster"))
      return "video";
    if (
      url.includes("imagedelivery.net") ||
      url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    )
      return "image";
    if (url.startsWith("0x")) return "hash";
    return "link";
  };

  // Filter and categorize embeds
  const images = embeds.filter((e: any) => getEmbedType(e) === "image");
  const videos = embeds.filter((e: any) => getEmbedType(e) === "video");
  const tweets = embeds.filter((e: any) => getEmbedType(e) === "twitter");
  const hasVideo = videos.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={author.pfpUrl}
            alt={author.displayName}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <div className="font-semibold text-gray-900">{author.username}</div>
            <div className="text-sm text-gray-500">{formatDate(timestamp)}</div>
          </div>
        </div>
        <div className="w-8 h-8 flex items-center justify-center">
          <img src="/farcaster-purple.png" alt="Farcaster" className="" />
        </div>
      </div>

      {/* Text Content with Image Wrapping */}
      <div className="mb-2">
        {images.length > 0 ? (
          <div className="flow-root">
            {/* Image floated to the right */}
            <div className="float-right ml-4 mb-2">
              {images.map((img: any, idx: number) => (
                <img
                  key={idx}
                  src={img}
                  alt=""
                  className="w-24 h-24 object-cover rounded-xl mb-2 last:mb-0"
                />
              ))}
            </div>
            {/* Text wraps around the image */}
            <div className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
              {text}
            </div>
            {/* Video Link */}
            {hasVideo && (
              <a
                href="#"
                className="inline-block text-blue-600 hover:underline mt-2 text-sm"
                onClick={(e) => e.preventDefault()}
              >
                video
              </a>
            )}
          </div>
        ) : (
          <div>
            <div className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
              {text}
            </div>
            {/* Video Link */}
            {hasVideo && (
              <a
                href="#"
                className="inline-block text-blue-600 hover:underline mt-2 text-sm"
                onClick={(e) => e.preventDefault()}
              >
                video
              </a>
            )}
          </div>
        )}
      </div>

      {/* Twitter Embeds */}
      {tweets.length > 0 && (
        <div className="space-y-2 mb-4">
          {tweets.map((tweet: any, idx: number) => (
            <a
              key={idx}
              href={tweet}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <img
                  src="/farcaster-purple.png"
                  alt="Farcaster"
                  className="w-4 h-4"
                />
                <span className="truncate">{tweet}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default CastCard;
