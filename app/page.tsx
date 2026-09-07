"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Order = {
  id: string;
  orderNumber: string;
  orderDate: string;
  siteId: "magen_avraham" | "lohomei_sinai";
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

type Supplier = {
  id: string;
  name: string;
  companyId: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  source: string;
  updatedAt: string;
};

const COMPANY = {
  officeAddress: "בית סילבר, דרך אבא הלל 7, רמת גן 5252204",
  officeContact: "צחי לנדאו",
  officePhone: "052-4310350",
  officeEmail: "zahi@zlandau.co.il",
  mainPhone: "03-5094002",
  invoiceEmail: "ramzi@hadif.co.il",
};

const SITES = {
  magen_avraham: {
    name: "מגן אברהם",
    heading: "מגן אברהם 17/19",
    address: "מגן אברהם 17/19, יפו תל אביב",
    fieldContact: "אורי לוין",
    fieldPhone: "052-3679976",
    fieldEmail: "mynewhouseori@gmail.com",
  },
  lohomei_sinai: {
    name: "לוחמי סיני",
    heading: "לוחמי סיני 19/2",
    address: "לוחמי סיני 19/2, רמת גן",
    fieldContact: "",
    fieldPhone: "",
    fieldEmail: "",
  },
} as const;

const today = () => new Date().toISOString().slice(0, 10);

const blankOrder = (number = "MA-2026-001"): Order => ({
  id: crypto.randomUUID(),
  orderNumber: number,
  orderDate: today(),
  siteId: "magen_avraham",
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [view, setView] = useState<"edit" | "history">("edit");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [shareTarget, setShareTarget] = useState<"whatsapp" | "email" | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const supplierNameRef = useRef<HTMLInputElement>(null);
  const selectedSite = SITES[order.siteId || "magen_avraham"];

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw-or-v3.js", { scope: "/" }).catch(() => {
        // The application remains usable even if installation support is unavailable.
      });
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadOrders = async () => {
      try {
        const [response, supplierResponse] = await Promise.all([
          fetch("/api/orders", { cache: "no-store" }),
          fetch("/api/suppliers", { cache: "no-store" }),
        ]);
        if (!response.ok || !supplierResponse.ok) throw new Error("load failed");
        const data = await response.json() as { orders: Order[] };
        const supplierData = await supplierResponse.json() as { suppliers: Supplier[] };
        let syncedOrders = data.orders;

        const legacy = localStorage.getItem("moshe-hadif-orders");
        const legacyOrders = legacy ? JSON.parse(legacy) as Order[] : [];
        if (!syncedOrders.length && legacyOrders.length) {
          const migrated = await Promise.all(legacyOrders.map(async (item) => {
            const result = await fetch("/api/orders", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(item),
            });
            const payload = await result.json() as { order: Order };
            return payload.order;
          }));
          syncedOrders = migrated;
          localStorage.removeItem("moshe-hadif-orders");
        }
        if (active) {
          setOrders(syncedOrders);
          setSuppliers(supplierData.suppliers);
        }
      } catch {
        if (active) setNotice("לא ניתן לטעון כרגע את המאגר המשותף");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadOrders();
    return () => { active = false; };
  }, []);

  const setField = <K extends keyof Order>(field: K, value: Order[K]) => {
    setOrder((current) => ({ ...current, [field]: value, updatedAt: new Date().toISOString() }));
  };

  const selectSupplier = (name: string) => {
    const selected = suppliers.find((supplier) => supplier.name === name);
    if (!selected) return;
    setOrder((current) => ({
      ...current,
      supplierName: selected.name,
      supplierId: selected.companyId,
      supplierContact: selected.contactName,
      supplierPhone: selected.phone,
      supplierEmail: selected.email,
      supplierAddress: selected.address,
      updatedAt: new Date().toISOString(),
    }));
  };

  const beginNewSupplier = () => {
    setOrder((current) => ({
      ...current,
      supplierName: "",
      supplierId: "",
      supplierContact: "",
      supplierPhone: "",
      supplierEmail: "",
      supplierAddress: "",
      updatedAt: new Date().toISOString(),
    }));
    window.requestAnimationFrame(() => supplierNameRef.current?.focus());
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

  const saveOrder = async () => {
    const liveTitle = titleRef.current?.value.trim() || order.title.trim();
    const liveSupplierName = supplierNameRef.current?.value.trim() || order.supplierName.trim();
    if (!liveTitle) {
      titleRef.current?.focus();
      flash("יש למלא את כותרת ההזמנה");
      return;
    }
    if (!liveSupplierName) {
      supplierNameRef.current?.focus();
      flash("יש למלא את השדה „שם הספק”");
      return;
    }
    const orderToSave = { ...order, title: liveTitle, supplierName: liveSupplierName };
    setIsSaving(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(orderToSave),
      });
      const data = await response.json() as { order?: Order; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error || "save failed");
      setOrder(data.order);
      setOrders((current) => [data.order!, ...current.filter((item) => item.id !== data.order!.id)]);
      setSuppliers((current) => {
        const savedSupplier: Supplier = {
          id: current.find((item) => item.name === data.order!.supplierName)?.id || `supplier-${data.order!.id}`,
          name: data.order!.supplierName,
          companyId: data.order!.supplierId,
          contactName: data.order!.supplierContact,
          phone: data.order!.supplierPhone,
          email: data.order!.supplierEmail,
          address: data.order!.supplierAddress,
          source: "נשמר באפליקציה",
          updatedAt: data.order!.updatedAt,
        };
        return [savedSupplier, ...current.filter((item) => item.name !== savedSupplier.name)]
          .sort((a, b) => a.name.localeCompare(b.name, "he"));
      });
      flash("ההזמנה נשמרה וסונכרנה");
    } catch {
      flash("השמירה נכשלה. בדקו את החיבור ונסו שוב");
    } finally {
      setIsSaving(false);
    }
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

  const deleteOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/orders?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("delete failed");
      setOrders((current) => current.filter((item) => item.id !== id));
      flash("הטיוטה נמחקה מכל המכשירים");
    } catch {
      flash("לא ניתן למחוק כרגע את ההזמנה");
    }
  };

  const exportExcel = () => {
    if (!orders.length) {
      flash("עדיין אין הזמנות שמורות לייצוא");
      return;
    }
    const headers = ["מספר הזמנה", "תאריך", "אתר", "כותרת", "ספק", "ח.פ./עוסק", "איש קשר", "טלפון", "דוא״ל", "כתובת", "מועד אספקה", "עלות", "כולל מע״מ", "המחיר כולל", "תנאי תשלום", "תיאור", "סטטוס", "מאשר"];
    const rows = orders.map((item) => [item.orderNumber, item.orderDate, SITES[item.siteId || "magen_avraham"].name, item.title, item.supplierName, item.supplierId, item.supplierContact, item.supplierPhone, item.supplierEmail, item.supplierAddress, item.deliveryDate, item.cost, item.vatIncluded, item.priceIncludes, item.paymentTerms, item.description, item.status, item.approver]);
    const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `orders-${today()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    flash("קובץ הנתונים מוכן לפתיחה באקסל");
  };

  const createOfficialPdf = async () => {
    const documentElement = window.document.getElementById("print-order");
    if (!documentElement) throw new Error("order preview unavailable");
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
    const canvas = await html2canvas(documentElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: 1200,
      onclone: (clonedDocument) => {
        const clonedOrder = clonedDocument.getElementById("print-order");
        if (clonedOrder) {
          clonedOrder.style.width = "850px";
          clonedOrder.style.minHeight = "1100px";
          clonedOrder.style.padding = "42px 58px";
          clonedOrder.style.boxShadow = "none";
        }
      },
    });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const maxWidth = 194;
    const maxHeight = 281;
    const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
    const width = canvas.width * ratio;
    const height = canvas.height * ratio;
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.96), "JPEG", (210 - width) / 2, 8, width, height, undefined, "FAST");
    const safeNumber = order.orderNumber.replace(/[^\p{L}\p{N}._-]+/gu, "-");
    return new File([pdf.output("blob")], `הזמנת-עבודה-${safeNumber}.pdf`, { type: "application/pdf" });
  };

  const downloadFile = (file: File) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  const shareOfficialOrder = async (target: "whatsapp" | "email") => {
    const liveTitle = titleRef.current?.value.trim() || order.title.trim();
    const liveSupplierName = supplierNameRef.current?.value.trim() || order.supplierName.trim();
    if (!liveTitle) {
      titleRef.current?.focus();
      flash("יש למלא את כותרת ההזמנה לפני השיתוף");
      return;
    }
    if (!liveSupplierName) {
      supplierNameRef.current?.focus();
      flash("יש למלא את שם הספק לפני השיתוף");
      return;
    }
    setShareTarget(target);
    try {
      if (liveTitle !== order.title || liveSupplierName !== order.supplierName) {
        setOrder((current) => ({ ...current, title: liveTitle, supplierName: liveSupplierName }));
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      }
      const file = await createOfficialPdf();
      const shareData: ShareData = {
        title: `הזמנת עבודה ${order.orderNumber}`,
        text: `מצורפת הזמנת עבודה רשמית עבור ${liveSupplierName}`,
        files: [file],
      };
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
      } else {
        downloadFile(file);
        flash(target === "whatsapp" ? "קובץ ה‑PDF הורד. צרף אותו ב‑WhatsApp" : "קובץ ה‑PDF הורד. צרף אותו להודעת המייל");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      flash("לא ניתן להכין את קובץ ההזמנה. נסה שוב");
    } finally {
      setShareTarget(null);
    }
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
            <span className="eyebrow">פרויקט {selectedSite.heading}</span>
            <h1>מחולל הזמנות עבודה</h1>
          </div>
        </div>
        <nav className="header-actions" aria-label="פעולות הזמנה">
          <button className="button ghost" type="button" onClick={newOrder}>הזמנה חדשה</button>
          <button className="button secondary" type="button" onClick={() => setView(view === "edit" ? "history" : "edit")}>{view === "edit" ? `הזמנות (${orders.length})` : "חזרה לעריכה"}</button>
          <button className="button primary" type="button" disabled={isSaving} onClick={() => void saveOrder()}>{isSaving ? "שומר..." : "שמירת טיוטה"}</button>
        </nav>
      </header>

      {view === "history" ? (
        <section className="history-view no-print">
          <div className="section-heading">
            <div><span className="eyebrow">מאגר משותף ומסונכרן</span><h2>הזמנות שמורות</h2></div>
            <button className="button secondary" type="button" onClick={exportExcel}>ייצוא לאקסל</button>
          </div>
          {isLoading ? (
            <div className="empty-state"><span>···</span><h3>טוען את ההזמנות</h3><p>המאגר המשותף מסתנכרן.</p></div>
          ) : !orders.length ? (
            <div className="empty-state"><span>01</span><h3>עדיין אין הזמנות שמורות</h3><p>שמרו את ההזמנה הראשונה והיא תופיע כאן.</p><button className="button primary" type="button" onClick={newOrder}>יצירת הזמנה</button></div>
          ) : (
            <div className="order-list">
              {orders.map((item) => (
                <article className="order-row" key={item.id}>
                  <div className="order-index">{item.orderNumber.slice(-3)}</div>
                  <div><span className="status-pill">{item.status}</span><h3>{item.title}</h3><p>{item.supplierName} · {SITES[item.siteId || "magen_avraham"].name} · {displayDate(item.orderDate)}</p></div>
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
            <Field label="אתר הבנייה">
              <select value={order.siteId || "magen_avraham"} onChange={(event) => setField("siteId", event.target.value as Order["siteId"])}>
                <option value="magen_avraham">מגן אברהם 17/19, יפו תל אביב</option>
                <option value="lohomei_sinai">לוחמי סיני 19/2, רמת גן</option>
              </select>
            </Field>
            <Field label="כותרת ההזמנה" required><input ref={titleRef} name="orderTitle" autoComplete="off" placeholder="לדוגמה: עבודות מיזוג אוויר" value={order.title} onChange={(event) => setField("title", event.target.value)} /></Field>

            <Divider number="02" title="פרטי הספק" />
            <div className="supplier-picker">
              <Field label={`בחר ספק קיים (${suppliers.length})`}>
                <select value={suppliers.some((supplier) => supplier.name === order.supplierName) ? order.supplierName : ""} onChange={(event) => selectSupplier(event.target.value)}>
                  <option value="">בחר ספק מהרשימה...</option>
                  {suppliers.map((supplier) => <option key={supplier.id} value={supplier.name}>{supplier.name}</option>)}
                </select>
              </Field>
              <button className="button supplier-new-button" type="button" onClick={beginNewSupplier}>+ הוספת ספק חדש</button>
            </div>
            <p className="supplier-help">להזנה ידנית, לחץ על „הוספת ספק חדש” ומלא את השדות הבאים.</p>
            <div className="form-grid two">
              <Field label="שם הספק" required><input ref={supplierNameRef} name="supplierName" autoComplete="organization" placeholder="חברה או בעל מקצוע" value={order.supplierName} onChange={(event) => setField("supplierName", event.target.value)} /></Field>
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
              <button className="button primary" type="button" disabled={isSaving} onClick={() => void saveOrder()}>{isSaving ? "שומר ומסנכרן..." : "שמירת הזמנה"}</button>
              <button className="button secondary" type="button" onClick={() => window.print()}>הדפסה / PDF</button>
              <button className="button share whatsapp" type="button" disabled={shareTarget !== null} onClick={() => void shareOfficialOrder("whatsapp")}>{shareTarget === "whatsapp" ? "מכין PDF..." : "שיתוף PDF ב‑WhatsApp"}</button>
              <button className="button share email" type="button" disabled={shareTarget !== null} onClick={() => void shareOfficialOrder("email")}>{shareTarget === "email" ? "מכין PDF..." : "שיתוף PDF במייל"}</button>
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
                <DocRow label="כתובת האתר" value={selectedSite.address} />
                <DocRow label="איש קשר משרד" value={`${COMPANY.officeContact}  ${COMPANY.officePhone}`} extra={COMPANY.officeEmail} />
                {selectedSite.fieldContact && <DocRow label="איש קשר שטח" value={`${selectedSite.fieldContact}  ${selectedSite.fieldPhone}`} extra={selectedSite.fieldEmail} />}
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
