# AI Context for Farcaster Mini App Starter Kit

## Project Purpose

A starter kit for building Farcaster mini-apps with Next.js, TypeScript, and QuickAuth.

## Key Conventions

- Use `fetchWithAuth` for all authenticated requests.
- Use `verifyAuth` in all protected API routes.
- Use semantic Tailwind color classes.
- Place UI components in `src/components/ui/`.
- Place API routes in `src/app/api/`.
- Use TypeScript everywhere.

## File Structure

- `src/lib/auth.ts`: Auth utilities
- `src/app/api/`: API routes
- `src/components/`: UI components
- `src/app/globals.css`: Theme variables
- `tailwind.config.ts`: Tailwind config

## Public vs Protected

- `/` and `/api/auth/*` are public.
- All other routes require authentication.

## Example Usage

```typescript
// Authenticated GET
const res = await fetchWithAuth("/api/protected");

// Authenticated POST
const res = await fetchWithAuth("/api/protected", {
  method: "POST",
  body: JSON.stringify({ foo: "bar" }),
});
```

For API

```typescript
export async function POST(request: Request) {
  // Verify authentication
  const fid = await verifyAuth(request);
  if (!fid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Perform the rest
}
```

## Build with Farcaster

Reference the link -> https://miniapps.farcaster.xyz/llms.txt for any Farcaster SDK related query.

## Query with Neynar

Reference the link -> https://docs.neynar.com/llms.txt for any data fetch query from Neynar.
