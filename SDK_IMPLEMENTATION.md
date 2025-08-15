# Farcaster Mini App SDK Implementation

## Overview

We have successfully implemented the `@farcaster/miniapp-sdk` integration to handle cast share contexts and generate personalized replies.

## Key Features Implemented

### 1. SDK Integration
- Installed `@farcaster/miniapp-sdk` package
- Added SDK context detection for cast share scenarios
- Integrated with existing `@neynar/react` mini app framework

### 2. Cast Share Context Detection
- Automatically detects when the app is opened in a "cast_share" context
- Extracts the shared cast information including:
  - Author details (fid, username, displayName, pfpUrl)
  - Cast content (text, hash, embeds, etc.)
  - Metadata (timestamp, mentions, channelKey)

### 3. Reply Generation System

#### Automatic Reply Generation
- When in cast share context, automatically calls `/api/generate-replies`
- Displays multiple AI-generated reply suggestions with:
  - Generated reply text
  - Communication style explanation
  - Personalization reasoning
  - "Use This Reply" and "Edit" buttons

#### Custom Input Enhancement
- Users can type their own reply ideas
- System enhances the custom input using the same API
- Returns a single enhanced reply with personalization explanation

### 4. UI/UX Improvements
- **Header**: Shows "Replying to @username" when in share context
- **Cast Display**: Shows the original cast being replied to
- **Refresh Button**: Allows regenerating replies
- **Loading States**: Shows generating indicators
- **Reply Cards**: Beautiful cards for each suggested reply
- **Context-Aware Placeholders**: Different input hints based on context

## API Integration

### Generate Replies Endpoint
**Endpoint**: `POST /api/generate-replies`

**For Auto-Generated Replies** (no customInput):
```json
{
  "targetCasthash": "0x...",
  "targetFid": "12345"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "targetUserPersona": { /* ... */ },
    "replies": [
      {
        "text": "Generated reply text",
        "style": "Style description", 
        "personalization": "Why this works explanation"
      }
    ]
  }
}
```

**For Enhanced Custom Input**:
```json
{
  "targetCasthash": "0x...",
  "targetFid": "12345",
  "customInput": "User's custom reply idea"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "enhancedReply": "Enhanced version of user input",
    "personalization": "Explanation of enhancements"
  }
}
```

## File Structure

### New Files
- `src/types/miniapp.ts` - TypeScript types for SDK integration
- `SDK_IMPLEMENTATION.md` - This documentation

### Modified Files
- `src/components/ui/AIChat.tsx` - Complete rewrite with SDK integration
- `package.json` - Added `@farcaster/miniapp-sdk` dependency

## Usage Flow

### Cast Share Context
1. User shares a cast to the mini app
2. App detects `cast_share` context using SDK
3. Automatically generates reply suggestions
4. User can:
   - Use a suggested reply directly
   - Edit a suggested reply
   - Type their own idea for enhancement
   - Refresh to get new suggestions

### Regular Context
- Works as before with standard AI assistant functionality
- Shows conversation starters and suggestions

## Technical Implementation Details

### SDK Context Detection
```typescript
const checkContext = async () => {
  try {
    const sdkContext = await sdk.context;
    if (sdkContext.location && sdkContext.location.type === 'cast_share') {
      setIsShareContext(true);
      const castLocation = sdkContext.location as any;
      if (castLocation.cast) {
        setSharedCast(castLocation.cast);
      }
    }
  } catch (error) {
    console.error('Failed to get SDK context:', error);
  }
};
```

### Reply Generation
```typescript
const generateReplies = useCallback(async (customInput?: string) => {
  if (!sharedCast) return;
  
  const response = await fetchWithAuth('/api/generate-replies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetCasthash: sharedCast.hash,
      targetFid: sharedCast.author.fid.toString(),
      customInput,
    }),
  });
  
  // Handle response based on whether it's custom input or auto-generated
}, [sharedCast]);
```

## Authentication
- Uses existing `fetchWithAuth` function for authenticated API calls
- Integrates with `@farcaster/quick-auth` SDK
- Maintains security for all API requests

## Error Handling
- Graceful fallbacks for SDK initialization failures
- Error messages for failed reply generation
- Loading states to improve user experience

## Future Enhancements
- Support for other location types (notifications, etc.)
- Reply history and favorites
- Custom persona settings
- Advanced reply filtering and categorization