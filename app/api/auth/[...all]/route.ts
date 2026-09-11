import { toNextJsHandler } from "better-auth/next-js";

import { assertAuthConfigured, auth } from "@/lib/auth";

const handlers = toNextJsHandler(auth);

export async function GET(request: Request) {
  assertAuthConfigured();
  return handlers.GET(request);
}

export async function POST(request: Request) {
  assertAuthConfigured();
  return handlers.POST(request);
}
