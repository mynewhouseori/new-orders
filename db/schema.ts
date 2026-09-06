import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull(),
  orderDate: text("order_date").notNull(),
  title: text("title").notNull(),
  supplierName: text("supplier_name").notNull(),
  supplierId: text("supplier_id").notNull().default(""),
  supplierContact: text("supplier_contact").notNull().default(""),
  supplierPhone: text("supplier_phone").notNull().default(""),
  supplierEmail: text("supplier_email").notNull().default(""),
  supplierAddress: text("supplier_address").notNull().default(""),
  deliveryDate: text("delivery_date").notNull().default(""),
  description: text("description").notNull().default(""),
  cost: text("cost").notNull().default(""),
  vatIncluded: text("vat_included").notNull().default("לא"),
  priceIncludes: text("price_includes").notNull().default(""),
  paymentTerms: text("payment_terms").notNull().default("45 יום"),
  approver: text("approver").notNull().default(""),
  status: text("status").notNull().default("טיוטה"),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("idx_orders_updated_at").on(table.updatedAt),
  index("idx_orders_status").on(table.status),
]);

export const suppliers = sqliteTable("suppliers", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  companyId: text("company_id").notNull().default(""),
  contactName: text("contact_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default(""),
  source: text("source").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("idx_suppliers_name").on(table.name),
]);
