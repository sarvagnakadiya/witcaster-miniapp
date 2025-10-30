// import { NextResponse } from "next/server";

// // Respond to HEAD requests for COOP/health checks without 404
// export async function HEAD() {
//   return new Response(null, { status: 204 });
// }

// // Redirect plain /share visits to home (the actual share page is /share/[fid])
// export async function GET() {
//   return NextResponse.redirect(
//     new URL("/", process.env.NEXT_PUBLIC_URL || "http://localhost:3000"),
//     308
//   );
// }
