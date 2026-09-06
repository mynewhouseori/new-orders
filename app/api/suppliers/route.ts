import { asc } from "drizzle-orm";
import { ensureOrdersSchema, getDb } from "../../../db";
import { suppliers } from "../../../db/schema";

export async function GET() {
  try {
    await ensureOrdersSchema();
    const rows = await getDb().select().from(suppliers).orderBy(asc(suppliers.name)).limit(500);
    return Response.json({ suppliers: rows });
  } catch {
    return Response.json({ error: "רשימת הספקים אינה זמינה כרגע." }, { status: 500 });
  }
}
