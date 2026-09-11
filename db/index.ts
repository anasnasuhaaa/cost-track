import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://cost_track:cost_track@localhost:5432/cost_track";

export const db = drizzle(neon(databaseUrl), { schema });
