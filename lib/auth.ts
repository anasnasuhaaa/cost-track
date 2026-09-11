import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";

const isProduction = process.env.NODE_ENV === "production";
const signupEnabled = process.env.SIGNUP_ENABLED !== "false";

export const auth = betterAuth({
  appName: "Cost Track",
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  // This build-only fallback lets static compilation run without real secrets.
  // Every runtime entry point calls assertAuthConfigured in production.
  secret: process.env.BETTER_AUTH_SECRET ?? "cost-track-build-only-placeholder-do-not-use",
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  disabledPaths: signupEnabled ? [] : ["/sign-up/email"],
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          await db.batch([
            db.insert(schema.userSettings).values({ userId: createdUser.id }).onConflictDoNothing(),
            db.insert(schema.financeAccount).values({
              userId: createdUser.id,
              name: "Cash",
              type: "CASH",
              isDefault: true,
            }).onConflictDoNothing(),
          ]);
        },
      },
    },
  },
  plugins: [nextCookies()],
  advanced: { useSecureCookies: isProduction },
});

export function assertAuthConfigured() {
  if (isProduction && !process.env.BETTER_AUTH_SECRET) {
    throw new Error("Konfigurasi autentikasi server belum lengkap.");
  }
}
