/* global React, Icon, ChannelPill, ProductImg, StatusBadge, Sparkline, MoveTag, Toggle, fmtMoney, fmtNum */
// More admin screens: Stock, Movement, Customers, Scan, Reports, Settings

const { useState: useStateB, useMemo: useMemoB, useEffect: useEffectB } = React;


// ---------------- STOCK / LOCATIONS ----------------
const ScreenStock = ({ t, lang }) => {
  const { LOCATIONS, PRODUCTS } = window.THINY_DATA;
  const [selLoc, setSelLoc] = useStateB(LOCATIONS[0].id);
  const productsAtLoc = PRODUCTS.map(p => ({ ...p, qtyHere: p.stockByLoc[selLoc] || 0 })).sort((a,b) => b.qtyHere - a.qtyHere);
  const locData = LOCATIONS.find(l => l.id === selLoc);
  const totalHere = productsAtLoc.reduce((a,b) => a + b.qtyHere, 0);
  const lowAtLoc = productsAtLoc.filter(p => p.qtyHere < Math.ceil(p.reorder / LOCATIONS.length)).length;

  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">{t.location.title}</h1>
          <p className="thiny-sub"><Icon name="sparkle" size={12}/> {t.location.autoSync} · ตัดสต๊อกตามคลังที่ใกล้ลูกค้าที่สุด</p>
        </div>
        <div className="thiny-top-actions">
          <button className="thiny-btn-ghost"><Icon name="movement" size={14}/>{t.common.transfer}</button>
          <button className="thiny-btn thiny-btn-primary"><Icon name="plus" size={14}/>Location</button>
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
              <button className="active">{t.common.all}</button>
              <button>{t.status.low}</button>
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
                    <td><button className="thiny-btn-ghost-sm">{t.common.transfer}</button></td>
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
          <button className="thiny-btn-ghost"><Icon name="filter" size={14}/>{t.common.filter}</button>
          <button className="thiny-btn-ghost"><Icon name="download" size={14}/>{t.common.export}</button>
          <button className="thiny-btn thiny-btn-primary"><Icon name="plus" size={14}/>{t.common.receive}</button>
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
const ScreenCustomers = ({ t, lang }) => {
  const { CUSTOMERS } = window.THINY_DATA;
  const tierColor = { platinum: "linear-gradient(135deg,#aaa,#ddd)", gold: "linear-gradient(135deg,#E9B949,#F2D86F)", silver: "linear-gradient(135deg,#C0C5CC,#E5E7EA)", bronze: "linear-gradient(135deg,#B97849,#D3996A)" };
  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">{t.customers.title}</h1>
          <p className="thiny-sub">{CUSTOMERS.length} สมาชิก · {CUSTOMERS.filter(c=>c.tier==="platinum"||c.tier==="gold").length} VIP</p>
        </div>
        <button className="thiny-btn thiny-btn-primary"><Icon name="plus" size={14}/>{t.common.addNew}</button>
      </div>

      <div className="thiny-stat-row">
        <div className="thiny-stat thiny-stat-accent">
          <div className="thiny-stat-label">Total members</div>
          <div className="thiny-stat-value">2,841</div>
          <div className="thiny-stat-bottom"><span className="thiny-delta up"><Icon name="arrowUp" size={12}/>12.4%</span></div>
        </div>
        <div className="thiny-stat">
          <div className="thiny-stat-label">New (7d)</div>
          <div className="thiny-stat-value">186</div>
          <div className="thiny-stat-bottom"><span className="thiny-delta up"><Icon name="arrowUp" size={12}/>4.1%</span></div>
        </div>
        <div className="thiny-stat">
          <div className="thiny-stat-label">Active (30d)</div>
          <div className="thiny-stat-value">1,247</div>
          <div className="thiny-stat-bottom"><span className="thiny-delta up"><Icon name="arrowUp" size={12}/>2.8%</span></div>
        </div>
        <div className="thiny-stat">
          <div className="thiny-stat-label">Avg LTV</div>
          <div className="thiny-stat-value">{fmtMoney(8420, lang)}</div>
          <div className="thiny-stat-bottom"><span className="thiny-delta up"><Icon name="arrowUp" size={12}/>6.2%</span></div>
        </div>
      </div>

      <div className="thiny-card thiny-card-flush">
        <table className="thiny-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>{t.customers.tier}</th>
              <th>{t.customers.joined}</th>
              <th>{t.customers.orders}</th>
              <th>{t.customers.spent}</th>
              <th>{t.customers.points}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {CUSTOMERS.map(c => (
              <tr key={c.id} className="thiny-tr-click">
                <td>
                  <div className="thiny-td-product">
                    <div className="thiny-avatar-sm" style={{background: tierColor[c.tier]}}>{c.name[0]}</div>
                    <div>
                      <div className="thiny-strong">{c.name}</div>
                      <div className="thiny-fg-3 thiny-xs">{c.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="thiny-fg-2 thiny-xs">{c.email}</div>
                  <div className="thiny-fg-3 thiny-xs">{c.phone}</div>
                </td>
                <td><span className={`thiny-tier thiny-tier-${c.tier}`}>{c.tier}</span></td>
                <td className="thiny-fg-2 thiny-xs">{c.joined}</td>
                <td><strong>{c.orders}</strong></td>
                <td><strong>{fmtMoney(c.spent, lang)}</strong></td>
                <td className="thiny-fg-2">{fmtNum(c.points)}</td>
                <td><button className="thiny-icon-btn"><Icon name="chev" size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---------------- BARCODE SCAN ----------------
const ScreenScan = ({ t, lang }) => {
  const [mode, setMode] = useStateB("in"); // in / out
  const [scanned, setScanned] = useStateB([]);
  const [pulse, setPulse] = useStateB(false);
  const { PRODUCTS } = window.THINY_DATA;

  const doScan = (productId) => {
    setPulse(true);
    setTimeout(()=>setPulse(false), 600);
    const p = PRODUCTS.find(x => x.id === productId);
    setScanned([{ ...p, scanAt: new Date().toLocaleTimeString(), qty: 1 }, ...scanned].slice(0,8));
  };

  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">{t.scan.title}</h1>
          <p className="thiny-sub">{t.scan.sub} · เปิดบนมือถือเพื่อใช้กล้องจริง</p>
        </div>
      </div>

      <div className="thiny-scan-layout">
        <div className="thiny-card thiny-scan-mockphone">
          <div className="thiny-card-title">Mobile scanner preview</div>
          <div className="thiny-card-sub">ตัวอย่างหน้าจอบนมือถือ</div>
          <div className="thiny-scan-phone">
            <div className="thiny-scan-cam">
              <div className={`thiny-scan-frame ${pulse ? "pulse" : ""}`}>
                <div className="thiny-scan-corners"></div>
                <div className="thiny-scan-line"></div>
                {/* fake barcode */}
                <svg className="thiny-scan-barcode" viewBox="0 0 200 80" preserveAspectRatio="none">
                  {[3,2,4,1,3,5,2,3,1,4,2,3,5,1,4,2,3,1,4,3,2,5,1,3,2,4,1,3,5,2].map((w,i,a) => {
                    let x = 0;
                    for (let j = 0; j < i; j++) x += a[j] * 2 + 2;
                    return <rect key={i} x={x} y={20} width={w*2} height={40} fill="rgba(255,255,255,0.92)"/>;
                  })}
                </svg>
              </div>
              <div className="thiny-scan-hint">{t.scan.hint}</div>
            </div>
            <div className="thiny-scan-controls">
              <button className={`thiny-scan-mode ${mode === "in" ? "active" : ""}`} onClick={()=>setMode("in")}><Icon name="arrowDown" size={14}/>{t.scan.scanIn}</button>
              <button className={`thiny-scan-mode ${mode === "out" ? "active" : ""}`} onClick={()=>setMode("out")}><Icon name="arrowUp" size={14}/>{t.scan.scanOut}</button>
            </div>
          </div>
        </div>

        <div className="thiny-card">
          <div className="thiny-card-head">
            <div>
              <div className="thiny-card-title">Live scan feed</div>
              <div className="thiny-card-sub">{mode === "in" ? t.scan.scanIn : t.scan.scanOut} · {scanned.length} รายการ</div>
            </div>
            <button className="thiny-btn-ghost-sm" onClick={()=>setScanned([])}>Clear</button>
          </div>
          <div className="thiny-scan-demo">
            <div className="thiny-scan-demo-label">ลองกดเพื่อจำลองการสแกน:</div>
            <div className="thiny-scan-demo-buttons">
              {PRODUCTS.slice(0,5).map(p => (
                <button key={p.id} className="thiny-scan-demo-btn" onClick={()=>doScan(p.id)}>
                  <Icon name="barcode" size={12}/>
                  <span className="thiny-mono">{p.barcode.slice(-4)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="thiny-scan-feed">
            {scanned.length === 0 && (
              <div className="thiny-empty">
                <Icon name="barcode" size={32} className="thiny-fg-3"/>
                <div className="thiny-fg-3 thiny-xs">ยังไม่มีรายการสแกน</div>
              </div>
            )}
            {scanned.map((s, i) => (
              <div key={i} className="thiny-scan-feed-row" style={{ animation: i === 0 ? "thiny-slidein 0.3s ease-out" : "" }}>
                <div className={`thiny-scan-feed-icon ${mode}`}>
                  <Icon name={mode === "in" ? "arrowDown" : "arrowUp"} size={12}/>
                </div>
                <ProductImg id={s.image} size="sm" rounded="rounded-md"/>
                <div className="thiny-scan-feed-info">
                  <div className="thiny-strong">{s.name[lang]}</div>
                  <div className="thiny-fg-3 thiny-xs thiny-mono">{s.barcode} · {s.scanAt}</div>
                </div>
                <div className="thiny-scan-feed-qty">×{s.qty}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------- REPORTS ----------------
const ScreenReports = ({ t, lang }) => {
  const { PRODUCTS, SALES_TREND } = window.THINY_DATA;
  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">{t.nav.reports}</h1>
          <p className="thiny-sub">รายงานยอดขาย·สต๊อก·ผลกำไร</p>
        </div>
        <div className="thiny-top-actions">
          <div className="thiny-seg">
            <button>{t.common.today}</button>
            <button className="active">{t.common.week}</button>
            <button>{t.common.month}</button>
          </div>
          <button className="thiny-btn-ghost"><Icon name="download" size={14}/>PDF</button>
        </div>
      </div>

      <div className="thiny-stat-row">
        <StatCard label="Gross revenue" value={fmtMoney(658200, lang)} delta={12.4} accent series={SALES_TREND.map(d=>d.sales)}/>
        <StatCard label="Net profit" value={fmtMoney(218400, lang)} delta={8.6} series={SALES_TREND.map(d=>d.orders)}/>
        <StatCard label="Items sold" value="2,184" delta={4.2}/>
        <StatCard label="Avg margin" value="33.2%" delta={2.1}/>
      </div>

      <div className="thiny-card">
        <div className="thiny-card-head">
          <div className="thiny-card-title">Top SKUs · 7 days</div>
          <button className="thiny-link">{t.dash.viewAll}</button>
        </div>
        <div className="thiny-topsku-list">
          {PRODUCTS.slice(0,6).map((p, i) => {
            const sold = [142, 124, 98, 86, 72, 64][i];
            const rev = sold * p.price;
            return (
              <div key={p.id} className="thiny-topsku-row">
                <div className="thiny-topsku-rank">{i+1}</div>
                <ProductImg id={p.image} size="sm" rounded="rounded-md"/>
                <div className="thiny-topsku-info">
                  <div className="thiny-strong">{p.name[lang]}</div>
                  <div className="thiny-fg-3 thiny-xs">{p.sku}</div>
                </div>
                <div className="thiny-topsku-bar"><div style={{ width: `${(sold/142)*100}%` }}/></div>
                <div className="thiny-topsku-num"><strong>{sold}</strong><span className="thiny-fg-3 thiny-xs"> sold</span></div>
                <div className="thiny-topsku-rev">{fmtMoney(rev, lang)}</div>
              </div>
            );
          })}
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

Object.assign(window, { ScreenStock, ScreenMovement, ScreenCustomers, ScreenScan, ScreenReports, ScreenSettings });
