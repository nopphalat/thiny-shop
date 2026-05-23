/* global React, Icon, ChannelPill, ProductImg, StatusBadge, Sparkline, BarChart, fmtMoney, fmtNum */
// Admin desktop app — sidebar, topbar, and all admin screens

const { useState, useMemo } = React;

// AddProductModal component
// สร้าง EAN-13 barcode (Thailand prefix 885) — เลขสุ่ม 12 หลัก + check digit
function generateBarcode() {
  let base = "885";
  for (let i = 0; i < 9; i++) base += Math.floor(Math.random() * 10);
  // คำนวณ check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return base + check;
}

// บีบอัดรูปก่อนอัปโหลด — resize ไม่เกิน 500x500, JPEG quality 0.75
async function compressImage(file, maxDim = 500, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
          else { width = Math.round(width * maxDim / height); height = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "white"; ctx.fillRect(0, 0, width, height); // bg ขาว เผื่อ PNG โปร่ง
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const AddProductModal = ({ t, onClose }) => {
  // Category options — must match SKU_CAT mapping in data.js
  const CATEGORY_OPTIONS = [
    { id: "fashion",     prefix: "FW", label: "👗 แฟชั่น" },
    { id: "beauty",      prefix: "BT", label: "💄 ความงาม" },
    { id: "home",        prefix: "HM", label: "🏠 ของใช้ในบ้าน" },
    { id: "food",        prefix: "FD", label: "🍱 อาหาร" },
    { id: "electronics", prefix: "EL", label: "📱 อิเล็กทรอนิกส์" },
  ];
  const [form, setForm] = useState({ id: "", sku: "", name_th: "", name_en: "", price: "", cost: "", barcode: "", quantity: "", category: "fashion", image: "" });
  const [autoBarcode, setAutoBarcode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const cat = CATEGORY_OPTIONS.find(c => c.id === form.category) || CATEGORY_OPTIONS[0];

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("ไฟล์ใหญ่เกิน 10MB"); return; }
    setUploadingImage(true);
    try {
      const dataUrl = await compressImage(file);
      setForm({ ...form, image: dataUrl });
    } catch (err) {
      alert("ไม่สามารถอ่านไฟล์ภาพ: " + err.message);
    }
    setUploadingImage(false);
  };

  const inp = (field, placeholder, type = "text", label) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600 }}>{label}</label>
      <input type={type} value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})}
        style={{ width: "100%", padding: "9px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
        placeholder={placeholder} />
    </div>
  );

  // Auto-build SKU from category prefix + ID (so category detection works in data.js)
  const buildSku = () => {
    if (form.sku) return form.sku.toUpperCase();
    const idPart = (form.id || "").replace(/[^A-Z0-9]/gi, "").toUpperCase() || String(Date.now()).slice(-4);
    return `TS-${cat.prefix}-${idPart}`;
  };

  const handleAddProduct = async () => {
    if (!form.id || !form.name_th || !form.price) {
      alert("กรุณากรอก: ID, ชื่อสินค้า, ราคา");
      return;
    }
    setLoading(true);
    try {
      const finalSku = buildSku();
      const finalBarcode = autoBarcode ? generateBarcode() : (form.barcode || "");
      // 1. สร้างสินค้า
      const res = await fetch(window.API_BASE + "/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id.toUpperCase(),
          sku: finalSku,
          name_th: form.name_th,
          name_en: form.name_en || form.name_th,
          name_lo: "",
          price: parseFloat(form.price),
          cost: parseFloat(form.cost) || 0,
          barcode: finalBarcode,
          image: form.image || form.id.toLowerCase(),
          reorder_point: 10,
        }),
      });
      if (!res.ok) { alert("เกิดข้อผิดพลาด: " + (await res.text())); setLoading(false); return; }

      // 2. เพิ่มสต๊อกเริ่มต้น (ถ้ากรอกจำนวน) + movement
      const qty = parseInt(form.quantity) || 0;
      if (qty > 0) {
        const locs = window.THINY_DATA?.LOCATIONS || [];
        const loc = locs[0];
        if (loc) {
          await fetch(window.API_BASE + "/stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: form.id.toUpperCase(), location_id: loc.id, quantity: qty }),
          }).catch(() => {});
          await logMovement({ type: "in", productId: form.id.toUpperCase(), qty, locationId: loc.id, refId: "init-stock" });
        }
      }

      alert(`✅ เพิ่มสินค้าสำเร็จ\n${cat.label} · SKU: ${finalSku}${qty > 0 ? ` · สต๊อก ${qty} ชิ้น` : ""}`);
      onClose();
      window.location.reload();
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "white", borderRadius: 14, padding: 28, width: "90%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>+ เพิ่มสินค้าใหม่</h2>

        {/* Image upload */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>รูปสินค้า</label>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 96, height: 96, borderRadius: 10, border: "2px dashed #ddd", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: form.image && form.image.startsWith("data:") ? "white" : "#f7f7f5" }}>
              {form.image && form.image.startsWith("data:") ? (
                <img src={form.image} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 28, color: "#bbb" }}>📷</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "inline-block", padding: "8px 14px", border: "1px solid #0F4C81", color: "#0F4C81", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, background: "white" }}>
                {uploadingImage ? "กำลังบีบอัด..." : (form.image && form.image.startsWith("data:") ? "เปลี่ยนรูป" : "📷 เลือกรูป")}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} style={{ display: "none" }} />
              </label>
              {form.image && form.image.startsWith("data:") && (
                <button type="button" onClick={() => setForm({ ...form, image: "" })} style={{ marginLeft: 6, padding: "8px 12px", border: "1px solid #fcc", color: "#c00", background: "white", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>ลบ</button>
              )}
              <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>JPG/PNG · ระบบจะย่อขนาดให้อัตโนมัติ</div>
            </div>
          </div>
        </div>

        {/* Category picker */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>หมวดหมู่ *</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
            {CATEGORY_OPTIONS.map(c => (
              <button key={c.id} type="button" onClick={() => setForm({...form, category: c.id})}
                style={{
                  padding: "10px 12px",
                  border: form.category === c.id ? "2px solid #0F4C81" : "1px solid #ddd",
                  background: form.category === c.id ? "#E8EEF6" : "white",
                  borderRadius: 8, fontSize: 13, cursor: "pointer",
                  fontWeight: form.category === c.id ? 700 : 500, textAlign: "left",
                }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>{inp("id", "P001", "text", "ID สินค้า *")}</div>
          <div>{inp("sku", `TS-${cat.prefix}-XXX (สร้างอัตโนมัติ)`, "text", "SKU (ไม่บังคับ)")}</div>
        </div>
        {!form.sku && form.id && (
          <div style={{ padding: "6px 12px", background: "#F0F7FF", borderRadius: 6, fontSize: 11, color: "#0F4C81", marginBottom: 12, marginTop: -6 }}>
            🏷️ SKU จะสร้างให้เป็น: <strong>{buildSku()}</strong>
          </div>
        )}
        {inp("name_th", "ชื่อสินค้าภาษาไทย", "text", "ชื่อสินค้า (ไทย) *")}
        {inp("name_en", "Product name", "text", "ชื่อสินค้า (English)")}

        {/* Barcode with auto-toggle */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Barcode</label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#666", cursor: "pointer" }}>
              <input type="checkbox" checked={autoBarcode} onChange={e => setAutoBarcode(e.target.checked)} style={{ cursor: "pointer" }} />
              สร้างให้อัตโนมัติ
            </label>
          </div>
          {autoBarcode ? (
            <div style={{ padding: "10px 12px", background: "#F0F7FF", borderRadius: 8, fontSize: 13, color: "#0F4C81", border: "1px solid #cfddf0" }}>
              🏷️ ระบบจะสร้างบาร์โค้ดให้ — รูปแบบ EAN-13 (ขึ้นต้นด้วย 885 = ประเทศไทย)
            </div>
          ) : (
            <input type="text" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
              placeholder="8851234567000" />
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>{inp("price", "0", "number", "ราคาขาย *")}</div>
          <div>{inp("cost", "0", "number", "ต้นทุน")}</div>
          <div>{inp("quantity", "0", "number", "จำนวนเริ่มต้น")}</div>
        </div>

        {form.price && form.cost && parseFloat(form.price) > 0 && (
          <div style={{ padding: "8px 12px", background: "#F0FDF4", borderRadius: 8, fontSize: 12, color: "#0A8754", marginBottom: 14 }}>
            Margin: {Math.round((1 - parseFloat(form.cost || 0) / parseFloat(form.price)) * 100)}%
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", border: "1px solid #ddd", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 14 }}>ยกเลิก</button>
          <button onClick={handleAddProduct} disabled={loading} style={{ padding: "9px 22px", background: "#0F4C81", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "กำลังบันทึก..." : "เพิ่มสินค้า"}
          </button>
        </div>
      </div>
    </div>
  );
};

const NAV = [
{ id: "dashboard", icon: "dashboard" },
{ id: "products", icon: "products" },
{ id: "chatOrders", icon: "chat", badge: 2 },
{ id: "scan", icon: "scan" },
{ id: "calendar", icon: "movement" },
{ id: "customers", icon: "customers" },
{ id: "finance", icon: "reports" },
{ id: "reports", icon: "reports" },
{ id: "settings", icon: "settings" }];


const AdminApp = ({ t, lang }) => {
  // ===== All useState hooks declared first (React rules) =====
  const [currentUser, setCurrentUser] = useState(() => window.getAuthUser ? window.getAuthUser() : null);
  const [route, setRoute] = useState("dashboard");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = async () => {
    if (!confirm("ออกจากระบบ?")) return;
    try {
      const token = window.getAuthToken();
      await fetch(window.API_BASE + "/auth/logout", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token }
      });
    } catch (e) {}
    window.clearAuthSession();
    setCurrentUser(null);
  };

  // === Global search across chat orders / customers / products ===
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return null;
    const { CHAT_ORDERS = [], CUSTOMERS = [], PRODUCTS = [] } = window.THINY_DATA || {};
    const orderResults = CHAT_ORDERS.filter(o => {
      const haystack = [
        o.id, o.customer?.name, o.customer?.phone, o.tracking, o.sourceTracking,
        o.customItem?.name, o.lastMessage
      ].filter(Boolean).map(x => String(x).toLowerCase()).join(" | ");
      return haystack.includes(q);
    }).slice(0, 10);
    const customerResults = CUSTOMERS.filter(c =>
      [c.name, c.phone, c.email].filter(Boolean).join(" | ").toLowerCase().includes(q)
    ).slice(0, 5);
    const productResults = PRODUCTS.filter(p =>
      [p.sku, p.barcode, p.name?.[lang], p.name?.th, p.name?.en].filter(Boolean).join(" | ").toLowerCase().includes(q)
    ).slice(0, 5);
    return { orderResults, customerResults, productResults };
  }, [searchQuery, lang, route, selectedProduct]);

  // Show login screen if not authenticated (after all hooks)
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="thiny-admin">
      <aside className="thiny-sidebar">
        <div className="thiny-brand">
          <div className="thiny-brand-mark">T</div>
          <div className="thiny-brand-text">
            <div className="thiny-brand-name" style={{ fontFamily: "Inter" }}>THINY</div>
            <div className="thiny-brand-sub">{t.adminPanel}</div>
          </div>
        </div>
        <nav className="thiny-nav">
          {NAV.filter(n => window.canAccess ? window.canAccess(currentUser, n.id) : true).map((n) =>
          <button key={n.id} className={`thiny-nav-item ${route === n.id ? "active" : ""}`} onClick={() => {setRoute(n.id);setSelectedProduct(null);}}>
              <Icon name={n.icon} size={18} />
              <span>{t.nav[n.id]}</span>
              {n.badge && <span className="thiny-nav-badge">{n.badge}</span>}
            </button>
          )}
          {/* Owner-only menus */}
          {currentUser?.role === "owner" && (
            <>
              <button className={`thiny-nav-item ${route === "users" ? "active" : ""}`} onClick={() => {setRoute("users");setSelectedProduct(null);}}>
                <Icon name="customers" size={18} />
                <span>จัดการผู้ใช้</span>
              </button>
              <button className={`thiny-nav-item ${route === "audit" ? "active" : ""}`} onClick={() => {setRoute("audit");setSelectedProduct(null);}}>
                <Icon name="movement" size={18} />
                <span>Audit Log</span>
              </button>
            </>
          )}
        </nav>
        <div className="thiny-user" style={{ cursor: "default" }}>
          <div className="thiny-avatar" style={{ background: ROLE_INFO[currentUser.role]?.color }}>{currentUser.avatar || currentUser.name?.[0]}</div>
          <div className="thiny-user-info" style={{ flex: 1, minWidth: 0 }}>
            <div className="thiny-user-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name}</div>
            <div className="thiny-user-role" style={{ color: ROLE_INFO[currentUser.role]?.color, fontWeight: 700 }}>
              {ROLE_INFO[currentUser.role]?.label || currentUser.role}
            </div>
          </div>
          <button onClick={handleLogout} title="ออกจากระบบ"
            style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 14, padding: 6, borderRadius: 6 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#FFE5E5"; e.currentTarget.style.color = "#C53030"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#999"; }}>
            🚪
          </button>
        </div>
      </aside>

      <main className="thiny-main">
        <header className="thiny-topbar">
          <div className="thiny-search" style={{ position: "relative" }}>
            <Icon name="search" size={16} />
            <input
              placeholder="ค้นหา ออเดอร์ · ลูกค้า · เบอร์ · tracking · สินค้า…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
            )}
            <span className="thiny-kbd">⌘K</span>

            {/* Search results dropdown */}
            {searchOpen && searchResults && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                background: "white", border: "1px solid #ddd", borderRadius: 10,
                boxShadow: "0 12px 36px rgba(0,0,0,0.12)", maxHeight: 480, overflowY: "auto",
                zIndex: 999
              }}>
                {(() => {
                  const { orderResults, customerResults, productResults } = searchResults;
                  const total = orderResults.length + customerResults.length + productResults.length;
                  if (total === 0) {
                    return <div style={{ padding: 16, textAlign: "center", color: "#999", fontSize: 13 }}>ไม่พบผลลัพธ์</div>;
                  }
                  return (
                    <>
                      {orderResults.length > 0 && (
                        <div>
                          <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", background: "#FAFAF7" }}>
                            📦 ออเดอร์ ({orderResults.length})
                          </div>
                          {orderResults.map(o => {
                            const plat = window.THINY_DATA.CHANNELS.find(c => c.id === o.platform);
                            return (
                              <button key={o.id} onMouseDown={(e) => { e.preventDefault(); setRoute("chatOrders"); setSearchOpen(false); setSearchQuery(""); }}
                                style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", border: "none", borderBottom: "1px solid #f5f5f5", background: "white", cursor: "pointer", fontFamily: "inherit" }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#F5EFFD"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "white"}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  {plat && (
                                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: plat.color, color: "#fff", fontSize: 9, fontWeight: 700 }}>{plat.icon}</span>
                                  )}
                                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#888" }}>{o.id}</span>
                                  <span style={{ fontWeight: 600, fontSize: 13 }}>{o.customer?.name}</span>
                                  <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#0F4C81" }}>฿{(o.total || 0).toLocaleString()}</span>
                                </div>
                                <div style={{ fontSize: 11, color: "#888", marginTop: 2, marginLeft: 26 }}>
                                  {o.customItem?.name || ((o.items || []).length + " items")} · {o.customer?.phone || "—"}
                                  {o.tracking ? " · 📍 " + o.tracking : ""}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {customerResults.length > 0 && (
                        <div>
                          <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", background: "#FAFAF7" }}>
                            👤 ลูกค้า ({customerResults.length})
                          </div>
                          {customerResults.map(c => (
                            <button key={c.id} onMouseDown={(e) => { e.preventDefault(); setRoute("customers"); setSearchOpen(false); setSearchQuery(""); }}
                              style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", border: "none", borderBottom: "1px solid #f5f5f5", background: "white", cursor: "pointer", fontFamily: "inherit" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#F5EFFD"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "white"}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>📞 {c.phone} · {c.email || "—"}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      {productResults.length > 0 && (
                        <div>
                          <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", background: "#FAFAF7" }}>
                            🏷️ สินค้า ({productResults.length})
                          </div>
                          {productResults.map(p => (
                            <button key={p.id} onMouseDown={(e) => { e.preventDefault(); setRoute("products"); setSelectedProduct(p.id); setSearchOpen(false); setSearchQuery(""); }}
                              style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", border: "none", borderBottom: "1px solid #f5f5f5", background: "white", cursor: "pointer", fontFamily: "inherit" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#F5EFFD"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "white"}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name?.[lang] || p.name?.th}</div>
                              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>SKU {p.sku} · ฿{p.price?.toLocaleString()} · barcode {p.barcode}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
          <div className="thiny-top-actions">
            <button className="thiny-icon-btn" title="Sync" onClick={() => window.location.reload()}>
              <Icon name="refresh" size={18} />
            </button>
            {/* User menu with logout */}
            <UserMenu user={currentUser} onLogout={handleLogout} />
          </div>
        </header>

        <div className="thiny-content">
          {route === "dashboard" && <ScreenDashboard t={t} lang={lang} goto={setRoute} />}
          {route === "products" && (selectedProduct ?
          <ScreenProductDetail t={t} lang={lang} pid={selectedProduct} onBack={() => setSelectedProduct(null)} /> :
          <ScreenProducts t={t} lang={lang} onPick={setSelectedProduct} onAdd={() => setShowAddProductForm(true)} />)}
          {route === "chatOrders" && <ScreenChatOrders t={t} lang={lang} />}
          {route === "stock" && <ScreenStock t={t} lang={lang} />}
          {route === "movement" && <ScreenMovement t={t} lang={lang} />}
          {route === "customers" && <ScreenCustomers t={t} lang={lang} />}
          {route === "scan" && <ScreenScan t={t} lang={lang} />}
          {route === "calendar" && <ScreenCalendar t={t} lang={lang} goto={setRoute} />}
          {route === "finance" && <ScreenFinance t={t} lang={lang} />}
          {route === "reports" && <ScreenReports t={t} lang={lang} />}
          {route === "settings" && <ScreenSettings t={t} lang={lang} />}
          {route === "users" && currentUser?.role === "owner" && <ScreenUsers t={t} lang={lang} currentUser={currentUser} />}
          {route === "audit" && currentUser?.role === "owner" && <ScreenAuditLog t={t} lang={lang} />}
        </div>
        {showAddProductForm && <AddProductModal t={t} onClose={() => setShowAddProductForm(false)} />}
      </main>
    </div>);

};

// ---------------- DASHBOARD ----------------
const ScreenDashboard = ({ t, lang, goto }) => {
  const { PRODUCTS, CHAT_ORDERS, CHANNELS, SALES_TREND } = window.THINY_DATA;

  // === Compute pre-order metrics ===
  const todayStr = "2026-05-21"; // today (matches sample data)
  const todayOrders = CHAT_ORDERS.filter(o => o.created && o.created.startsWith(todayStr));
  const todayRevenue = todayOrders.reduce((a, o) => a + (o.total || 0), 0);

  // Status buckets
  const byStatus = (s) => CHAT_ORDERS.filter(o => o.status === s);
  const awaitingPayment = byStatus("awaitingPayment").concat(
    CHAT_ORDERS.filter(o => o.status === "new" && o.paymentStatus !== "paid" && o.paymentMethod !== "cod")
  );
  const needToOrder = byStatus("paid"); // ชำระแล้ว รอเราสั่งจาก platform
  const waitingArrival = byStatus("ordered"); // สั่งแล้ว รอของถึง
  const readyToShip = byStatus("arrived"); // พร้อมส่ง
  const codOutstanding = CHAT_ORDERS.filter(o => o.paymentMethod === "cod" && o.paymentStatus !== "paid" && (o.status === "shipped" || o.status === "arrived"));

  // Total service fees collected (paid orders)
  const totalServiceFees = CHAT_ORDERS.filter(o => o.paymentStatus === "paid").reduce((a, o) => a + (o.serviceFee || 0), 0);
  // Total profit estimate (paid orders): total - (sourceCost * qty)
  const totalProfit = CHAT_ORDERS.filter(o => o.paymentStatus === "paid").reduce((a, o) => {
    const qty = o.customItem?.qty || (o.items || []).reduce((x, it) => x + it.qty, 0);
    return a + ((o.total || 0) - (o.sourceCost || 0) * qty);
  }, 0);
  // COD value pending collection
  const codValue = codOutstanding.reduce((a, o) => a + (o.total || 0), 0);

  // Active orders by platform
  const activeOrders = CHAT_ORDERS.filter(o => o.status !== "delivered" && o.status !== "cancelled");
  const platformCounts = CHANNELS.map(c => ({
    ...c,
    count: activeOrders.filter(o => o.platform === c.id).length
  }));
  const totalActiveOrders = activeOrders.length;

  // ===== Smart aggregation: group paid orders by product → bulk buy from platform =====
  // Match by (platform + item name) so we know what to bulk-order from each platform
  const toOrderAgg = {};
  needToOrder.forEach(o => {
    const itemName = o.customItem?.name || "";
    const key = `${o.platform || "unknown"}::${itemName.toLowerCase()}`;
    if (!toOrderAgg[key]) {
      toOrderAgg[key] = {
        platform: o.platform,
        itemName,
        totalQty: 0,
        totalCost: 0,
        orders: []
      };
    }
    const qty = o.customItem?.qty || 1;
    toOrderAgg[key].totalQty += qty;
    toOrderAgg[key].totalCost += (o.sourceCost || 0) * qty;
    toOrderAgg[key].orders.push(o);
  });
  const aggregations = Object.values(toOrderAgg).sort((a, b) => b.totalQty - a.totalQty);

  // Status breakdown for chart
  const statusBreakdown = [
    { key: "awaitingPayment", label: "รอชำระ", color: "#B7531B", count: awaitingPayment.length },
    { key: "paid",            label: "รอสั่ง",  color: "#1F6F4A", count: needToOrder.length },
    { key: "ordered",         label: "รอของถึง",color: "#0F4C81", count: waitingArrival.length },
    { key: "arrived",         label: "พร้อมส่ง",color: "#5B3A8F", count: readyToShip.length },
    { key: "shipped",         label: "ส่งแล้ว", color: "#888",    count: byStatus("shipped").length },
  ];
  const maxStatus = Math.max(1, ...statusBreakdown.map(s => s.count));

  // Recent orders (last 5)
  const recentOrders = CHAT_ORDERS.slice(0, 5);

  // Color helpers
  const cardBg = "white";
  const labelStyle = { fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" };

  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">ภาพรวมร้าน</h1>
          <p className="thiny-sub">สรุปงาน Pre-order · <span style={{ color: "var(--c-ok)" }}>● Live</span> · {new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
      </div>

      {/* ============ DIRECT SALES (POS) ============ */}
      <DirectSalesSummary />

      {/* ============ KPI ROW ============ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "linear-gradient(135deg, #0F4C81 0%, #1565A8 100%)", color: "white", padding: 18, borderRadius: 12 }}>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>📦 ออเดอร์วันนี้</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6 }}>{todayOrders.length}</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>ยอดรวม ฿{todayRevenue.toLocaleString()}</div>
        </div>
        <div style={{ background: cardBg, padding: 18, borderRadius: 12, borderLeft: "4px solid #1F6F4A" }}>
          <div style={{ ...labelStyle, color: "#1F6F4A" }}>💰 กำไรรวม</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#1F6F4A" }}>฿{totalProfit.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>รวมค่าบริการ ฿{totalServiceFees.toLocaleString()}</div>
        </div>
        <div style={{ background: cardBg, padding: 18, borderRadius: 12, borderLeft: "4px solid #C77100" }}>
          <div style={{ ...labelStyle, color: "#C77100" }}>📦 COD ค้างเก็บ</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#C77100" }}>฿{codValue.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{codOutstanding.length} ออเดอร์</div>
        </div>
        <div style={{ background: cardBg, padding: 18, borderRadius: 12, borderLeft: "4px solid #5B3A8F" }}>
          <div style={{ ...labelStyle, color: "#5B3A8F" }}>⚡ ต้องดำเนินการ</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#5B3A8F" }}>{awaitingPayment.length + needToOrder.length + readyToShip.length}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{totalActiveOrders} ออเดอร์ active</div>
        </div>
      </div>

      {/* ============ ACTION ITEMS (สำคัญสุด) ============ */}
      <div className="thiny-card" style={{ marginBottom: 16, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>🎯 สิ่งที่ต้องทำ</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>คลิกการ์ดเพื่อไปจัดการ</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {/* รอชำระ */}
          <button onClick={() => goto("chatOrders")} style={{
            padding: 14, border: "2px solid #FEF3D3", background: "#FFFCF5",
            borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 18 }}>⏳</span>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#B7531B", textTransform: "uppercase" }}>รอชำระ</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#B7531B", marginTop: 4 }}>{awaitingPayment.length}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>ออเดอร์รอลูกค้าโอน</div>
          </button>

          {/* รอสั่งจาก platform */}
          <button onClick={() => goto("chatOrders")} style={{
            padding: 14, border: "2px solid #DDF0E3", background: "#F8FDFA",
            borderRadius: 10, cursor: "pointer", textAlign: "left"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 18 }}>🛒</span>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1F6F4A", textTransform: "uppercase" }}>รอเราสั่ง</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#1F6F4A", marginTop: 4 }}>{needToOrder.length}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>ลูกค้าจ่ายแล้ว · ไปสั่ง platform</div>
          </button>

          {/* รอของถึง */}
          <button onClick={() => goto("chatOrders")} style={{
            padding: 14, border: "2px solid #DCE7F3", background: "#F8FBFE",
            borderRadius: 10, cursor: "pointer", textAlign: "left"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 18 }}>🚚</span>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0F4C81", textTransform: "uppercase" }}>รอของถึง</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0F4C81", marginTop: 4 }}>{waitingArrival.length}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>สั่งจาก platform แล้ว</div>
          </button>

          {/* พร้อมส่ง */}
          <button onClick={() => goto("scan")} style={{
            padding: 14, border: "2px solid #E7DEF5", background: "linear-gradient(135deg, #F5EFFD 0%, #E7DEF5 100%)",
            borderRadius: 10, cursor: "pointer", textAlign: "left"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 18 }}>📤</span>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#5B3A8F", textTransform: "uppercase" }}>พร้อมส่ง!</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#5B3A8F", marginTop: 4 }}>{readyToShip.length}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>ของถึงร้านแล้ว · ไปสแกนตัดออก →</div>
          </button>
        </div>
      </div>

      {/* ============ Smart Aggregation — รวบออเดอร์ไปสั่ง platform ============ */}
      {aggregations.length > 0 && (
        <div className="thiny-card" style={{ marginBottom: 16, padding: 18, borderLeft: "4px solid #1F6F4A" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>🛒 รวบออเดอร์ที่ต้องสั่ง</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                ระบบรวบลูกค้าที่สั่งสินค้าเดียวกัน → สั่ง platform ครั้งเดียว ประหยัดค่าส่ง
              </div>
            </div>
            <div style={{ fontSize: 11, padding: "4px 10px", background: "#DDF0E3", color: "#1F6F4A", borderRadius: 10, fontWeight: 700 }}>
              {aggregations.length} รายการ
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {aggregations.map((agg, i) => {
              const plat = CHANNELS.find(c => c.id === agg.platform);
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr 100px 100px 120px", gap: 12, padding: 12, background: "#FAFAF7", borderRadius: 8, alignItems: "center" }}>
                  {plat ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 32, height: 32, borderRadius: 8, background: plat.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>{plat.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: plat.color }}>{plat.name}</span>
                    </div>
                  ) : <div style={{ width: 32 }} />}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{agg.itemName}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                      {agg.orders.length} ลูกค้า: {agg.orders.map(o => o.customer?.name?.split(" ")[0]).slice(0, 3).join(", ")}{agg.orders.length > 3 ? "…" : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", fontWeight: 700 }}>จำนวน</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#1F6F4A" }}>×{agg.totalQty}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", fontWeight: 700 }}>ต้นทุน</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>฿{agg.totalCost.toLocaleString()}</div>
                  </div>
                  <button onClick={() => {
                    const url = plat?.id === "shopee" ? `https://shopee.co.th/search?keyword=${encodeURIComponent(agg.itemName)}` :
                                plat?.id === "lazada" ? `https://www.lazada.co.th/catalog/?q=${encodeURIComponent(agg.itemName)}` :
                                plat?.id === "tiktok" ? `https://shop.tiktok.com/?q=${encodeURIComponent(agg.itemName)}` : "#";
                    window.open(url, "_blank", "noopener");
                  }}
                    style={{ padding: "8px 12px", background: plat?.color || "#0F4C81", color: "white", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
                    ไปสั่ง →
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 10, padding: 10, background: "#FFF8E1", borderRadius: 6, fontSize: 11, color: "#8B5A00" }}>
            💡 รวมยอดต้นทุน: ฿{aggregations.reduce((a, x) => a + x.totalCost, 0).toLocaleString()} · ปกติสั่งทีละครั้งเสียค่าส่ง {aggregations.reduce((a, x) => a + x.orders.length, 0)} ครั้ง · รวมเป็น {aggregations.length} ครั้ง = ประหยัดได้
          </div>
        </div>
      )}

      {/* ============ STATUS BREAKDOWN + PLATFORM ============ */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 16 }}>
        {/* Status breakdown */}
        <div className="thiny-card" style={{ padding: 18 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>📊 สถานะออเดอร์ทั้งหมด</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{totalActiveOrders} active orders</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {statusBreakdown.map(s => (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 80, fontSize: 12, color: "#555", fontWeight: 600 }}>{s.label}</div>
                <div style={{ flex: 1, height: 22, background: "#F5F2EA", borderRadius: 4, position: "relative", overflow: "hidden" }}>
                  <div style={{
                    width: `${(s.count / maxStatus) * 100}%`,
                    height: "100%", background: s.color, borderRadius: 4,
                    transition: "width 0.4s ease-out",
                    display: "flex", alignItems: "center", paddingLeft: 8,
                    color: "white", fontWeight: 700, fontSize: 11
                  }}>{s.count > 0 && s.count}</div>
                </div>
                <div style={{ width: 30, textAlign: "right", fontWeight: 700, fontSize: 13, color: s.color }}>{s.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform usage */}
        <div className="thiny-card" style={{ padding: 18 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>🛍️ Platform ที่สั่งบ่อย</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>ออเดอร์ active</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {platformCounts.sort((a, b) => b.count - a.count).map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, background: "#FAFAF7", borderRadius: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: p.color, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14
                }}>{p.icon}</div>
                <div style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: p.color }}>{p.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ SALES CHART + RECENT ORDERS ============ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Sales trend */}
        <div className="thiny-card" style={{ padding: 18 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>📈 ยอดขาย 14 วัน</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{fmtMoney(SALES_TREND.reduce((a, b) => a + b.sales, 0), lang)} รวม · {SALES_TREND.reduce((a, b) => a + b.orders, 0)} ออเดอร์</div>
          </div>
          <BarChart data={SALES_TREND.map((d, i) => ({ l: d.d, v: d.sales, hl: i === SALES_TREND.length - 1 }))} height={180} accent="var(--c-accent)" />
        </div>

        {/* Recent orders */}
        <div className="thiny-card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>🕐 ออเดอร์ล่าสุด</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{recentOrders.length} รายการ</div>
            </div>
            <button onClick={() => goto("chatOrders")} className="thiny-link" style={{ fontSize: 12 }}>ดูทั้งหมด →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentOrders.map(o => {
              const plat = CHANNELS.find(c => c.id === o.platform);
              return (
                <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, background: "#FAFAF7", borderRadius: 8 }}>
                  {plat && (
                    <div style={{
                      width: 28, height: 28, borderRadius: 6, background: plat.color, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12
                    }}>{plat.icon}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customer.name}</div>
                    <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>{o.id} · {o.created.split(" ")[1]}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>฿{(o.total || 0).toLocaleString()}</div>
                    <div style={{
                      fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8, display: "inline-block",
                      background: o.paymentStatus === "paid" ? "#DDF0E3" : "#FEF3D3",
                      color: o.paymentStatus === "paid" ? "#1F6F4A" : "#C77100"
                    }}>{o.paymentStatus === "paid" ? "✓ ชำระ" : (o.paymentMethod === "cod" ? "COD" : "รอ")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, delta, series, accent, warn }) => {
  return (
    <div className={`thiny-stat ${accent ? "thiny-stat-accent" : ""} ${warn ? "thiny-stat-warn" : ""}`}>
      <div className="thiny-stat-label">{label}</div>
      <div className="thiny-stat-value">{value}</div>
      <div className="thiny-stat-bottom">
        {delta !== null && delta !== undefined ?
        <span className={`thiny-delta ${delta >= 0 ? "up" : "down"}`}>
            <Icon name={delta >= 0 ? "arrowUp" : "arrowDown"} size={12} />
            {Math.abs(delta).toFixed(1)}%
          </span> :
        warn ? <span className="thiny-delta warn">needs attention</span> : <span />}
        {series && <Sparkline data={series} width={80} height={28} stroke={accent ? "var(--c-accent)" : "var(--c-fg-2)"} />}
      </div>
    </div>);

};

const MoveTag = ({ type, t }) => {
  const map = {
    in: { label: t.movement.in, cls: "in" },
    out: { label: t.movement.out, cls: "out" },
    transfer: { label: t.movement.transferType, cls: "transfer" },
    adjust: { label: t.movement.adjust, cls: "adjust" }
  };
  const m = map[type] || { label: type, cls: "in" };
  return <span className={`thiny-movetag thiny-movetag-${m.cls}`}>{m.label}</span>;
};

// ---------------- PRODUCTS ----------------
// ============= DIRECT SALES (POS) SUMMARY =============
const DirectSalesSummary = () => {
  const [range, setRange] = useState("today"); // today | week | month
  const ORDERS = (window.THINY_DATA?.ORDERS || []);

  // Parse SQL datetime '2026-05-23 05:30:00' หรือ ISO '2026-05-23T05:30:00Z'
  const parseDate = (s) => {
    if (!s) return null;
    const normalized = String(s).replace(" ", "T") + (String(s).includes("Z") || String(s).includes("+") ? "" : "Z");
    const d = new Date(normalized);
    return isNaN(d) ? null : d;
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday); startOfWeek.setDate(startOfToday.getDate() - 6); // 7 วันย้อนหลัง
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const inRange = (d, start) => d && d >= start;
  const filtered = ORDERS.filter(o => {
    const d = parseDate(o.date);
    if (!d) return false;
    if (range === "today") return inRange(d, startOfToday);
    if (range === "week") return inRange(d, startOfWeek);
    if (range === "month") return inRange(d, startOfMonth);
    return true;
  });

  const totalRev = filtered.reduce((sum, o) => sum + o.total, 0);
  const orderCount = filtered.length;
  const avgOrder = orderCount > 0 ? Math.round(totalRev / orderCount) : 0;

  // สร้าง bar chart รายวัน
  const dailyAgg = {};
  filtered.forEach(o => {
    const d = parseDate(o.date);
    if (!d) return;
    const key = `${d.getMonth()+1}/${d.getDate()}`;
    dailyAgg[key] = (dailyAgg[key] || 0) + o.total;
  });
  const days = range === "today" ? 1 : range === "week" ? 7 : new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const dailyList = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getMonth()+1}/${d.getDate()}`;
    dailyList.push({ key, value: dailyAgg[key] || 0, isToday: i === 0 });
  }
  const maxVal = Math.max(1, ...dailyList.map(d => d.value));

  const rangeLabel = { today: "วันนี้", week: "7 วัน", month: "เดือนนี้" };

  return (
    <div className="thiny-card" style={{ padding: 18, marginBottom: 16, background: "linear-gradient(135deg, #0A8754 0%, #0F9C66 100%)", color: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>💰 ยอดขายร้านค้า (POS)</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>ยอดขายตรงผ่านปุ่ม "ขายสินค้า"</div>
        </div>
        <div style={{ display: "flex", gap: 6, background: "rgba(0,0,0,0.2)", padding: 4, borderRadius: 8 }}>
          {["today", "week", "month"].map(r => (
            <button key={r} onClick={() => setRange(r)}
              style={{ padding: "6px 14px", border: "none", borderRadius: 6, background: range === r ? "white" : "transparent", color: range === r ? "#0A8754" : "white", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              {rangeLabel[r]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>ยอดขายรวม</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 2 }}>{totalRev.toLocaleString()} ฿</div>
        </div>
        <div>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>จำนวนออเดอร์</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 2 }}>{orderCount}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>เฉลี่ย/ออเดอร์</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 2 }}>{avgOrder.toLocaleString()} ฿</div>
        </div>
      </div>

      {/* Mini bar chart */}
      {range !== "today" && dailyList.length > 0 && (
        <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 56, paddingTop: 8 }}>
          {dailyList.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }} title={`${d.key}: ${d.value.toLocaleString()} ฿`}>
              <div style={{ width: "100%", height: `${(d.value / maxVal) * 44}px`, minHeight: d.value > 0 ? 3 : 1, background: d.isToday ? "white" : "rgba(255,255,255,0.5)", borderRadius: 3, transition: "height 0.3s" }}></div>
              {(days <= 7 || i % 5 === 0) && (
                <div style={{ fontSize: 9, opacity: 0.7, marginTop: 4 }}>{d.key}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {orderCount === 0 && (
        <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.15)", borderRadius: 8, fontSize: 12, marginTop: 6 }}>
          ยังไม่มีการขายในช่วงนี้ — เริ่มขายผ่านปุ่ม <strong>💰 ขายสินค้า</strong> ในหน้าสินค้า
        </div>
      )}
    </div>
  );
};

// ============= MOVEMENT helper =============
// บันทึก movement (in/out/transfer) เพื่อให้ประวัติการเคลื่อนไหวมีข้อมูล
async function logMovement({ type, productId, qty, locationId, refId, userName }) {
  try {
    const user = (typeof window.getAuthUser === "function" ? window.getAuthUser() : null);
    await fetch(window.API_BASE + "/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "M-" + Date.now().toString().slice(-8) + "-" + Math.random().toString(36).slice(2,5).toUpperCase(),
        type,                                                            // 'in' | 'out' | 'adjust' | 'transfer'
        product_id: productId,
        quantity: qty,
        from_location_id: type === "out" ? locationId : null,
        to_location_id: type === "in" ? locationId : null,
        user_name: userName || user?.name || user?.username || "Owner",
        reference_id: refId || "",
      }),
    });
  } catch (e) { console.warn("logMovement failed:", e.message); }
}

// ============= PRINT RECEIPT helper =============
function printReceipt({ orderId, date, items, subtotal, discount, discountLabel, total, custName, custPhone, channel, note, lang = "th" }) {
  const channelLabels = { walkin: "หน้าร้าน", line: "LINE", fb: "Facebook", ig: "Instagram", tiktok: "TikTok", other: "อื่นๆ" };
  const itemsHtml = items.map(it => {
    const name = it.product?.name?.[lang] || it.product?.name?.th || it.product?.name || it.id;
    return `<tr>
      <td style="padding:4px 0;">${name}<div style="font-size:9px;color:#777">${it.id}</div></td>
      <td style="text-align:center;padding:4px 0;">${it.qty}</td>
      <td style="text-align:right;padding:4px 0;">${it.price.toLocaleString()}</td>
      <td style="text-align:right;padding:4px 0;font-weight:600;">${(it.qty*it.price).toLocaleString()}</td>
    </tr>`;
  }).join("");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>บิล ${orderId}</title>
<style>
  @media print { @page { size: 80mm auto; margin: 4mm; } body { margin: 0; } .no-print { display:none !important; } }
  body { font-family: "Sarabun","IBM Plex Sans Thai", -apple-system, system-ui, sans-serif; font-size: 12px; max-width: 320px; margin: 0 auto; padding: 14px; color: #000; }
  h1 { font-size: 18px; text-align: center; margin: 0 0 4px; letter-spacing: 1px; }
  .sub { text-align: center; font-size: 10px; color: #555; margin-bottom: 10px; }
  hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; font-weight: 600; border-bottom: 1px solid #000; padding: 4px 0; }
  th:nth-child(2) { text-align: center; }
  th:nth-child(3), th:nth-child(4) { text-align: right; }
  .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
  .total { font-size: 16px; font-weight: 800; padding: 6px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; margin-top: 4px; }
  .thanks { text-align: center; margin-top: 14px; font-size: 10px; color: #555; }
  .btn { display: inline-block; padding: 10px 20px; background: #0F4C81; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; margin: 4px; }
</style></head>
<body>
  <h1>THINY SHOP</h1>
  <div class="sub">ใบเสร็จรับเงิน</div>
  <div class="row"><span>เลขที่:</span><strong>${orderId}</strong></div>
  <div class="row"><span>วันที่:</span><span>${date}</span></div>
  <div class="row"><span>ลูกค้า:</span><strong>${custName}</strong></div>
  ${custPhone ? `<div class="row"><span>เบอร์:</span><span>${custPhone}</span></div>` : ""}
  <div class="row"><span>ช่องทาง:</span><span>${channelLabels[channel] || channel}</span></div>
  <hr>
  <table>
    <thead><tr><th>รายการ</th><th>จำนวน</th><th>ราคา</th><th>รวม</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <hr>
  <div class="row"><span>รวมก่อนลด</span><span>${subtotal.toLocaleString()} ฿</span></div>
  ${discount > 0 ? `<div class="row" style="color:#c00"><span>ส่วนลด${discountLabel ? " ("+discountLabel+")" : ""}</span><span>−${discount.toLocaleString()} ฿</span></div>` : ""}
  <div class="row total"><span>ยอดสุทธิ</span><span>${total.toLocaleString()} ฿</span></div>
  ${note ? `<div style="margin-top:8px;font-size:10px;color:#666;">หมายเหตุ: ${note}</div>` : ""}
  <div class="thanks">★ ขอบคุณที่อุดหนุน ★<br>${new Date().toLocaleString("th-TH")}</div>
  <div class="no-print" style="text-align:center;margin-top:18px;">
    <button class="btn" onclick="window.print()">🖨 พิมพ์บิล</button>
    <button class="btn" style="background:#888" onclick="window.close()">ปิด</button>
  </div>
  <script>setTimeout(() => window.print(), 300);<\/script>
</body></html>`;

  const w = window.open("", "_blank", "width=380,height=640");
  if (!w) { alert("ไม่สามารถเปิดหน้าต่างพิมพ์ได้ · กรุณาอนุญาต popup"); return; }
  w.document.write(html);
  w.document.close();
}

// ============= MULTI-PRODUCT SELL MODAL (POS-style) =============
const MultiSellModal = ({ onClose, onDone, lang = "th" }) => {
  const [cart, setCart] = useState([]); // [{ id, product, qty, price }]
  const [search, setSearch] = useState("");
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [channel, setChannel] = useState("walkin");
  const [note, setNote] = useState("");
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState("baht"); // "baht" | "percent"
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null); // saved receipt data after success
  const loc = (window.THINY_DATA.LOCATIONS || [])[0];
  const PRODUCTS = window.THINY_DATA.PRODUCTS || [];

  const channels = [
    { id: "walkin", label: "🏪 หน้าร้าน" },
    { id: "line", label: "💬 LINE" },
    { id: "fb", label: "📘 FB" },
    { id: "ig", label: "📷 IG" },
    { id: "tiktok", label: "🎵 TikTok" },
    { id: "other", label: "✏️ อื่นๆ" },
  ];

  const searchLower = search.trim().toLowerCase();
  const filteredProducts = !searchLower ? PRODUCTS : PRODUCTS.filter(p => {
    const stock = Object.values(p.stockByLoc || {}).reduce((a,b) => a+b, 0);
    if (stock <= 0) return false;
    const haystack = [p.id, p.sku, p.barcode, p.name?.[lang], p.name?.th, p.name?.en].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(searchLower);
  });

  const addToCart = (product) => {
    const stock = Object.values(product.stockByLoc || {}).reduce((a,b) => a+b, 0);
    if (stock <= 0) { alert("สินค้าหมด"); return; }
    const existing = cart.find(c => c.id === product.id);
    if (existing) {
      if (existing.qty + 1 > stock) { alert(`สต๊อกไม่พอ · ${product.name?.[lang] || product.name?.th} เหลือ ${stock} ชิ้น`); return; }
      setCart(cart.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { id: product.id, product, qty: 1, price: product.price }]);
    }
    setSearch("");
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(c => {
      if (c.id !== id) return c;
      const newQty = c.qty + delta;
      const stock = Object.values(c.product.stockByLoc || {}).reduce((a,b) => a+b, 0);
      if (newQty <= 0) return null;
      if (newQty > stock) { alert(`สต๊อกไม่พอ · เหลือ ${stock} ชิ้น`); return c; }
      return { ...c, qty: newQty };
    }).filter(Boolean));
  };

  const setItemPrice = (id, newPrice) => {
    setCart(cart.map(c => c.id === id ? { ...c, price: parseFloat(newPrice) || 0 } : c));
  };

  const removeItem = (id) => setCart(cart.filter(c => c.id !== id));

  const subtotal = cart.reduce((sum, c) => sum + (c.qty * c.price), 0);
  const totalQty = cart.reduce((sum, c) => sum + c.qty, 0);
  const totalCost = cart.reduce((sum, c) => sum + (c.qty * (c.product.cost || 0)), 0);
  const discountNum = parseFloat(discount) || 0;
  const discountAmount = discountType === "percent"
    ? Math.round(subtotal * discountNum / 100 * 100) / 100
    : discountNum;
  const total = Math.max(0, subtotal - discountAmount);
  const discountLabel = discountAmount > 0
    ? (discountType === "percent" ? `${discountNum}%` : "")
    : "";
  const profit = totalCost > 0 ? total - totalCost : null;

  const handleCheckout = async () => {
    if (cart.length === 0) { alert("กรุณาเลือกสินค้าก่อน"); return; }
    if (!custName.trim()) { alert("กรุณากรอกชื่อลูกค้า"); return; }
    if (!loc) { alert("ยังไม่มี location ในระบบ"); return; }

    setLoading(true);
    try {
      // 1. ลูกค้า
      let customerId;
      if (custPhone.trim()) {
        customerId = "C-" + custPhone.replace(/\D/g, "").slice(-9);
        await fetch(window.API_BASE + "/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: customerId, name: custName.trim(), phone: custPhone.trim(),
            email: "", tier: "regular", joined_date: new Date().toISOString().split("T")[0], points: 0,
          }),
        }).catch(() => {});
      } else {
        customerId = "WALKIN-" + Date.now();
      }

      // 2. order
      const orderId = "S-" + Date.now().toString().slice(-8);
      const orderRes = await fetch(window.API_BASE + "/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          customer_id: customerId,
          total_amount: total,
          items: cart.map(c => ({ product_id: c.id, quantity: c.qty, price: c.price })),
        }),
      });
      if (!orderRes.ok) {
        alert("ไม่สามารถบันทึกคำสั่งซื้อ: " + (await orderRes.text()));
        setLoading(false);
        return;
      }

      // 3. หักสต๊อก + บันทึก movement ทุกตัว
      for (const item of cart) {
        const current = item.product.stockByLoc?.[loc.id] || 0;
        const newQty = Math.max(0, current - item.qty);
        await fetch(window.API_BASE + "/stock/" + encodeURIComponent(item.id) + "/" + encodeURIComponent(loc.id), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: newQty }),
        }).catch(() => {});
        item.product.stockByLoc = item.product.stockByLoc || {};
        item.product.stockByLoc[loc.id] = newQty;
        await logMovement({ type: "out", productId: item.id, qty: item.qty, locationId: loc.id, refId: orderId });
      }

      if (window.logAudit) {
        const summary = cart.map(c => `${c.product.name?.th || c.id} × ${c.qty}`).join(", ");
        window.logAudit("sell_multi", "order", orderId, `${summary} = ${total.toLocaleString()} ฿${discountAmount > 0 ? ` (ลด ${discountAmount.toLocaleString()})` : ""} · ลูกค้า ${custName}${custPhone ? " (" + custPhone + ")" : ""}`);
      }

      // เก็บข้อมูลไว้สำหรับพิมพ์บิล
      setDone({
        orderId,
        date: new Date().toLocaleString("th-TH"),
        items: cart.map(c => ({ id: c.id, product: c.product, qty: c.qty, price: c.price })),
        subtotal, discount: discountAmount, discountLabel, total,
        custName: custName.trim(), custPhone: custPhone.trim(), channel, note: note.trim(),
        totalQty, profit,
      });
    } catch (e) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  };

  // ===== DONE SCREEN — after successful sale =====
  if (done) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 12 }}>
        <div style={{ background: "white", borderRadius: 14, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}>
          <div style={{ padding: "32px 28px 20px", textAlign: "center", background: "linear-gradient(135deg,#0A8754 0%,#0F9C66 100%)", color: "white" }}>
            <div style={{ fontSize: 48, marginBottom: 6 }}>✓</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>บันทึกการขายสำเร็จ</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>#{done.orderId}</div>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
              <span style={{ color: "#666", fontSize: 13 }}>ลูกค้า</span>
              <strong style={{ fontSize: 13 }}>{done.custName}{done.custPhone ? ` (${done.custPhone})` : ""}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
              <span style={{ color: "#666", fontSize: 13 }}>รายการ</span>
              <strong style={{ fontSize: 13 }}>{done.items.length} ชนิด · {done.totalQty} ชิ้น</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
              <span style={{ color: "#666", fontSize: 13 }}>รวมก่อนลด</span>
              <span style={{ fontSize: 13 }}>{done.subtotal.toLocaleString()} ฿</span>
            </div>
            {done.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee", color: "#c00" }}>
                <span style={{ fontSize: 13 }}>ส่วนลด{done.discountLabel ? ` (${done.discountLabel})` : ""}</span>
                <span style={{ fontSize: 13 }}>−{done.discount.toLocaleString()} ฿</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "2px solid #000", marginTop: 4 }}>
              <span style={{ fontWeight: 700 }}>ยอดสุทธิ</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#0A8754" }}>{done.total.toLocaleString()} ฿</span>
            </div>
            {done.profit !== null && (
              <div style={{ textAlign: "right", fontSize: 11, color: "#666", marginTop: 4 }}>กำไรประมาณ {done.profit.toLocaleString()} ฿</div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={() => printReceipt({ ...done, lang })} style={{ flex: 1, padding: "12px 16px", background: "#0F4C81", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                🖨 พิมพ์บิล
              </button>
              <button onClick={() => { setDone(null); onDone(); }} style={{ flex: 1, padding: "12px 16px", background: "white", color: "#333", border: "1px solid #ddd", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 12 }}>
      <div style={{ background: "white", borderRadius: 14, width: "100%", maxWidth: 720, maxHeight: "95vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
        {/* Header */}
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0A8754" }}>💰 บันทึกการขาย</div>
            <div style={{ fontSize: 12, color: "#888" }}>{cart.length} ชนิด · {totalQty} ชิ้น · {total.toLocaleString()} ฿</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888", padding: 4 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
          {/* Product search */}
          <div style={{ marginBottom: 14 }}>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 ค้นหาสินค้าด้วยชื่อ / SKU / barcode..."
              style={{ width: "100%", padding: "11px 14px", border: "2px solid #0F4C81", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
            {search && (
              <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #eee", borderRadius: 10, marginTop: 6, background: "white" }}>
                {filteredProducts.length === 0 ? (
                  <div style={{ padding: 16, textAlign: "center", color: "#888", fontSize: 13 }}>ไม่พบสินค้า (หรือสต๊อกหมด)</div>
                ) : filteredProducts.slice(0, 10).map(p => {
                  const stock = Object.values(p.stockByLoc || {}).reduce((a,b) => a+b, 0);
                  return (
                    <button key={p.id} onClick={() => addToCart(p)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #f5f5f5", background: "white", cursor: "pointer", textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F0F7FF"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name?.[lang] || p.name?.th}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>{p.id} · {fmtMoney(p.price, lang)} · คงเหลือ {stock}</div>
                      </div>
                      <div style={{ background: "#0A8754", color: "white", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>+ เพิ่ม</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#444" }}>🛒 รายการสินค้า ({cart.length})</div>
            {cart.length === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center", color: "#888", border: "2px dashed #ddd", borderRadius: 10, fontSize: 13 }}>
                ยังไม่มีสินค้าในรายการ<br />
                <span style={{ fontSize: 11 }}>พิมพ์ชื่อสินค้าด้านบนเพื่อเพิ่ม</span>
              </div>
            ) : (
              <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
                {cart.map(c => {
                  const stock = Object.values(c.product.stockByLoc || {}).reduce((a,b) => a+b, 0);
                  return (
                    <div key={c.id} style={{ padding: "10px 12px", borderBottom: "1px solid #f5f5f5", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, background: "white" }}>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.product.name?.[lang] || c.product.name?.th}</div>
                        <div style={{ fontSize: 10, color: "#888" }}>คงเหลือ {stock} · {c.id}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#f5f5f5", borderRadius: 8, padding: 2 }}>
                        <button onClick={() => updateQty(c.id, -1)} style={{ width: 28, height: 28, border: "none", background: "white", borderRadius: 6, fontWeight: 800, fontSize: 16, cursor: "pointer" }}>−</button>
                        <span style={{ minWidth: 28, textAlign: "center", fontWeight: 700, fontSize: 14 }}>{c.qty}</span>
                        <button onClick={() => updateQty(c.id, 1)} style={{ width: 28, height: 28, border: "none", background: "white", borderRadius: 6, fontWeight: 800, fontSize: 16, cursor: "pointer" }}>+</button>
                      </div>
                      <input type="number" value={c.price} onChange={e => setItemPrice(c.id, e.target.value)}
                        style={{ width: 80, padding: "5px 8px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, textAlign: "right" }} />
                      <div style={{ minWidth: 70, textAlign: "right", fontWeight: 700, fontSize: 13, color: "#0A8754" }}>
                        {(c.qty * c.price).toLocaleString()} ฿
                      </div>
                      <button onClick={() => removeItem(c.id)} style={{ background: "none", border: "none", color: "#c00", cursor: "pointer", fontSize: 16, padding: 2 }}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer info */}
          <div style={{ background: "#FAFAF7", padding: 14, borderRadius: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "#444" }}>👤 ข้อมูลลูกค้า</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <input type="text" value={custName} onChange={e => setCustName(e.target.value)} placeholder="ชื่อลูกค้า *"
                style={{ padding: "9px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
              <input type="tel" value={custPhone} onChange={e => setCustPhone(e.target.value)} placeholder="เบอร์โทร (ไม่บังคับ)"
                style={{ padding: "9px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4, marginBottom: 10 }}>
              {channels.map(c => (
                <button key={c.id} type="button" onClick={() => setChannel(c.id)}
                  style={{ padding: "7px 4px", border: channel === c.id ? "2px solid #0F4C81" : "1px solid #ddd", background: channel === c.id ? "#E8EEF6" : "white", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: channel === c.id ? 700 : 500 }}>
                  {c.label}
                </button>
              ))}
            </div>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="หมายเหตุ (ไม่บังคับ)"
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
          </div>

          {/* Discount */}
          {cart.length > 0 && (
            <div style={{ background: "#FFF8E1", padding: 12, borderRadius: 10, marginBottom: 12, border: "1px solid #FFD27A" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#8B5A00" }}>🏷️ ส่วนลด</div>
              <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                <div style={{ display: "flex", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden", background: "white" }}>
                  <button type="button" onClick={() => setDiscountType("baht")}
                    style={{ padding: "6px 14px", border: "none", background: discountType === "baht" ? "#0F4C81" : "white", color: discountType === "baht" ? "white" : "#666", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>฿</button>
                  <button type="button" onClick={() => setDiscountType("percent")}
                    style={{ padding: "6px 14px", border: "none", background: discountType === "percent" ? "#0F4C81" : "white", color: discountType === "percent" ? "white" : "#666", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>%</button>
                </div>
                <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)}
                  placeholder={discountType === "baht" ? "เช่น 50" : "เช่น 10"}
                  style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
                {discountAmount > 0 && (
                  <button type="button" onClick={() => setDiscount("")}
                    style={{ padding: "8px 14px", border: "1px solid #ddd", background: "white", borderRadius: 8, cursor: "pointer", fontSize: 12, color: "#888" }}>×</button>
                )}
              </div>
              {discountAmount > 0 && (
                <div style={{ fontSize: 11, color: "#8B5A00", marginTop: 6 }}>
                  ลดทั้งหมด {discountAmount.toLocaleString()} ฿ จาก {subtotal.toLocaleString()} ฿
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: "1px solid #eee", background: "#F8FAF8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "#888" }}>ยอดสุทธิ ({totalQty} ชิ้น)</div>
              {discountAmount > 0 && (
                <div style={{ fontSize: 11, color: "#888", textDecoration: "line-through" }}>{subtotal.toLocaleString()} ฿</div>
              )}
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0A8754" }}>{total.toLocaleString()} ฿</div>
              {profit !== null && <div style={{ fontSize: 11, color: "#666" }}>กำไรประมาณ {profit.toLocaleString()} ฿</div>}
            </div>
            <button onClick={handleCheckout} disabled={loading || cart.length === 0 || !custName.trim()}
              style={{
                padding: "14px 28px", background: (loading || cart.length === 0 || !custName.trim()) ? "#aaa" : "#0A8754",
                color: "white", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15,
                cursor: (loading || cart.length === 0 || !custName.trim()) ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(10,135,84,0.3)"
              }}>
              {loading ? "กำลังบันทึก..." : "✓ ชำระเงิน"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScreenProducts = ({ t, lang, onPick, onAdd }) => {
  const { PRODUCTS, CATEGORIES } = window.THINY_DATA;
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name | price-low | price-high | stock-low | stock-high
  const [showMultiSell, setShowMultiSell] = useState(false);

  // Filter + search
  const searchLower = search.trim().toLowerCase();
  let filtered = cat === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat);
  if (searchLower) {
    filtered = filtered.filter(p => [
      p.id, p.sku, p.barcode, p.name?.th, p.name?.en, p.name?.lo,
    ].filter(Boolean).join(" ").toLowerCase().includes(searchLower));
  }

  // Sort
  const stockOf = (p) => Object.values(p.stockByLoc || {}).reduce((a, b) => a + b, 0);
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "name") return (a.name?.[lang] || a.name?.th || "").localeCompare(b.name?.[lang] || b.name?.th || "");
    if (sortBy === "price-low") return (a.price || 0) - (b.price || 0);
    if (sortBy === "price-high") return (b.price || 0) - (a.price || 0);
    if (sortBy === "stock-low") return stockOf(a) - stockOf(b);
    if (sortBy === "stock-high") return stockOf(b) - stockOf(a);
    return 0;
  });

  const isEmpty = PRODUCTS.length === 0;
  const noMatch = !isEmpty && filtered.length === 0;

  return (
    <div className="thiny-screen">
      {showMultiSell && <MultiSellModal lang={lang} onClose={() => setShowMultiSell(false)} onDone={() => { setShowMultiSell(false); window.location.reload(); }} />}
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">{t.products.title}</h1>
          <p className="thiny-sub">{PRODUCTS.length} SKU · {PRODUCTS.filter((p) => p.status === "active").length} {t.status.active.toLowerCase()}</p>
        </div>
        <div className="thiny-top-actions">
          <button onClick={() => setShowMultiSell(true)} disabled={isEmpty}
            style={{ padding: "9px 18px", background: isEmpty ? "#ccc" : "#0A8754", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: isEmpty ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: isEmpty ? "none" : "0 2px 8px rgba(10,135,84,0.25)" }}>
            💰 ขายสินค้า
          </button>
          <button className="thiny-btn-ghost" disabled={isEmpty} onClick={() => {
            const csv = 'ID,SKU,Name,Price\n' + PRODUCTS.map(p => `${p.id},${p.sku},"${p.name[lang]}",${p.price}`).join('\n');
            const blob = new Blob([csv], {type: 'text/csv'});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
          }}><Icon name="download" size={14} />{t.common.export}</button>
          <button className="thiny-btn thiny-btn-primary" onClick={onAdd}><Icon name="plus" size={14} />{t.products.addProduct}</button>
        </div>
      </div>

      {/* ===== EMPTY STATE (no products at all) ===== */}
      {isEmpty ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 14, marginTop: 20 }}>
          <div style={{ fontSize: 56, marginBottom: 14 }}>📦</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>ยังไม่มีสินค้าในระบบ</div>
          <div style={{ color: "#888", fontSize: 13, marginBottom: 22 }}>เริ่มต้นด้วยการเพิ่มสินค้าแรกของคุณ</div>
          <button onClick={onAdd} style={{ padding: "12px 28px", background: "#0F4C81", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icon name="plus" size={14} /> เพิ่มสินค้าแรก
          </button>
        </div>
      ) : (
        <>
          {/* ===== Search + Sort bar ===== */}
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍 ค้นหาด้วยชื่อ, SKU, หรือ barcode..."
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
              {search && (
                <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888", padding: 4 }}>×</button>
              )}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding: "10px 14px", border: "1px solid #ddd", borderRadius: 10, fontSize: 13, background: "white", cursor: "pointer" }}>
              <option value="name">เรียงตามชื่อ (A→Z)</option>
              <option value="price-low">ราคา (น้อย→มาก)</option>
              <option value="price-high">ราคา (มาก→น้อย)</option>
              <option value="stock-low">สต๊อก (น้อย→มาก)</option>
              <option value="stock-high">สต๊อก (มาก→น้อย)</option>
            </select>
          </div>

          <div className="thiny-cat-tabs">
            <button className={cat === "all" ? "active" : ""} onClick={() => setCat("all")}>{t.common.all}</button>
            {CATEGORIES.map((c) =>
              <button key={c.id} className={cat === c.id ? "active" : ""} onClick={() => setCat(c.id)}>{c.name[lang]}</button>
            )}
          </div>

          {noMatch ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "white", borderRadius: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 14, color: "#666" }}>ไม่พบสินค้าที่ตรงกับการค้นหา</div>
              {search && <button onClick={() => setSearch("")} style={{ marginTop: 12, padding: "6px 14px", border: "1px solid #ddd", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 12 }}>ล้างคำค้นหา</button>}
            </div>
          ) : (
            <div className="thiny-card thiny-card-flush">
              <table className="thiny-table">
                <thead>
                  <tr>
                    <th>{t.products.title.split(" ")[0]}</th>
                    <th>{t.products.sku}</th>
                    <th>{t.products.barcode}</th>
                    <th>{t.common.price}</th>
                    <th>{t.products.onhand}</th>
                    <th>{t.common.status}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const total = stockOf(p);
                    const isLow = total < (p.reorder || 10) * 2;
                    return (
                      <tr key={p.id} className="thiny-tr-click" onClick={() => onPick(p.id)}>
                        <td className="thiny-td-product">
                          <ProductImg id={p.image} size="sm" rounded="rounded-md" />
                          <div>
                            <div className="thiny-strong">{p.name[lang]}</div>
                            <div className="thiny-fg-3 thiny-xs">{p.id}</div>
                          </div>
                        </td>
                        <td className="thiny-mono">{p.sku}</td>
                        <td className="thiny-mono thiny-fg-2">{p.barcode || "—"}</td>
                        <td><strong>{fmtMoney(p.price, lang)}</strong></td>
                        <td>
                          <div className="thiny-onhand">
                            <strong style={{ color: isLow ? "var(--c-warn)" : "inherit" }}>{total}</strong>
                            <div className="thiny-onhand-bar">
                              <div style={{ width: `${Math.min(100, total / ((p.reorder || 10) * 5) * 100)}%`, background: isLow ? "var(--c-warn)" : "var(--c-accent)" }} />
                            </div>
                          </div>
                        </td>
                        <td><StatusBadge kind={isLow ? "low" : "active"} label={t.status[isLow ? "low" : "active"]} /></td>
                        <td><button className="thiny-icon-btn" onClick={(e) => { e.stopPropagation(); onPick(p.id); }} title="View details"><Icon name="chev" size={14} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ---------------- PRODUCT DETAIL ----------------
const SellProductModal = ({ product, onClose, onDone }) => {
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState(String(product.price || ""));
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [channel, setChannel] = useState("walkin");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const loc = (window.THINY_DATA.LOCATIONS || [])[0];
  const currentStock = product.stockByLoc?.[loc?.id] || 0;
  const qtyNum = parseInt(qty) || 0;
  const priceNum = parseFloat(price) || 0;
  const total = qtyNum * priceNum;
  const profit = priceNum > 0 && product.cost > 0 ? (priceNum - product.cost) * qtyNum : null;

  const channels = [
    { id: "walkin", label: "🏪 หน้าร้าน" },
    { id: "line", label: "💬 LINE" },
    { id: "fb", label: "📘 Facebook" },
    { id: "ig", label: "📷 Instagram" },
    { id: "tiktok", label: "🎵 TikTok" },
    { id: "other", label: "✏️ อื่นๆ" },
  ];

  const handleSell = async () => {
    if (!qtyNum || qtyNum <= 0) { alert("กรุณากรอกจำนวนที่ขาย"); return; }
    if (qtyNum > currentStock) { alert(`สต๊อกไม่พอ · คงเหลือ ${currentStock} ชิ้น`); return; }
    if (!priceNum) { alert("กรุณากรอกราคาขาย"); return; }
    if (!custName.trim()) { alert("กรุณากรอกชื่อลูกค้า"); return; }

    setLoading(true);
    try {
      // 1. หา/สร้างลูกค้า — ใช้เบอร์เป็นกุญแจ
      let customerId = null;
      if (custPhone.trim()) {
        customerId = "C-" + custPhone.replace(/\D/g, "").slice(-9);
        // ลองสร้าง (ถ้ามีอยู่แล้วก็จะ error ปล่อยผ่าน)
        await fetch(window.API_BASE + "/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: customerId,
            name: custName.trim(),
            phone: custPhone.trim(),
            email: "",
            tier: "regular",
            joined_date: new Date().toISOString().split("T")[0],
            points: 0,
          }),
        }).catch(() => {});
      } else {
        customerId = "WALKIN-" + Date.now();
      }

      // 2. สร้าง order
      const orderId = "S-" + Date.now().toString().slice(-8);
      const orderRes = await fetch(window.API_BASE + "/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          customer_id: customerId,
          total_amount: total,
          items: [{ product_id: product.id, quantity: qtyNum, price: priceNum }],
        }),
      });
      if (!orderRes.ok) {
        const txt = await orderRes.text();
        alert("ไม่สามารถบันทึกคำสั่งซื้อ: " + txt);
        setLoading(false);
        return;
      }

      // 3. หักสต๊อก
      const newQty = currentStock - qtyNum;
      await fetch(window.API_BASE + "/stock/" + encodeURIComponent(product.id) + "/" + encodeURIComponent(loc.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });

      // 4. อัปเดต local state
      product.stockByLoc = product.stockByLoc || {};
      product.stockByLoc[loc.id] = newQty;
      // บันทึก movement
      await logMovement({ type: "out", productId: product.id, qty: qtyNum, locationId: loc.id, refId: orderId });
      if (window.logAudit) window.logAudit("sell_product", "product", product.id, `ขาย ${qtyNum} ชิ้น @ ${priceNum} = ${total} ฿ · ลูกค้า ${custName}${custPhone ? " (" + custPhone + ")" : ""}${note ? " · " + note : ""}`);

      alert(`✅ บันทึกขายสำเร็จ\n\n${product.name?.th || product.name} × ${qtyNum}\nยอดรวม: ${total.toLocaleString()} ฿\nลูกค้า: ${custName}${profit !== null ? `\nกำไร: ${profit.toLocaleString()} ฿` : ""}`);
      onDone();
    } catch (e) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "white", borderRadius: 14, padding: 24, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#0A8754" }}>💰 ขายสินค้า</h3>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 18 }}>
          {product.name?.th || product.name} · คงเหลือ {currentStock} ชิ้น
        </div>

        {/* Quantity + Price */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>จำนวน *</label>
            <input type="number" min="1" max={currentStock} value={qty} onChange={e => setQty(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 16, boxSizing: "border-box" }}
              autoFocus />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>ราคา/ชิ้น *</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 16, boxSizing: "border-box" }} />
          </div>
        </div>

        {/* Total preview */}
        {qtyNum > 0 && priceNum > 0 && (
          <div style={{ padding: "10px 14px", background: "#F0FDF4", borderRadius: 10, marginBottom: 16, border: "1px solid #C6EFD5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#0A8754", fontWeight: 600 }}>ยอดรวม</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#0A8754" }}>{total.toLocaleString()} ฿</span>
            </div>
            {profit !== null && (
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>กำไรประมาณ {profit.toLocaleString()} ฿</div>
            )}
          </div>
        )}

        {/* Customer info */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>ชื่อลูกค้า *</label>
          <input type="text" value={custName} onChange={e => setCustName(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
            placeholder="เช่น คุณสมหญิง" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>เบอร์โทร <span style={{ color: "#888", fontWeight: 400 }}>(ไม่บังคับ)</span></label>
          <input type="tel" value={custPhone} onChange={e => setCustPhone(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
            placeholder="08X-XXX-XXXX" />
          {custPhone && <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>📇 จะบันทึกเป็นลูกค้าประจำ · ค้นหาได้ภายหลัง</div>}
        </div>

        {/* Channel */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>ช่องทาง</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {channels.map(c => (
              <button key={c.id} type="button" onClick={() => setChannel(c.id)}
                style={{ padding: "8px 6px", border: channel === c.id ? "2px solid #0F4C81" : "1px solid #ddd", background: channel === c.id ? "#E8EEF6" : "white", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: channel === c.id ? 700 : 500 }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>หมายเหตุ <span style={{ color: "#888", fontWeight: 400 }}>(ไม่บังคับ)</span></label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
            placeholder="เช่น ลดราคาพิเศษ" />
        </div>

        {qtyNum > currentStock && (
          <div style={{ padding: "8px 12px", background: "#FEE2E2", color: "#991B1B", borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
            ⚠️ สต๊อกไม่พอ · เหลือ {currentStock} ชิ้น
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 18px", border: "1px solid #ddd", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 14 }}>ยกเลิก</button>
          <button onClick={handleSell} disabled={loading || qtyNum > currentStock} style={{ padding: "10px 24px", background: "#0A8754", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: (loading || qtyNum > currentStock) ? "not-allowed" : "pointer", opacity: (loading || qtyNum > currentStock) ? 0.6 : 1 }}>
            {loading ? "กำลังบันทึก..." : "💰 บันทึกการขาย"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============= EDIT PRODUCT MODAL =============
const EditProductModal = ({ product, onClose, onDone }) => {
  const CATS = [
    { id: "fashion",     prefix: "FW", label: "👗 แฟชั่น" },
    { id: "beauty",      prefix: "BT", label: "💄 ความงาม" },
    { id: "home",        prefix: "HM", label: "🏠 ของใช้ในบ้าน" },
    { id: "food",        prefix: "FD", label: "🍱 อาหาร" },
    { id: "electronics", prefix: "EL", label: "📱 อิเล็กทรอนิกส์" },
  ];
  // หา category เดิมจาก SKU prefix
  const currentCat = (() => {
    const skuParts = (product.sku || "").split("-");
    const prefix = skuParts[1] || "";
    return CATS.find(c => c.prefix === prefix)?.id || "fashion";
  })();

  const [form, setForm] = useState({
    name_th: product.name?.th || "",
    name_en: product.name?.en || "",
    price: String(product.price || ""),
    cost: String(product.cost || ""),
    barcode: product.barcode || "",
    sku: product.sku || "",
    category: currentCat,
    reorder_point: String(product.reorder || 10),
    image: product.image || "",
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("ไฟล์ใหญ่เกิน 10MB"); return; }
    setUploadingImage(true);
    try {
      const dataUrl = await compressImage(file);
      setForm({ ...form, image: dataUrl });
    } catch (err) {
      alert("ไม่สามารถอ่านไฟล์ภาพ: " + err.message);
    }
    setUploadingImage(false);
  };

  const hasRealImage = form.image && (form.image.startsWith("data:") || form.image.startsWith("http"));

  const cat = CATS.find(c => c.id === form.category) || CATS[0];

  // ถ้าเปลี่ยน category → ปรับ SKU prefix อัตโนมัติ (รองรับ SKU ทุกรูปแบบ)
  const handleCategoryChange = (newCatId) => {
    const newCat = CATS.find(c => c.id === newCatId);
    if (!newCat) return;
    // 1) ถ้าเป็นรูปแบบ TS-XX-suffix → เปลี่ยนแค่ส่วน prefix
    const m = form.sku.match(/^(TS)-([A-Z]{2})-(.+)$/i);
    if (m) {
      setForm({ ...form, category: newCatId, sku: `TS-${newCat.prefix}-${m[3]}` });
      return;
    }
    // 2) ไม่ใช่รูปแบบนั้น → สร้าง SKU ใหม่จาก product id (เพื่อให้ category detect ทำงานได้)
    const idPart = (product.id || "").replace(/[^A-Z0-9]/gi, "").toUpperCase() || String(Date.now()).slice(-4);
    setForm({ ...form, category: newCatId, sku: `TS-${newCat.prefix}-${idPart}` });
  };

  const inp = (field, placeholder, type = "text") => (
    <input type={type} value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})}
      style={{ width: "100%", padding: "9px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
      placeholder={placeholder} />
  );

  const handleSave = async () => {
    if (!form.name_th || !form.price) { alert("กรุณากรอก: ชื่อสินค้า, ราคา"); return; }
    setLoading(true);
    try {
      const res = await fetch(window.API_BASE + "/products/" + encodeURIComponent(product.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_th: form.name_th,
          name_en: form.name_en || form.name_th,
          name_lo: product.name?.lo || "",
          price: parseFloat(form.price),
          cost: parseFloat(form.cost) || 0,
          barcode: form.barcode,
          sku: form.sku,
          image: form.image || product.id.toLowerCase(),
          reorder_point: parseInt(form.reorder_point) || 10,
        }),
      });
      if (!res.ok) { alert("เกิดข้อผิดพลาด: " + (await res.text())); setLoading(false); return; }
      if (window.logAudit) window.logAudit("edit_product", "product", product.id, form.name_th);
      alert("✅ บันทึกข้อมูลสินค้าสำเร็จ");
      onDone();
    } catch (e) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(window.API_BASE + "/products/" + encodeURIComponent(product.id), { method: "DELETE" });
      if (!res.ok) { alert("ลบไม่สำเร็จ: " + (await res.text())); setLoading(false); return; }
      if (window.logAudit) window.logAudit("delete_product", "product", product.id, product.name?.th || product.id);
      alert("🗑 ลบสินค้าเรียบร้อย");
      onDone(true); // signal that we deleted, parent should go back
    } catch (e) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  };

  if (confirmDelete) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 16 }}>
        <div style={{ background: "white", borderRadius: 14, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <div style={{ fontSize: 40, textAlign: "center", marginBottom: 10 }}>⚠️</div>
          <h3 style={{ margin: "0 0 8px", textAlign: "center", fontSize: 18, fontWeight: 700 }}>ยืนยันการลบสินค้า?</h3>
          <div style={{ fontSize: 13, color: "#666", textAlign: "center", marginBottom: 18 }}>
            <strong>{product.name?.th}</strong> ({product.id})<br />
            สต๊อกทั้งหมดจะถูกลบไปด้วย <br/>
            <span style={{ color: "#c00" }}>ไม่สามารถกู้คืนได้</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: "10px 16px", border: "1px solid #ddd", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 14 }}>ยกเลิก</button>
            <button onClick={handleDelete} disabled={loading} style={{ flex: 1, padding: "10px 16px", background: "#c00", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "กำลังลบ..." : "🗑 ลบเลย"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "white", borderRadius: 14, padding: 28, width: "100%", maxWidth: 500, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>⚙️ แก้ไขสินค้า</h2>
          <span style={{ fontSize: 11, color: "#888", padding: "3px 8px", background: "#f0f0f0", borderRadius: 4 }}>{product.id}</span>
        </div>

        {/* Image upload */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>รูปสินค้า</label>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 96, height: 96, borderRadius: 10, border: "2px dashed #ddd", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: hasRealImage ? "white" : "#f7f7f5" }}>
              {hasRealImage ? (
                <img src={form.image} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 28, color: "#bbb" }}>📷</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "inline-block", padding: "8px 14px", border: "1px solid #0F4C81", color: "#0F4C81", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, background: "white" }}>
                {uploadingImage ? "กำลังบีบอัด..." : (hasRealImage ? "เปลี่ยนรูป" : "📷 เลือกรูป")}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} style={{ display: "none" }} />
              </label>
              {hasRealImage && (
                <button type="button" onClick={() => setForm({ ...form, image: "" })} style={{ marginLeft: 6, padding: "8px 12px", border: "1px solid #fcc", color: "#c00", background: "white", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>ลบรูป</button>
              )}
              <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>JPG/PNG · ระบบจะย่อขนาดให้อัตโนมัติ</div>
            </div>
          </div>
        </div>

        {/* Category */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>หมวดหมู่</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
            {CATS.map(c => (
              <button key={c.id} type="button" onClick={() => handleCategoryChange(c.id)}
                style={{ padding: "9px 12px", border: form.category === c.id ? "2px solid #0F4C81" : "1px solid #ddd", background: form.category === c.id ? "#E8EEF6" : "white", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: form.category === c.id ? 700 : 500, textAlign: "left" }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>SKU <span style={{ color: "#888", fontWeight: 400, fontSize: 11 }}>(prefix กำหนดหมวดหมู่)</span></label>
          {inp("sku", "TS-FW-001")}
          {form.category !== currentCat && (
            <div style={{ padding: "6px 10px", background: "#FFF8E1", borderRadius: 6, fontSize: 11, color: "#8B5A00", marginTop: 5 }}>
              ⚡ เปลี่ยนหมวดเป็น <strong>{cat.label}</strong> · SKU ใหม่: <code style={{ background: "white", padding: "1px 5px", borderRadius: 3 }}>{form.sku}</code>
            </div>
          )}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>ชื่อสินค้า (ไทย) *</label>
          {inp("name_th", "ชื่อสินค้า")}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>ชื่อสินค้า (English)</label>
          {inp("name_en", "Product name")}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Barcode</label>
          {inp("barcode", "8851234567000")}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>ราคาขาย *</label>
            {inp("price", "0", "number")}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>ต้นทุน</label>
            {inp("cost", "0", "number")}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>แจ้งเมื่อต่ำ</label>
            {inp("reorder_point", "10", "number")}
          </div>
        </div>

        {form.price && form.cost && parseFloat(form.price) > 0 && (
          <div style={{ padding: "8px 12px", background: "#F0FDF4", borderRadius: 8, fontSize: 12, color: "#0A8754", marginBottom: 14 }}>
            Margin: {Math.round((1 - parseFloat(form.cost || 0) / parseFloat(form.price)) * 100)}%
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 18, paddingTop: 14, borderTop: "1px solid #eee" }}>
          <button onClick={() => setConfirmDelete(true)} style={{ padding: "9px 14px", border: "1px solid #fcc", borderRadius: 8, background: "white", color: "#c00", cursor: "pointer", fontSize: 13 }}>
            🗑 ลบสินค้า
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ padding: "9px 18px", border: "1px solid #ddd", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 14 }}>ยกเลิก</button>
            <button onClick={handleSave} disabled={loading} style={{ padding: "9px 22px", background: "#0F4C81", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReceiveStockModal = ({ product, onClose, onDone }) => {
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const loc = (window.THINY_DATA.LOCATIONS || [])[0];

  const handleReceive = async () => {
    const n = parseInt(qty);
    if (!n || n <= 0) { alert("กรุณากรอกจำนวนที่ถูกต้อง"); return; }
    if (!loc) { alert("ยังไม่มี location ในระบบ"); return; }
    setLoading(true);
    try {
      const current = product.stockByLoc?.[loc.id] || 0;
      const res = await fetch(window.API_BASE + "/stock/" + encodeURIComponent(product.id) + "/" + encodeURIComponent(loc.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: current + n }),
      });
      if (res.ok) {
        product.stockByLoc = product.stockByLoc || {};
        product.stockByLoc[loc.id] = current + n;
        // บันทึก movement
        await logMovement({ type: "in", productId: product.id, qty: n, locationId: loc.id, refId: note || "" });
        if (window.logAudit) window.logAudit("stock_receive", "product", product.id, `รับเข้า ${n} ชิ้น · ${note || "—"}`);
        onDone();
      } else {
        alert("เกิดข้อผิดพลาด");
      }
    } catch (e) { alert("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "white", borderRadius: 14, padding: 28, width: "90%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700 }}>+ รับสินค้าเข้าสต๊อก</h3>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>{product.name?.th || product.name}</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>จำนวนที่รับเข้า</label>
          <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 16, boxSizing: "border-box" }}
            placeholder="เช่น 50" autoFocus />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>หมายเหตุ (ไม่บังคับ)</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
            placeholder="เช่น รับจาก Shopee รอบที่ 1" />
        </div>
        {loc && <div style={{ padding: "8px 12px", background: "#F0F7FF", borderRadius: 8, fontSize: 12, color: "#0F4C81", marginBottom: 20 }}>
          📍 เพิ่มเข้า: <strong>{loc.name_th || loc.name?.th || "ร้านหลัก"}</strong> · คงเหลือปัจจุบัน: {product.stockByLoc?.[loc.id] || 0} ชิ้น
        </div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", border: "1px solid #ddd", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 14 }}>ยกเลิก</button>
          <button onClick={handleReceive} disabled={loading} style={{ padding: "9px 22px", background: "#0F4C81", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ScreenProductDetail = ({ t, lang, pid, onBack }) => {
  const p = window.THINY_DATA.PRODUCTS.find((x) => x.id === pid);
  const { MOVEMENTS } = window.THINY_DATA;
  const [showReceive, setShowReceive] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [, forceUpdate] = useState(0);

  if (!p) return <div className="thiny-screen"><button className="thiny-back" onClick={onBack}>← กลับ</button><div style={{padding:40,textAlign:"center",color:"#888"}}>ไม่พบสินค้า</div></div>;

  const total = Object.values(p.stockByLoc || {}).reduce((a, b) => a + b, 0);
  const moves = MOVEMENTS.filter((m) => m.product === pid).slice(0, 8);
  const margin = p.cost > 0 ? Math.round((1 - p.cost / p.price) * 100) : null;
  const isLowStock = total <= (p.reorder || 10);
  const outOfStock = total === 0;

  return (
    <div className="thiny-screen">
      <button className="thiny-back" onClick={onBack}><Icon name="chev" size={14} className="thiny-rot180" />{t.common.back}</button>

      {showReceive && <ReceiveStockModal product={p} onClose={() => setShowReceive(false)} onDone={() => { setShowReceive(false); forceUpdate(n => n + 1); }} />}
      {showSell && <SellProductModal product={p} onClose={() => setShowSell(false)} onDone={() => { setShowSell(false); forceUpdate(n => n + 1); }} />}
      {showEdit && <EditProductModal product={p} onClose={() => setShowEdit(false)} onDone={(deleted) => { setShowEdit(false); if (deleted) { onBack(); window.location.reload(); } else { window.location.reload(); } }} />}

      {/* ── Header card ── */}
      <div className="thiny-card" style={{ marginBottom: 14 }}>
        <div className="thiny-pd-head">
          <ProductImg id={p.image} size="xl" rounded="rounded-xl" />
          <div className="thiny-pd-info" style={{ flex: 1 }}>
            <div className="thiny-pd-cat">{(window.THINY_DATA.CATEGORIES || []).find((c) => c.id === p.category)?.name?.[lang] || p.category}</div>
            <h2 className="thiny-h2">{p.name?.[lang] || p.name?.th || p.name}</h2>
            <div className="thiny-pd-codes">
              {p.sku && <span className="thiny-chip">SKU {p.sku}</span>}
              {p.barcode && <span className="thiny-chip">Barcode {p.barcode}</span>}
              <span className="thiny-chip">ID {p.id}</span>
            </div>

            {/* Stats row */}
            <div className="thiny-pd-stats" style={{ marginTop: 14 }}>
              <div>
                <div className="thiny-pd-stat-label">{t.common.price}</div>
                <div className="thiny-pd-stat-value">{fmtMoney(p.price, lang)}</div>
              </div>
              {p.cost > 0 && <div>
                <div className="thiny-pd-stat-label">ต้นทุน</div>
                <div className="thiny-pd-stat-value">{fmtMoney(p.cost, lang)}</div>
              </div>}
              {margin !== null && <div>
                <div className="thiny-pd-stat-label">Margin</div>
                <div className="thiny-pd-stat-value" style={{ color: margin >= 30 ? "var(--c-ok)" : "var(--c-warn)" }}>{margin}%</div>
              </div>}
              <div>
                <div className="thiny-pd-stat-label">คงเหลือ</div>
                <div className="thiny-pd-stat-value" style={{ color: isLowStock ? "var(--c-err)" : "inherit", fontWeight: 700, fontSize: 20 }}>{total}</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="thiny-pd-actions" style={{ marginTop: 16, flexWrap: "wrap", gap: 8 }}>
              <button
                onClick={() => setShowSell(true)}
                disabled={outOfStock}
                style={{
                  padding: "10px 20px", background: outOfStock ? "#ccc" : "#0A8754", color: "white",
                  border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14,
                  cursor: outOfStock ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 6
                }}>
                💰 ขายสินค้า {outOfStock && "(หมด)"}
              </button>
              <button className="thiny-btn thiny-btn-primary" onClick={() => setShowReceive(true)}>
                <Icon name="plus" size={14} /> รับสินค้าเข้า
              </button>
              <button className="thiny-btn-ghost" onClick={() => setShowEdit(true)}>
                <Icon name="settings" size={14} /> แก้ไข
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Movement history ── */}
      <div className="thiny-card">
        <div className="thiny-card-head" style={{ marginBottom: 12 }}>
          <div>
            <div className="thiny-card-title">ประวัติการเคลื่อนไหว</div>
            <div className="thiny-card-sub">{moves.length} รายการล่าสุด</div>
          </div>
        </div>
        {moves.length === 0 ? (
          <div className="thiny-empty" style={{ padding: "24px 0" }}>
            <Icon name="movement" size={28} className="thiny-fg-3"/>
            <div className="thiny-fg-3 thiny-xs">ยังไม่มีประวัติการเคลื่อนไหว</div>
          </div>
        ) : (
          <table className="thiny-table thiny-table-soft">
            <thead><tr><th>ประเภท</th><th>จำนวน</th><th>ผู้ทำรายการ</th><th>วันที่</th><th>อ้างอิง</th></tr></thead>
            <tbody>
              {moves.map((m) => (
                <tr key={m.id}>
                  <td><MoveTag type={m.type} t={t} /></td>
                  <td><strong style={{ color: m.type === "out" ? "var(--c-err)" : "var(--c-ok)" }}>{m.type === "out" ? "−" : "+"}{Math.abs(m.qty)}</strong></td>
                  <td className="thiny-fg-2">{m.user}</td>
                  <td className="thiny-fg-2 thiny-xs">{m.date}</td>
                  <td className="thiny-mono thiny-xs">{m.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const Toggle = ({ checked: initial }) => {
  const [on, setOn] = useState(initial);
  return <button className={`thiny-toggle ${on ? "on" : ""}`} onClick={() => setOn(!on)}><span /></button>;
};

Object.assign(window, { AdminApp, StatCard, MoveTag, Toggle });