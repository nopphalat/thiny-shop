/* global React, Icon, ChannelPill, ProductImg, StatusBadge, Sparkline, MoveTag, Toggle, fmtMoney, fmtNum */
// More admin screens: Stock, Movement, Customers, Scan, Reports, Settings

const { useState: useStateB, useMemo: useMemoB, useEffect: useEffectB } = React;


// ---------------- STOCK / LOCATIONS ----------------
const ScreenStock = ({ t, lang }) => {
  const { LOCATIONS, PRODUCTS } = window.THINY_DATA;
  const [selLoc, setSelLoc] = useStateB(LOCATIONS[0].id);
  const [showLowOnly, setShowLowOnly] = useState(false);
  const allProductsAtLoc = PRODUCTS.map(p => ({ ...p, qtyHere: p.stockByLoc[selLoc] || 0 })).sort((a,b) => b.qtyHere - a.qtyHere);
  const productsAtLoc = showLowOnly ? allProductsAtLoc.filter(p => p.qtyHere < Math.ceil(p.reorder / LOCATIONS.length)) : allProductsAtLoc;
  const locData = LOCATIONS.find(l => l.id === selLoc);
  const totalHere = allProductsAtLoc.reduce((a,b) => a + b.qtyHere, 0);
  const lowAtLoc = allProductsAtLoc.filter(p => p.qtyHere < Math.ceil(p.reorder / LOCATIONS.length)).length;

  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">{t.location.title}</h1>
          <p className="thiny-sub"><Icon name="sparkle" size={12}/> {t.location.autoSync} · ตัดสต๊อกตามคลังที่ใกล้ลูกค้าที่สุด</p>
        </div>
        <div className="thiny-top-actions">
          <button className="thiny-btn-ghost" onClick={() => alert('โอนย้ายสตอก')}><Icon name="movement" size={14}/>{t.common.transfer}</button>
          <button className="thiny-btn thiny-btn-primary" onClick={() => alert('เพิ่มคลังใหม่')}><Icon name="plus" size={14}/>Location</button>
        </div>
      </div>

      <div className="thiny-loc-overview">
        {LOCATIONS.map(loc => {
          const totalAtLoc = PRODUCTS.reduce((a,p) => a + (p.stockByLoc[loc.id] || 0), 0);
          const capacity = loc.type === "warehouse" ? 2500 : 800;
          const pct = (totalAtLoc / capacity) * 100;
          return (
            <button key={loc.id} className={`thiny-loc-overview-card ${selLoc === loc.id ? "active" : ""}`} onClick={() => setSelLoc(loc.id)}>
              <div className="thiny-loc-overview-head">
                <div className={`thiny-loc-icon ${loc.type}`}>
                  <Icon name={loc.type === "warehouse" ? "box" : "location"} size={14}/>
                </div>
                <span className="thiny-loc-overview-type">{loc.type === "warehouse" ? t.location.warehouse : t.location.store}</span>
                <span className="thiny-mono thiny-xs thiny-fg-3">{loc.code}</span>
              </div>
              <div className="thiny-loc-overview-name">{loc.name[lang]}</div>
              <div className="thiny-loc-overview-num">{totalAtLoc.toLocaleString()}</div>
              <div className="thiny-loc-overview-meta">
                <span>{t.location.capacity} {pct.toFixed(0)}%</span>
              </div>
              <div className="thiny-loc-bar"><div style={{ width: `${Math.min(100, pct)}%`, background: pct > 80 ? "var(--c-warn)" : "var(--c-accent)" }}/></div>
            </button>
          );
        })}
      </div>

      <div className="thiny-row">
        <div className="thiny-card thiny-col-2 thiny-card-flush">
          <div className="thiny-card-head" style={{padding: "16px 20px 0"}}>
            <div>
              <div className="thiny-card-title">สต๊อกที่ {locData.name[lang]}</div>
              <div className="thiny-card-sub">{productsAtLoc.length} SKU · {totalHere.toLocaleString()} หน่วย · {lowAtLoc} ต่ำกว่าเกณฑ์</div>
            </div>
            <div className="thiny-seg thiny-seg-sm">
              <button className={!showLowOnly ? "active" : ""} onClick={() => setShowLowOnly(false)}>{t.common.all}</button>
              <button className={showLowOnly ? "active" : ""} onClick={() => setShowLowOnly(true)}>{t.status.low}</button>
            </div>
          </div>
          <table className="thiny-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>{t.products.sku}</th>
                <th>{t.location.onhand}</th>
                <th>Min</th>
                <th>{t.common.status}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {productsAtLoc.slice(0, 10).map(p => {
                const min = Math.ceil(p.reorder / LOCATIONS.length);
                const isLow = p.qtyHere < min;
                return (
                  <tr key={p.id}>
                    <td className="thiny-td-product">
                      <ProductImg id={p.image} size="sm" rounded="rounded-md"/>
                      <span>{p.name[lang]}</span>
                    </td>
                    <td className="thiny-mono thiny-xs">{p.sku}</td>
                    <td><strong style={{ color: isLow ? "var(--c-warn)" : "inherit" }}>{p.qtyHere}</strong></td>
                    <td className="thiny-fg-3">{min}</td>
                    <td><StatusBadge kind={isLow ? "low" : "active"} label={isLow ? t.status.low : "OK"}/></td>
                    <td><button className="thiny-btn-ghost-sm" onClick={() => alert('โอนย้าย: ' + p.name[lang])}>{t.common.transfer}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="thiny-card">
          <div className="thiny-card-title">Auto-rules</div>
          <div className="thiny-card-sub">กฎอัตโนมัติสำหรับ location นี้</div>
          <div style={{height: 12}}/>
          <div className="thiny-rule">
            <div className="thiny-rule-icon" style={{background: "var(--c-ok-bg)", color: "var(--c-ok)"}}><Icon name="check" size={14}/></div>
            <div className="thiny-rule-body">
              <div className="thiny-strong">หักสต๊อกอัตโนมัติเมื่อมีออเดอร์</div>
              <div className="thiny-fg-3 thiny-xs">ตัดทันทีเมื่อยืนยันออเดอร์</div>
            </div>
            <Toggle checked={true}/>
          </div>
          <div className="thiny-rule">
            <div className="thiny-rule-icon" style={{background: "var(--c-info-bg)", color: "var(--c-info)"}}><Icon name="movement" size={14}/></div>
            <div className="thiny-rule-body">
              <div className="thiny-strong">โอนย้ายอัตโนมัติเมื่อ&lt; min</div>
              <div className="thiny-fg-3 thiny-xs">ดึงจาก WH-01 ทุก 6 ชม.</div>
            </div>
            <Toggle checked={true}/>
          </div>
          <div className="thiny-rule">
            <div className="thiny-rule-icon" style={{background: "var(--c-warn-bg)", color: "var(--c-warn)"}}><Icon name="bell" size={14}/></div>
            <div className="thiny-rule-body">
              <div className="thiny-strong">แจ้งเตือนเมื่อต่ำ</div>
              <div className="thiny-fg-3 thiny-xs">LINE + Email</div>
            </div>
            <Toggle checked={true}/>
          </div>
          <div className="thiny-rule">
            <div className="thiny-rule-icon" style={{background: "var(--c-accent-soft)", color: "var(--c-accent)"}}><Icon name="sparkle" size={14}/></div>
            <div className="thiny-rule-body">
              <div className="thiny-strong">ระงับ marketplace เมื่อหมด</div>
              <div className="thiny-fg-3 thiny-xs">ซ่อนสินค้าจาก Shopee/Lazada</div>
            </div>
            <Toggle checked={false}/>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------- MOVEMENT ----------------
const ScreenMovement = ({ t, lang }) => {
  const { MOVEMENTS, LOCATIONS, PRODUCTS } = window.THINY_DATA;
  const [type, setType] = useStateB("all");
  const filtered = type === "all" ? MOVEMENTS : MOVEMENTS.filter(m => m.type === type);
  const counts = {
    in: MOVEMENTS.filter(m=>m.type==="in").length,
    out: MOVEMENTS.filter(m=>m.type==="out").length,
    transfer: MOVEMENTS.filter(m=>m.type==="transfer").length,
    adjust: MOVEMENTS.filter(m=>m.type==="adjust").length,
  };
  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">{t.movement.title}</h1>
          <p className="thiny-sub">ทุกรายการเข้า·ออก·โอน·ปรับยอด · 10 จากทั้งหมด 9,912 รายการ</p>
        </div>
        <div className="thiny-top-actions">
          <button className="thiny-btn-ghost" onClick={() => alert('เปิด filter')}><Icon name="filter" size={14}/>{t.common.filter}</button>
          <button className="thiny-btn-ghost" onClick={() => alert('ดาวน์โหลด movement')}><Icon name="download" size={14}/>{t.common.export}</button>
          <button className="thiny-btn thiny-btn-primary" onClick={() => alert('เพิ่มรับสินค้า')}><Icon name="plus" size={14}/>{t.common.receive}</button>
        </div>
      </div>

      <div className="thiny-stat-row">
        <MoveStat label={t.movement.in} value={counts.in} color="var(--c-ok)" icon="arrowDown"/>
        <MoveStat label={t.movement.out} value={counts.out} color="var(--c-err)" icon="arrowUp"/>
        <MoveStat label={t.movement.transferType} value={counts.transfer} color="var(--c-info)" icon="movement"/>
        <MoveStat label={t.movement.adjust} value={counts.adjust} color="var(--c-warn)" icon="settings"/>
      </div>

      <div className="thiny-status-tabs">
        <button className={type==="all"?"active":""} onClick={()=>setType("all")}>{t.common.all} <span className="thiny-tab-count">{MOVEMENTS.length}</span></button>
        <button className={type==="in"?"active":""} onClick={()=>setType("in")}>{t.movement.in} <span className="thiny-tab-count">{counts.in}</span></button>
        <button className={type==="out"?"active":""} onClick={()=>setType("out")}>{t.movement.out} <span className="thiny-tab-count">{counts.out}</span></button>
        <button className={type==="transfer"?"active":""} onClick={()=>setType("transfer")}>{t.movement.transferType} <span className="thiny-tab-count">{counts.transfer}</span></button>
        <button className={type==="adjust"?"active":""} onClick={()=>setType("adjust")}>{t.movement.adjust} <span className="thiny-tab-count">{counts.adjust}</span></button>
      </div>

      <div className="thiny-card thiny-card-flush">
        <table className="thiny-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{t.movement.type}</th>
              <th>Product</th>
              <th>{t.common.qty}</th>
              <th>{t.movement.from}</th>
              <th>{t.movement.to}</th>
              <th>{t.movement.user}</th>
              <th>Date</th>
              <th>{t.movement.ref}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const p = PRODUCTS.find(x => x.id === m.product);
              const locName = (id) => LOCATIONS.find(l=>l.id===id)?.name[lang] || (id === "supplier" ? "Supplier" : id === "customer" ? "Customer" : id === "—" ? "—" : id);
              return (
                <tr key={m.id}>
                  <td className="thiny-mono thiny-xs">{m.id}</td>
                  <td><MoveTag type={m.type} t={t}/></td>
                  <td className="thiny-td-product"><ProductImg id={p.image} size="sm" rounded="rounded-md"/><span>{p.name[lang]}</span></td>
                  <td><strong style={{ color: m.type === "out" || (m.type === "adjust" && m.qty < 0) ? "var(--c-err)" : "var(--c-ok)" }}>
                    {m.type==="out"||(m.type==="adjust"&&m.qty<0)?"−":"+"}{Math.abs(m.qty)}
                  </strong></td>
                  <td className="thiny-fg-2">{locName(m.from)}</td>
                  <td className="thiny-fg-2">{locName(m.to)}</td>
                  <td className="thiny-fg-2">{m.user}</td>
                  <td className="thiny-fg-3 thiny-xs">{m.date}</td>
                  <td className="thiny-mono thiny-xs">{m.ref}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MoveStat = ({ label, value, color, icon }) => (
  <div className="thiny-stat">
    <div className="thiny-stat-label" style={{display:"flex",alignItems:"center",gap:6}}>
      <span style={{color, display:"inline-flex"}}><Icon name={icon} size={12}/></span>
      {label}
    </div>
    <div className="thiny-stat-value">{value}</div>
    <div className="thiny-fg-3 thiny-xs">รายการในวันนี้</div>
  </div>
);

// ---------------- CUSTOMERS ----------------
// Normalize phone for matching (digits only, ignore +/spaces/dashes)
const normalizePhone = (p) => (p || "").replace(/[^0-9]/g, "").replace(/^0+/, "");

// Build aggregated list: include CUSTOMERS + unique chat-order customers
const buildAllCustomers = () => {
  const { CUSTOMERS = [], CHAT_ORDERS = [] } = window.THINY_DATA || {};
  const map = new Map();
  CUSTOMERS.forEach(c => {
    map.set(normalizePhone(c.phone) || c.id, { ...c, source: "registered" });
  });
  CHAT_ORDERS.forEach(o => {
    const cust = o.customer;
    if (!cust?.name) return;
    const key = normalizePhone(cust.phone) || cust.name;
    if (!map.has(key)) {
      map.set(key, {
        id: "GUEST-" + key.slice(-4),
        name: cust.name,
        phone: cust.phone || "",
        email: "",
        address: cust.address || "",
        tier: "bronze",
        joined: o.created?.split(" ")[0] || "",
        orders: 0,
        spent: 0,
        points: 0,
        source: "chat-only"
      });
    }
  });
  return Array.from(map.values());
};

// Get all chat orders for a customer (by phone match)
const getCustomerOrders = (customer) => {
  const { CHAT_ORDERS = [] } = window.THINY_DATA || {};
  const key = normalizePhone(customer.phone);
  if (!key && !customer.name) return [];
  return CHAT_ORDERS.filter(o => {
    if (normalizePhone(o.customer?.phone) === key && key) return true;
    if (!key && o.customer?.name === customer.name) return true;
    return false;
  });
};

const ScreenCustomers = ({ t, lang }) => {
  const [selectedCustomer, setSelectedCustomer] = useStateB(null);
  const [searchTerm, setSearchTerm] = useStateB("");
  const [showAdd, setShowAdd] = useStateB(false);
  const tierColor = { platinum: "linear-gradient(135deg,#aaa,#ddd)", gold: "linear-gradient(135deg,#E9B949,#F2D86F)", silver: "linear-gradient(135deg,#C0C5CC,#E5E7EA)", bronze: "linear-gradient(135deg,#B97849,#D3996A)" };

  if (selectedCustomer) {
    return <CustomerDetail customer={selectedCustomer} lang={lang} onBack={() => setSelectedCustomer(null)} />;
  }

  const allCustomers = buildAllCustomers();
  // Compute live stats per customer
  const enrichedCustomers = allCustomers.map(c => {
    const orders = getCustomerOrders(c);
    const totalSpent = orders.filter(o => o.paymentStatus === "paid").reduce((a, o) => a + (o.total || 0), 0);
    const lastOrder = orders[0]?.created || c.joined || "—";
    return { ...c, liveOrders: orders.length, liveSpent: totalSpent, lastOrder };
  }).sort((a, b) => b.liveSpent - a.liveSpent);

  const filtered = enrichedCustomers.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return [c.name, c.phone, c.email, c.id].filter(Boolean).join(" ").toLowerCase().includes(q);
  });

  const totalSpentAll = enrichedCustomers.reduce((a, c) => a + c.liveSpent, 0);
  const avgLTV = enrichedCustomers.length > 0 ? totalSpentAll / enrichedCustomers.length : 0;
  const vipCount = enrichedCustomers.filter(c => c.tier === "platinum" || c.tier === "gold").length;
  const activeCount = enrichedCustomers.filter(c => c.liveOrders > 0).length;

  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">👥 ลูกค้า</h1>
          <p className="thiny-sub">{enrichedCustomers.length} คน · {vipCount} VIP · {activeCount} active</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="🔍 ค้นหาลูกค้า..."
            style={{ padding: "8px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, width: 220 }} />
          <button className="thiny-btn thiny-btn-primary" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={14}/> เพิ่มลูกค้า
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 18, borderRadius: 12, background: "linear-gradient(135deg, #0F4C81 0%, #1565A8 100%)", color: "white" }}>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, textTransform: "uppercase" }}>👥 ลูกค้าทั้งหมด</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6 }}>{enrichedCustomers.length}</div>
        </div>
        <div style={{ padding: 18, borderRadius: 12, background: "white", borderLeft: "4px solid #C77100" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#C77100", textTransform: "uppercase" }}>💎 VIP (Gold+)</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#C77100" }}>{vipCount}</div>
        </div>
        <div style={{ padding: 18, borderRadius: 12, background: "white", borderLeft: "4px solid #1F6F4A" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1F6F4A", textTransform: "uppercase" }}>🔥 Active</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#1F6F4A" }}>{activeCount}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>มีออเดอร์อย่างน้อย 1</div>
        </div>
        <div style={{ padding: 18, borderRadius: 12, background: "white", borderLeft: "4px solid #5B3A8F" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5B3A8F", textTransform: "uppercase" }}>💰 LTV เฉลี่ย</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: "#5B3A8F" }}>{fmtMoney(avgLTV, lang)}</div>
        </div>
      </div>

      <div className="thiny-card thiny-card-flush">
        <table className="thiny-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Tier</th>
              <th>ออเดอร์</th>
              <th>ยอดรวม</th>
              <th>ออเดอร์ล่าสุด</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="thiny-tr-click" onClick={() => setSelectedCustomer(c)}>
                <td>
                  <div className="thiny-td-product">
                    <div className="thiny-avatar-sm" style={{background: tierColor[c.tier]}}>{c.name[0]}</div>
                    <div>
                      <div className="thiny-strong">{c.name}</div>
                      <div className="thiny-fg-3 thiny-xs">
                        {c.id}
                        {c.source === "chat-only" && <span style={{ marginLeft: 6, background: "#FEF3D3", color: "#C77100", padding: "1px 6px", borderRadius: 8, fontSize: 9, fontWeight: 700 }}>CHAT</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="thiny-fg-2 thiny-xs">{c.phone || "—"}</div>
                  <div className="thiny-fg-3 thiny-xs">{c.email || "—"}</div>
                </td>
                <td><span className={`thiny-tier thiny-tier-${c.tier}`}>{c.tier}</span></td>
                <td><strong>{c.liveOrders}</strong></td>
                <td><strong>{fmtMoney(c.liveSpent, lang)}</strong></td>
                <td className="thiny-fg-2 thiny-xs">{c.lastOrder}</td>
                <td>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="thiny-icon-btn" onClick={(e) => { e.stopPropagation(); setSelectedCustomer({ ...c, _openEdit: true }); }} title="แก้ไข"
                      style={{ fontSize: 13 }}>✏️</button>
                    <button className="thiny-icon-btn" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(c); }} title="View details">
                      <Icon name="chev" size={14}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "#999" }}>
            ไม่พบลูกค้าที่ตรงกับ "{searchTerm}"
          </div>
        )}
      </div>

      {showAdd && (
        <EditCustomerModal
          customer={null}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); window.location.reload(); }}
        />
      )}
    </div>
  );
};

// ============ EDIT CUSTOMER MODAL ============
const EditCustomerModal = ({ customer, onClose, onSaved }) => {
  const isEdit = !!customer?.id && customer.source !== "chat-only";
  const [form, setForm] = useStateB({
    id: customer?.id || "C" + String(Math.floor(Math.random() * 9000) + 1000),
    name: customer?.name || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    address: customer?.address || "",
    tier: customer?.tier || "bronze",
    points: customer?.points || 0,
    joined: customer?.joined || new Date().toISOString().slice(0, 10),
    note: customer?.note || ""
  });
  const [saving, setSaving] = useStateB(false);

  const handleSave = async () => {
    if (!form.name) {
      alert("กรุณากรอกชื่อลูกค้า");
      return;
    }
    setSaving(true);
    try {
      const API = window.API_BASE || "http://localhost:5000/api";
      const url = isEdit ? `${API}/customers/${customer.id}` : `${API}/customers`;
      const method = isEdit ? "PUT" : "POST";
      const payload = {
        id: form.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        tier: form.tier,
        points: parseInt(form.points) || 0,
        joined_date: form.joined
      };
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        if (window.logAudit) window.logAudit(isEdit ? "edit_customer" : "create_customer", "customer", form.id, form.name);
        onSaved && onSaved();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        alert("เกิดข้อผิดพลาด: " + (err.error || res.status));
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
    setSaving(false);
  };

  const tierColors = {
    bronze: { bg: "#FCE4D0", color: "#B97849" },
    silver: { bg: "#E5E7EA", color: "#65676B" },
    gold:   { bg: "#FEF3D3", color: "#C77100" },
    platinum: { bg: "#F0F0F2", color: "#666" },
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "white", borderRadius: 14, padding: 24, width: "92%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            {isEdit ? "✏️ แก้ไขลูกค้า" : "➕ เพิ่มลูกค้าใหม่"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, color: "#999", cursor: "pointer", padding: 0 }}>×</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>ชื่อ-นามสกุล *</label>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>📞 เบอร์โทร</label>
            <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="08X-XXX-XXXX"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>📧 Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="name@email.com"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>📍 ที่อยู่</label>
          <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }}
            placeholder="บ้านเลขที่ · ถนน · เขต · จังหวัด · รหัสไปรษณีย์" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>💎 Tier (สถานะลูกค้า)</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {Object.entries(tierColors).map(([tierId, c]) => {
              const labels = { bronze: "🥉 Bronze", silver: "🥈 Silver", gold: "🥇 Gold", platinum: "💎 Platinum" };
              return (
                <button key={tierId} type="button" onClick={() => setForm({ ...form, tier: tierId })}
                  style={{
                    padding: "10px 6px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: form.tier === tierId ? "2px solid " + c.color : "1px solid #ddd",
                    background: form.tier === tierId ? c.bg : "white",
                    color: form.tier === tierId ? c.color : "#666"
                  }}>{labels[tierId]}</button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>📅 วันที่เป็นสมาชิก</label>
            <input type="date" value={form.joined} onChange={e => setForm({ ...form, joined: e.target.value })}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>⭐ แต้มสะสม</label>
            <input type="number" min="0" value={form.points} onChange={e => setForm({ ...form, points: e.target.value })}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid #eee" }}>
          {isEdit && (
            <button onClick={async () => {
              if (!confirm(`ลบ "${customer.name}" ออกจากระบบ?`)) return;
              const API = window.API_BASE || "http://localhost:5000/api";
              await fetch(`${API}/customers/${customer.id}`, { method: "DELETE" });
              if (window.logAudit) window.logAudit("delete_customer", "customer", customer.id, customer.name);
              onSaved && onSaved();
              onClose();
            }}
              style={{ padding: "10px 16px", border: "1px solid #FFB3B3", color: "#C53030", background: "white", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
              🗑️ ลบลูกค้า
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #ddd", borderRadius: 8, background: "white", cursor: "pointer", fontWeight: 600 }}>ยกเลิก</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "10px 24px", border: "none", borderRadius: 8, background: "#0F4C81", color: "white", cursor: saving ? "wait" : "pointer", fontWeight: 700 }}>
            {saving ? "กำลังบันทึก..." : (isEdit ? "💾 บันทึก" : "➕ เพิ่ม")}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ CUSTOMER DETAIL ============
const CustomerDetail = ({ customer, lang, onBack }) => {
  const [editing, setEditing] = useStateB(!!customer?._openEdit);
  const [, forceRefresh] = useStateB(0);
  const c = customer;
  const orders = getCustomerOrders(c).sort((a, b) => (b.created || "").localeCompare(a.created || ""));
  const paidOrders = orders.filter(o => o.paymentStatus === "paid");
  const totalSpent = paidOrders.reduce((a, o) => a + (o.total || 0), 0);
  const avgOrderValue = paidOrders.length > 0 ? totalSpent / paidOrders.length : 0;
  const totalProfit = paidOrders.reduce((a, o) => {
    const qty = o.customItem?.qty || (o.items || []).reduce((x, it) => x + it.qty, 0);
    return a + ((o.total || 0) - (o.sourceCost || 0) * qty);
  }, 0);

  // Status breakdown
  const statusCounts = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  // Platform preference
  const platformCounts = {};
  orders.forEach(o => { if (o.platform) platformCounts[o.platform] = (platformCounts[o.platform] || 0) + 1; });
  const favPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0];

  // Calculate frequency (days between orders)
  const orderDates = orders.map(o => o.created?.split(" ")[0]).filter(Boolean).sort();
  let avgDaysBetween = null;
  if (orderDates.length > 1) {
    const first = new Date(orderDates[0]);
    const last = new Date(orderDates[orderDates.length - 1]);
    const days = (last - first) / (1000 * 60 * 60 * 24);
    avgDaysBetween = Math.round(days / (orderDates.length - 1));
  }

  const tierColor = { platinum: "linear-gradient(135deg,#888,#bbb)", gold: "linear-gradient(135deg,#E9B949,#F2D86F)", silver: "linear-gradient(135deg,#C0C5CC,#E5E7EA)", bronze: "linear-gradient(135deg,#B97849,#D3996A)" };

  // Status info map (reuse logic from chat orders)
  const statusLabel = {
    new: "ใหม่", awaitingPayment: "รอชำระ", paid: "ชำระแล้ว", ordered: "สั่งแล้ว",
    arrived: "ของถึงร้าน", shipped: "ส่งแล้ว", delivered: "ส่งสำเร็จ", cancelled: "ยกเลิก"
  };
  const statusBg = {
    new: "#FEF3D3", awaitingPayment: "#FFE9D8", paid: "#DDF0E3", ordered: "#DCE7F3",
    arrived: "#E7DEF5", shipped: "#DCE7F3", delivered: "#DDF0E3", cancelled: "#EEE"
  };
  const statusFg = {
    new: "#C77100", awaitingPayment: "#B7531B", paid: "#1F6F4A", ordered: "#0F4C81",
    arrived: "#5B3A8F", shipped: "#0F4C81", delivered: "#1F6F4A", cancelled: "#999"
  };

  return (
    <div className="thiny-screen">
      <button className="thiny-back" onClick={onBack}>
        <Icon name="chev" size={14} className="thiny-rot180" /> กลับไปยังรายการลูกค้า
      </button>

      {/* Header card */}
      <div className="thiny-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: tierColor[c.tier], color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, fontWeight: 800, fontFamily: "Inter",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)"
          }}>{c.name[0]}</div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>{c.name}</h1>
              <span className={`thiny-tier thiny-tier-${c.tier}`}>{c.tier}</span>
              {c.source === "chat-only" && (
                <span style={{ background: "#FEF3D3", color: "#C77100", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>CHAT CUSTOMER</span>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 12, fontSize: 13 }}>
              <div>📞 <strong>{c.phone || "—"}</strong></div>
              <div>📧 {c.email || "—"}</div>
              <div>📍 {c.address || "—"}</div>
              <div>📅 สมาชิกตั้งแต่ {c.joined || "—"}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {c.phone && (
              <a href={`tel:${c.phone}`} style={{ padding: "8px 16px", background: "#1F6F4A", color: "white", borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: "none", textAlign: "center" }}>
                📞 โทรหา
              </a>
            )}
            {c.phone && (
              <a href={`https://wa.me/${c.phone.replace(/[^0-9+]/g, "")}`} target="_blank" rel="noopener noreferrer"
                style={{ padding: "8px 16px", background: "#25D366", color: "white", borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: "none", textAlign: "center" }}>
                💬 WhatsApp
              </a>
            )}
            <button onClick={() => setEditing(true)}
              style={{ padding: "8px 16px", background: "white", color: "#0F4C81", border: "1px solid #0F4C81", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              ✏️ แก้ไข
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 16, borderRadius: 12, background: "linear-gradient(135deg, #0F4C81 0%, #1565A8 100%)", color: "white" }}>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, textTransform: "uppercase" }}>📦 ออเดอร์ทั้งหมด</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6 }}>{orders.length}</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{paidOrders.length} ชำระแล้ว</div>
        </div>
        <div style={{ padding: 16, borderRadius: 12, background: "white", borderLeft: "4px solid #1F6F4A" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1F6F4A", textTransform: "uppercase" }}>💰 ยอดซื้อรวม</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: "#1F6F4A" }}>{fmtMoney(totalSpent, lang)}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>เฉลี่ย {fmtMoney(avgOrderValue, lang)}/ออเดอร์</div>
        </div>
        <div style={{ padding: 16, borderRadius: 12, background: "white", borderLeft: "4px solid #C77100" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#C77100", textTransform: "uppercase" }}>💎 กำไรจากลูกค้า</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: "#C77100" }}>{fmtMoney(totalProfit, lang)}</div>
        </div>
        <div style={{ padding: 16, borderRadius: 12, background: "white", borderLeft: "4px solid #5B3A8F" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5B3A8F", textTransform: "uppercase" }}>⏰ ความถี่</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: "#5B3A8F" }}>
            {avgDaysBetween !== null ? `${avgDaysBetween} วัน` : "—"}
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>สั่งทุกๆ (เฉลี่ย)</div>
        </div>
      </div>

      {/* Platform preference */}
      {favPlatform && (
        <div className="thiny-card" style={{ padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 24 }}>❤️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase" }}>Platform โปรด</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>
              {(window.THINY_DATA.CHANNELS.find(p => p.id === favPlatform[0])?.name) || favPlatform[0]} · {favPlatform[1]} ครั้ง
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).map(([pid, count]) => {
              const plat = window.THINY_DATA.CHANNELS.find(c => c.id === pid);
              if (!plat) return null;
              return (
                <div key={pid} style={{ textAlign: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: plat.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{plat.icon}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{count}×</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order history */}
      <div className="thiny-card" style={{ padding: 18 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>📜 ประวัติการสั่งซื้อ</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{orders.length} ออเดอร์</div>
        </div>

        {orders.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#999" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 14 }}>ลูกค้ายังไม่เคยสั่งซื้อ</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {orders.map(o => {
              const plat = window.THINY_DATA.CHANNELS.find(p => p.id === o.platform);
              const itemName = o.customItem?.name || (window.THINY_DATA.PRODUCTS.find(p => p.id === o.items?.[0]?.pid)?.name?.[lang] || "—");
              return (
                <div key={o.id} style={{ display: "grid", gridTemplateColumns: "120px 80px 1fr 120px 100px 80px", gap: 12, alignItems: "center", padding: 12, background: "#FAFAF7", borderRadius: 8 }}>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}>{o.id}</div>
                    <div style={{ fontSize: 10, color: "#888" }}>{o.created}</div>
                  </div>
                  {plat ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 10, background: plat.color, color: "#fff", fontSize: 10, fontWeight: 700, width: "fit-content" }}>
                      {plat.icon} {plat.name}
                    </span>
                  ) : <span>—</span>}
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{itemName}{o.customItem ? ` × ${o.customItem.qty}` : ""}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>฿{(o.total || 0).toLocaleString()}</div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 10, width: "fit-content",
                    background: statusBg[o.status] || "#EEE", color: statusFg[o.status] || "#666"
                  }}>{statusLabel[o.status] || o.status}</span>
                  <div style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 10, textAlign: "center",
                    background: o.paymentStatus === "paid" ? "#DDF0E3" : "#FEF3D3",
                    color: o.paymentStatus === "paid" ? "#1F6F4A" : "#C77100"
                  }}>{o.paymentStatus === "paid" ? "✓ ชำระ" : (o.paymentMethod === "cod" ? "COD" : "รอ")}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <EditCustomerModal
          customer={c}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); forceRefresh(n => n + 1); window.location.reload(); }}
        />
      )}
    </div>
  );
};

// ---------------- BARCODE SCAN ----------------
// Status label for scan-page alerts (kept inline since admin-chat.jsx has the full STATUS_INFO)
const STATUS_INFO_SCAN = {
  new: "ออเดอร์ใหม่",
  awaitingPayment: "รอชำระเงิน",
  paid: "ชำระแล้ว",
  ordered: "สั่งจาก platform แล้ว",
  arrived: "ของถึงร้านแล้ว",
  shipped: "จัดส่งให้ลูกค้าแล้ว",
  delivered: "ส่งสำเร็จ",
  cancelled: "ยกเลิก",
};

const ScreenScan = ({ t, lang }) => {
  const [mode, setMode] = useStateB("in"); // in / out
  const [scanned, setScanned] = useStateB([]);
  const [pulse, setPulse] = useStateB(false);
  const [trackingInput, setTrackingInput] = useStateB("");
  const [barcodeInput, setBarcodeInput] = useStateB("");
  const [matched, setMatched] = useStateB(null);
  // Unassigned-tracking flow: when scan finds no match, prompt user to pick a pending order
  const [pendingAssign, setPendingAssign] = useStateB(null); // { tracking, candidates }
  const [, forceUpdate] = useStateB(0);
  // Real camera scanner state
  const [cameraActive, setCameraActive] = useStateB(false);
  const [cameraError, setCameraError] = useStateB(null);
  const scannerRef = React.useRef(null);
  const { PRODUCTS, CHAT_ORDERS, CHANNELS } = window.THINY_DATA;

  // Look up a tracking number against pre-order CHAT_ORDERS
  // Behavior changes based on mode (in = รับเข้า / out = ตัดออก)
  const lookupTracking = (raw) => {
    const trk = (raw || "").trim();
    if (!trk) {
      alert("กรุณากรอกเลข tracking");
      return;
    }
    setPulse(true);
    setTimeout(() => setPulse(false), 600);

    // Match against sourceTracking (incoming) first, then outgoing tracking
    const order = CHAT_ORDERS.find(o =>
      (o.sourceTracking && o.sourceTracking.toLowerCase() === trk.toLowerCase()) ||
      (o.tracking && o.tracking.toLowerCase() === trk.toLowerCase())
    );

    if (!order) {
      // Find pre-orders that need a tracking number (depending on mode)
      const candidates = mode === "in"
        ? CHAT_ORDERS.filter(o => !o.sourceTracking && (o.status === "paid" || o.status === "ordered" || o.status === "new" || o.status === "awaitingPayment"))
        : CHAT_ORDERS.filter(o => !o.tracking && o.status === "arrived");

      if (candidates.length > 0) {
        // Open assignment modal
        setPendingAssign({ tracking: trk, candidates });
        setMatched(null);
      } else {
        alert("❌ ไม่พบออเดอร์ที่ใช้เลข tracking นี้\n\nและไม่มีออเดอร์ที่ยังไม่มี tracking ให้ผูกได้");
        setMatched(null);
      }
      setTrackingInput("");
      setBarcodeInput("");
      return;
    }

    const isIncomingTracking = order.sourceTracking && order.sourceTracking.toLowerCase() === trk.toLowerCase();

    // === MODE: รับเข้า ===
    // Of from platform arrived at our shop. Status → "arrived" (still in pre-order list)
    if (mode === "in") {
      if (order.status === "ordered" || order.status === "paid" || order.status === "new") {
        order.status = "arrived";
        if (window.logAudit) window.logAudit("scan_in", "chat_order", order.id, `${order.customer?.name} · tracking ${trk} · ของถึงร้านแล้ว`);
      } else if (order.status === "arrived") {
        // already received
      } else if (order.status === "shipped" || order.status === "delivered") {
        alert("⚠️ ออเดอร์นี้ส่งออกไปแล้ว!\n\nลูกค้า: " + order.customer.name + "\nสถานะ: " + (STATUS_INFO_SCAN[order.status] || order.status));
      }
      setMatched({ order, isIncoming: true, scanMode: "in", at: new Date().toLocaleTimeString() });
    }
    // === MODE: ตัดออก ===
    // Ship to customer. Check payment first, then enable print & confirm-ship buttons.
    else {
      // Validation: order must be at least "arrived" before shipping
      if (order.status === "new" || order.status === "ordered" || order.status === "awaitingPayment") {
        alert("⚠️ ออเดอร์นี้ยังไม่ถึงร้านเลย!\n\nลูกค้า: " + order.customer.name + "\nสถานะปัจจุบัน: " + (STATUS_INFO_SCAN[order.status] || order.status) + "\n\nต้อง 'รับเข้า' ก่อน");
        setMatched(null);
        setTrackingInput("");
        setBarcodeInput("");
        return;
      }
      setMatched({ order, isIncoming: isIncomingTracking, scanMode: "out", at: new Date().toLocaleTimeString() });
    }

    setScanned([{
      orderId: order.id,
      customerName: order.customer.name,
      productName: order.customItem ? order.customItem.name : (PRODUCTS.find(p => p.id === order.items?.[0]?.pid)?.name[lang] || "—"),
      tracking: trk,
      direction: mode,
      scanAt: new Date().toLocaleTimeString()
    }, ...scanned].slice(0, 8));
    if (window.saveChatOrder) window.saveChatOrder(order);
    forceUpdate(n => n + 1);
    setTrackingInput("");
    setBarcodeInput("");
  };

  // Assign the unmatched tracking number to a chosen pending order
  const assignTrackingToOrder = (order) => {
    if (!pendingAssign) return;
    const trk = pendingAssign.tracking;
    if (mode === "in") {
      order.sourceTracking = trk;
      if (order.status === "new" || order.status === "paid" || order.status === "awaitingPayment") {
        order.status = "ordered";
      }
      // Run normal lookup flow now that order is linked
      order.status = "arrived";
    } else {
      order.tracking = trk;
    }
    setPendingAssign(null);
    setMatched({ order, isIncoming: mode === "in", scanMode: mode, at: new Date().toLocaleTimeString() });
    setScanned([{
      orderId: order.id,
      customerName: order.customer.name,
      productName: order.customItem ? order.customItem.name : (PRODUCTS.find(p => p.id === order.items?.[0]?.pid)?.name[lang] || "—"),
      tracking: trk,
      direction: mode,
      scanAt: new Date().toLocaleTimeString(),
      justLinked: true
    }, ...scanned].slice(0, 8));
    if (window.saveChatOrder) window.saveChatOrder(order);
    if (window.logAudit) window.logAudit("assign_tracking", "chat_order", order.id, `${order.customer?.name} · ผูก tracking ${pendingAssign.tracking}`);
    forceUpdate(n => n + 1);
  };

  // Confirm shipping (called from matched display when user clicks "ยืนยันส่ง")
  const confirmShip = () => {
    if (!matched || !matched.order) return;
    matched.order.status = "shipped";
    if (window.saveChatOrder && matched?.order) window.saveChatOrder(matched.order);
    if (window.logAudit) window.logAudit("scan_out", "chat_order", matched.order.id, `${matched.order.customer?.name} · ตัดสต๊อกออก`);
    alert("✓ ตัดสต๊อกออกแล้ว · ออเดอร์ " + matched.order.id + " ส่งให้ลูกค้าเรียบร้อย");
    forceUpdate(n => n + 1);
  };

  const markPaidFromScan = () => {
    if (!matched || !matched.order) return;
    matched.order.paymentStatus = "paid";
    if (window.saveChatOrder && matched?.order) window.saveChatOrder(matched.order);
    if (window.logAudit) window.logAudit("mark_paid", "chat_order", matched.order.id, matched.order.customer?.name);
    forceUpdate(n => n + 1);
  };

  // ===== Camera functions =====
  const startCamera = () => {
    if (!window.Html5Qrcode) {
      setCameraError("กรุณารอสักครู่แล้วลองใหม่");
      return;
    }
    setCameraError(null);
    setCameraActive(true);
  };

  const stopCamera = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {}).finally(() => {
        if (scannerRef.current) {
          try { scannerRef.current.clear(); } catch(e) {}
        }
        scannerRef.current = null;
        setCameraActive(false);
      });
    } else {
      setCameraActive(false);
    }
  };

  useEffectB(() => {
    if (!cameraActive) return;
    let scanner;
    try {
      // จำกัดเฉพาะ format ที่ใช้บนพัสดุไทย → เร็วกว่าสแกนทุก format ~5x
      const fmts = window.Html5QrcodeSupportedFormats;
      scanner = new window.Html5Qrcode("thiny-camera-view", {
        formatsToSupport: fmts ? [
          fmts.CODE_128,  // Shopee, Lazada, Flash, J&T, Kerry
          fmts.CODE_39,
          fmts.CODE_93,
          fmts.ITF,
          fmts.EAN_13,
          fmts.QR_CODE,   // QR code ทั่วไป
        ] : undefined,
        verbose: false,
      });
      scannerRef.current = scanner;
      scanner.start(
        { facingMode: "environment" },
        { fps: 30, qrbox: { width: 260, height: 260 }, aspectRatio: 1.7778 },
        (decodedText) => {
          // เสียงสัญญาณสแกนสำเร็จ
          if (window.AudioContext || window.webkitAudioContext) {
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = ctx.createOscillator();
              osc.connect(ctx.destination);
              osc.frequency.value = 880;
              osc.start(); osc.stop(ctx.currentTime + 0.1);
            } catch(e) {}
          }
          lookupTracking(decodedText);
          scanner.stop().catch(() => {});
          scannerRef.current = null;
          setCameraActive(false);
        },
        () => {} // scan errors are normal (frames without barcode)
      ).catch(err => {
        const msg = err && err.message ? err.message : String(err);
        setCameraError("ไม่สามารถเปิดกล้องได้ · " + msg);
        setCameraActive(false);
        scannerRef.current = null;
      });
    } catch(e) {
      setCameraError("เกิดข้อผิดพลาด: " + e.message);
      setCameraActive(false);
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [cameraActive]);

  // Quick demo lists — adapt based on mode
  const incomingPending = CHAT_ORDERS.filter(o => o.sourceTracking && (o.status === "ordered" || o.status === "paid"));
  const readyToShip = CHAT_ORDERS.filter(o => o.status === "arrived");
  const quickList = mode === "in" ? incomingPending : readyToShip;
  const quickLabel = mode === "in" ? "📥 Pre-order รอของถึง · กดเพื่อทดสอบ:" : "📤 พร้อมจัดส่งให้ลูกค้า · กดเพื่อทดสอบ:";
  const quickTrackingFor = (o) => mode === "in" ? o.sourceTracking : (o.tracking || o.sourceTracking);

  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">ติดตามค้นหาพัสดุ</h1>
          <p className="thiny-sub">ยิง/พิมพ์เลข tracking ของพัสดุที่เข้ามา → รู้ทันทีว่าเป็นของลูกค้าคนไหน</p>
        </div>
      </div>

      {/* ===== Tracking lookup ===== */}
      <div className="thiny-card" style={{ background: "linear-gradient(135deg, #0F4C81 0%, #1565A8 100%)", color: "white", marginBottom: 16 }}>
        <div style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>🔍 ค้นหาออเดอร์ด้วยเลข Tracking</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 14 }}>พิมพ์/ยิงเลข tracking ของพัสดุที่ได้รับจาก platform → จะรู้ทันทีว่าเป็นของลูกค้าคนไหน</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupTracking(trackingInput)}
              placeholder="เช่น SPX-1234567890"
              style={{ flex: 1, padding: "12px 14px", borderRadius: 8, border: "none", fontSize: 14, fontFamily: "monospace", boxSizing: "border-box" }}
              autoFocus
            />
            <button onClick={() => lookupTracking(trackingInput)} style={{ padding: "12px 24px", background: "#FFC107", color: "#0F4C81", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>ค้นหา</button>
          </div>
        </div>
      </div>

      {/* ===== Assign-tracking modal (เมื่อหา tracking ไม่เจอ) ===== */}
      {pendingAssign && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: 14, padding: 24, width: "92%", maxWidth: 540, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 13, color: "#B7531B", fontWeight: 700 }}>🆕 ไม่พบเลข tracking นี้ในระบบ</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, fontFamily: "monospace", color: "#0F4C81" }}>{pendingAssign.tracking}</div>
              </div>
              <button onClick={() => setPendingAssign(null)} style={{ background: "none", border: "none", fontSize: 24, color: "#999", cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
            </div>

            <div style={{ padding: 12, background: "#FFF8E1", borderRadius: 8, marginBottom: 16, fontSize: 13, color: "#8B5A00" }}>
              💡 เลือกออเดอร์ที่จะ<strong>ผูกเลข tracking นี้</strong>ให้ — ระบบจะอัปเดตสถานะให้อัตโนมัติ
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
              📋 ออเดอร์ที่ยังไม่มี tracking ({pendingAssign.candidates.length} ออเดอร์)
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pendingAssign.candidates.map(o => {
                const plat = CHANNELS.find(c => c.id === o.platform);
                const itemName = o.customItem ? o.customItem.name : (PRODUCTS.find(p => p.id === o.items?.[0]?.pid)?.name[lang] || "—");
                const isPaid = o.paymentStatus === "paid";
                return (
                  <button key={o.id} onClick={() => assignTrackingToOrder(o)}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: 12, border: "2px solid #E5DDC9", borderRadius: 10,
                      background: "#FAFAF7", cursor: "pointer", transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#F5EFFD"; e.currentTarget.style.borderColor = "#5B3A8F"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#FAFAF7"; e.currentTarget.style.borderColor = "#E5DDC9"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          {plat && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 10, background: plat.color, color: "#fff", fontSize: 10, fontWeight: 700 }}>
                              <span>{plat.icon}</span>{plat.name}
                            </span>
                          )}
                          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#888" }}>{o.id}</span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8,
                            background: isPaid ? "#DDF0E3" : "#FEF3D3",
                            color: isPaid ? "#1F6F4A" : "#C77100"
                          }}>{isPaid ? "✓ ชำระแล้ว" : (o.paymentMethod === "cod" ? "COD" : "รอโอน")}</span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>{o.customer.name}</div>
                        <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{itemName}{o.customItem ? ` × ${o.customItem.qty}` : ""}</div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>📞 {o.customer.phone || "—"} · {o.created}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0F4C81" }}>฿{(o.total || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: "#5B3A8F", marginTop: 4, fontWeight: 700 }}>ผูก →</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16, paddingTop: 16, borderTop: "1px solid #eee" }}>
              <button onClick={() => setPendingAssign(null)}
                style={{ flex: 1, padding: "10px 16px", border: "1px solid #ddd", borderRadius: 8, background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Matched order display ===== */}
      {matched && (() => {
        const o = matched.order;
        const isOutMode = matched.scanMode === "out";
        const isPaid = o.paymentStatus === "paid";
        const isCOD = o.paymentMethod === "cod";
        // Outgoing scan: block shipping if customer hasn't paid (and not COD)
        const blockShipping = isOutMode && !isPaid && !isCOD;
        const accentColor = blockShipping ? "#C53030" : (isOutMode ? "#0F4C81" : "#1F6F4A");
        const accentBg = blockShipping ? "#FFE5E5" : (isOutMode ? "#DCE7F3" : "#DDF0E3");

        return (
        <div className="thiny-card" style={{ borderLeft: "4px solid " + accentColor, marginBottom: 16, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: accentColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {matched.scanMode === "in" ? "✓ รับเข้า — ของถึงร้านแล้ว" : "📤 เตรียมตัดออก — ส่งให้ลูกค้า"}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{o.customer.name}</div>
              <div style={{ fontSize: 13, color: "#666" }}>📞 {o.customer.phone} · {o.id}</div>
            </div>
            {(() => {
              const plat = CHANNELS.find(c => c.id === o.platform);
              if (!plat) return null;
              return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 16, background: plat.color, color: "#fff", fontSize: 12, fontWeight: 700 }}>
                  <span>{plat.icon}</span>{plat.name}
                </span>
              );
            })()}
          </div>

          <div style={{ background: "#FAFAF7", padding: 12, borderRadius: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>สินค้าที่สั่ง</div>
            <div style={{ fontWeight: 600 }}>
              {o.customItem ?
                `${o.customItem.name} · ${o.customItem.options || ""} · ×${o.customItem.qty}` :
                `${(o.items || []).length} รายการ`}
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>ยอดที่ลูกค้าจ่าย: <strong>฿{(o.total || 0).toLocaleString()}</strong></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div style={{ background: "#FFFCF5", padding: 10, borderRadius: 6, fontSize: 12 }}>
              <div style={{ color: "#888" }}>ที่อยู่จัดส่ง</div>
              <div style={{ fontWeight: 500, marginTop: 2 }}>{o.customer.address || "—"}</div>
            </div>
            <div style={{ background: isPaid ? "#DDF0E3" : (isCOD ? "#FEF3D3" : "#FFE5E5"), padding: 10, borderRadius: 6, fontSize: 12 }}>
              <div style={{ color: "#888" }}>การชำระเงิน</div>
              <div style={{ fontWeight: 700, color: isPaid ? "#1F6F4A" : (isCOD ? "#C77100" : "#C53030"), marginTop: 2, fontSize: 13 }}>
                {isPaid ? "✓ ชำระแล้ว" : (isCOD ? "📦 COD เก็บปลายทาง" : "⏳ ยังไม่ได้โอน!")}
              </div>
            </div>
          </div>

          {/* ===== Mode: รับเข้า ===== */}
          {matched.scanMode === "in" && (
            <>
              <div style={{ padding: 10, background: "#DDF0E3", borderRadius: 6, fontSize: 13, color: "#1F6F4A", fontWeight: 600, marginBottom: 10 }}>
                ✓ อัปเดตสถานะเป็น "ของถึงร้านแล้ว" · ยังอยู่ใน Pre-order list
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => window.printBillFor(o, lang)}
                  style={{ flex: 1, padding: "12px", background: "#1F6F4A", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                  🖨️ พิมพ์บิล + บาร์โค้ดเตรียมไว้
                </button>
              </div>
            </>
          )}

          {/* ===== Mode: ตัดออก ===== */}
          {matched.scanMode === "out" && blockShipping && (
            <div style={{ padding: 14, background: "#FFE5E5", border: "2px solid #C53030", borderRadius: 8, marginBottom: 10 }}>
              <div style={{ fontWeight: 700, color: "#C53030", fontSize: 15, marginBottom: 4 }}>⚠️ หยุด! ลูกค้ายังไม่ได้โอนเงิน</div>
              <div style={{ fontSize: 12, color: "#7A1F1F", marginBottom: 10 }}>วิธีชำระ: โอนเงิน · ยอดที่ต้องชำระ ฿{(o.total || 0).toLocaleString()}</div>
              <button onClick={markPaidFromScan}
                style={{ padding: "8px 16px", background: "#1F6F4A", color: "white", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                ✓ ลูกค้าโอนแล้ว · ทำเครื่องหมายชำระ
              </button>
            </div>
          )}

          {matched.scanMode === "out" && !blockShipping && o.status === "arrived" && (
            <>
              <div style={{ padding: 10, background: "#DCE7F3", borderRadius: 6, fontSize: 13, color: "#0F4C81", fontWeight: 600, marginBottom: 10 }}>
                {isCOD && !isPaid ? "📦 COD — เก็บเงินปลายทาง ฿" + (o.total || 0).toLocaleString() : "✓ ชำระเรียบร้อย — พร้อมส่งของ"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button onClick={() => window.printBillFor(o, lang)}
                  style={{ padding: "12px", background: "#0F4C81", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                  🖨️ พิมพ์บิล + บาร์โค้ด
                </button>
                <button onClick={confirmShip}
                  style={{ padding: "12px", background: "#1F6F4A", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                  ✓ ยืนยันส่ง · ตัดสต๊อก
                </button>
              </div>
            </>
          )}

          {matched.scanMode === "out" && (o.status === "shipped" || o.status === "delivered") && (
            <div style={{ padding: 10, background: "#EEE", borderRadius: 6, fontSize: 13, color: "#666", fontWeight: 600 }}>
              ⚠️ ออเดอร์นี้ตัดสต๊อกไปแล้ว · สถานะปัจจุบัน: {STATUS_INFO_SCAN[o.status]}
            </div>
          )}
        </div>
        );
      })()}

      <div className="thiny-scan-layout">
        <div className="thiny-card thiny-scan-mockphone">
          {/* Manual barcode input — ย้ายขึ้นมาด้านบนแล้ว (ใช้ง่ายกว่ากล้อง) */}
          <div style={{ marginBottom: 14, padding: 14, background: "#FFF8E1", border: "1px solid #FFD27A", borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>⌨️</span>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#8B5A00" }}>พิมพ์เลข tracking เอง</div>
            </div>
            <div style={{ fontSize: 11, color: "#8B5A00", opacity: 0.8, marginBottom: 8 }}>พิมพ์เลข tracking หรือใช้กล้องสแกนด้านล่างก็ได้</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && lookupTracking(barcodeInput)}
                placeholder="เช่น SPX-1234567890"
                style={{ flex: 1, padding: "10px 12px", border: "1px solid #FFD27A", borderRadius: 6, fontSize: 13, fontFamily: "monospace", boxSizing: "border-box", background: "white" }}
                autoFocus
              />
              <button
                onClick={() => lookupTracking(barcodeInput)}
                style={{ padding: "10px 16px", background: "#C77100", color: "white", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                ค้นหา
              </button>
            </div>
          </div>

          <div className="thiny-card-title">สแกนด้วยกล้องมือถือ</div>
          <div className="thiny-card-sub">กดปุ่มเปิดกล้อง แล้วชี้ไปที่บาร์โค้ดบนพัสดุ</div>
          <div className="thiny-scan-phone">
            <div className="thiny-scan-cam" style={{ position: "relative", minHeight: 200, background: "#111", borderRadius: 10, overflow: "hidden" }}>
              {/* html5-qrcode renders the video feed into this div */}
              <div id="thiny-camera-view" style={{ width: "100%" }}></div>

              {/* Overlay when camera is off */}
              {!cameraActive && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "#1a1a1a" }}>
                  <svg viewBox="0 0 200 80" style={{ width: "55%", opacity: 0.3 }} preserveAspectRatio="none">
                    {[3,2,4,1,3,5,2,3,1,4,2,3,5,1,4,2,3,1,4,3,2,5,1,3,2,4,1,3,5,2].map((w,i,a) => {
                      let x = 0;
                      for (let j = 0; j < i; j++) x += a[j] * 2 + 2;
                      return <rect key={i} x={x} y={20} width={w*2} height={40} fill="white"/>;
                    })}
                  </svg>
                  <button
                    onClick={startCamera}
                    style={{ padding: "12px 32px", background: "#0F4C81", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(15,76,129,0.5)" }}
                  >
                    📷 เปิดกล้อง
                  </button>
                  {cameraError && (
                    <div style={{ color: "#FF6B6B", fontSize: 12, textAlign: "center", padding: "0 20px", lineHeight: 1.5 }}>
                      ⚠️ {cameraError}
                    </div>
                  )}
                  <div style={{ color: "#555", fontSize: 11 }}>หรือพิมพ์เลข tracking ด้านบน</div>
                </div>
              )}

              {/* Stop button overlay when camera is on */}
              {cameraActive && (
                <div style={{ position: "absolute", top: 8, right: 8, zIndex: 20 }}>
                  <button
                    onClick={stopCamera}
                    style={{ padding: "6px 14px", background: "rgba(0,0,0,0.75)", color: "white", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                  >
                    ✕ ปิด
                  </button>
                </div>
              )}

              {/* Scan guide line overlay */}
              {cameraActive && (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                  <div style={{ width: "80%", height: 2, background: "rgba(255,60,60,0.8)", boxShadow: "0 0 8px rgba(255,60,60,0.6)" }}></div>
                </div>
              )}
            </div>

            <div className="thiny-scan-controls">
              <button className={`thiny-scan-mode ${mode === "in" ? "active" : ""}`} onClick={() => setMode("in")}>
                <Icon name="arrowDown" size={14}/> รับเข้า
              </button>
              <button className={`thiny-scan-mode ${mode === "out" ? "active" : ""}`} onClick={() => setMode("out")}>
                <Icon name="arrowUp" size={14}/> ตัดออก
              </button>
            </div>
          </div>
        </div>

        <div className="thiny-card">
          <div className="thiny-card-head">
            <div>
              <div className="thiny-card-title">ประวัติการค้นหา</div>
              <div className="thiny-card-sub">{scanned.length} รายการล่าสุด</div>
            </div>
            <button className="thiny-btn-ghost-sm" onClick={()=>{ setScanned([]); setMatched(null); }}>Clear</button>
          </div>

          {/* Quick demo: list adapts based on mode (รับเข้า vs ตัดออก) */}
          {quickList.length > 0 && (
            <div className="thiny-scan-demo">
              <div className="thiny-scan-demo-label">{quickLabel}</div>
              <div className="thiny-scan-demo-buttons">
                {quickList.slice(0,4).map(o => (
                  <button key={o.id} className="thiny-scan-demo-btn" onClick={() => lookupTracking(quickTrackingFor(o))} style={{ flexDirection: "column", padding: "8px 12px", alignItems: "flex-start", gap: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, width: "100%" }}>
                      <Icon name="barcode" size={12}/>
                      <span className="thiny-mono" style={{ fontSize: 11 }}>{quickTrackingFor(o)}</span>
                    </div>
                    <span style={{ fontSize: 10, color: "#888" }}>→ {o.customer.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="thiny-scan-feed">
            {scanned.length === 0 && (
              <div className="thiny-empty">
                <Icon name="barcode" size={32} className="thiny-fg-3"/>
                <div className="thiny-fg-3 thiny-xs">ยังไม่มีการค้นหา · เริ่มต้นโดยพิมพ์เลข tracking ด้านบน</div>
              </div>
            )}
            {scanned.map((s, i) => (
              <div key={i} className="thiny-scan-feed-row" style={{ animation: i === 0 ? "thiny-slidein 0.3s ease-out" : "", background: s.direction === "in" ? "#FFFCF5" : "#F8FBFE" }}>
                <div className={`thiny-scan-feed-icon ${s.direction}`}>
                  <Icon name={s.direction === "in" ? "arrowDown" : "arrowUp"} size={12}/>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: "#F0EBE0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📦</div>
                <div className="thiny-scan-feed-info">
                  <div className="thiny-strong">{s.customerName} · {s.orderId}</div>
                  <div className="thiny-fg-3 thiny-xs">{s.productName} · {s.tracking}</div>
                </div>
                <div className="thiny-fg-3 thiny-xs thiny-mono">{s.scanAt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ ของในร้าน (arrived items) ============ */}
      <div className="thiny-card" style={{ marginTop: 16, padding: 18, borderLeft: "4px solid #5B3A8F" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>📦 ของในร้าน · พร้อมจัดส่ง</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
              ออเดอร์ที่สแกนรับเข้าแล้ว · รอตัดออกส่งลูกค้า ({readyToShip.length} รายการ)
            </div>
          </div>
          {readyToShip.length > 0 && (
            <button onClick={() => setMode("out")}
              style={{ padding: "8px 14px", background: "#5B3A8F", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
              ↑ สลับโหมดตัดออก
            </button>
          )}
        </div>

        {readyToShip.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", background: "#FAFAF7", borderRadius: 10 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 14, color: "#888", fontWeight: 600 }}>ยังไม่มีของในร้าน</div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>เมื่อสแกนรับเข้า สินค้าจะมาแสดงที่นี่</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {readyToShip.map(o => {
              const plat = CHANNELS.find(c => c.id === o.platform);
              const itemName = o.customItem ? o.customItem.name : (PRODUCTS.find(p => p.id === o.items?.[0]?.pid)?.name[lang] || "—");
              const itemQty = o.customItem ? o.customItem.qty : (o.items || []).reduce((a, b) => a + b.qty, 0);
              const isPaid = o.paymentStatus === "paid";
              const isCOD = o.paymentMethod === "cod";
              return (
                <div key={o.id} style={{
                  padding: 12,
                  background: "linear-gradient(135deg, #F5EFFD 0%, #EAE0F7 100%)",
                  borderRadius: 10, border: "1px solid #C7B3DD"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    {plat && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 10, background: plat.color, color: "#fff", fontSize: 10, fontWeight: 700 }}>
                        <span>{plat.icon}</span>{plat.name}
                      </span>
                    )}
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#666" }}>{o.id}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8, marginLeft: "auto",
                      background: isPaid ? "#DDF0E3" : "#FEF3D3",
                      color: isPaid ? "#1F6F4A" : "#C77100"
                    }}>{isPaid ? "✓ ชำระ" : (isCOD ? "COD" : "รอโอน")}</span>
                  </div>

                  <div style={{ fontSize: 15, fontWeight: 700, color: "#222", marginBottom: 2 }}>{o.customer.name}</div>
                  <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>
                    📦 {itemName} × {itemQty}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>
                    📍 {(o.customer.address || "—").substring(0, 50)}{(o.customer.address || "").length > 50 ? "…" : ""}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid rgba(91, 58, 143, 0.2)" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#5B3A8F" }}>฿{(o.total || 0).toLocaleString()}</div>
                    <button onClick={() => window.printBillFor(o, lang)}
                      title="พิมพ์บิล + บาร์โค้ด"
                      style={{ padding: "6px 12px", background: "white", color: "#5B3A8F", border: "1px solid #5B3A8F", borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                      🖨️ พิมพ์บิล
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------- REPORTS ----------------
const ScreenReports = ({ t, lang }) => {
  const { CHAT_ORDERS, CHANNELS } = window.THINY_DATA;
  const [period, setPeriod] = useStateB("month"); // week / month / all

  // === Filter orders by period ===
  const now = new Date();
  const cutoff = new Date(now);
  if (period === "week") cutoff.setDate(now.getDate() - 7);
  else if (period === "month") cutoff.setMonth(now.getMonth() - 1);
  else if (period === "all") cutoff.setFullYear(2000); // all time

  const filterByPeriod = (o) => {
    if (period === "all") return true;
    const date = new Date((o.created || "").split(" ")[0]);
    return date >= cutoff;
  };

  const periodOrders = CHAT_ORDERS.filter(filterByPeriod);
  const paidOrders = periodOrders.filter(o => o.paymentStatus === "paid");

  // === Top customers (by spend) ===
  const customerStats = {};
  paidOrders.forEach(o => {
    const key = normalizePhone(o.customer?.phone) || o.customer?.name || "—";
    if (!customerStats[key]) customerStats[key] = { name: o.customer?.name, phone: o.customer?.phone, count: 0, spent: 0 };
    customerStats[key].count++;
    customerStats[key].spent += o.total || 0;
  });
  const topCustomers = Object.values(customerStats).sort((a, b) => b.spent - a.spent).slice(0, 10);

  // === Top products ===
  const productStats = {};
  paidOrders.forEach(o => {
    const name = o.customItem?.name || "—";
    const qty = o.customItem?.qty || 1;
    if (!productStats[name]) productStats[name] = { name, count: 0, qty: 0, revenue: 0, profit: 0 };
    productStats[name].count++;
    productStats[name].qty += qty;
    productStats[name].revenue += o.total || 0;
    productStats[name].profit += (o.total || 0) - ((o.sourceCost || 0) * qty);
  });
  const topProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // === Platform ROI ===
  const platformStats = {};
  paidOrders.forEach(o => {
    const pid = o.platform || "unknown";
    if (!platformStats[pid]) platformStats[pid] = { count: 0, revenue: 0, cost: 0, fees: 0 };
    const qty = o.customItem?.qty || 1;
    platformStats[pid].count++;
    platformStats[pid].revenue += o.total || 0;
    platformStats[pid].cost += (o.sourceCost || 0) * qty;
    platformStats[pid].fees += o.serviceFee || 0;
  });
  const platformAnalysis = Object.entries(platformStats).map(([pid, s]) => {
    const plat = CHANNELS.find(c => c.id === pid);
    return {
      platform: plat,
      count: s.count,
      revenue: s.revenue,
      cost: s.cost,
      fees: s.fees,
      profit: s.revenue - s.cost,
      margin: s.revenue > 0 ? ((s.revenue - s.cost) / s.revenue * 100) : 0
    };
  }).sort((a, b) => b.profit - a.profit);

  // === Totals ===
  const totalRevenue = paidOrders.reduce((a, o) => a + (o.total || 0), 0);
  const totalCost = paidOrders.reduce((a, o) => {
    const qty = o.customItem?.qty || 1;
    return a + (o.sourceCost || 0) * qty;
  }, 0);
  const totalProfit = totalRevenue - totalCost;
  const totalFees = paidOrders.reduce((a, o) => a + (o.serviceFee || 0), 0);
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;

  // === Status breakdown ===
  const statusCounts = {};
  periodOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  // Export full report as CSV
  const exportReport = () => {
    let csv = `THINY Shop · Analytics Report (${period})\n\n`;
    csv += `Period,${period}\nTotal orders,${periodOrders.length}\nPaid orders,${paidOrders.length}\nRevenue,${totalRevenue}\nCost,${totalCost}\nProfit,${totalProfit}\nService fees,${totalFees}\nMargin,${margin.toFixed(1)}%\n\n`;
    csv += `Top Customers\nRank,Name,Phone,Orders,Spent\n`;
    topCustomers.forEach((c, i) => { csv += `${i + 1},"${c.name}","${c.phone || ''}",${c.count},${c.spent}\n`; });
    csv += `\nTop Products\nRank,Product,Qty,Revenue,Profit\n`;
    topProducts.forEach((p, i) => { csv += `${i + 1},"${p.name}",${p.qty},${p.revenue},${p.profit}\n`; });
    csv += `\nPlatform Analysis\nPlatform,Orders,Revenue,Cost,Profit,Margin\n`;
    platformAnalysis.forEach(p => { csv += `${p.platform?.name || 'Unknown'},${p.count},${p.revenue},${p.cost},${p.profit},${p.margin.toFixed(1)}%\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = `thiny-analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">📊 รายงานเชิงลึก · Analytics</h1>
          <p className="thiny-sub">ยอดขาย · กำไร · ลูกค้า · สินค้า · Platform analysis</p>
        </div>
        <div className="thiny-top-actions">
          <div className="thiny-seg">
            <button className={period === "week" ? "active" : ""} onClick={() => setPeriod("week")}>7 วัน</button>
            <button className={period === "month" ? "active" : ""} onClick={() => setPeriod("month")}>1 เดือน</button>
            <button className={period === "all" ? "active" : ""} onClick={() => setPeriod("all")}>ทั้งหมด</button>
          </div>
          <button className="thiny-btn-ghost" onClick={exportReport}>
            <Icon name="download" size={14}/> Export CSV
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 16, borderRadius: 12, background: "linear-gradient(135deg, #0F4C81 0%, #1565A8 100%)", color: "white" }}>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, textTransform: "uppercase" }}>💵 รายได้</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{fmtMoney(totalRevenue, lang)}</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{paidOrders.length} ออเดอร์ชำระ</div>
        </div>
        <div style={{ padding: 16, borderRadius: 12, background: "linear-gradient(135deg, #1F6F4A 0%, #2E8C5F 100%)", color: "white" }}>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, textTransform: "uppercase" }}>💎 กำไรขั้นต้น</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{fmtMoney(totalProfit, lang)}</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>Margin {margin.toFixed(1)}%</div>
        </div>
        <div style={{ padding: 16, borderRadius: 12, background: "white", borderLeft: "4px solid #C77100" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#C77100", textTransform: "uppercase" }}>🎯 AOV (เฉลี่ย)</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: "#C77100" }}>{fmtMoney(avgOrderValue, lang)}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>ค่าบริการรวม {fmtMoney(totalFees, lang)}</div>
        </div>
        <div style={{ padding: 16, borderRadius: 12, background: "white", borderLeft: "4px solid #5B3A8F" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5B3A8F", textTransform: "uppercase" }}>👥 ลูกค้า</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: "#5B3A8F" }}>{topCustomers.length}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>คนซื้อในช่วงนี้</div>
        </div>
      </div>

      {/* Platform analysis */}
      <div className="thiny-card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>🛍️ Platform Analysis · ROI</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>เปรียบเทียบกำไรจากแต่ละ platform</div>
        </div>
        {platformAnalysis.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#999" }}>ยังไม่มีข้อมูล</div>
        ) : (
          <table className="thiny-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>ออเดอร์</th>
                <th>รายได้</th>
                <th>ต้นทุน</th>
                <th>กำไร</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {platformAnalysis.map((p, i) => (
                <tr key={i}>
                  <td>
                    {p.platform ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 24, height: 24, borderRadius: 6, background: p.platform.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11 }}>{p.platform.icon}</span>
                        <strong>{p.platform.name}</strong>
                      </span>
                    ) : <span style={{ color: "#999" }}>Unknown</span>}
                  </td>
                  <td><strong>{p.count}</strong></td>
                  <td>{fmtMoney(p.revenue, lang)}</td>
                  <td className="thiny-fg-2">{fmtMoney(p.cost, lang)}</td>
                  <td><strong style={{ color: p.profit >= 0 ? "#1F6F4A" : "#C53030" }}>{fmtMoney(p.profit, lang)}</strong></td>
                  <td>
                    <span style={{
                      padding: "2px 8px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                      background: p.margin >= 30 ? "#DDF0E3" : p.margin >= 15 ? "#FEF3D3" : "#FFE5E5",
                      color: p.margin >= 30 ? "#1F6F4A" : p.margin >= 15 ? "#C77100" : "#C53030"
                    }}>{p.margin.toFixed(1)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Top customers */}
        <div className="thiny-card" style={{ padding: 18 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>👑 Top ลูกค้า</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>10 อันดับลูกค้าที่ซื้อเยอะสุด</div>
          </div>
          {topCustomers.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#999" }}>ยังไม่มีข้อมูล</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {topCustomers.map((c, i) => {
                const max = topCustomers[0].spent;
                return (
                  <div key={i} style={{ padding: 8, background: i === 0 ? "linear-gradient(90deg, #FFE9D8 0%, white 70%)" : "#FAFAF7", borderRadius: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: i === 0 ? "#C77100" : i < 3 ? "#1F6F4A" : "#888",
                          color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 800, fontSize: 11
                        }}>{i + 1}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                          <div style={{ fontSize: 10, color: "#888" }}>{c.phone || "—"} · {c.count} ออเดอร์</div>
                        </div>
                      </div>
                      <strong style={{ fontSize: 14, color: "#0F4C81" }}>{fmtMoney(c.spent, lang)}</strong>
                    </div>
                    <div style={{ height: 4, background: "#F0EBE0", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${(c.spent / max) * 100}%`, height: "100%", background: "linear-gradient(90deg, #C77100, #E9B949)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="thiny-card" style={{ padding: 18 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>🏆 Top สินค้าขายดี</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>10 อันดับสินค้าที่ทำเงินสูงสุด</div>
          </div>
          {topProducts.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#999" }}>ยังไม่มีข้อมูล</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {topProducts.map((p, i) => {
                const max = topProducts[0].revenue;
                return (
                  <div key={i} style={{ padding: 8, background: i === 0 ? "linear-gradient(90deg, #DCE7F3 0%, white 70%)" : "#FAFAF7", borderRadius: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: i === 0 ? "#0F4C81" : i < 3 ? "#1F6F4A" : "#888",
                          color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 800, fontSize: 11
                        }}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: "#888" }}>×{p.qty} · กำไร ฿{p.profit.toLocaleString()}</div>
                        </div>
                      </div>
                      <strong style={{ fontSize: 14, color: "#1F6F4A" }}>{fmtMoney(p.revenue, lang)}</strong>
                    </div>
                    <div style={{ height: 4, background: "#F0EBE0", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${(p.revenue / max) * 100}%`, height: "100%", background: "linear-gradient(90deg, #0F4C81, #1F6F4A)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------- SETTINGS ----------------
const ScreenSettings = ({ t, lang }) => {
  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">{t.nav.settings}</h1>
          <p className="thiny-sub">ตั้งค่าระบบ · อัตโนมัติ · ผู้ใช้</p>
        </div>
      </div>

      <div className="thiny-card">
        <div className="thiny-card-title">Auto-rules</div>
        <div className="thiny-card-sub">การทำงานอัตโนมัติของระบบ</div>
        <div style={{height:12}}/>
        <div className="thiny-rule">
          <div className="thiny-rule-icon" style={{background:"var(--c-ok-bg)",color:"var(--c-ok)"}}><Icon name="check" size={14}/></div>
          <div className="thiny-rule-body"><div className="thiny-strong">หักสต๊อกอัตโนมัติ</div><div className="thiny-fg-3 thiny-xs">เมื่อมีออเดอร์ใหม่</div></div>
          <Toggle checked={true}/>
        </div>
        <div className="thiny-rule">
          <div className="thiny-rule-icon" style={{background:"var(--c-info-bg)",color:"var(--c-info)"}}><Icon name="movement" size={14}/></div>
          <div className="thiny-rule-body"><div className="thiny-strong">Auto-replenish locations</div><div className="thiny-fg-3 thiny-xs">โอนจาก WH-01 → store</div></div>
          <Toggle checked={true}/>
        </div>
        <div className="thiny-rule">
          <div className="thiny-rule-icon" style={{background:"var(--c-accent-soft)",color:"var(--c-accent)"}}><Icon name="bell" size={14}/></div>
          <div className="thiny-rule-body"><div className="thiny-strong">แจ้งเตือนผ่าน LINE</div><div className="thiny-fg-3 thiny-xs">สต๊อกต่ำ · ออเดอร์ใหม่</div></div>
          <Toggle checked={true}/>
        </div>
      </div>
    </div>
  );
};

// ---------------- FINANCE / รายรับ-รายจ่าย ----------------
const EXPENSE_CATEGORIES = [
  { id: "shipping", label: "ค่าจัดส่ง", icon: "🚚", color: "#0F4C81" },
  { id: "packaging", label: "ค่า packaging", icon: "📦", color: "#5B3A8F" },
  { id: "supplies", label: "ค่าวัสดุ", icon: "🛍️", color: "#1F6F4A" },
  { id: "marketing", label: "ค่าโฆษณา", icon: "📣", color: "#C77100" },
  { id: "fees", label: "ค่าธรรมเนียม platform", icon: "💳", color: "#B7531B" },
  { id: "transport", label: "ค่าเดินทาง", icon: "🚗", color: "#0F4C81" },
  { id: "utilities", label: "ค่าน้ำ-ค่าไฟ", icon: "⚡", color: "#888" },
  { id: "other", label: "อื่นๆ", icon: "📝", color: "#666" },
];

const ScreenFinance = ({ t, lang }) => {
  const { CHAT_ORDERS } = window.THINY_DATA;
  const [expenses, setExpenses] = useStateB([]);
  const [showAdd, setShowAdd] = useStateB(false);
  const [monthFilter, setMonthFilter] = useStateB(new Date().toISOString().slice(0, 7));

  const loadExpenses = () => {
    const API = window.API_BASE || 'http://localhost:5000/api';
    fetch(API + '/expenses' + (monthFilter ? '?month=' + monthFilter : ''))
      .then(r => r.ok ? r.json() : [])
      .then(setExpenses)
      .catch(() => setExpenses([]));
  };

  React.useEffect(() => { loadExpenses(); }, [monthFilter]);

  // === Calculate income from paid chat orders this month ===
  const monthOrders = CHAT_ORDERS.filter(o => o.created && o.created.startsWith(monthFilter));
  const paidOrders = monthOrders.filter(o => o.paymentStatus === "paid");
  const revenue = paidOrders.reduce((a, o) => a + (o.total || 0), 0);
  const serviceFees = paidOrders.reduce((a, o) => a + (o.serviceFee || 0), 0);
  const sourceCosts = paidOrders.reduce((a, o) => {
    const qty = o.customItem?.qty || (o.items || []).reduce((x, it) => x + it.qty, 0);
    return a + (o.sourceCost || 0) * qty;
  }, 0);
  const totalExpenses = expenses.reduce((a, e) => a + Number(e.amount || 0), 0);
  const grossProfit = revenue - sourceCosts;
  const netProfit = grossProfit - totalExpenses;

  // Expenses by category
  const byCategory = {};
  expenses.forEach(e => {
    if (!byCategory[e.category]) byCategory[e.category] = 0;
    byCategory[e.category] += Number(e.amount);
  });
  const maxCat = Math.max(1, ...Object.values(byCategory));

  // List of months available (last 6 months)
  const months = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }

  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">💰 การเงิน · รายรับ-รายจ่าย</h1>
          <p className="thiny-sub">สรุป P&L รายเดือน · กำไรขาดทุน · บันทึกรายจ่าย</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, background: "white" }}>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button onClick={() => setShowAdd(true)}
            style={{ padding: "10px 18px", background: "#0F4C81", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
            + เพิ่มรายจ่าย
          </button>
        </div>
      </div>

      {/* P&L Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 18, borderRadius: 12, background: "linear-gradient(135deg, #1F6F4A 0%, #2E8C5F 100%)", color: "white" }}>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, textTransform: "uppercase" }}>💵 รายรับ</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>฿{revenue.toLocaleString()}</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>{paidOrders.length} ออเดอร์ · ค่าบริการ ฿{serviceFees.toLocaleString()}</div>
        </div>
        <div style={{ padding: 18, borderRadius: 12, background: "white", borderLeft: "4px solid #C53030" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#C53030", textTransform: "uppercase" }}>📉 ต้นทุนรวม</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, color: "#C53030" }}>฿{(sourceCosts + totalExpenses).toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>ต้นทุนสินค้า ฿{sourceCosts.toLocaleString()} + ค่าใช้จ่าย ฿{totalExpenses.toLocaleString()}</div>
        </div>
        <div style={{ padding: 18, borderRadius: 12, background: "white", borderLeft: "4px solid #0F4C81" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0F4C81", textTransform: "uppercase" }}>📊 กำไรขั้นต้น</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, color: "#0F4C81" }}>฿{grossProfit.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>รายรับ - ต้นทุนสินค้า</div>
        </div>
        <div style={{ padding: 18, borderRadius: 12, background: netProfit >= 0 ? "linear-gradient(135deg, #5B3A8F 0%, #7B5BAF 100%)" : "linear-gradient(135deg, #C53030 0%, #E74C3C 100%)", color: "white" }}>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, textTransform: "uppercase" }}>💎 กำไรสุทธิ</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{netProfit >= 0 ? "฿" : "-฿"}{Math.abs(netProfit).toLocaleString()}</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>หลังหักทุกค่าใช้จ่าย</div>
        </div>
      </div>

      {/* Expenses by category + List */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
        <div className="thiny-card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📊 รายจ่ายตามหมวด</div>
          {Object.keys(byCategory).length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#999", fontSize: 13 }}>ยังไม่มีรายจ่าย</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {EXPENSE_CATEGORIES.map(c => {
                const amount = byCategory[c.id] || 0;
                if (amount === 0) return null;
                return (
                  <div key={c.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{c.icon} {c.label}</span>
                      <span style={{ fontWeight: 700, color: c.color }}>฿{amount.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 8, background: "#F5F2EA", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${(amount / maxCat) * 100}%`, height: "100%", background: c.color, borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="thiny-card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>📋 รายการรายจ่าย ({expenses.length})</div>
            <button onClick={() => {
              const csv = 'Date,Category,Amount,Description\n' + expenses.map(e => `${e.expense_date},${e.category},${e.amount},"${(e.description || '').replace(/"/g, '""')}"`).join('\n');
              const blob = new Blob([csv], {type: 'text/csv'});
              const a = document.createElement('a');
              a.href = window.URL.createObjectURL(blob);
              a.download = `expenses-${monthFilter}.csv`;
              a.click();
            }} style={{ background: "none", border: "1px solid #ddd", padding: "6px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>↓ Export CSV</button>
          </div>
          {expenses.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#999" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 14 }}>ยังไม่มีรายจ่ายในเดือนนี้</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>คลิก "+ เพิ่มรายจ่าย" เพื่อบันทึก</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
              {expenses.map(e => {
                const cat = EXPENSE_CATEGORIES.find(c => c.id === e.category) || EXPENSE_CATEGORIES[7];
                return (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, background: "#FAFAF7", borderRadius: 8, borderLeft: "3px solid " + cat.color }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: cat.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{cat.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{e.description || cat.label}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>{cat.label} · {e.expense_date}{e.note ? " · " + e.note : ""}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: cat.color }}>฿{Number(e.amount).toLocaleString()}</div>
                    <button onClick={() => {
                      if (!confirm("ลบรายจ่ายนี้?")) return;
                      const API = window.API_BASE || 'http://localhost:5000/api';
                      fetch(API + '/expenses/' + e.id, { method: 'DELETE' })
                        .then(() => loadExpenses());
                    }} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 16, padding: "2px 6px" }}>×</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadExpenses(); }} />}
    </div>
  );
};

const AddExpenseModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useStateB({
    category: "shipping",
    amount: "",
    description: "",
    note: "",
    expense_date: new Date().toISOString().slice(0, 10)
  });
  const [saving, setSaving] = useStateB(false);

  const handleSave = async () => {
    if (!form.amount || !form.expense_date) {
      alert("กรอกจำนวนเงินและวันที่");
      return;
    }
    setSaving(true);
    try {
      const API = window.API_BASE || 'http://localhost:5000/api';
      const res = await fetch(API + '/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) })
      });
      if (res.ok) {
        if (window.logAudit) window.logAudit("create_expense", "expense", "", `${form.category} · ฿${form.amount} · ${form.description || ""}`);
        onSaved();
      } else alert("เกิดข้อผิดพลาด");
    } catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "white", borderRadius: 14, padding: 24, width: "92%", maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>+ เพิ่มรายจ่าย</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, color: "#999", cursor: "pointer", padding: 0 }}>×</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>หมวด</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {EXPENSE_CATEGORIES.map(c => (
              <button key={c.id} type="button" onClick={() => setForm({ ...form, category: c.id })}
                style={{
                  padding: "10px 6px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  border: form.category === c.id ? "2px solid " + c.color : "1px solid #ddd",
                  background: form.category === c.id ? c.color + "15" : "white",
                  color: form.category === c.id ? c.color : "#333", textAlign: "center"
                }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{c.icon}</div>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>จำนวนเงิน *</label>
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
              placeholder="0.00" autoFocus />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>วันที่ *</label>
            <input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>รายละเอียด</label>
          <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
            placeholder="เช่น ค่าส่งพัสดุ Kerry 5 กล่อง" />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>หมายเหตุ</label>
          <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #ddd", borderRadius: 8, background: "white", cursor: "pointer", fontWeight: 600 }}>ยกเลิก</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "10px 20px", border: "none", borderRadius: 8, background: "#0F4C81", color: "white", cursor: saving ? "wait" : "pointer", fontWeight: 700 }}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------- DELIVERY CALENDAR ----------------
const ScreenCalendar = ({ t, lang, goto }) => {
  const { CHAT_ORDERS } = window.THINY_DATA;
  const today = new Date();
  const [viewMonth, setViewMonth] = useStateB({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDay, setSelectedDay] = useStateB(null);

  // Build day map: dateStr (YYYY-MM-DD) → array of events
  const dayMap = {};
  CHAT_ORDERS.forEach(o => {
    const date = (o.created || "").split(" ")[0];
    if (!date) return;
    if (!dayMap[date]) dayMap[date] = [];
    let eventType = "created";
    if (o.status === "shipped") eventType = "shipped";
    else if (o.status === "delivered") eventType = "delivered";
    else if (o.status === "arrived") eventType = "arrived";
    else if (o.status === "awaitingPayment") eventType = "payment-due";
    dayMap[date].push({ order: o, type: eventType });
  });

  const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  // Generate days for the current month grid
  const year = viewMonth.year;
  const month = viewMonth.month;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ day: d, dateStr, events: dayMap[dateStr] || [] });
  }
  while (days.length % 7 !== 0) days.push(null);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const prevMonth = () => {
    const m = month - 1;
    setViewMonth(m < 0 ? { year: year - 1, month: 11 } : { year, month: m });
  };
  const nextMonth = () => {
    const m = month + 1;
    setViewMonth(m > 11 ? { year: year + 1, month: 0 } : { year, month: m });
  };
  const goToday = () => setViewMonth({ year: today.getFullYear(), month: today.getMonth() });

  // Summary for current month
  const monthOrders = Object.entries(dayMap).filter(([date]) => date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).flatMap(([_, evs]) => evs);
  const monthSummary = {
    total: monthOrders.length,
    shipped: monthOrders.filter(e => e.type === "shipped").length,
    arrived: monthOrders.filter(e => e.type === "arrived").length,
    paymentDue: monthOrders.filter(e => e.type === "payment-due").length
  };

  const eventColor = {
    "created": "#888",
    "payment-due": "#C77100",
    "arrived": "#5B3A8F",
    "shipped": "#0F4C81",
    "delivered": "#1F6F4A"
  };
  const eventLabel = {
    "created": "ออเดอร์ใหม่",
    "payment-due": "รอชำระ",
    "arrived": "ของถึงร้าน",
    "shipped": "จัดส่งแล้ว",
    "delivered": "ส่งสำเร็จ"
  };

  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">📅 ปฏิทินจัดส่ง</h1>
          <p className="thiny-sub">มองเห็นออเดอร์ทุกวัน · รับ-ส่ง-ชำระ {monthNames[month]} {year + 543}</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={prevMonth} style={{ padding: "8px 14px", background: "white", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>‹</button>
          <button onClick={goToday} style={{ padding: "8px 16px", background: "#0F4C81", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>วันนี้</button>
          <button onClick={nextMonth} style={{ padding: "8px 14px", background: "white", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>›</button>
        </div>
      </div>

      {/* Monthly summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 14, background: "white", borderRadius: 10, borderLeft: "4px solid #888" }}>
          <div style={{ fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase" }}>📊 รวมเดือนนี้</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{monthSummary.total} events</div>
        </div>
        <div style={{ padding: 14, background: "white", borderRadius: 10, borderLeft: "4px solid #C77100" }}>
          <div style={{ fontSize: 11, color: "#C77100", fontWeight: 700, textTransform: "uppercase" }}>⏳ รอชำระ</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: "#C77100" }}>{monthSummary.paymentDue}</div>
        </div>
        <div style={{ padding: 14, background: "white", borderRadius: 10, borderLeft: "4px solid #5B3A8F" }}>
          <div style={{ fontSize: 11, color: "#5B3A8F", fontWeight: 700, textTransform: "uppercase" }}>📦 ของถึงร้าน</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: "#5B3A8F" }}>{monthSummary.arrived}</div>
        </div>
        <div style={{ padding: 14, background: "white", borderRadius: 10, borderLeft: "4px solid #0F4C81" }}>
          <div style={{ fontSize: 11, color: "#0F4C81", fontWeight: 700, textTransform: "uppercase" }}>🚚 จัดส่งแล้ว</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: "#0F4C81" }}>{monthSummary.shipped}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        {/* Calendar grid */}
        <div className="thiny-card" style={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
            {dayNames.map(d => (
              <div key={d} style={{ textAlign: "center", padding: 6, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {days.map((d, i) => {
              if (!d) return <div key={i} style={{ minHeight: 80 }} />;
              const isToday = d.dateStr === todayStr;
              const isSelected = selectedDay === d.dateStr;
              const eventCount = d.events.length;
              const uniqueTypes = [...new Set(d.events.map(e => e.type))];
              return (
                <button key={i} onClick={() => setSelectedDay(isSelected ? null : d.dateStr)}
                  style={{
                    minHeight: 80, padding: 6, borderRadius: 8, cursor: "pointer",
                    background: isSelected ? "#F5EFFD" : (isToday ? "#FFF8E1" : "white"),
                    border: isSelected ? "2px solid #5B3A8F" : (isToday ? "2px solid #C77100" : "1px solid #eee"),
                    textAlign: "left", display: "flex", flexDirection: "column", alignItems: "stretch",
                    fontFamily: "inherit"
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: isToday ? 800 : 600, color: isToday ? "#C77100" : "#333", fontSize: 13 }}>{d.day}</span>
                    {eventCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#5B3A8F", color: "white", padding: "1px 6px", borderRadius: 8 }}>{eventCount}</span>
                    )}
                  </div>
                  {eventCount > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {uniqueTypes.slice(0, 3).map(type => {
                        const c = d.events.filter(e => e.type === type).length;
                        return (
                          <div key={type} style={{
                            fontSize: 9, padding: "1px 5px", borderRadius: 4,
                            background: eventColor[type] + "20", color: eventColor[type], fontWeight: 700,
                            display: "flex", justifyContent: "space-between"
                          }}>
                            <span>{eventLabel[type].substring(0, 8)}</span>
                            <span>{c}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day events */}
        <div className="thiny-card" style={{ padding: 18 }}>
          {selectedDay ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>📅 {selectedDay}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{(dayMap[selectedDay] || []).length} events</div>
              </div>
              {(dayMap[selectedDay] || []).length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#999", fontSize: 13 }}>ไม่มี event</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(dayMap[selectedDay] || []).map((e, i) => {
                    const plat = window.THINY_DATA.CHANNELS.find(c => c.id === e.order.platform);
                    return (
                      <button key={i} onClick={() => goto && goto("chatOrders")}
                        style={{ textAlign: "left", padding: 10, background: "#FAFAF7", borderRadius: 8, borderLeft: "3px solid " + eventColor[e.type], cursor: "pointer", border: "none", fontFamily: "inherit", width: "100%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 8, background: eventColor[e.type] + "20", color: eventColor[e.type], textTransform: "uppercase" }}>
                            {eventLabel[e.type]}
                          </span>
                          {plat && <span style={{ fontSize: 10, color: "#888" }}>{plat.icon} {plat.name}</span>}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{e.order.customer?.name}</div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{e.order.id} · ฿{(e.order.total || 0).toLocaleString()}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: 32, textAlign: "center", color: "#999" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👈</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>คลิกวันเพื่อดูรายละเอียด</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>เลือกวันในปฏิทินจะแสดง events ของวันนั้น</div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="thiny-card" style={{ padding: 14, marginTop: 12, display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12 }}>
        <strong style={{ color: "#666" }}>คำอธิบาย:</strong>
        {Object.entries(eventLabel).map(([k, v]) => (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: eventColor[k] }} />
            {v}
          </span>
        ))}
      </div>
    </div>
  );
};

// ============ USER MANAGEMENT (Owner only) ============
const ScreenUsers = ({ t, lang, currentUser }) => {
  const [users, setUsers] = useStateB([]);
  const [showAdd, setShowAdd] = useStateB(false);
  const [editingUser, setEditingUser] = useStateB(null);

  const loadUsers = async () => {
    try {
      const res = await fetch(window.API_BASE + "/users");
      if (res.ok) setUsers(await res.json());
    } catch (e) {}
  };
  React.useEffect(() => { loadUsers(); }, []);

  const toggleActive = async (u) => {
    if (u.id === currentUser.id) {
      alert("ไม่สามารถ deactivate ตัวเองได้");
      return;
    }
    if (!confirm(`${u.active ? "ระงับ" : "เปิดใช้งาน"} ${u.name}?`)) return;
    await fetch(window.API_BASE + "/users/" + u.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active })
    });
    if (window.logAudit) window.logAudit(u.active ? "deactivate_user" : "activate_user", "user", u.id, u.username);
    loadUsers();
  };

  const deleteUser = async (u) => {
    if (u.id === currentUser.id) {
      alert("ไม่สามารถลบตัวเองได้");
      return;
    }
    if (!confirm(`ลบ user "${u.name}" ออกจากระบบถาวร?`)) return;
    await fetch(window.API_BASE + "/users/" + u.id, { method: "DELETE" });
    if (window.logAudit) window.logAudit("delete_user", "user", u.id, u.username);
    loadUsers();
  };

  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">👥 จัดการผู้ใช้</h1>
          <p className="thiny-sub">เพิ่ม/แก้ไข/ระงับ users ในระบบ · เฉพาะ Owner เท่านั้น</p>
        </div>
        <button className="thiny-btn thiny-btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={14}/> เพิ่ม User
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {Object.entries(window.ROLE_INFO).map(([roleId, info]) => {
          const count = users.filter(u => u.role === roleId && u.active).length;
          return (
            <div key={roleId} style={{ padding: 16, background: "white", borderRadius: 12, borderLeft: "4px solid " + info.color }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: info.color, textTransform: "uppercase" }}>{info.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: info.color }}>{count}</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>active users</div>
            </div>
          );
        })}
        <div style={{ padding: 16, background: "white", borderRadius: 12, borderLeft: "4px solid #999" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase" }}>🚫 ระงับ</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#999" }}>{users.filter(u => !u.active).length}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>inactive</div>
        </div>
      </div>

      <div className="thiny-card thiny-card-flush">
        <table className="thiny-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Email</th>
              <th>Last Login</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const roleInfo = window.ROLE_INFO[u.role] || { label: u.role, color: "#888" };
              return (
                <tr key={u.id} style={{ opacity: u.active ? 1 : 0.5 }}>
                  <td>
                    <div className="thiny-td-product">
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: roleInfo.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>{u.avatar || u.name?.[0]}</div>
                      <div>
                        <div className="thiny-strong">{u.name} {u.id === currentUser.id && <span style={{ fontSize: 10, color: "#1F6F4A", fontWeight: 700 }}>(คุณ)</span>}</div>
                        <div className="thiny-fg-3 thiny-xs">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 12, background: roleInfo.color + "20", color: roleInfo.color, fontSize: 12, fontWeight: 700 }}>
                      {roleInfo.label}
                    </span>
                  </td>
                  <td className="thiny-fg-2 thiny-xs">{u.email || "—"}</td>
                  <td className="thiny-fg-2 thiny-xs">{u.last_login ? new Date(u.last_login).toLocaleString("th-TH") : "ยังไม่เคย"}</td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 12, background: u.active ? "#DDF0E3" : "#FFE5E5", color: u.active ? "#1F6F4A" : "#C53030", fontSize: 11, fontWeight: 700 }}>
                      {u.active ? "✓ Active" : "🚫 Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => setEditingUser(u)} title="แก้ไข"
                        style={{ padding: "4px 8px", background: "white", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>✏️</button>
                      <button onClick={() => toggleActive(u)} title={u.active ? "ระงับ" : "เปิดใช้"}
                        style={{ padding: "4px 8px", background: "white", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>{u.active ? "🚫" : "✓"}</button>
                      <button onClick={() => deleteUser(u)} title="ลบ"
                        style={{ padding: "4px 8px", background: "white", border: "1px solid #FFB3B3", color: "#C53030", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAdd && <UserFormModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadUsers(); }} />}
      {editingUser && <UserFormModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={() => { setEditingUser(null); loadUsers(); }} />}
    </div>
  );
};

const UserFormModal = ({ user, onClose, onSaved }) => {
  const isEdit = !!user;
  const [form, setForm] = useStateB({
    username: user?.username || "",
    password: "",
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "staff",
    avatar: user?.avatar || ""
  });
  const [saving, setSaving] = useStateB(false);

  const handleSave = async () => {
    if (!form.username || !form.name) {
      alert("Username และ Name ต้องไม่ว่าง");
      return;
    }
    if (!isEdit && !form.password) {
      alert("กรุณาตั้ง password");
      return;
    }
    setSaving(true);
    try {
      const url = isEdit ? `${window.API_BASE}/users/${user.id}` : `${window.API_BASE}/users`;
      const method = isEdit ? "PUT" : "POST";
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        if (window.logAudit) window.logAudit(isEdit ? "edit_user" : "create_user", "user", form.username, form.name);
        onSaved();
      } else {
        const err = await res.json();
        alert("Error: " + (err.error || "Unknown"));
      }
    } catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "white", borderRadius: 14, padding: 24, width: "90%", maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{isEdit ? "✏️ แก้ไข User" : "➕ เพิ่ม User ใหม่"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, color: "#999", cursor: "pointer" }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Username *</label>
            <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={isEdit}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box", background: isEdit ? "#F5F2EA" : "white" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password {!isEdit && "*"}</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder={isEdit ? "ปล่อยว่างถ้าไม่เปลี่ยน" : "อย่างน้อย 6 ตัว"}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>ชื่อ-นามสกุล *</label>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Avatar (2 ตัวอักษร)</label>
            <input type="text" maxLength={2} value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value.toUpperCase() })}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box", fontWeight: 700, textAlign: "center" }} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Role</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {Object.entries(window.ROLE_INFO).map(([roleId, info]) => (
              <button key={roleId} type="button" onClick={() => setForm({ ...form, role: roleId })}
                style={{
                  padding: 14, border: form.role === roleId ? "2px solid " + info.color : "1px solid #ddd",
                  background: form.role === roleId ? info.color + "15" : "white",
                  borderRadius: 8, cursor: "pointer", textAlign: "center", fontFamily: "inherit"
                }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: form.role === roleId ? info.color : "#333" }}>{info.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #ddd", borderRadius: 8, background: "white", cursor: "pointer", fontWeight: 600 }}>ยกเลิก</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "10px 24px", border: "none", borderRadius: 8, background: "#0F4C81", color: "white", cursor: saving ? "wait" : "pointer", fontWeight: 700 }}>
            {saving ? "กำลังบันทึก..." : (isEdit ? "บันทึก" : "เพิ่ม")}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ AUDIT LOG VIEWER ============
const ACTION_LABELS = {
  login: { icon: "🚪", label: "เข้าสู่ระบบ", color: "#1F6F4A" },
  logout: { icon: "🚪", label: "ออกจากระบบ", color: "#888" },
  create_order: { icon: "➕", label: "สร้างออเดอร์", color: "#1F6F4A" },
  update_status: { icon: "🔄", label: "เปลี่ยนสถานะ", color: "#0F4C81" },
  mark_paid: { icon: "✓", label: "ทำเครื่องหมายชำระ", color: "#1F6F4A" },
  scan_in: { icon: "↓", label: "สแกนรับเข้า", color: "#5B3A8F" },
  scan_out: { icon: "↑", label: "สแกนตัดออก", color: "#0F4C81" },
  ship_order: { icon: "🚚", label: "จัดส่ง", color: "#0F4C81" },
  print_bill: { icon: "🖨️", label: "พิมพ์บิล", color: "#888" },
  send_notification: { icon: "📨", label: "แจ้งเตือนลูกค้า", color: "#C77100" },
  delete_order: { icon: "🗑️", label: "ลบออเดอร์", color: "#C53030" },
  bulk_action: { icon: "📋", label: "Bulk action", color: "#5B3A8F" },
  create_user: { icon: "👥", label: "สร้าง user", color: "#1F6F4A" },
  edit_user: { icon: "✏️", label: "แก้ไข user", color: "#0F4C81" },
  delete_user: { icon: "🗑️", label: "ลบ user", color: "#C53030" },
  activate_user: { icon: "✓", label: "เปิดใช้งาน user", color: "#1F6F4A" },
  deactivate_user: { icon: "🚫", label: "ระงับ user", color: "#C77100" },
  create_expense: { icon: "💰", label: "บันทึกรายจ่าย", color: "#C77100" },
  delete_expense: { icon: "🗑️", label: "ลบรายจ่าย", color: "#C53030" },
  assign_tracking: { icon: "📌", label: "ผูก tracking", color: "#5B3A8F" }
};

const ScreenAuditLog = ({ t, lang }) => {
  const [logs, setLogs] = useStateB([]);
  const [users, setUsers] = useStateB([]);
  const [filterUser, setFilterUser] = useStateB("");
  const [filterAction, setFilterAction] = useStateB("");

  const loadLogs = async () => {
    const params = new URLSearchParams();
    if (filterUser) params.set("user_id", filterUser);
    if (filterAction) params.set("action", filterAction);
    try {
      const res = await fetch(window.API_BASE + "/audit-log?" + params.toString());
      if (res.ok) setLogs(await res.json());
    } catch (e) {}
  };
  React.useEffect(() => { loadLogs(); }, [filterUser, filterAction]);
  React.useEffect(() => {
    fetch(window.API_BASE + "/users").then(r => r.json()).then(setUsers).catch(() => {});
  }, []);

  // Stats
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter(l => (l.created_at || "").startsWith(today));
  const uniqueUsersToday = new Set(todayLogs.map(l => l.username)).size;

  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">📋 Audit Log · ใครทำอะไรเมื่อไหร่</h1>
          <p className="thiny-sub">บันทึกทุก action ที่ users ทำในระบบ · ตรวจสอบย้อนหลังได้</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, background: "white" }}>
            <option value="">ทุก users</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, background: "white" }}>
            <option value="">ทุก actions</option>
            {Object.entries(ACTION_LABELS).map(([a, info]) => (
              <option key={a} value={a}>{info.icon} {info.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 16, background: "white", borderRadius: 12, borderLeft: "4px solid #0F4C81" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0F4C81", textTransform: "uppercase" }}>📊 Total logs</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{logs.length}</div>
        </div>
        <div style={{ padding: 16, background: "white", borderRadius: 12, borderLeft: "4px solid #1F6F4A" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1F6F4A", textTransform: "uppercase" }}>📅 วันนี้</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#1F6F4A" }}>{todayLogs.length}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>actions ตั้งแต่เที่ยงคืน</div>
        </div>
        <div style={{ padding: 16, background: "white", borderRadius: 12, borderLeft: "4px solid #5B3A8F" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5B3A8F", textTransform: "uppercase" }}>👥 active วันนี้</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#5B3A8F" }}>{uniqueUsersToday}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>users ที่ทำ action</div>
        </div>
      </div>

      <div className="thiny-card" style={{ padding: 0 }}>
        {logs.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#999" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 14 }}>ยังไม่มี log</div>
          </div>
        ) : (
          <div style={{ maxHeight: 600, overflowY: "auto" }}>
            {logs.map((log, i) => {
              const actionInfo = ACTION_LABELS[log.action] || { icon: "•", label: log.action, color: "#888" };
              const roleInfo = window.ROLE_INFO[log.user_role] || { color: "#888", label: log.user_role };
              const time = log.created_at ? new Date(log.created_at).toLocaleString("th-TH") : "—";
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 200px 1fr 180px", gap: 12, padding: "10px 16px", borderBottom: "1px solid #f0f0f0", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>{time}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: roleInfo.color, color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                      {log.username?.[0]?.toUpperCase() || "?"}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{log.username}</div>
                      <div style={{ fontSize: 10, color: roleInfo.color, fontWeight: 700 }}>{roleInfo.label}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 10, background: actionInfo.color + "15", color: actionInfo.color, fontSize: 11, fontWeight: 700 }}>
                      {actionInfo.icon} {actionInfo.label}
                    </span>
                    {log.target_id && (
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#666" }}>→ {log.target_id}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.details}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { ScreenStock, ScreenMovement, ScreenCustomers, ScreenScan, ScreenReports, ScreenSettings, ScreenFinance, ScreenCalendar, ScreenUsers, ScreenAuditLog });
