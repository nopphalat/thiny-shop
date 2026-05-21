/* global React, Icon, ChannelPill, ProductImg, StatusBadge, Sparkline, BarChart, fmtMoney, fmtNum */
// Admin desktop app — sidebar, topbar, and all admin screens

const { useState, useMemo } = React;

// AddProductModal component
const AddProductModal = ({ t, onClose }) => {
  const [form, setForm] = useState({ id: "", sku: "", name_th: "", name_en: "", price: "", cost: "", barcode: "" });
  const [loading, setLoading] = useState(false);

  const handleAddProduct = async () => {
    if (!form.id || !form.sku || !form.name_th || !form.price) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          sku: form.sku,
          name_th: form.name_th,
          name_en: form.name_en || form.name_th,
          name_lo: "",
          price: parseFloat(form.price),
          cost: parseFloat(form.cost) || 0,
          barcode: form.barcode,
          image: form.id,
          reorder_point: 30,
        }),
      });
      if (res.ok) {
        alert("เพิ่มสินค้าสำเร็จ");
        onClose();
        window.location.reload();
      } else {
        alert("เกิดข้อผิดพลาด");
      }
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "white", borderRadius: "12px", padding: "32px", width: "90%", maxWidth: "500px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <h2 style={{ margin: "0 0 24px 0", fontSize: "20px", fontWeight: 600 }}>เพิ่มสินค้าใหม่</h2>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>ID สินค้า</label>
          <input type="text" value={form.id} onChange={(e) => setForm({...form, id: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} placeholder="P013" />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>SKU</label>
          <input type="text" value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} placeholder="TS-XXX-001" />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>ชื่อ (ไทย)</label>
          <input type="text" value={form.name_th} onChange={(e) => setForm({...form, name_th: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} placeholder="ชื่อสินค้า" />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>ชื่อ (English)</label>
          <input type="text" value={form.name_en} onChange={(e) => setForm({...form, name_en: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} placeholder="Product name" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>ราคา</label>
            <input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} placeholder="0" />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>ต้นทุน</label>
            <input type="number" value={form.cost} onChange={(e) => setForm({...form, cost: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} placeholder="0" />
          </div>
        </div>
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>Barcode</label>
          <input type="text" value={form.barcode} onChange={(e) => setForm({...form, barcode: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} placeholder="8851234567000" />
        </div>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", border: "1px solid #ddd", borderRadius: "6px", background: "white", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}>ยกเลิก</button>
          <button onClick={handleAddProduct} disabled={loading} style={{ padding: "8px 16px", borderRadius: "6px", background: "#0F4C81", color: "white", cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 500, opacity: loading ? 0.7 : 1 }}>
            {loading ? "กำลังเพิ่ม..." : "เพิ่มสินค้า"}
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
{ id: "calendar", icon: "movement" },
{ id: "customers", icon: "customers" },
{ id: "scan", icon: "scan" },
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
            <button className="thiny-icon-btn thiny-bell" title="Alerts" onClick={() => alert('ยังไม่มีการแจ้งเตือนใหม่')}>
              <Icon name="bell" size={18} />
              <span className="thiny-dot"></span>
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
        <div className="thiny-seg">
          <button className="active" onClick={() => console.log('Today')}>{t.common.today}</button>
          <button onClick={() => console.log('Week')}>{t.common.week}</button>
          <button onClick={() => console.log('Month')}>{t.common.month}</button>
        </div>
      </div>

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
const ScreenProducts = ({ t, lang, onPick, onAdd }) => {
  const { PRODUCTS, CATEGORIES } = window.THINY_DATA;
  const [cat, setCat] = useState("all");

  const filtered = cat === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat);

  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">{t.products.title}</h1>
          <p className="thiny-sub">{PRODUCTS.length} SKU · {PRODUCTS.filter((p) => p.status === "active").length} {t.status.active.toLowerCase()}</p>
        </div>
        <div className="thiny-top-actions">
          <button className="thiny-btn-ghost" onClick={() => {
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

      <div className="thiny-cat-tabs">
        <button className={cat === "all" ? "active" : ""} onClick={() => setCat("all")}>{t.common.all}</button>
        {CATEGORIES.map((c) =>
        <button key={c.id} className={cat === c.id ? "active" : ""} onClick={() => setCat(c.id)}>{c.name[lang]}</button>
        )}
      </div>

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
              const total = Object.values(p.stockByLoc).reduce((a, b) => a + b, 0);
              const isLow = total < p.reorder * 2;
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
                  <td className="thiny-mono thiny-fg-2">{p.barcode}</td>
                  <td><strong>{fmtMoney(p.price, lang)}</strong></td>
                  <td>
                    <div className="thiny-onhand">
                      <strong style={{ color: isLow ? "var(--c-warn)" : "inherit" }}>{total}</strong>
                      <div className="thiny-onhand-bar">
                        <div style={{ width: `${Math.min(100, total / (p.reorder * 5) * 100)}%`, background: isLow ? "var(--c-warn)" : "var(--c-accent)" }} />
                      </div>
                    </div>
                  </td>
                  <td><StatusBadge kind={isLow ? "low" : "active"} label={t.status[isLow ? "low" : "active"]} /></td>
                  <td><button className="thiny-icon-btn" onClick={() => onPick(p.id)} title="View details"><Icon name="chev" size={14} /></button></td>
                </tr>);

            })}
          </tbody>
        </table>
      </div>
    </div>);

};

// ---------------- PRODUCT DETAIL ----------------
const ScreenProductDetail = ({ t, lang, pid, onBack }) => {
  const p = window.THINY_DATA.PRODUCTS.find((x) => x.id === pid);
  const { LOCATIONS, MOVEMENTS } = window.THINY_DATA;
  const total = Object.values(p.stockByLoc).reduce((a, b) => a + b, 0);
  const moves = MOVEMENTS.filter((m) => m.product === pid).slice(0, 6);
  return (
    <div className="thiny-screen">
      <button className="thiny-back" onClick={onBack}><Icon name="chev" size={14} className="thiny-rot180" />{t.common.back}</button>
      <div className="thiny-row">
        <div className="thiny-card thiny-pd-main">
          <div className="thiny-pd-head">
            <ProductImg id={p.image} size="xl" rounded="rounded-xl" />
            <div className="thiny-pd-info">
              <div className="thiny-pd-cat">{window.THINY_DATA.CATEGORIES.find((c) => c.id === p.category).name[lang]}</div>
              <h2 className="thiny-h2">{p.name[lang]}</h2>
              <div className="thiny-pd-codes">
                <span className="thiny-chip">SKU {p.sku}</span>
                <span className="thiny-chip">Barcode {p.barcode}</span>
                <span className="thiny-chip">ID {p.id}</span>
              </div>
              <div className="thiny-pd-stats">
                <div><div className="thiny-pd-stat-label">{t.common.price}</div><div className="thiny-pd-stat-value">{fmtMoney(p.price, lang)}</div></div>
                <div><div className="thiny-pd-stat-label">{t.products.cost}</div><div className="thiny-pd-stat-value">{fmtMoney(p.cost, lang)}</div></div>
                <div><div className="thiny-pd-stat-label">Margin</div><div className="thiny-pd-stat-value" style={{ color: "var(--c-ok)" }}>{Math.round((1 - p.cost / p.price) * 100)}%</div></div>
                <div><div className="thiny-pd-stat-label">{t.products.onhand}</div><div className="thiny-pd-stat-value">{total}</div></div>
              </div>
              <div className="thiny-pd-actions">
                <button className="thiny-btn thiny-btn-primary" onClick={() => alert('รับสินค้า: ' + p.name[lang])}><Icon name="plus" size={14} />{t.common.receive}</button>
                <button className="thiny-btn-ghost" onClick={() => alert('โอนย้ายสินค้า: ' + p.name[lang])}><Icon name="movement" size={14} />{t.common.transfer}</button>
                <button className="thiny-btn-ghost" onClick={() => alert('แก้ไขสินค้า: ' + p.name[lang])}><Icon name="settings" size={14} />{t.common.edit}</button>
              </div>
            </div>
          </div>

          <div className="thiny-pd-section">
            <h3 className="thiny-h3">{t.location.title.split(" ")[0]} · {t.products.onhand}</h3>
            <div className="thiny-loc-grid">
              {LOCATIONS.map((loc) => {
                const qty = p.stockByLoc[loc.id] || 0;
                const reorderPerLoc = Math.ceil(p.reorder / LOCATIONS.length);
                return (
                  <div key={loc.id} className="thiny-loc-card">
                    <div className="thiny-loc-head">
                      <Icon name={loc.type === "warehouse" ? "box" : "location"} size={14} />
                      <span className="thiny-loc-code">{loc.code}</span>
                    </div>
                    <div className="thiny-loc-name">{loc.name[lang]}</div>
                    <div className="thiny-loc-qty">
                      <span className="thiny-loc-num" style={{ color: qty < reorderPerLoc ? "var(--c-warn)" : "inherit" }}>{qty}</span>
                      <span className="thiny-fg-3 thiny-xs">/ min {reorderPerLoc}</span>
                    </div>
                    <div className="thiny-loc-bar"><div style={{ width: `${Math.min(100, qty / (reorderPerLoc * 4) * 100)}%`, background: qty < reorderPerLoc ? "var(--c-warn)" : "var(--c-accent)" }} /></div>
                  </div>);

              })}
            </div>
          </div>

          <div className="thiny-pd-section">
            <h3 className="thiny-h3">{t.dash.recentMovement}</h3>
            <table className="thiny-table thiny-table-soft">
              <thead><tr><th>{t.movement.type}</th><th>{t.common.qty}</th><th>{t.movement.from}</th><th>{t.movement.to}</th><th>{t.movement.user}</th><th>Date</th><th>{t.movement.ref}</th></tr></thead>
              <tbody>
                {moves.map((m) => {
                  const locName = (id) => LOCATIONS.find((l) => l.id === id)?.name[lang] || (id === "supplier" ? "Supplier" : id === "customer" ? "Customer" : id);
                  return (
                    <tr key={m.id}>
                      <td><MoveTag type={m.type} t={t} /></td>
                      <td><strong>{m.type === "out" || m.type === "adjust" && m.qty < 0 ? "−" : "+"}{Math.abs(m.qty)}</strong></td>
                      <td className="thiny-fg-2">{locName(m.from)}</td>
                      <td className="thiny-fg-2">{locName(m.to)}</td>
                      <td className="thiny-fg-2">{m.user}</td>
                      <td className="thiny-fg-2 thiny-xs">{m.date}</td>
                      <td className="thiny-mono thiny-xs">{m.ref}</td>
                    </tr>);

                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="thiny-card thiny-pd-side">
          <div className="thiny-card-title">{t.location.autoSync}</div>
          <div className="thiny-auto-rule">
            <div>
              <div className="thiny-strong">หักสต๊อกอัตโนมัติ</div>
              <div className="thiny-fg-3 thiny-xs">ตัดจากคลังที่ใกล้ลูกค้าที่สุด</div>
            </div>
            <Toggle checked={true} />
          </div>
          <div className="thiny-auto-rule">
            <div>
              <div className="thiny-strong">โอนย้ายอัตโนมัติเมื่อต่ำกว่า min</div>
              <div className="thiny-fg-3 thiny-xs">ดึงจาก WH-01 → store</div>
            </div>
            <Toggle checked={true} />
          </div>
          <div className="thiny-auto-rule">
            <div>
              <div className="thiny-strong">แจ้งเตือนเมื่อต่ำ</div>
              <div className="thiny-fg-3 thiny-xs">ส่ง LINE + email</div>
            </div>
            <Toggle checked={false} />
          </div>
        </div>
      </div>
    </div>);

};

const Toggle = ({ checked: initial }) => {
  const [on, setOn] = useState(initial);
  return <button className={`thiny-toggle ${on ? "on" : ""}`} onClick={() => setOn(!on)}><span /></button>;
};

Object.assign(window, { AdminApp, StatCard, MoveTag, Toggle });