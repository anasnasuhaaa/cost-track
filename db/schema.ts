import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const accountType = pgEnum("account_type", [
  "CASH",
  "BANK",
  "EWALLET",
  "OTHER",
]);
export const transactionType = pgEnum("transaction_type", [
  "INCOME",
  "EXPENSE",
]);
export const transactionSource = pgEnum("transaction_source", ["MANUAL", "AI"]);

// Better Auth tables. The table and column names intentionally follow its
// canonical Drizzle schema so the adapter can use them without remapping.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userSettings = pgTable(
  "user_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    currency: text("currency").default("IDR").notNull(),
    locale: text("locale").default("id-ID").notNull(),
    timezone: text("timezone").default("Asia/Jakarta").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("user_settings_user_id_uq").on(table.userId)],
);

export const financeAccount = pgTable(
  "finance_account",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: accountType("type").default("CASH").notNull(),
    openingBalance: integer("opening_balance").default(0).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("finance_account_user_id_idx").on(table.userId),
    uniqueIndex("finance_account_user_name_uq").on(table.userId, table.name),
  ],
);

export const category = pgTable(
  "category",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: transactionType("type").notNull(),
    icon: text("icon"),
    systemKey: text("system_key"),
    isSystem: boolean("is_system").default(false).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("category_user_id_idx").on(table.userId),
    uniqueIndex("category_system_key_uq").on(table.systemKey),
  ],
);

export const financeTransaction = pgTable(
  "finance_transaction",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: transactionType("type").notNull(),
    amount: integer("amount").notNull(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => financeAccount.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "restrict" }),
    description: text("description").notNull(),
    transactionDate: date("transaction_date", { mode: "string" }).notNull(),
    source: transactionSource("source").default("MANUAL").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("finance_transaction_user_id_idx").on(table.userId),
    index("finance_transaction_user_date_idx").on(table.userId, table.transactionDate),
    index("finance_transaction_user_type_date_idx").on(
      table.userId,
      table.type,
      table.transactionDate,
    ),
    index("finance_transaction_user_category_idx").on(table.userId, table.categoryId),
    index("finance_transaction_user_account_idx").on(table.userId, table.accountId),
  ],
);

export type FinanceAccount = typeof financeAccount.$inferSelect;
export type Category = typeof category.$inferSelect;
export type FinanceTransaction = typeof financeTransaction.$inferSelect;
