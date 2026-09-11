import { defineConfig } from "drizzle-kit";

const buildUrl = new URL("postgresql://localhost:5432/cost_track");
buildUrl.username = "build";
buildUrl.password = "placeholder";

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL ?? buildUrl.toString(),
  },
});
