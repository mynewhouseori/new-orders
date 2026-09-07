import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { historicalSuppliers } from "./supplier-seed";

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
      site_id TEXT NOT NULL DEFAULT 'magen_avraham',
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
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      company_id TEXT NOT NULL DEFAULT '',
      contact_name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers (name)"),
  ]);

  const seededAt = "2026-09-06T00:00:00.000Z";
  await env.DB.batch(historicalSuppliers.map((supplier) => env.DB.prepare(`
    INSERT INTO suppliers (id, name, company_id, contact_name, phone, email, address, source, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO NOTHING
  `).bind(supplier.id, supplier.name, supplier.companyId, supplier.contactName, supplier.phone, supplier.email, supplier.address, supplier.source, seededAt)));
}
