import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle", // Output directory for migrations
  dialect: "mysql", // mysql2
  dbCredentials: {
    url: process.env.DATABASE_URL || "mysql://user:password@localhost:3306/crm",
  },
  verbose: true,
  strict: true,
});
