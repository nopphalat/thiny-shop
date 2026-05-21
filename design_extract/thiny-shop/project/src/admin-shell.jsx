/* global React, Icon, ChannelPill, ProductImg, StatusBadge, Sparkline, BarChart, fmtMoney, fmtNum */
// Admin desktop app — sidebar, topbar, and all admin screens

const { useState, useMemo } = React;

const NAV = [
{ id: "dashboard", icon: "dashboard" },
{ id: "products", icon: "products" },
{ id: "chatOrders", icon: "chat", badge: 2 },
{ id: "stock", icon: "stock" },
{ id: "movement", icon: "movement" },
{ id: "customers", icon: "customers" },
{ id: "scan", icon: "scan" },
{ id: "reports", icon: "reports" },
{ id: "settings", icon: "settings" }];


const AdminApp = ({ t, lang }) => {
  const [route, setRoute] = useState("dashboard");
  const [selectedProduct, setSelectedProduct] = useState(null);

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
          {NAV.map((n) =>
          <button key={n.id} className={`thiny-nav-item ${route === n.id ? "active" : ""}`} onClick={() => {setRoute(n.id);setSelectedProduct(null);}}>
              <Icon name={n.icon} size={18} />
              <span>{t.nav[n.id]}</span>
              {n.badge && <span className="thiny-nav-badge">{n.badge}</span>}
            </button>
          )}
        </nav>
        <div className="thiny-user">
          <div className="thiny-avatar">SK</div>
          <div className="thiny-user-info">
            <div className="thiny-user-name">Sirikorn K.</div>
            <div className="thiny-user-role">Owner</div>
          </div>
        </div>
      </aside>

      <main className="thiny-main">
        <header className="thiny-topbar">
          <div className="thiny-search">
            <Icon name="search" size={16} />
            <input placeholder={t.common.search} />
            <span className="thiny-kbd">⌘K</span>
          </div>
          <div className="thiny-top-actions">
            <button className="thiny-icon-btn" title="Sync">
              <Icon name="refresh" size={18} />
            </button>
            <button className="thiny-icon-btn thiny-bell" title="Alerts">
              <Icon name="bell" size={18} />
              <span className="thiny-dot"></span>
            </button>
            <button className="thiny-btn thiny-btn-primary">
              <Icon name="plus" size={14} />
              <span>{t.common.addNew}</span>
            </button>
          </div>
        </header>

        <div className="thiny-content">
          {route === "dashboard" && <ScreenDashboard t={t} lang={lang} goto={setRoute} />}
          {route === "products" && (selectedProduct ?
          <ScreenProductDetail t={t} lang={lang} pid={selectedProduct} onBack={() => setSelectedProduct(null)} /> :
          <ScreenProducts t={t} lang={lang} onPick={setSelectedProduct} />)}
          {route === "chatOrders" && <ScreenChatOrders t={t} lang={lang} />}
          {route === "stock" && <ScreenStock t={t} lang={lang} />}
          {route === "movement" && <ScreenMovement t={t} lang={lang} />}
          {route === "customers" && <ScreenCustomers t={t} lang={lang} />}
          {route === "scan" && <ScreenScan t={t} lang={lang} />}
          {route === "reports" && <ScreenReports t={t} lang={lang} />}
          {route === "settings" && <ScreenSettings t={t} lang={lang} />}
        </div>
      </main>
    </div>);

};

// ---------------- DASHBOARD ----------------
const ScreenDashboard = ({ t, lang, goto }) => {
  const { PRODUCTS, MOVEMENTS, SALES_TREND } = window.THINY_DATA;
  const lowStock = PRODUCTS.filter((p) => Object.values(p.stockByLoc).reduce((a, b) => a + b, 0) < p.reorder * 2);
  const trendSeries = SALES_TREND.map((d) => d.sales);
  const todaySales = SALES_TREND[SALES_TREND.length - 1].sales;
  const yestSales = SALES_TREND[SALES_TREND.length - 2].sales;
  const delta = (todaySales - yestSales) / yestSales * 100;
  const todayOrders = SALES_TREND[SALES_TREND.length - 1].orders;
  const avgOrder = todaySales / todayOrders;

  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">{t.dash.title}</h1>
          <p className="thiny-sub">{t.dash.sub} · <span style={{ color: "var(--c-ok)" }}>● Live</span></p>
        </div>
        <div className="thiny-seg">
          <button className="active">{t.common.today}</button>
          <button>{t.common.week}</button>
          <button>{t.common.month}</button>
          <button className="thiny-icon-btn"><Icon name="download" size={16} /></button>
        </div>
      </div>

      <div className="thiny-stat-row">
        <StatCard label={t.dash.todaySales} value={fmtMoney(todaySales, lang)} delta={delta} accent series={trendSeries} />
        <StatCard label={t.dash.orders} value={todayOrders} delta={8.4} series={SALES_TREND.map((d) => d.orders)} />
        <StatCard label={t.dash.avgOrder} value={fmtMoney(avgOrder, lang)} delta={-2.1} />
        <StatCard label={t.dash.lowStock} value={lowStock.length} delta={null} warn />
      </div>

      <div className="thiny-card">
        <div className="thiny-card-head">
          <div>
            <div className="thiny-card-title">{t.dash.salesTrend}</div>
            <div className="thiny-card-sub">{fmtMoney(SALES_TREND.reduce((a, b) => a + b.sales, 0), lang)} · {SALES_TREND.reduce((a, b) => a + b.orders, 0)} {t.dash.orders.toLowerCase()}</div>
          </div>
          <div className="thiny-seg thiny-seg-sm">
            <button className="active">{t.dash.todaySales}</button>
            <button>{t.dash.orders}</button>
          </div>
        </div>
        <BarChart data={SALES_TREND.map((d, i) => ({ l: d.d, v: d.sales, hl: i === SALES_TREND.length - 1 }))} height={200} accent="var(--c-accent)" />
      </div>

      <div className="thiny-row">
        <div className="thiny-card thiny-col-2">
          <div className="thiny-card-head">
            <div className="thiny-card-title">{t.dash.recentMovement}</div>
            <button className="thiny-link" onClick={() => goto("movement")}>{t.dash.viewAll}</button>
          </div>
          <table className="thiny-table thiny-table-soft">
            <thead>
              <tr><th>{t.movement.type}</th><th>{t.products.title.replace("ทั้งหมด", "").replace("All ", "")}</th><th>{t.common.qty}</th><th>{t.movement.from}</th><th>{t.movement.to}</th><th>{t.movement.ref}</th></tr>
            </thead>
            <tbody>
              {MOVEMENTS.slice(0, 6).map((m) => {
                const p = window.THINY_DATA.PRODUCTS.find((x) => x.id === m.product);
                const locName = (id) => window.THINY_DATA.LOCATIONS.find((l) => l.id === id)?.name[lang] || id;
                return (
                  <tr key={m.id}>
                    <td><MoveTag type={m.type} t={t} /></td>
                    <td className="thiny-td-product"><ProductImg id={p.image} size="sm" rounded="rounded-md" /><span>{p.name[lang]}</span></td>
                    <td><strong>{m.type === "out" || m.type === "adjust" && m.qty < 0 ? "−" : "+"}{Math.abs(m.qty)}</strong></td>
                    <td className="thiny-fg-2">{m.from === "supplier" ? "Supplier" : m.from === "—" ? "—" : locName(m.from)}</td>
                    <td className="thiny-fg-2">{m.to === "customer" ? "Customer" : m.to === "—" ? "—" : locName(m.to)}</td>
                    <td className="thiny-mono">{m.ref}</td>
                  </tr>);

              })}
            </tbody>
          </table>
        </div>

        <div className="thiny-card">
          <div className="thiny-card-head">
            <div className="thiny-card-title">{t.dash.alerts}</div>
            <span className="thiny-tag-count">{lowStock.length}</span>
          </div>
          <div className="thiny-alert-list">
            {lowStock.slice(0, 5).map((p) => {
              const total = Object.values(p.stockByLoc).reduce((a, b) => a + b, 0);
              return (
                <div key={p.id} className="thiny-alert-row">
                  <ProductImg id={p.image} size="sm" rounded="rounded-md" />
                  <div className="thiny-alert-info">
                    <div className="thiny-alert-name">{p.name[lang]}</div>
                    <div className="thiny-alert-meta">SKU {p.sku} · {t.products.onhand} <strong style={{ color: "var(--c-warn)" }}>{total}</strong> / {p.reorder * 2}</div>
                  </div>
                  <button className="thiny-btn-ghost-sm">{t.common.receive}</button>
                </div>);

            })}
          </div>
        </div>
      </div>

      <div className="thiny-card">
        <div className="thiny-card-head">
          <div>
            <div className="thiny-card-title">{t.dash.topProducts}</div>
            <div className="thiny-card-sub">10 อันดับขายดี · 7 วันย้อนหลัง</div>
          </div>
          <button className="thiny-link" onClick={() => goto("reports")}>{t.dash.viewAll}</button>
        </div>
        <div className="thiny-topsku-list">
          {PRODUCTS.slice(0, 10).map((p, i) => {
            const sold = [284, 242, 198, 176, 154, 132, 118, 104, 92, 78][i];
            const rev = sold * p.price;
            const max = 284;
            return (
              <div key={p.id} className="thiny-topsku-row">
                <div className="thiny-topsku-rank">{i + 1}</div>
                <ProductImg id={p.image} size="sm" rounded="rounded-md" />
                <div className="thiny-topsku-info">
                  <div className="thiny-strong">{p.name[lang]}</div>
                  <div className="thiny-fg-3 thiny-xs">{p.sku}</div>
                </div>
                <div className="thiny-topsku-bar"><div style={{ width: `${(sold / max) * 100}%` }} /></div>
                <div className="thiny-topsku-num"><strong>{sold}</strong><span className="thiny-fg-3 thiny-xs"> sold</span></div>
                <div className="thiny-topsku-rev">{fmtMoney(rev, lang)}</div>
              </div>);

          })}
        </div>
      </div>
    </div>);

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
const ScreenProducts = ({ t, lang, onPick }) => {
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
          <button className="thiny-btn-ghost"><Icon name="download" size={14} />{t.common.export}</button>
          <button className="thiny-btn thiny-btn-primary"><Icon name="plus" size={14} />{t.products.addProduct}</button>
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
                  <td><button className="thiny-icon-btn"><Icon name="chev" size={14} /></button></td>
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
                <button className="thiny-btn thiny-btn-primary"><Icon name="plus" size={14} />{t.common.receive}</button>
                <button className="thiny-btn-ghost"><Icon name="movement" size={14} />{t.common.transfer}</button>
                <button className="thiny-btn-ghost"><Icon name="settings" size={14} />{t.common.edit}</button>
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