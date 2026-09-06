"use client";

import { useEffect, useMemo, useState } from "react";

type Order = {
  id: string;
  orderNumber: string;
  orderDate: string;
  title: string;
  supplierName: string;
  supplierId: string;
  supplierContact: string;
  supplierPhone: string;
  supplierEmail: string;
  supplierAddress: string;
  deliveryDate: string;
  description: string;
  cost: string;
  vatIncluded: "כן" | "לא";
  priceIncludes: string;
  paymentTerms: string;
  approver: string;
  status: "טיוטה" | "מאושרת" | "נשלחה";
  updatedAt: string;
};

const COMPANY = {
  officeAddress: "בית סילבר, דרך אבא הלל 7, רמת גן 5252204",
  siteAddress: "מגן אברהם 17/19, יפו תל אביב",
  officeContact: "צחי לנדאו",
  officePhone: "052-4310350",
  officeEmail: "zahi@zlandau.co.il",
  siteContact: "אורי לוין",
  sitePhone: "052-3679976",
  siteEmail: "mynewhouseori@gmail.com",
  mainPhone: "03-5094002",
  invoiceEmail: "ramzi@hadif.co.il",
};

const today = () => new Date().toISOString().slice(0, 10);

const blankOrder = (number = "MA-2026-001"): Order => ({
  id: crypto.randomUUID(),
  orderNumber: number,
  orderDate: today(),
  title: "",
  supplierName: "",
  supplierId: "",
  supplierContact: "",
  supplierPhone: "",
  supplierEmail: "",
  supplierAddress: "",
  deliveryDate: "",
  description: "",
  cost: "",
  vatIncluded: "לא",
  priceIncludes: "",
  paymentTerms: "45 יום",
  approver: "",
  status: "טיוטה",
  updatedAt: new Date().toISOString(),
});

const displayDate = (value: string) => value
  ? new Intl.DateTimeFormat("he-IL").format(new Date(`${value}T12:00:00`))
  : "טרם נקבע";

const escapeCsv = (value: string) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function Home() {
  const [order, setOrder] = useState<Order>(() => blankOrder());
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<"edit" | "history">("edit");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("moshe-hadif-orders");
    if (saved) setOrders(JSON.parse(saved));
  }, []);

  const setField = <K extends keyof Order>(field: K, value: Order[K]) => {
    setOrder((current) => ({ ...current, [field]: value, updatedAt: new Date().toISOString() }));
  };

  const nextNumber = useMemo(() => {
    const max = orders.reduce((result, item) => {
      const match = item.orderNumber.match(/(\d+)$/);
      return Math.max(result, match ? Number(match[1]) : 0);
    }, 0);
    return `MA-${new Date().getFullYear()}-${String(max + 1).padStart(3, "0")}`;
  }, [orders]);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const saveOrder = () => {
    if (!order.title.trim() || !order.supplierName.trim()) {
      flash("יש למלא לפחות כותרת ושם ספק");
      return;
    }
    const updated = [order, ...orders.filter((item) => item.id !== order.id)];
    setOrders(updated);
    localStorage.setItem("moshe-hadif-orders", JSON.stringify(updated));
    flash("ההזמנה נשמרה במכשיר");
  };

  const newOrder = () => {
    setOrder(blankOrder(nextNumber));
    setView("edit");
  };

  const editOrder = (selected: Order) => {
    setOrder(selected);
    setView("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteOrder = (id: string) => {
    const updated = orders.filter((item) => item.id !== id);
    setOrders(updated);
    localStorage.setItem("moshe-hadif-orders", JSON.stringify(updated));
    flash("הטיוטה נמחקה");
  };

  const exportExcel = () => {
    if (!orders.length) {
      flash("עדיין אין הזמנות שמורות לייצוא");
      return;
    }
    const headers = ["מספר הזמנה", "תאריך", "כותרת", "ספק", "ח.פ./עוסק", "איש קשר", "טלפון", "דוא״ל", "כתובת", "מועד אספקה", "עלות", "כולל מע״מ", "המחיר כולל", "תנאי תשלום", "תיאור", "סטטוס", "מאשר"];
    const rows = orders.map((item) => [item.orderNumber, item.orderDate, item.title, item.supplierName, item.supplierId, item.supplierContact, item.supplierPhone, item.supplierEmail, item.supplierAddress, item.deliveryDate, item.cost, item.vatIncluded, item.priceIncludes, item.paymentTerms, item.description, item.status, item.approver]);
    const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `orders-${today()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    flash("קובץ הנתונים מוכן לפתיחה באקסל");
  };

  const supplierLine = [order.supplierName, order.supplierId && `ח.פ./עוסק ${order.supplierId}`].filter(Boolean).join(" · ");
  const supplierContactLine = [order.supplierContact, order.supplierPhone, order.supplierEmail].filter(Boolean).join(" · ");

  return (
    <main className="app-shell" dir="rtl">
      {notice && <div className="toast" role="status">{notice}</div>}

      <header className="app-header no-print">
        <div className="brand-lockup">
          <div className="brand-mark">MH</div>
          <div>
            <span className="eyebrow">פרויקט מגן אברהם 17/19</span>
            <h1>מחולל הזמנות עבודה</h1>
          </div>
        </div>
        <nav className="header-actions" aria-label="פעולות הזמנה">
          <button className="button ghost" type="button" onClick={newOrder}>הזמנה חדשה</button>
          <button className="button secondary" type="button" onClick={() => setView(view === "edit" ? "history" : "edit")}>{view === "edit" ? `הזמנות (${orders.length})` : "חזרה לעריכה"}</button>
          <button className="button primary" type="button" onClick={saveOrder}>שמירת טיוטה</button>
        </nav>
      </header>

      {view === "history" ? (
        <section className="history-view no-print">
          <div className="section-heading">
            <div><span className="eyebrow">מאגר מקומי</span><h2>הזמנות שמורות</h2></div>
            <button className="button secondary" type="button" onClick={exportExcel}>ייצוא לאקסל</button>
          </div>
          {!orders.length ? (
            <div className="empty-state"><span>01</span><h3>עדיין אין הזמנות שמורות</h3><p>שמרו את ההזמנה הראשונה והיא תופיע כאן.</p><button className="button primary" type="button" onClick={newOrder}>יצירת הזמנה</button></div>
          ) : (
            <div className="order-list">
              {orders.map((item) => (
                <article className="order-row" key={item.id}>
                  <div className="order-index">{item.orderNumber.slice(-3)}</div>
                  <div><span className="status-pill">{item.status}</span><h3>{item.title}</h3><p>{item.supplierName} · {displayDate(item.orderDate)}</p></div>
                  <div className="row-cost">{item.cost ? `₪ ${Number(item.cost).toLocaleString("he-IL")}` : "ללא עלות"}</div>
                  <div className="row-actions"><button type="button" onClick={() => editOrder(item)}>עריכה</button><button className="danger" type="button" onClick={() => deleteOrder(item.id)}>מחיקה</button></div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="workspace">
          <form className="editor-panel no-print" onSubmit={(event) => event.preventDefault()}>
            <div className="panel-heading"><div><span className="step">01</span><div><h2>פרטי ההזמנה</h2><p>השינויים מופיעים מיד בתצוגה</p></div></div><span className="draft-badge">{order.status}</span></div>

            <div className="form-grid two">
              <Field label="מספר הזמנה"><input value={order.orderNumber} onChange={(event) => setField("orderNumber", event.target.value)} /></Field>
              <Field label="תאריך הוצאה"><input type="date" value={order.orderDate} onChange={(event) => setField("orderDate", event.target.value)} /></Field>
            </div>
            <Field label="כותרת ההזמנה" required><input autoFocus placeholder="לדוגמה: עבודות מיזוג אוויר" value={order.title} onChange={(event) => setField("title", event.target.value)} /></Field>

            <Divider number="02" title="פרטי הספק" />
            <div className="form-grid two">
              <Field label="שם הספק" required><input placeholder="חברה או בעל מקצוע" value={order.supplierName} onChange={(event) => setField("supplierName", event.target.value)} /></Field>
              <Field label="ח.פ. / עוסק"><input inputMode="numeric" value={order.supplierId} onChange={(event) => setField("supplierId", event.target.value)} /></Field>
              <Field label="איש קשר"><input value={order.supplierContact} onChange={(event) => setField("supplierContact", event.target.value)} /></Field>
              <Field label="טלפון"><input type="tel" value={order.supplierPhone} onChange={(event) => setField("supplierPhone", event.target.value)} /></Field>
              <Field label="דוא״ל"><input type="email" value={order.supplierEmail} onChange={(event) => setField("supplierEmail", event.target.value)} /></Field>
              <Field label="כתובת"><input value={order.supplierAddress} onChange={(event) => setField("supplierAddress", event.target.value)} /></Field>
            </div>

            <Divider number="03" title="עבודה, מחיר ואספקה" />
            <Field label="תיאור העבודה או פרטי הציוד"><textarea rows={6} placeholder="פירוט העבודה, כמויות, מידות, דגמים והערות" value={order.description} onChange={(event) => setField("description", event.target.value)} /></Field>
            <div className="form-grid two">
              <Field label="מועד אספקה"><input type="date" value={order.deliveryDate} onChange={(event) => setField("deliveryDate", event.target.value)} /></Field>
              <Field label="עלות בש״ח"><input type="number" min="0" step="0.01" placeholder="0" value={order.cost} onChange={(event) => setField("cost", event.target.value)} /></Field>
              <Field label="האם העלות כוללת מע״מ?"><select value={order.vatIncluded} onChange={(event) => setField("vatIncluded", event.target.value as Order["vatIncluded"])}><option>לא</option><option>כן</option></select></Field>
              <Field label="תנאי תשלום"><select value={order.paymentTerms} onChange={(event) => setField("paymentTerms", event.target.value)}><option>מיידי</option><option>שוטף + 30</option><option>שוטף + 45</option><option>שוטף + 60</option><option>45 יום</option><option>אחר</option></select></Field>
            </div>
            <Field label="המחיר כולל"><textarea rows={3} placeholder="אספקה, עבודה, הובלה, התקנה, פירוק וכד׳" value={order.priceIncludes} onChange={(event) => setField("priceIncludes", event.target.value)} /></Field>
            <div className="form-grid two">
              <Field label="שם המאשר / חותם"><input value={order.approver} onChange={(event) => setField("approver", event.target.value)} /></Field>
              <Field label="סטטוס"><select value={order.status} onChange={(event) => setField("status", event.target.value as Order["status"])}><option>טיוטה</option><option>מאושרת</option><option>נשלחה</option></select></Field>
            </div>

            <div className="editor-actions">
              <button className="button primary" type="button" onClick={saveOrder}>שמירת הזמנה</button>
              <button className="button secondary" type="button" onClick={() => window.print()}>הדפסה / PDF</button>
            </div>
          </form>

          <div className="preview-column">
            <div className="preview-toolbar no-print"><span><i /> תצוגה חיה</span><button type="button" onClick={() => window.print()}>הדפסה / שמירה כ‑PDF</button></div>
            <article className="order-preview" id="print-order">
              <header className="document-header">
                <img src="/company-logo.png" alt="קבוצת משה חדיף" />
                <div className="document-meta"><span>מס׳ {order.orderNumber}</span><span>{displayDate(order.orderDate)}</span></div>
              </header>
              <h2>טופס הזמנת עבודה</h2>
              {order.title && <p className="document-title">{order.title}</p>}

              <section className="document-section company-details">
                <DocRow label="כתובת המשרד" value={COMPANY.officeAddress} />
                <DocRow label="כתובת האתר" value={COMPANY.siteAddress} />
                <DocRow label="איש קשר משרד" value={`${COMPANY.officeContact}  ${COMPANY.officePhone}`} extra={COMPANY.officeEmail} />
                <DocRow label="איש קשר שטח" value={`${COMPANY.siteContact}  ${COMPANY.sitePhone}`} extra={COMPANY.siteEmail} />
                <DocRow label="טל משרד" value={COMPANY.mainPhone} />
                <DocRow label="דוא״ל לחשבונית" value={COMPANY.invoiceEmail} />
              </section>

              <section className="document-section order-details">
                <DocRow label="פרטי ספק" value={supplierLine || "—"} extra={supplierContactLine} tall />
                {order.supplierAddress && <DocRow label="כתובת ספק" value={order.supplierAddress} />}
                <DocRow label="מועד אספקה" value={displayDate(order.deliveryDate)} emphasis />
                <DocRow label="תיאור העבודה" value={order.description || "—"} large />
                <DocRow label="עלות העבודה" value={order.cost ? `₪ ${Number(order.cost).toLocaleString("he-IL")} ${order.vatIncluded === "כן" ? "כולל מע״מ" : "לא כולל מע״מ"}` : "—"} emphasis />
                <DocRow label="המחיר כולל" value={order.priceIncludes || "—"} tall />
                <DocRow label="תנאי תשלום" value={order.paymentTerms} emphasis />
              </section>

              <footer className="document-footer"><span>חתימה:</span><div>{order.approver}</div></footer>
            </article>
          </div>
        </section>
      )}
    </main>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="field"><span>{label}{required && <b> *</b>}</span>{children}</label>;
}

function Divider({ number, title }: { number: string; title: string }) {
  return <div className="form-divider"><span>{number}</span><h3>{title}</h3><i /></div>;
}

function DocRow({ label, value, extra, tall, large, emphasis }: { label: string; value: string; extra?: string; tall?: boolean; large?: boolean; emphasis?: boolean }) {
  return <div className={`doc-row${tall ? " tall" : ""}${large ? " large" : ""}${emphasis ? " emphasis" : ""}`}><dt>{label}:</dt><dd><span>{value}</span>{extra && <small>{extra}</small>}</dd></div>;
}
