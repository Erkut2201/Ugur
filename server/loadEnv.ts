// server/loadEnv.ts
// Lädt .env.development wenn vorhanden (npm run dev), sonst .env (Produktion)
// Muss als ERSTES importiert werden, bevor andere Module auf process.env zugreifen.

import { config } from "dotenv";
import { existsSync } from "fs";

if (existsSync(".env.development")) {
  config({ path: ".env.development", override: true });
} else {
  config({ override: true });
}
