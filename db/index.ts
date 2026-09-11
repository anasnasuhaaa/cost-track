import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const buildUrl = new URL("postgresql://localhost:5432/cost_track");
buildUrl.username = "build";
buildUrl.password = "placeholder";
const databaseUrl = process.env.DATABASE_URL ?? buildUrl.toString();

export const db = drizzle(neon(databaseUrl), { schema });
