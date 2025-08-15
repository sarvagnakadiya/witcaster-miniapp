export type MiniAppUser = {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
};

export type MiniAppCast = {
  author: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  hash: string;
  parentHash?: string;
  parentFid?: number;
  timestamp?: number;
  mentions?: MiniAppUser[];
  text: string;
  embeds?: string[];
  channelKey?: string;
};

export type GenerateRepliesResponse = {
  success: boolean;
  data: {
    targetUserPersona: {
      interests: string[];
      commonTopics: string[];
      communicationStyle: string;
    };
    replies: {
      text: string;
      style: string;
      personalization: string;
    }[];
  };
};

export type EnhancedReplyResponse = {
  success: boolean;
  data: {
    enhancedReply: string;
    personalization: string;
  };
};
