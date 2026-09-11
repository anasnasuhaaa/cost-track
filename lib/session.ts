import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { assertAuthConfigured, auth } from "@/lib/auth";

export const getSession = cache(async () => {
  assertAuthConfigured();
  return auth.api.getSession({ headers: await headers() });
});

export const requireUser = cache(async () => {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return session.user;
});

export async function getRequestUser() {
  assertAuthConfigured();
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}
