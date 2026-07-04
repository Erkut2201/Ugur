import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config();

const usePostgres =
  process.env.POSTGRES_URL ||
  (process.env.PG_HOST &&
    process.env.PG_USER &&
    process.env.PG_PASSWORD &&
    process.env.PG_DATABASE);

export default usePostgres
  ? defineConfig({
      dialect: "postgresql",
      schema: "./shared/schema.ts",
      out: "./drizzle",
      dbCredentials: process.env.POSTGRES_URL
        ? { url: process.env.POSTGRES_URL }
        : {
            host: process.env.PG_HOST!,
            port: Number(process.env.PG_PORT ?? 5432),
            user: process.env.PG_USER!,
            password: process.env.PG_PASSWORD!,
            database: process.env.PG_DATABASE!,
            ssl: false,
          },
    })
  : defineConfig({
      dialect: "sqlite",
      schema: "./shared/schema.ts",
      out: "./drizzle",
      dbCredentials: {
        url: process.env.SQLITE_PATH ?? "./data/local.db",
      },
    });
