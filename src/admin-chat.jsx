/* global React, Icon, ChannelPill, ProductImg, StatusBadge, MoveTag, Toggle, fmtMoney */
// THINY SHOP — Chat orders (WhatsApp / Messenger / LINE / Instagram)

const { useState: useStateC } = React;

// Reuse the channel pill style but for CHATS (not marketplaces)
const ChatPill = ({ id, size = "md" }) => {
  const ch = window.THINY_DATA.CHATS.find((c) => c.id === id);
  if (!ch) return null;
  const dim = size === "sm" ? 18 : size === "lg" ? 28 : 22;
  return (
    <span
      title={ch.name}
      className="thiny-chpill"
      style={{
        width: dim, height: dim, background: ch.color, color: "#fff",
        borderRadius: "50%", display: "inline-flex", alignItems: "center",
        justifyContent: "center", fontSize: dim * 0.5, fontWeight: 700,
        fontFamily: "system-ui",
      }}
    >{ch.icon}</span>
  );
};

// Detailed pre-order workflow: customer order → we order from platform → arrives → ship to customer
const CHAT_STATUS_FLOW = [
  "new",            // 1. รับออเดอร์ใหม่
  "awaitingPayment",// 2. รอชำระเงิน
  "paid",           // 3. ชำระแล้ว / รอสั่งของ
  "ordered",        // 4. สั่งจาก platform แล้ว (กำลังรอของมาที่ร้าน)
  "arrived",        // 5. ของถึงร้านแล้ว (สแกนบาร์โค้ดแล้ว)
  "shipped",        // 6. จัดส่งให้ลูกค้าแล้ว
  "delivered",      // 7. ลูกค้าได้รับแล้ว
  "cancelled",      // ยกเลิก
];

const STATUS_INFO = {
  new:             { th: "ออเดอร์ใหม่",       en: "New",            color: "#C77100", bg: "#FEF3D3" },
  awaitingPayment: { th: "รอชำระเงิน",      en: "Awaiting Payment", color: "#B7531B", bg: "#FFE9D8" },
  paid:            { th: "ชำระแล้ว",        en: "Paid",             color: "#1F6F4A", bg: "#DDF0E3" },
  ordered:         { th: "สั่งจาก platform", en: "Ordered",          color: "#0F4C81", bg: "#DCE7F3" },
  arrived:         { th: "ของถึงร้าน",      en: "Arrived at shop",  color: "#5B3A8F", bg: "#E7DEF5" },
  shipped:         { th: "จัดส่งให้ลูกค้า",  en: "Shipped",          color: "#0F4C81", bg: "#DCE7F3" },
  delivered:       { th: "ส่งสำเร็จ",       en: "Delivered",        color: "#1F6F4A", bg: "#DDF0E3" },
  cancelled:       { th: "ยกเลิก",          en: "Cancelled",        color: "#999",    bg: "#EEE" },
};

const chatStatusBadge = (status, t, lang) => {
  const s = STATUS_INFO[status] || STATUS_INFO.new;
  const label = s[lang === "en" ? "en" : "th"];
  return (
    <span className="thiny-badge" style={{ background: s.bg, color: s.color }}>
      <span className="thiny-badge-dot" style={{ background: s.color }} />
      {label}
    </span>
  );
};

// =========================================================
// Print bill helper (shared between list and detail)
// =========================================================
const printBillFor = (o, lang = "th") => {
  const PRODUCTS = window.THINY_DATA.PRODUCTS;
  const productLine = o.customItem
    ? `${o.customItem.name}${o.customItem.options ? " (" + o.customItem.options + ")" : ""} × ${o.customItem.qty}`
    : (o.items || []).map(it => {
        const p = PRODUCTS.find(x => x.id === it.pid);
        return p ? `${p.name[lang]} × ${it.qty}` : "";
      }).filter(Boolean).join("<br>");
  const itemPrice = o.customItem
    ? o.customItem.pricePerUnit * o.customItem.qty
    : (o.items || []).reduce((a, it) => {
        const p = PRODUCTS.find(x => x.id === it.pid);
        return a + (p ? p.price * it.qty : 0);
      }, 0);
  const fee = o.serviceFee || 0;
  const paymentLabel = o.paymentStatus === "paid"
    ? "✓ ชำระแล้ว"
    : (o.paymentMethod === "cod" ? "📦 เก็บปลายทาง (COD) ฿" + (o.total || 0).toLocaleString() : "⏳ รอโอนเงิน");

  const html = `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<title>ใบจัดส่ง ${o.id}</title>
<style>
  @page { size: 100mm 150mm; margin: 4mm; }
  * { box-sizing: border-box; }
  body { font-family: "IBM Plex Sans Thai", "Noto Sans Thai", system-ui, sans-serif; margin: 0; padding: 0; color: #000; }
  .bill { width: 92mm; padding: 4mm; border: 2px solid #000; }
  .head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 4mm; border-bottom: 2px dashed #000; margin-bottom: 4mm; }
  .brand { font-weight: 800; font-size: 14pt; }
  .order-id { font-family: monospace; font-weight: 700; font-size: 11pt; }
  .section { margin-bottom: 3mm; padding-bottom: 3mm; border-bottom: 1px dashed #999; }
  .section:last-child { border-bottom: none; }
  .label { font-size: 7pt; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1mm; font-weight: 600; }
  .value { font-size: 10pt; font-weight: 600; line-height: 1.3; }
  .big { font-size: 13pt; font-weight: 800; }
  .price-row { display: flex; justify-content: space-between; padding: 1mm 0; font-size: 9pt; }
  .price-total { display: flex; justify-content: space-between; padding-top: 2mm; margin-top: 2mm; border-top: 2px solid #000; font-weight: 800; font-size: 11pt; }
  .payment { background: #000; color: #fff; padding: 2mm 3mm; text-align: center; font-weight: 700; font-size: 10pt; border-radius: 2mm; }
  .payment.cod { background: #C77100; }
  .tracking-box { background: #f5f5f5; padding: 2mm; border-radius: 1mm; margin-top: 1mm; font-family: monospace; font-weight: 700; font-size: 10pt; }
  .note { font-size: 8pt; font-style: italic; color: #555; padding: 2mm; background: #FFF8E1; border-radius: 1mm; }
  .footer { text-align: center; font-size: 7pt; color: #777; margin-top: 4mm; padding-top: 2mm; border-top: 1px dashed #999; }
  @media print { body { margin: 0; } .no-print { display: none !important; } .bill { border: none; } }
  .toolbar { position: fixed; top: 8px; right: 8px; display: flex; gap: 6px; }
  .toolbar button { padding: 8px 14px; border: none; border-radius: 6px; background: #0F4C81; color: white; font-weight: 600; cursor: pointer; font-family: inherit; }
  .toolbar button.secondary { background: #ccc; color: #333; }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button onclick="window.print()">🖨️ พิมพ์</button>
    <button class="secondary" onclick="window.close()">ปิด</button>
  </div>
  <div class="bill">
    <div class="head">
      <div>
        <div class="brand">🌿 THINY SHOP</div>
        <div style="font-size: 8pt; color: #666;">ใบจัดส่งสินค้า · ${new Date().toLocaleDateString("th-TH")}</div>
      </div>
      <div style="text-align: right;">
        <div class="label">ORDER</div>
        <div class="order-id">${o.id}</div>
      </div>
    </div>

    <div class="section">
      <div class="label">📮 ผู้รับ</div>
      <div class="big">${o.customer.name}</div>
      <div class="value" style="margin-top: 1mm;">📞 ${o.customer.phone || "—"}</div>
      <div class="value" style="margin-top: 1mm; font-weight: 500;">${o.customer.address || "—"}</div>
      ${o.customer.note ? `<div class="note" style="margin-top: 2mm;">💬 ${o.customer.note}</div>` : ""}
    </div>

    <div class="section">
      <div class="label">📦 สินค้า</div>
      <div class="value">${productLine}</div>
    </div>

    <div class="section">
      <div class="price-row"><span>ราคาสินค้า</span><span>฿${itemPrice.toLocaleString()}</span></div>
      ${fee > 0 ? `<div class="price-row"><span>ค่าบริการสั่งซื้อ</span><span>฿${fee.toLocaleString()}</span></div>` : ""}
      <div class="price-total"><span>ยอดรวม</span><span>฿${(o.total || 0).toLocaleString()}</span></div>
    </div>

    <div class="section">
      <div class="label">การชำระเงิน</div>
      <div class="payment ${o.paymentMethod === "cod" && o.paymentStatus !== "paid" ? "cod" : ""}">${paymentLabel}</div>
    </div>

    ${o.tracking ? `<div class="section">
      <div class="label">🚚 Tracking ขาออก ${o.courier ? "(" + o.courier + ")" : ""}</div>
      <div class="tracking-box">${o.tracking}</div>
    </div>` : ""}

    <div class="section barcode-section" style="text-align: center; padding-top: 4mm;">
      <div class="label" style="margin-bottom: 2mm;">📊 บาร์โค้ดออเดอร์ · สแกนได้</div>
      <svg id="bill-barcode" style="width: 80mm; height: 18mm;"></svg>
      <div style="font-family: monospace; font-size: 9pt; font-weight: 700; margin-top: 1mm; letter-spacing: 1px;">${o.id}</div>
    </div>

    <div class="footer">
      THINY SHOP · thinyshop.co/track/${o.id}<br>
      ขอบคุณที่อุดหนุนค่ะ 🙏
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
  <script>
    function renderBarcodeAndPrint() {
      try {
        if (window.JsBarcode) {
          JsBarcode("#bill-barcode", "${o.id}", {
            format: "CODE128",
            width: 1.6,
            height: 50,
            displayValue: false,
            margin: 0,
            background: "#ffffff",
            lineColor: "#000000"
          });
        }
      } catch(e) { console.warn("barcode render failed", e); }
      setTimeout(function() { window.print(); }, 250);
    }
    if (document.readyState === "complete") { renderBarcodeAndPrint(); }
    else { window.addEventListener("load", renderBarcodeAndPrint); }
  </script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=420,height=720");
  if (!w) {
    alert("กรุณาอนุญาต popup สำหรับเว็บนี้เพื่อพิมพ์บิล");
    return;
  }
  w.document.write(html);
  w.document.close();
};

// =========================================================
// Add Chat Order Modal
// =========================================================
const AddChatOrderModal = ({ t, lang, onClose, onSave, editingOrder = null }) => {
  const { PRODUCTS, CHATS, CHANNELS } = window.THINY_DATA;
  const isEdit = !!editingOrder;

  // Populate form from existing order (edit mode) or defaults (add mode)
  const [form, setForm] = useStateC(() => {
    if (editingOrder) {
      return {
        customerName: editingOrder.customer?.name || "",
        customerPhone: editingOrder.customer?.phone || "",
        customerAddress: editingOrder.customer?.address || "",
        channel: editingOrder.channel || "whatsapp",
        lastMessage: editingOrder.lastMessage || "",
        productName: editingOrder.customItem?.name || "",
        productOptions: editingOrder.customItem?.options || "",
        qty: editingOrder.customItem?.qty || 1,
        pricePerUnit: editingOrder.customItem?.pricePerUnit || 0,
        platform: editingOrder.platform || "shopee",
        sourceTracking: editingOrder.sourceTracking || "",
        sourceCost: editingOrder.sourceCost || 0,
        serviceFee: editingOrder.serviceFee || 0,
        paymentMethod: editingOrder.paymentMethod || "transfer",
        paymentStatus: editingOrder.paymentStatus || "unpaid",
        status: editingOrder.status || "new",
      };
    }
    return {
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      channel: "whatsapp",
      lastMessage: "",
      productName: "",
      productOptions: "",
      qty: 1,
      pricePerUnit: 0,
      platform: "shopee",
      sourceTracking: "",
      sourceCost: 0,
      serviceFee: 50,
      paymentMethod: "transfer",
      paymentStatus: "unpaid",
      status: "new",
    };
  });
  const [saving, setSaving] = useStateC(false);

  const subtotal = (parseFloat(form.pricePerUnit) || 0) * (parseInt(form.qty) || 0);
  const fee = parseFloat(form.serviceFee) || 0;
  const customerTotal = subtotal + fee;
  const totalCost = (parseFloat(form.sourceCost) || 0) * (parseInt(form.qty) || 0);
  const profit = customerTotal - totalCost;

  const handleSubmit = async () => {
    if (!form.customerName.trim()) { alert("กรุณากรอกชื่อลูกค้า"); return; }
    if (!form.productName.trim()) { alert("กรุณากรอกชื่อสินค้า"); return; }
    if (form.qty < 1) { alert("จำนวนต้องมากกว่า 0"); return; }
    if (!form.pricePerUnit || form.pricePerUnit <= 0) { alert("กรุณากรอกราคาขายต่อชิ้น"); return; }

    setSaving(true);
    const newId = isEdit ? editingOrder.id : "CH-" + (1043 + Math.floor(Math.random() * 9000));
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");

    const newOrder = {
      id: newId,
      platform: form.platform,
      channel: form.channel,
      customer: {
        name: form.customerName,
        phone: form.customerPhone || "",
        address: form.customerAddress || "",
        note: "",
      },
      // เก็บเป็น free-text product line (ไม่ต้องผูกกับ SKU ของเรา)
      customItem: {
        name: form.productName,
        options: form.productOptions || "",
        qty: parseInt(form.qty),
        pricePerUnit: parseFloat(form.pricePerUnit),
      },
      items: [], // empty - ใช้ customItem แทน
      subtotal: subtotal,
      serviceFee: fee,
      total: customerTotal,
      // ข้อมูลฝั่งซัพพลายเออร์ (เราซื้อจาก platform)
      sourceTracking: form.sourceTracking || "",
      sourceCost: parseFloat(form.sourceCost) || 0,
      // ขาออก (ส่งให้ลูกค้า) - ใส่ตอนพร้อมส่ง
      tracking: "",
      courier: "",
      // ชำระเงิน
      paymentMethod: form.paymentMethod,
      paymentStatus: form.paymentStatus,
      // สถานะ
      status: form.status,
      lastMessage: form.lastMessage || "—",
      created: isEdit ? editingOrder.created : now.toISOString().split("T")[0] + " " + hh + ":" + mm,
      // Preserve existing tracking on edit (those have their own UI flow)
      tracking: isEdit ? (editingOrder.tracking || "") : "",
      courier: isEdit ? (editingOrder.courier || "") : "",
    };
    if (isEdit) {
      // Mutate original object so React-rendered detail page picks it up
      Object.assign(editingOrder, newOrder);
      if (window.saveChatOrder) await window.saveChatOrder(editingOrder);
      if (window.logAudit) window.logAudit("edit_order", "chat_order", editingOrder.id, `${form.customerName} · แก้ไขออเดอร์`);
    } else {
      onSave(newOrder);
    }
    setSaving(false);
    onClose();
  };

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" };
  const labelStyle = { display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600, color: "#333" };
  const subLabelStyle = { color: "#888", fontWeight: 400, fontSize: "11px", marginLeft: 4 };
  const sectionStyle = { padding: "16px", background: "#FAFAF7", borderRadius: "8px", marginBottom: "16px" };
  const sectionTitleStyle = { fontSize: "13px", fontWeight: 700, color: "#0F4C81", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "white", borderRadius: "12px", padding: "28px", width: "100%", maxWidth: "640px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>{isEdit ? "✏️ แก้ไขออเดอร์" : "เพิ่มออเดอร์พรีออเดอร์"}</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#888" }}>{isEdit ? `${editingOrder.id} · แก้ไขข้อมูลทั้งหมดของออเดอร์` : "บันทึกข้อมูลลูกค้าที่สั่งของผ่านแชท"}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#999", padding: 0, lineHeight: 1 }}>×</button>
        </div>

        {/* ==== 1. ลูกค้า ==== */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>1 · ข้อมูลลูกค้า</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelStyle}>ชื่อลูกค้า *</label>
              <input type="text" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                style={inputStyle} placeholder="สมชาย ใจดี" />
            </div>
            <div>
              <label style={labelStyle}>เบอร์โทร</label>
              <input type="text" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                style={inputStyle} placeholder="08X-XXX-XXXX" />
            </div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={labelStyle}>ที่อยู่จัดส่ง</label>
            <textarea value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
              rows={2} style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }} placeholder="ที่อยู่..." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>ช่องทางติดต่อ</label>
              <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}
                style={{ ...inputStyle, background: "white" }}>
                {CHATS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>ข้อความ/หมายเหตุ</label>
              <input type="text" value={form.lastMessage} onChange={(e) => setForm({ ...form, lastMessage: e.target.value })}
                style={inputStyle} placeholder="เช่น ขอจองของหน่อยค่ะ" />
            </div>
          </div>
        </div>

        {/* ==== 2. สินค้าที่ลูกค้าสั่ง ==== */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>2 · สินค้าที่ลูกค้าสั่ง</div>
          <div style={{ marginBottom: "12px" }}>
            <label style={labelStyle}>ชื่อสินค้า * <span style={subLabelStyle}>(พิมพ์เอง เช่น Nike Air Max)</span></label>
            <input type="text" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })}
              style={inputStyle} placeholder="เช่น Nike Air Max 90" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px", gap: "12px" }}>
            <div>
              <label style={labelStyle}>ตัวเลือก <span style={subLabelStyle}>(สี/ไซส์)</span></label>
              <input type="text" value={form.productOptions} onChange={(e) => setForm({ ...form, productOptions: e.target.value })}
                style={inputStyle} placeholder="Size 40 / สีดำ" />
            </div>
            <div>
              <label style={labelStyle}>จำนวน</label>
              <input type="number" min="1" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>ราคาขาย/ชิ้น *</label>
              <input type="number" min="0" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
                style={inputStyle} placeholder="0" />
            </div>
          </div>
        </div>

        {/* ==== 3. เราไปสั่งจากแพลตฟอร์มไหน ==== */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>3 · เราไปสั่งจาก Platform ไหน</div>
          <label style={labelStyle}>แพลตฟอร์ม</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "12px" }}>
            {CHANNELS.map(ch => (
              <button key={ch.id} type="button" onClick={() => setForm({ ...form, platform: ch.id })}
                style={{
                  padding: "10px 8px",
                  border: form.platform === ch.id ? "2px solid " + ch.color : "1px solid #ddd",
                  borderRadius: "8px",
                  background: form.platform === ch.id ? ch.color + "12" : "white",
                  cursor: "pointer", textAlign: "center", fontSize: "12px",
                  fontWeight: form.platform === ch.id ? 600 : 500,
                  color: form.platform === ch.id ? ch.color : "#333",
                }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: ch.color, color: "#fff", margin: "0 auto 4px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11 }}>{ch.icon}</div>
                {ch.name}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>เลข Tracking ขาเข้า <span style={subLabelStyle}>(จาก platform → ร้านเรา · ใช้สแกนตอนของถึง)</span></label>
              <input type="text" value={form.sourceTracking} onChange={(e) => setForm({ ...form, sourceTracking: e.target.value })}
                style={inputStyle} placeholder="เช่น SPX-1234567890" />
            </div>
            <div>
              <label style={labelStyle}>ต้นทุน/ชิ้น <span style={subLabelStyle}>(บาท)</span></label>
              <input type="number" min="0" value={form.sourceCost} onChange={(e) => setForm({ ...form, sourceCost: e.target.value })}
                style={inputStyle} placeholder="0" />
            </div>
          </div>
        </div>

        {/* ==== ค่าบริการ ==== */}
        <div style={{ ...sectionStyle, background: "#FFF8E1", borderLeft: "4px solid #C77100" }}>
          <div style={sectionTitleStyle}>💼 ค่าบริการสั่งซื้อ</div>
          <label style={labelStyle}>ค่าบริการที่คิดลูกค้า <span style={subLabelStyle}>(สำหรับการช่วยสั่งซื้อ-รับ-ส่งให้ลูกค้า)</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr) 1.2fr", gap: 6 }}>
            {[0, 30, 50, 80, 100].map(amt => (
              <button key={amt} type="button" onClick={() => setForm({ ...form, serviceFee: amt })}
                style={{
                  padding: "10px 6px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: parseFloat(form.serviceFee) === amt ? "2px solid #C77100" : "1px solid #ddd",
                  background: parseFloat(form.serviceFee) === amt ? "#FEF3D3" : "white",
                  color: parseFloat(form.serviceFee) === amt ? "#C77100" : "#333",
                }}>{amt === 0 ? "ฟรี" : "฿" + amt}</button>
            ))}
            <input type="number" min="0" value={form.serviceFee} onChange={(e) => setForm({ ...form, serviceFee: e.target.value })}
              style={{ ...inputStyle, padding: "8px 10px" }} placeholder="กรอกเอง" />
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#888" }}>
            💡 ค่าบริการนี้จะรวมเข้ายอดที่ลูกค้าต้องจ่าย และนับเป็นรายได้ของเรา
          </div>
        </div>

        {/* ==== 4. การชำระเงิน ==== */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>4 · การชำระเงินจากลูกค้า</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>วิธีชำระ</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <button type="button" onClick={() => setForm({ ...form, paymentMethod: "transfer" })}
                  style={{
                    padding: "10px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: form.paymentMethod === "transfer" ? "2px solid #0F4C81" : "1px solid #ddd",
                    background: form.paymentMethod === "transfer" ? "#DCE7F3" : "white",
                    color: form.paymentMethod === "transfer" ? "#0F4C81" : "#333",
                  }}>💳 โอน</button>
                <button type="button" onClick={() => setForm({ ...form, paymentMethod: "cod" })}
                  style={{
                    padding: "10px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: form.paymentMethod === "cod" ? "2px solid #C77100" : "1px solid #ddd",
                    background: form.paymentMethod === "cod" ? "#FEF3D3" : "white",
                    color: form.paymentMethod === "cod" ? "#C77100" : "#333",
                  }}>📦 COD</button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>สถานะการชำระ</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <button type="button" onClick={() => setForm({ ...form, paymentStatus: "unpaid" })}
                  style={{
                    padding: "10px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: form.paymentStatus === "unpaid" ? "2px solid #C77100" : "1px solid #ddd",
                    background: form.paymentStatus === "unpaid" ? "#FEF3D3" : "white",
                    color: form.paymentStatus === "unpaid" ? "#C77100" : "#333",
                  }}>⏳ ยังไม่ชำระ</button>
                <button type="button" onClick={() => setForm({ ...form, paymentStatus: "paid" })}
                  style={{
                    padding: "10px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: form.paymentStatus === "paid" ? "2px solid #1F6F4A" : "1px solid #ddd",
                    background: form.paymentStatus === "paid" ? "#DDF0E3" : "white",
                    color: form.paymentStatus === "paid" ? "#1F6F4A" : "#333",
                  }}>✓ ชำระแล้ว</button>
              </div>
            </div>
          </div>
        </div>

        {/* ==== 5. สถานะออเดอร์ ==== */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>5 · สถานะออเดอร์</div>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            style={{ ...inputStyle, background: "white" }}>
            {CHAT_STATUS_FLOW.filter(s => s !== "cancelled").map(s => (
              <option key={s} value={s}>{STATUS_INFO[s].th}</option>
            ))}
          </select>
        </div>

        {/* ==== สรุปยอด ==== */}
        <div style={{ background: "linear-gradient(135deg, #0F4C81 0%, #1565A8 100%)", color: "white", padding: "16px", borderRadius: "10px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, opacity: 0.85 }}>
            <span>ราคาสินค้า ({form.qty || 0} ชิ้น × ฿{form.pricePerUnit || 0})</span>
            <span>฿{subtotal.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, opacity: 0.85, marginTop: 4 }}>
            <span>+ ค่าบริการสั่งซื้อ</span>
            <span style={{ color: "#FFD27A" }}>฿{fee.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.25)" }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>= ยอดที่ลูกค้าจ่าย</span>
            <span style={{ fontSize: 24, fontWeight: 700 }}>฿{customerTotal.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, opacity: 0.75, marginTop: 10, paddingTop: 8, borderTop: "1px dashed rgba(255,255,255,0.2)" }}>
            <span>ต้นทุนรวม</span>
            <span>฿{totalCost.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginTop: 4 }}>
            <span style={{ opacity: 0.85 }}>💰 กำไร (รวมค่าบริการ)</span>
            <span style={{ fontWeight: 700, color: profit >= 0 ? "#A8E6C0" : "#FFB3B3" }}>฿{profit.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={saving}
            style={{ padding: "10px 20px", border: "1px solid #ddd", borderRadius: "6px", background: "white", cursor: saving ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 500 }}>
            ยกเลิก
          </button>
          <button onClick={handleSubmit} disabled={saving}
            style={{ padding: "10px 24px", border: "none", borderRadius: "6px", background: "#0F4C81", color: "white", cursor: saving ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? "กำลังเพิ่ม..." : "+ บันทึกออเดอร์"}
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// LIST + DETAIL screen (toggles via state)
// =========================================================
const ScreenChatOrders = ({ t, lang }) => {
  const [selectedId, setSelectedId] = useStateC(null);
  const [showAddModal, setShowAddModal] = useStateC(false);
  const [newOrders, setNewOrders] = useStateC([]);

  const handleAddOrder = (newOrder) => {
    // Add the new order to the local in-memory list
    window.THINY_DATA.CHAT_ORDERS.unshift(newOrder);
    setNewOrders([...newOrders, newOrder]);
    // Persist to backend
    if (window.createChatOrder) window.createChatOrder(newOrder);
    // Audit log
    if (window.logAudit) window.logAudit("create_order", "chat_order", newOrder.id,
      `${newOrder.customer?.name} · ${newOrder.customItem?.name || "(no item)"} · ฿${(newOrder.total || 0).toLocaleString()} · ${newOrder.platform}`);
    alert("เพิ่มออเดอร์ " + newOrder.id + " สำเร็จ");
  };

  if (selectedId) {
    return (
      <ChatOrderDetail
        t={t}
        lang={lang}
        id={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }
  return (
    <>
      <ChatOrderList t={t} lang={lang} onPick={setSelectedId} onAdd={() => setShowAddModal(true)} />
      {showAddModal && <AddChatOrderModal t={t} lang={lang} onClose={() => setShowAddModal(false)} onSave={handleAddOrder} />}
    </>
  );
};

const ChatOrderList = ({ t, lang, onPick, onAdd }) => {
  const { CHAT_ORDERS, CHATS, PRODUCTS } = window.THINY_DATA;
  const [channel, setChannel] = useStateC("all");
  const [status, setStatus] = useStateC("all");
  const [selectedIds, setSelectedIds] = useStateC(new Set());
  const filtered = CHAT_ORDERS.filter(
    (o) =>
      (channel === "all" || o.channel === channel) &&
      (status === "all" || o.status === status)
  );
  const counts = {};
  CHAT_STATUS_FLOW.forEach((s) => {
    counts[s] = CHAT_ORDERS.filter((o) => o.status === s).length;
  });

  // Toggle a single row's selection
  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };
  // Toggle all visible rows
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(o => o.id)));
    }
  };
  const clearSelection = () => setSelectedIds(new Set());

  // ===== Bulk actions =====
  const bulkPrintBills = () => {
    const orders = CHAT_ORDERS.filter(o => selectedIds.has(o.id));
    if (orders.length === 0) return;
    if (orders.length > 10 && !confirm(`พิมพ์ ${orders.length} บิลพร้อมกัน?`)) return;
    orders.forEach((o, i) => {
      setTimeout(() => printBillFor(o, lang), i * 150);
    });
    if (window.logAudit) window.logAudit("bulk_action", "chat_order", orders.length, `Print ${orders.length} bills`);
  };
  const bulkUpdateStatus = (newStatus) => {
    const orders = CHAT_ORDERS.filter(o => selectedIds.has(o.id));
    if (orders.length === 0) return;
    if (!confirm(`เปลี่ยนสถานะของ ${orders.length} ออเดอร์ เป็น "${STATUS_INFO[newStatus]?.th || newStatus}"?`)) return;
    orders.forEach(o => {
      o.status = newStatus;
      if (window.saveChatOrder) window.saveChatOrder(o);
    });
    if (window.logAudit) window.logAudit("bulk_action", "chat_order", orders.length, `Status → ${STATUS_INFO[newStatus]?.th || newStatus} (${orders.length} orders)`);
    clearSelection();
    alert(`✓ อัปเดต ${orders.length} ออเดอร์เป็น "${STATUS_INFO[newStatus]?.th || newStatus}"`);
  };
  const bulkMarkPaid = () => {
    const orders = CHAT_ORDERS.filter(o => selectedIds.has(o.id) && o.paymentStatus !== "paid");
    if (orders.length === 0) {
      alert("ออเดอร์ที่เลือกชำระแล้วหมด");
      return;
    }
    if (!confirm(`ทำเครื่องหมาย "ชำระแล้ว" สำหรับ ${orders.length} ออเดอร์?`)) return;
    orders.forEach(o => {
      o.paymentStatus = "paid";
      if (o.status === "new" || o.status === "awaitingPayment") o.status = "paid";
      if (window.saveChatOrder) window.saveChatOrder(o);
    });
    if (window.logAudit) window.logAudit("bulk_action", "chat_order", orders.length, `Mark paid (${orders.length} orders)`);
    clearSelection();
    alert(`✓ อัปเดต ${orders.length} ออเดอร์ชำระแล้ว`);
  };
  const bulkExportCSV = () => {
    const orders = CHAT_ORDERS.filter(o => selectedIds.has(o.id));
    if (orders.length === 0) return;
    const csv = 'ID,Platform,Channel,Customer,Phone,Item,Qty,Total,ServiceFee,Status,PaymentStatus,Tracking,Created\n' +
      orders.map(o => {
        const item = o.customItem?.name || (PRODUCTS.find(p => p.id === o.items?.[0]?.pid)?.name?.[lang] || '-');
        const qty = o.customItem?.qty || (o.items || []).reduce((a, b) => a + b.qty, 0);
        return `${o.id},${o.platform || '-'},${o.channel || '-'},"${o.customer?.name || ''}","${o.customer?.phone || ''}","${item}",${qty},${o.total || 0},${o.serviceFee || 0},${o.status},${o.paymentStatus},${o.tracking || ''},${o.created || ''}`;
      }).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = `chat-orders-selected-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(a.href);
  };
  const bulkDelete = async () => {
    const orders = CHAT_ORDERS.filter(o => selectedIds.has(o.id));
    if (orders.length === 0) return;
    if (!confirm(`ลบ ${orders.length} ออเดอร์? · การลบไม่สามารถย้อนคืนได้!`)) return;
    const API = window.API_BASE || 'http://localhost:5000/api';
    const ids = orders.map(o => o.id);
    for (const o of orders) {
      try {
        await fetch(API + '/chat-orders/' + encodeURIComponent(o.id), { method: 'DELETE' });
        const idx = CHAT_ORDERS.indexOf(o);
        if (idx >= 0) CHAT_ORDERS.splice(idx, 1);
      } catch (e) {}
    }
    if (window.logAudit) window.logAudit("delete_order", "chat_order", ids.join(","), `Bulk delete ${orders.length} orders: ${ids.join(", ")}`);
    clearSelection();
    alert(`✓ ลบ ${orders.length} ออเดอร์เรียบร้อย`);
    window.location.reload();
  };

  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">{t.chat.title}</h1>
          <p className="thiny-sub">{t.chat.sub} · เก็บทุก ออเดอร์ที่ลูกค้าทักมา</p>
        </div>
        <div className="thiny-top-actions">
          <button className="thiny-btn-ghost" onClick={() => {
            const csv = 'ID,Platform,Channel,Customer,Status,Total\n' + CHAT_ORDERS.map(o => `${o.id},${o.platform || '-'},${o.channel},"${o.customer.name}",${o.status},${o.items.reduce((a,b) => a + (b.qty * (PRODUCTS.find(p => p.id === b.pid)?.price || 0)), 0)}`).join('\n');
            const blob = new Blob([csv], {type: 'text/csv'});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-orders-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
          }}><Icon name="download" size={14} />{t.common.export}</button>
          <button className="thiny-btn thiny-btn-primary" onClick={() => onAdd && onAdd()}><Icon name="plus" size={14} />{t.chat.newOrder}</button>
        </div>
      </div>

      {/* Per-chat-channel cards */}
      <div className="thiny-mp-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {CHATS.map((c) => {
          const channelOrders = CHAT_ORDERS.filter((o) => o.channel === c.id);
          const newCount = channelOrders.filter((o) => o.status === "new").length;
          return (
            <button
              key={c.id}
              className={`thiny-mp-card ${channel === c.id ? "active" : ""}`}
              onClick={() => setChannel(channel === c.id ? "all" : c.id)}
              style={{ textAlign: "left" }}
            >
              <div className="thiny-mp-head">
                <ChatPill id={c.id} size="lg" />
                <span className="thiny-fg-3 thiny-xs">● online</span>
              </div>
              <div className="thiny-mp-name">{c.name}</div>
              <div className="thiny-mp-num">{channelOrders.length}</div>
              <div className="thiny-mp-meta">
                {newCount > 0 ? (
                  <span style={{ color: "var(--c-warn)" }}>{newCount} ใหม่</span>
                ) : (
                  <span>ไม่มีใหม่</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="thiny-status-tabs">
        <button className={status === "all" ? "active" : ""} onClick={() => setStatus("all")}>
          {t.common.all} <span className="thiny-tab-count">{CHAT_ORDERS.length}</span>
        </button>
        {CHAT_STATUS_FLOW.map((s) => (
          <button key={s} className={status === s ? "active" : ""} onClick={() => setStatus(s)}>
            {STATUS_INFO[s] ? STATUS_INFO[s][lang === "en" ? "en" : "th"] : s}
            <span className="thiny-tab-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Bulk action bar — shows when at least 1 row selected */}
      {selectedIds.size > 0 && (
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "linear-gradient(135deg, #5B3A8F 0%, #7B5BAF 100%)", color: "white",
          padding: "12px 18px", borderRadius: 10, marginBottom: 12,
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          boxShadow: "0 4px 16px rgba(91, 58, 143, 0.3)"
        }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            ✓ เลือก {selectedIds.size} ออเดอร์
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={bulkPrintBills} style={{ padding: "6px 12px", background: "white", color: "#5B3A8F", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            🖨️ พิมพ์บิลรวม ({selectedIds.size})
          </button>
          <button onClick={bulkMarkPaid} style={{ padding: "6px 12px", background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            ✓ ทำเครื่องหมายชำระ
          </button>
          <select onChange={(e) => { if (e.target.value) { bulkUpdateStatus(e.target.value); e.target.value = ""; } }} defaultValue=""
            style={{ padding: "6px 10px", background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <option value="" style={{ color: "#333" }}>เปลี่ยน status...</option>
            {CHAT_STATUS_FLOW.map(s => (
              <option key={s} value={s} style={{ color: "#333" }}>{STATUS_INFO[s]?.th || s}</option>
            ))}
          </select>
          <button onClick={bulkExportCSV} style={{ padding: "6px 12px", background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            ↓ Export CSV
          </button>
          <button onClick={bulkDelete} style={{ padding: "6px 12px", background: "rgba(255,0,0,0.3)", color: "white", border: "1px solid rgba(255,200,200,0.5)", borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            🗑️ ลบ
          </button>
          <button onClick={clearSelection} style={{ padding: "6px 10px", background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
            ✕
          </button>
        </div>
      )}

      <div className="thiny-card thiny-card-flush">
        <table className="thiny-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox"
                  checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onChange={toggleSelectAll}
                  title="เลือกทั้งหมด"
                  style={{ cursor: "pointer", width: 16, height: 16 }} />
              </th>
              <th>Order</th>
              <th>Platform</th>
              <th>{t.preorder.channel}</th>
              <th>{t.preorder.customer}</th>
              <th>{t.chat.items}</th>
              <th>{t.chat.tracking}</th>
              <th>{t.chat.total}</th>
              <th>{t.common.status}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const isCustom = !!o.customItem;
              const firstItem = isCustom ? null : (o.items && o.items[0] ? PRODUCTS.find((p) => p.id === o.items[0].pid) : null);
              const totalQty = isCustom ? o.customItem.qty : (o.items || []).reduce((a, b) => a + b.qty, 0);
              return (
                <tr key={o.id} className="thiny-tr-click" onClick={() => onPick(o.id)}
                  style={selectedIds.has(o.id) ? { background: "#F5EFFD" } : {}}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox"
                      checked={selectedIds.has(o.id)}
                      onChange={() => toggleSelect(o.id)}
                      style={{ cursor: "pointer", width: 16, height: 16 }} />
                  </td>
                  <td>
                    <div className="thiny-mono">{o.id}</div>
                    <div className="thiny-fg-3 thiny-xs">{(o.created || "").split(" ")[1] || ""}</div>
                  </td>
                  <td>
                    {(() => {
                      const plat = window.THINY_DATA.CHANNELS.find(c => c.id === o.platform);
                      if (!plat) return <span className="thiny-fg-3 thiny-xs">—</span>;
                      return (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "3px 8px", borderRadius: 12,
                          background: plat.color + "15", color: plat.color,
                          fontSize: 11, fontWeight: 600
                        }}>
                          <span style={{
                            width: 16, height: 16, borderRadius: "50%",
                            background: plat.color, color: "#fff",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            fontSize: 9, fontWeight: 700
                          }}>{plat.icon}</span>
                          {plat.name}
                        </span>
                      );
                    })()}
                  </td>
                  <td><ChatPill id={o.channel} size="md" /></td>
                  <td>
                    <div className="thiny-strong">{o.customer.name}</div>
                    <div className="thiny-fg-3 thiny-xs" style={{
                      maxWidth: 180, overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap"
                    }}>“{o.lastMessage}”</div>
                  </td>
                  <td className="thiny-td-product">
                    {isCustom ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: "#F0EBE0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📦</div>
                        <div>
                          <div className="thiny-strong">{o.customItem.name}</div>
                          <div className="thiny-fg-3 thiny-xs">
                            {o.customItem.options ? o.customItem.options + " · " : ""}×{totalQty}
                          </div>
                        </div>
                      </div>
                    ) : firstItem ? (
                      <>
                        <ProductImg id={firstItem.image} size="sm" rounded="rounded-md" />
                        <div>
                          <div className="thiny-strong">{firstItem.name[lang]}</div>
                          <div className="thiny-fg-3 thiny-xs">
                            {o.items.length > 1 ? `+${o.items.length - 1} ${t.chat.itemCount} · ` : ""}
                            ×{totalQty}
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="thiny-fg-3 thiny-xs">—</span>
                    )}
                  </td>
                  <td>
                    {o.sourceTracking ? (
                      <div>
                        <div className="thiny-mono thiny-xs">📥 {o.sourceTracking}</div>
                        <div className="thiny-fg-3 thiny-xs" style={{ fontSize: 10 }}>ขาเข้า</div>
                      </div>
                    ) : o.tracking ? (
                      <div>
                        <div className="thiny-mono thiny-xs">📤 {o.tracking}</div>
                        <div className="thiny-fg-3 thiny-xs" style={{ fontSize: 10 }}>{o.courier || "ขาออก"}</div>
                      </div>
                    ) : (
                      <span className="thiny-fg-3 thiny-xs">— {t.chat.noTracking}</span>
                    )}
                  </td>
                  <td>
                    <div><strong>{fmtMoney(o.total, lang)}</strong></div>
                    {o.paymentStatus && (
                      <div style={{
                        fontSize: 10, fontWeight: 600, marginTop: 2,
                        color: o.paymentStatus === "paid" ? "#1F6F4A" : "#C77100"
                      }}>
                        {o.paymentStatus === "paid" ? "✓ ชำระแล้ว" : (o.paymentMethod === "cod" ? "📦 COD" : "⏳ รอโอน")}
                      </div>
                    )}
                  </td>
                  <td>{chatStatusBadge(o.status, t, lang)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        className="thiny-icon-btn"
                        onClick={(e) => { e.stopPropagation(); printBillFor(o); }}
                        title="พิมพ์บิลติดหน้ากล่อง"
                        style={{ fontSize: 14 }}
                      >🖨️</button>
                      <button className="thiny-icon-btn" onClick={(e) => { e.stopPropagation(); onPick(o.id); }}>
                        <Icon name="chev" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =========================================================
// DETAIL
// =========================================================
const ChatOrderDetail = ({ t, lang, id, onBack }) => {
  const { CHAT_ORDERS, PRODUCTS, CHATS } = window.THINY_DATA;
  const o = CHAT_ORDERS.find((x) => x.id === id);
  const channel = CHATS.find((c) => c.id === o.channel);
  const platform = window.THINY_DATA.CHANNELS.find(c => c.id === o.platform);
  const [copied, setCopied] = useStateC(false);
  const [scanMode, setScanMode] = useStateC(null); // "in" or "out"
  const [scanned, setScanned] = useStateC([]);
  const [showEdit, setShowEdit] = useStateC(false);
  const [, forceUpdate] = useStateC(0);

  const persist = () => { if (window.saveChatOrder) window.saveChatOrder(o); };
  const updateStatus = (newStatus) => {
    const oldStatus = o.status;
    o.status = newStatus;
    persist();
    if (window.logAudit) window.logAudit("update_status", "chat_order", o.id, `${o.customer?.name} · ${oldStatus} → ${newStatus}`);
    forceUpdate(n => n + 1);
  };
  const markPaid = () => {
    o.paymentStatus = "paid";
    if (o.status === "new" || o.status === "awaitingPayment") o.status = "paid";
    persist();
    if (window.logAudit) window.logAudit("mark_paid", "chat_order", o.id, `${o.customer?.name} · ฿${(o.total || 0).toLocaleString()}`);
    forceUpdate(n => n + 1);
  };
  const setOutTracking = () => {
    const trk = prompt("กรอกเลข tracking ขาออก (ส่งให้ลูกค้า):", o.tracking || "");
    if (trk !== null) {
      o.tracking = trk;
      const courier = prompt("ขนส่ง (เช่น Kerry, Flash, J&T):", o.courier || "");
      if (courier !== null) o.courier = courier;
      o.status = "shipped";
      persist();
      if (window.logAudit) window.logAudit("ship_order", "chat_order", o.id, `${o.customer?.name} · tracking ${trk} · ${courier || "—"}`);
      forceUpdate(n => n + 1);
    }
  };
  const setInTracking = () => {
    const trk = prompt("กรอกเลข tracking ขาเข้า (จาก platform):", o.sourceTracking || "");
    if (trk !== null) {
      o.sourceTracking = trk;
      if (o.status === "paid" || o.status === "new") o.status = "ordered";
      persist();
      if (window.logAudit) window.logAudit("assign_tracking", "chat_order", o.id, `${o.customer?.name} · in-tracking ${trk}`);
      forceUpdate(n => n + 1);
    }
  };

  const printBill = () => {
    printBillFor(o, lang);
    if (window.logAudit) window.logAudit("print_bill", "chat_order", o.id, o.customer?.name);
  };

  const trackingUrl = `https://thinyshop.co/track/${o.id}`;

  // Build the WhatsApp / Messenger / LINE deep-link
  const composeChatLink = (kind) => {
    const phone = o.customer.phone.replace(/[^0-9+]/g, "");
    const trackMsg =
      `สวัสดีค่ะ คุณ${o.customer.name} · THINY SHOP 🌿\n` +
      `ออเดอร์ ${o.id} ส่งของเรียบร้อยแล้ว 📦\n` +
      `Tracking: ${o.tracking || "—"} (${o.courier || "—"})\n` +
      `ติดตาม: ${trackingUrl}\n` +
      `ขอบคุณที่อุดหนุนค่ะ 🙏`;
    const text = encodeURIComponent(trackMsg);
    if (kind === "whatsapp") return `https://wa.me/${phone}?text=${text}`;
    if (kind === "line")     return `https://line.me/R/oaMessage/@thinyshop/?${text}`;
    if (kind === "facebook") return `https://m.me/thinyshop?text=${text}`;
    if (kind === "ig")       return `https://ig.me/m/thinyshop?text=${text}`;
    return "#";
  };

  const handleSend = (kind) => {
    // In a real app this would open the deep-link.
    // For the prototype, just show a confirmation toast.
    const url = composeChatLink(kind);
    window.open(url, "_blank", "noopener");
    // Log the notification
    logNotification("tracking", kind);
  };

  // Log notification to backend
  const logNotification = async (template, channelKind) => {
    try {
      const API = window.API_BASE || 'http://localhost:5000/api';
      await fetch(API + '/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: o.id,
          template,
          channel: channelKind,
          message: template + " sent via " + channelKind
        })
      });
    } catch (e) {}
  };

  // === Notification templates ===
  const NOTIFY_TEMPLATES = {
    paymentReminder: {
      label: "💰 เตือนชำระ",
      build: () => `สวัสดีค่ะ คุณ${o.customer.name} 🙏\nออเดอร์ ${o.id} ยังไม่ได้รับการชำระเงินค่ะ\nยอด ฿${(o.total || 0).toLocaleString()}\nรบกวนช่วยโอนภายในวันนี้นะคะ ขอบคุณค่ะ`
    },
    paymentConfirm: {
      label: "✓ ยืนยันได้รับเงิน",
      build: () => `ขอบคุณค่ะ คุณ${o.customer.name} 🌿\nเราได้รับการชำระสำหรับออเดอร์ ${o.id} แล้ว\nกำลังจัดเตรียมและจะแจ้ง tracking ให้ทราบค่ะ`
    },
    orderArrived: {
      label: "📦 ของถึงร้านแล้ว",
      build: () => `สวัสดีค่ะ คุณ${o.customer.name} 📦\nออเดอร์ ${o.id} ของถึงร้านเรียบร้อยแล้ว\nกำลังเตรียมแพ็คเพื่อจัดส่งให้ค่ะ`
    },
    shipped: {
      build: () => `สวัสดีค่ะ คุณ${o.customer.name} · THINY SHOP 🌿\nออเดอร์ ${o.id} ส่งของเรียบร้อยแล้ว 📦\nTracking: ${o.tracking || "—"} (${o.courier || "—"})\nติดตาม: ${trackingUrl}\nขอบคุณที่อุดหนุนค่ะ 🙏`,
      label: "🚚 แจ้ง tracking"
    },
    thankyou: {
      label: "❤️ ขอบคุณหลังส่ง",
      build: () => `ขอบคุณค่ะ คุณ${o.customer.name} 💖\nหวังว่าคุณจะพอใจกับสินค้านะคะ\nถ้ามีอะไรติดขัด ทักกลับมาได้เลยค่ะ\nรอต้อนรับครั้งหน้าค่ะ 🌿`
    }
  };

  const sendNotification = (templateKey, channelKind) => {
    const tpl = NOTIFY_TEMPLATES[templateKey];
    if (!tpl) return;
    const msg = tpl.build();
    const phone = (o.customer.phone || "").replace(/[^0-9+]/g, "");
    const text = encodeURIComponent(msg);
    let url = "";
    if (channelKind === "whatsapp") url = `https://wa.me/${phone}?text=${text}`;
    else if (channelKind === "line") url = `https://line.me/R/oaMessage/@thinyshop/?${text}`;
    else if (channelKind === "facebook") url = `https://m.me/thinyshop?text=${text}`;
    else if (channelKind === "ig") url = `https://ig.me/m/thinyshop?text=${text}`;
    if (url) {
      window.open(url, "_blank", "noopener");
      logNotification(templateKey, channelKind);
      if (window.logAudit) window.logAudit("send_notification", "chat_order", o.id, `${o.customer?.name} · ${tpl.label} via ${channelKind}`);
    }
  };

  const [showNotifyMenu, setShowNotifyMenu] = useStateC(false);

  const copyTrackingLink = () => {
    navigator.clipboard?.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const doScan = (pid) => {
    const p = PRODUCTS.find((x) => x.id === pid);
    setScanned([{ pid, name: p.name[lang], at: new Date().toLocaleTimeString() }, ...scanned].slice(0, 8));
  };

  return (
    <div className="thiny-screen">
      <button className="thiny-back" onClick={onBack}>
        <Icon name="chev" size={14} className="thiny-rot180" />
        {t.chat.backToList}
      </button>

      <div className="thiny-row">
        <div className="thiny-card thiny-pd-main">
          {/* Head — channel + customer + status */}
          <div className="thiny-pd-head" style={{ background: "var(--c-mute)" }}>
            <div className="thiny-chat-customer">
              <div className="thiny-chat-avatar" style={{ background: channel.color }}>
                {o.customer.name[0]}
              </div>
              <div>
                <div className="thiny-pd-cat" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <ChatPill id={o.channel} size="sm" />
                  <span>{channel.name} · {o.id}</span>
                  {(() => {
                    const plat = window.THINY_DATA.CHANNELS.find(c => c.id === o.platform);
                    if (!plat) return null;
                    return (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "2px 8px", borderRadius: 10,
                        background: plat.color, color: "#fff",
                        fontSize: 11, fontWeight: 600, marginLeft: 4
                      }}>
                        <span style={{ fontSize: 10 }}>{plat.icon}</span>
                        {plat.name}
                      </span>
                    );
                  })()}
                </div>
                <h2 className="thiny-h2">{o.customer.name}</h2>
                <div className="thiny-pd-codes">
                  <span className="thiny-chip">📞 {o.customer.phone}</span>
                  <span className="thiny-chip">{o.created}</span>
                  <span className="thiny-chip" style={{ background: "var(--c-surface)" }}>
                    {chatStatusBadge(o.status, t, lang)}
                  </span>
                  {o.paymentStatus && (
                    <span className="thiny-chip" style={{
                      background: o.paymentStatus === "paid" ? "#DDF0E3" : "#FEF3D3",
                      color: o.paymentStatus === "paid" ? "#1F6F4A" : "#C77100",
                      fontWeight: 600
                    }}>
                      {o.paymentStatus === "paid" ? "✓ ชำระแล้ว" : (o.paymentMethod === "cod" ? "📦 COD รอเก็บ" : "⏳ รอโอน")}
                    </span>
                  )}
                </div>
                <div className="thiny-pd-stats">
                  <div>
                    <div className="thiny-pd-stat-label">ยอดลูกค้าจ่าย</div>
                    <div className="thiny-pd-stat-value">{fmtMoney(o.total, lang)}</div>
                  </div>
                  <div>
                    <div className="thiny-pd-stat-label">จำนวน</div>
                    <div className="thiny-pd-stat-value">{o.customItem ? o.customItem.qty : (o.items || []).reduce((a, b) => a + b.qty, 0)}</div>
                  </div>
                  <div>
                    <div className="thiny-pd-stat-label">Tracking ขาเข้า</div>
                    <div className="thiny-pd-stat-value thiny-mono" style={{ fontSize: 13 }}>{o.sourceTracking || "—"}</div>
                  </div>
                  <div>
                    <div className="thiny-pd-stat-label">Tracking ขาออก</div>
                    <div className="thiny-pd-stat-value thiny-mono" style={{ fontSize: 13 }}>{o.tracking || "—"}</div>
                  </div>
                </div>

                <div className="thiny-pd-actions" style={{ flexWrap: "wrap" }}>
                  <button
                    className="thiny-btn thiny-btn-primary"
                    style={{ background: channel.color }}
                    onClick={() => handleSend(o.channel)}
                  >
                    <Icon name="chat" size={14} />
                    {t.chat.sendTracking} {channel.name}
                  </button>
                  <button className="thiny-btn-ghost" onClick={copyTrackingLink}>
                    <Icon name={copied ? "check" : "location"} size={14} />
                    {copied ? t.chat.copied : t.chat.copyLink}
                  </button>
                  <a
                    className="thiny-btn-ghost"
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener"
                    style={{ textDecoration: "none" }}
                  >
                    <Icon name="eye" size={14} />
                    {t.chat.trackingPage}
                  </a>
                  <a
                    className="thiny-btn-ghost"
                    href={`tel:${o.customer.phone}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Icon name="bell" size={14} />
                    {t.chat.callCustomer}
                  </a>
                  <button
                    className="thiny-btn thiny-btn-primary"
                    onClick={printBill}
                    style={{ background: "#1F6F4A" }}
                    title="พิมพ์ใบจัดส่งเพื่อติดหน้ากล่อง"
                  >
                    🖨️ พิมพ์บิล
                  </button>
                  <button
                    className="thiny-btn-ghost"
                    onClick={() => setShowEdit(true)}
                    title="แก้ไขข้อมูลออเดอร์ทั้งหมด"
                  >
                    ✏️ แก้ไข
                  </button>
                  <div style={{ position: "relative" }}>
                    <button className="thiny-btn-ghost" onClick={() => setShowNotifyMenu(!showNotifyMenu)}>
                      📨 แจ้งเตือน ▾
                    </button>
                    {showNotifyMenu && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 4px)", right: 0,
                        background: "white", border: "1px solid #ddd", borderRadius: 10,
                        boxShadow: "0 12px 30px rgba(0,0,0,0.15)", padding: 8,
                        minWidth: 240, zIndex: 100
                      }}>
                        <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", fontWeight: 700, padding: "4px 8px", marginBottom: 4 }}>เลือก template + ส่งผ่าน</div>
                        {Object.entries(NOTIFY_TEMPLATES).map(([key, tpl]) => (
                          <div key={key} style={{ marginBottom: 6 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, padding: "4px 8px" }}>{tpl.label}</div>
                            <div style={{ display: "flex", gap: 4, paddingLeft: 8 }}>
                              {["whatsapp", "line", "facebook", "ig"].map(ch => (
                                <button key={ch} onClick={() => { sendNotification(key, ch); setShowNotifyMenu(false); }}
                                  style={{ flex: 1, padding: "6px 4px", border: "1px solid #ddd", background: "white", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 600 }}
                                  title={`Send via ${ch}`}>
                                  {ch === "whatsapp" ? "W" : ch === "line" ? "L" : ch === "facebook" ? "M" : "♥"}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address + note + last message */}
          <div className="thiny-pd-section">
            <div className="thiny-chat-info-grid">
              <div className="thiny-chat-info-card">
                <div className="thiny-chat-info-icon" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                  <Icon name="location" size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="thiny-fg-3 thiny-xs">{t.chat.address}</div>
                  <div className="thiny-strong" style={{ marginTop: 2 }}>{o.customer.address}</div>
                </div>
              </div>
              <div className="thiny-chat-info-card">
                <div className="thiny-chat-info-icon" style={{ background: "var(--c-warn-bg)", color: "var(--c-warn)" }}>
                  <Icon name="chat" size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="thiny-fg-3 thiny-xs">{t.chat.note}</div>
                  <div className="thiny-strong" style={{ marginTop: 2 }}>
                    {o.customer.note || <span className="thiny-fg-3">—</span>}
                  </div>
                </div>
              </div>
              <div className="thiny-chat-info-card" style={{ gridColumn: "1 / -1" }}>
                <div className="thiny-chat-info-icon" style={{ background: channel.color + "22", color: channel.color }}>
                  <Icon name="chat" size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="thiny-fg-3 thiny-xs">{t.chat.lastMsg} · {channel.name}</div>
                  <div className="thiny-strong" style={{ marginTop: 2, fontStyle: "italic" }}>“{o.lastMessage}”</div>
                </div>
              </div>
            </div>
          </div>

          {/* Items + scan */}
          <div className="thiny-pd-section">
            <div className="thiny-card-head" style={{ marginBottom: 14 }}>
              <h3 className="thiny-h3" style={{ margin: 0 }}>{t.chat.items}</h3>
              <div className="thiny-seg thiny-seg-sm">
                <button className={scanMode === "in" ? "active" : ""} onClick={() => setScanMode(scanMode === "in" ? null : "in")}>
                  <Icon name="barcode" size={12} /> {t.chat.scanIn}
                </button>
                <button className={scanMode === "out" ? "active" : ""} onClick={() => setScanMode(scanMode === "out" ? null : "out")}>
                  <Icon name="barcode" size={12} /> {t.chat.scanOut}
                </button>
              </div>
            </div>

            {scanMode && (
              <div className="thiny-chat-scanbox">
                <div className="thiny-chat-scanbox-head">
                  <div>
                    <strong>{scanMode === "in" ? t.chat.scanIn : t.chat.scanOut}</strong>
                    <span className="thiny-fg-3 thiny-xs" style={{ marginLeft: 8 }}>· แตะบาร์โค้ดเพื่อจำลอง</span>
                  </div>
                  <button className="thiny-btn-ghost-sm" onClick={() => { setScanMode(null); setScanned([]); }}>
                    <Icon name="x" size={12} />
                  </button>
                </div>
                <div className="thiny-chat-scanbox-buttons">
                  {(o.items || []).map((it) => {
                    const p = PRODUCTS.find((x) => x.id === it.pid);
                    if (!p) return null;
                    return (
                      <button
                        key={it.pid}
                        className="thiny-scan-demo-btn"
                        onClick={() => doScan(it.pid)}
                        style={{ background: "var(--c-surface)" }}
                      >
                        <Icon name="barcode" size={12} />
                        <span className="thiny-mono">{p.barcode.slice(-4)}</span>
                        <span style={{ fontSize: 11 }}>×{it.qty}</span>
                      </button>
                    );
                  })}
                  {o.customItem && o.sourceTracking && (
                    <button className="thiny-scan-demo-btn" onClick={() => {
                      setScanned([{ pid: "custom", name: o.customItem.name, at: new Date().toLocaleTimeString() }, ...scanned].slice(0, 8));
                      if (scanMode === "in") updateStatus("arrived");
                    }} style={{ background: "var(--c-surface)" }}>
                      <Icon name="barcode" size={12} />
                      <span className="thiny-mono">{o.sourceTracking.slice(-6)}</span>
                      <span style={{ fontSize: 11 }}>ขาเข้า</span>
                    </button>
                  )}
                </div>
                {scanned.length > 0 && (
                  <div className="thiny-chat-scan-feed">
                    {scanned.map((s, i) => (
                      <div key={i} className="thiny-chat-scan-feed-row" style={{ animation: i === 0 ? "thiny-slidein 0.3s" : "" }}>
                        <div className={`thiny-scan-feed-icon ${scanMode}`}>
                          <Icon name={scanMode === "in" ? "arrowDown" : "arrowUp"} size={12} />
                        </div>
                        <span className="thiny-strong">{s.name}</span>
                        <span className="thiny-fg-3 thiny-xs thiny-mono" style={{ marginLeft: "auto" }}>{s.at}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="thiny-chat-items">
              {o.customItem ? (
                <div className="thiny-chat-item-row" style={{ background: "linear-gradient(135deg, #FAFAF7 0%, #F0EBE0 100%)", padding: 14, borderRadius: 10, border: "1px dashed #C77100" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, background: platform ? platform.color : "#999", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>📦</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="thiny-strong" style={{ fontSize: 15 }}>{o.customItem.name}</div>
                    {o.customItem.options && (
                      <div className="thiny-fg-3 thiny-xs" style={{ marginTop: 2 }}>{o.customItem.options}</div>
                    )}
                    <div className="thiny-fg-3 thiny-xs" style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 4, background: "#C7710020", color: "#C77100", fontWeight: 600, fontSize: 10 }}>PRE-ORDER</span>
                      {platform && <span>สั่งจาก {platform.name}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="thiny-fg-3 thiny-xs">×{o.customItem.qty}</div>
                    <div className="thiny-strong">{fmtMoney(o.customItem.pricePerUnit * o.customItem.qty, lang)}</div>
                    {o.sourceCost > 0 && (
                      <div className="thiny-fg-3 thiny-xs" style={{ marginTop: 2 }}>ต้นทุน {fmtMoney(o.sourceCost * o.customItem.qty, lang)}</div>
                    )}
                  </div>
                </div>
              ) : (
                (o.items || []).map((it, idx) => {
                  const p = PRODUCTS.find((x) => x.id === it.pid);
                  if (!p) return null;
                  const totalStock = Object.values(p.stockByLoc).reduce((a, b) => a + b, 0);
                  return (
                    <div key={idx} className="thiny-chat-item-row">
                      <ProductImg id={p.image} size="md" rounded="rounded-md" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="thiny-strong">{p.name[lang]}</div>
                        <div className="thiny-fg-3 thiny-xs thiny-mono">{p.sku} · {p.barcode}</div>
                        <div className="thiny-fg-3 thiny-xs" style={{ marginTop: 2 }}>
                          คงเหลือ <strong style={{ color: totalStock < 10 ? "var(--c-warn)" : "var(--c-fg)" }}>{totalStock}</strong>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="thiny-fg-3 thiny-xs">×{it.qty}</div>
                        <div className="thiny-strong">{fmtMoney(p.price * it.qty, lang)}</div>
                      </div>
                    </div>
                  );
                })
              )}
              {/* Price breakdown */}
              {o.customItem && (
                <div style={{ background: "#FAFAF7", padding: 12, borderRadius: 8, marginTop: 10, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#666" }}>ราคาสินค้า ({o.customItem.qty} × ฿{o.customItem.pricePerUnit.toLocaleString()})</span>
                    <span>{fmtMoney(o.customItem.pricePerUnit * o.customItem.qty, lang)}</span>
                  </div>
                  {(o.serviceFee || 0) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "#C77100", fontWeight: 600 }}>
                      <span>+ ค่าบริการสั่งซื้อ</span>
                      <span>{fmtMoney(o.serviceFee, lang)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #E5DDC9", fontWeight: 700 }}>
                    <span>ยอดรวมที่ลูกค้าจ่าย</span>
                    <span style={{ color: "var(--c-accent)", fontSize: 16 }}>{fmtMoney(o.total, lang)}</span>
                  </div>
                </div>
              )}
              <div className="thiny-chat-total">
                <span className="thiny-fg-2">{t.chat.total}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "var(--c-accent)" }}>{fmtMoney(o.total, lang)}</span>
              </div>
            </div>

            {/* ===== Pre-order Tracking Sections (incoming + outgoing) ===== */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              {/* Tracking ขาเข้า */}
              <div style={{ padding: 14, border: "1px solid #E5DDC9", borderRadius: 10, background: "#FFFCF5" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: platform?.color || "#999", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>{platform?.icon || "?"}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>📥 ขาเข้า</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{platform?.name || "Platform"} → ร้านเรา</div>
                  </div>
                </div>
                {o.sourceTracking ? (
                  <div style={{ background: "white", padding: 10, borderRadius: 6, fontSize: 13, fontFamily: "monospace", fontWeight: 600, marginBottom: 8 }}>{o.sourceTracking}</div>
                ) : (
                  <div style={{ background: "white", padding: 10, borderRadius: 6, fontSize: 12, color: "#999", marginBottom: 8 }}>— ยังไม่ได้สั่ง —</div>
                )}
                <button onClick={setInTracking} style={{ width: "100%", padding: "8px", border: "1px solid #C77100", background: "white", color: "#C77100", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  {o.sourceTracking ? "✎ แก้ไข tracking ขาเข้า" : "+ เพิ่ม tracking ขาเข้า"}
                </button>
                <div style={{ fontSize: 10, color: "#999", marginTop: 6, textAlign: "center" }}>เมื่อของถึงร้าน ยิงบาร์โค้ดที่หน้าสแกน</div>
              </div>

              {/* Tracking ขาออก */}
              <div style={{ padding: 14, border: "1px solid #DCE7F3", borderRadius: 10, background: "#F8FBFE" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: "#0F4C81", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>📤</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>📤 ขาออก</div>
                    <div style={{ fontSize: 11, color: "#888" }}>ร้านเรา → ลูกค้า</div>
                  </div>
                </div>
                {o.tracking ? (
                  <div style={{ background: "white", padding: 10, borderRadius: 6, fontSize: 13, fontFamily: "monospace", fontWeight: 600, marginBottom: 8 }}>
                    {o.tracking}
                    {o.courier && <div style={{ fontSize: 11, color: "#666", marginTop: 2, fontWeight: 400 }}>{o.courier}</div>}
                  </div>
                ) : (
                  <div style={{ background: "white", padding: 10, borderRadius: 6, fontSize: 12, color: "#999", marginBottom: 8 }}>— ยังไม่ได้ส่ง —</div>
                )}
                <button onClick={setOutTracking} style={{ width: "100%", padding: "8px", border: "1px solid #0F4C81", background: "white", color: "#0F4C81", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  {o.tracking ? "✎ แก้ไข tracking ขาออก" : "+ เพิ่ม tracking ขาออก"}
                </button>
                <div style={{ fontSize: 10, color: "#999", marginTop: 6, textAlign: "center" }}>กดเมื่อส่งของให้ลูกค้าแล้ว</div>
              </div>
            </div>

            {/* Payment action */}
            {o.paymentStatus !== "paid" && (
              <div style={{ marginTop: 12, padding: 12, background: "#FEF3D3", border: "1px solid #C77100", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#C77100", fontSize: 14 }}>⏳ {o.paymentMethod === "cod" ? "รอเก็บเงินปลายทาง" : "ยังไม่ได้รับชำระเงิน"}</div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>วิธี: {o.paymentMethod === "cod" ? "COD (เก็บปลายทาง)" : "โอนเงิน"} · จำนวน {fmtMoney(o.total, lang)}</div>
                </div>
                <button onClick={markPaid} style={{ padding: "8px 16px", background: "#1F6F4A", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>✓ ทำเครื่องหมายว่าชำระแล้ว</button>
              </div>
            )}
          </div>

          {/* Status timeline + click to update */}
          <div className="thiny-pd-section">
            <h3 className="thiny-h3">สถานะออเดอร์ <span style={{ fontSize: 11, color: "#888", fontWeight: 400, marginLeft: 8 }}>(คลิกเพื่อเปลี่ยนสถานะ)</span></h3>
            <div className="thiny-chat-timeline">
              {CHAT_STATUS_FLOW.filter((s) => s !== "cancelled").map((s, i, arr) => {
                const currentIdx = arr.indexOf(o.status === "cancelled" ? "new" : o.status);
                const done = i <= currentIdx;
                const here = i === currentIdx;
                return (
                  <div key={s} className={`thiny-chat-step ${done ? "done" : ""} ${here ? "here" : ""}`}
                    onClick={() => updateStatus(s)}
                    style={{ cursor: "pointer" }}
                    title={"คลิกเพื่อตั้งสถานะเป็น " + (STATUS_INFO[s]?.th || s)}>
                    <div className="thiny-chat-step-dot">{done && <Icon name="check" size={10} />}</div>
                    <div className="thiny-chat-step-label">
                      {STATUS_INFO[s] ? STATUS_INFO[s].th : s}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side: quick actions */}
        <div className="thiny-card thiny-pd-side">
          <div className="thiny-card-title">Quick send</div>
          <div className="thiny-card-sub">ส่งข้อความ + tracking ให้ลูกค้าทันที</div>
          <div style={{ height: 12 }} />

          {window.THINY_DATA.CHATS.map((c) => (
            <button
              key={c.id}
              className="thiny-chat-send-row"
              onClick={() => handleSend(c.id)}
              disabled={c.id !== o.channel}
              style={{ opacity: c.id === o.channel ? 1 : 0.45 }}
              title={c.id === o.channel ? `ส่งทาง ${c.name}` : `ลูกค้าไม่ได้ทักจาก ${c.name}`}
            >
              <ChatPill id={c.id} size="lg" />
              <div style={{ flex: 1, textAlign: "left" }}>
                <div className="thiny-strong">{c.name}</div>
                <div className="thiny-fg-3 thiny-xs">
                  {c.id === o.channel ? "ลูกค้าทักจากช่องนี้" : "ไม่ได้เชื่อม"}
                </div>
              </div>
              <Icon name="arrowRight" size={14} className="thiny-fg-3" />
            </button>
          ))}

          <div className="thiny-pd-divider" />

          <div className="thiny-card-title">Customer page</div>
          <div className="thiny-card-sub">ลูกค้าเปิดลิงก์เพื่อดูสถานะ + tracking</div>
          <div style={{ height: 10 }} />
          <div className="thiny-tracking-link">
            <Icon name="location" size={14} className="thiny-fg-3" />
            <div className="thiny-mono thiny-xs" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
              thinyshop.co/track/{o.id}
            </div>
            <button className="thiny-btn-ghost-sm" onClick={copyTrackingLink}>
              {copied ? <Icon name="check" size={12} /> : "Copy"}
            </button>
          </div>

        </div>
      </div>
      {showEdit && (
        <AddChatOrderModal
          t={t} lang={lang}
          editingOrder={o}
          onClose={() => setShowEdit(false)}
          onSave={() => { /* not used in edit mode */ }}
        />
      )}
    </div>
  );
};

Object.assign(window, { ScreenChatOrders, ChatOrderList, ChatOrderDetail, ChatPill, printBillFor });
