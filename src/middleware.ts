// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export function middleware(request: NextRequest) {
//   const origin = request.headers.get("origin") ?? "*";

//   const responseHeaders = new Headers({
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Methods":
//       "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
//     "Access-Control-Allow-Headers":
//       request.headers.get("access-control-request-headers") ?? "*",
//     "Access-Control-Max-Age": "86400",
//   });

//   if (request.method === "OPTIONS") {
//     return new NextResponse(null, { status: 204, headers: responseHeaders });
//   }

//   const response = NextResponse.next();
//   responseHeaders.forEach((value, key) => {
//     response.headers.set(key, value);
//   });
//   return response;
// }

// export const config = {
//   matcher: ["/api/:path*"],
// };
