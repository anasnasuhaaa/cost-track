import "../env.config";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { category } from "./schema";

const defaultCategories = [
  ["expense-food", "Makanan", "EXPENSE", "Utensils"],
  ["expense-transport", "Transportasi", "EXPENSE", "Car"],
  ["expense-education", "Pendidikan", "EXPENSE", "BookOpen"],
  ["expense-shopping", "Belanja", "EXPENSE", "ShoppingBag"],
  ["expense-bills", "Tagihan", "EXPENSE", "ReceiptText"],
  ["expense-entertainment", "Hiburan", "EXPENSE", "Clapperboard"],
  ["expense-health", "Kesehatan", "EXPENSE", "HeartPulse"],
  ["expense-other", "Lainnya", "EXPENSE", "Shapes"],
  ["income-salary", "Gaji", "INCOME", "BriefcaseBusiness"],
  ["income-freelance", "Freelance", "INCOME", "Laptop"],
  ["income-allowance", "Uang Saku", "INCOME", "WalletCards"],
  ["income-gift", "Hadiah", "INCOME", "Gift"],
  ["income-other", "Pemasukan Lainnya", "INCOME", "CircleDollarSign"],
] as const;

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL wajib diisi untuk menjalankan seed.");
  }

  const database = drizzle(neon(databaseUrl));
  await database
    .insert(category)
    .values(
      defaultCategories.map(([systemKey, name, type, icon]) => ({
        systemKey,
        name,
        type,
        icon,
        isSystem: true,
      })),
    )
    .onConflictDoNothing({ target: category.systemKey });
}

seed()
  .then(() => console.log("Kategori bawaan siap digunakan."))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Seed gagal.");
    process.exitCode = 1;
  });
