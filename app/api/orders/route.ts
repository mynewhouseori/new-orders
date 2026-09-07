import { desc, eq, sql } from "drizzle-orm";
import { ensureOrdersSchema, getDb } from "../../../db";
import { orders, suppliers } from "../../../db/schema";

type OrderInput = typeof orders.$inferInsert;

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status = message.includes("no such table") ? 503 : 500;
  return Response.json({ error: status === 503 ? "מסד הנתונים עדיין מתעדכן. נסו שוב בעוד רגע." : "שמירת ההזמנות אינה זמינה כרגע." }, { status });
}

export async function GET() {
  try {
    await ensureOrdersSchema();
    const db = getDb();
    const rows = await db.select().from(orders).orderBy(desc(orders.updatedAt)).limit(500);
    return Response.json({ orders: rows });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await ensureOrdersSchema();
    const payload = (await request.json()) as Partial<OrderInput>;
    if (!payload.id || !payload.title?.trim() || !payload.supplierName?.trim()) {
      return Response.json({ error: "חסרים פרטי הזמנה נדרשים." }, { status: 400 });
    }

    const value: OrderInput = {
      id: payload.id,
      orderNumber: payload.orderNumber?.trim() || "ללא מספר",
      orderDate: payload.orderDate || new Date().toISOString().slice(0, 10),
      siteId: payload.siteId === "lohomei_sinai" ? "lohomei_sinai" : "magen_avraham",
      title: payload.title.trim(),
      supplierName: payload.supplierName.trim(),
      supplierId: payload.supplierId || "",
      supplierContact: payload.supplierContact || "",
      supplierPhone: payload.supplierPhone || "",
      supplierEmail: payload.supplierEmail || "",
      supplierAddress: payload.supplierAddress || "",
      deliveryDate: payload.deliveryDate || "",
      description: payload.description || "",
      cost: payload.cost || "",
      vatIncluded: payload.vatIncluded || "לא",
      priceIncludes: payload.priceIncludes || "",
      paymentTerms: payload.paymentTerms || "45 יום",
      approver: payload.approver || "",
      status: payload.status || "טיוטה",
      updatedAt: new Date().toISOString(),
    };

    const db = getDb();
    await db.insert(suppliers).values({
      id: `supplier-${crypto.randomUUID()}`,
      name: value.supplierName,
      companyId: value.supplierId,
      contactName: value.supplierContact,
      phone: value.supplierPhone,
      email: value.supplierEmail,
      address: value.supplierAddress,
      source: "נשמר באפליקציה",
      updatedAt: value.updatedAt,
    }).onConflictDoUpdate({
      target: suppliers.name,
      set: {
        companyId: sql`CASE WHEN excluded.company_id <> '' THEN excluded.company_id ELSE ${suppliers.companyId} END`,
        contactName: sql`CASE WHEN excluded.contact_name <> '' THEN excluded.contact_name ELSE ${suppliers.contactName} END`,
        phone: sql`CASE WHEN excluded.phone <> '' THEN excluded.phone ELSE ${suppliers.phone} END`,
        email: sql`CASE WHEN excluded.email <> '' THEN excluded.email ELSE ${suppliers.email} END`,
        address: sql`CASE WHEN excluded.address <> '' THEN excluded.address ELSE ${suppliers.address} END`,
        source: "נשמר באפליקציה",
        updatedAt: value.updatedAt,
      },
    });
    const [saved] = await db.insert(orders).values(value).onConflictDoUpdate({
      target: orders.id,
      set: value,
    }).returning();
    return Response.json({ order: saved });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureOrdersSchema();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "חסר מזהה הזמנה." }, { status: 400 });
    await getDb().delete(orders).where(eq(orders.id, id));
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
