import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

export async function ensureOrdersSchema() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY NOT NULL,
      order_number TEXT NOT NULL,
      order_date TEXT NOT NULL,
      title TEXT NOT NULL,
      supplier_name TEXT NOT NULL,
      supplier_id TEXT NOT NULL DEFAULT '',
      supplier_contact TEXT NOT NULL DEFAULT '',
      supplier_phone TEXT NOT NULL DEFAULT '',
      supplier_email TEXT NOT NULL DEFAULT '',
      supplier_address TEXT NOT NULL DEFAULT '',
      delivery_date TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      cost TEXT NOT NULL DEFAULT '',
      vat_included TEXT NOT NULL DEFAULT 'לא',
      price_includes TEXT NOT NULL DEFAULT '',
      payment_terms TEXT NOT NULL DEFAULT '45 יום',
      approver TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'טיוטה',
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders (updated_at)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)"),
  ]);
}
