/* global React, Icon, ProductImg, fmtMoney */
// Mobile shop — what customers see on their phones

const { useState: useStateS, useEffect: useEffectS } = React;

const ShopApp = ({ t, lang }) => {
  const [route, setRoute] = useStateS("home");
  const [pid, setPid] = useStateS(null);
  const [cart, setCart] = useStateS([]);
  const [signedIn, setSignedIn] = useStateS(true);

  const addToCart = (pid, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(c => c.pid === pid);
      if (existing) return prev.map(c => c.pid === pid ? { ...c, qty: c.qty + qty } : c);
      return [...prev, { pid, qty }];
    });
  };

  const cartCount = cart.reduce((a,b) => a + b.qty, 0);

  return (
    <div className="thiny-shop">
      <div className="thiny-shop-viewport">
        {route === "home"     && <ShopHome     t={t} lang={lang} onPick={(p)=>{setPid(p); setRoute("detail");}} onSearch={()=>setRoute("explore")}/>}
        {route === "explore"  && <ShopExplore  t={t} lang={lang} onPick={(p)=>{setPid(p); setRoute("detail");}}/>}
        {route === "detail"   && <ShopDetail   t={t} lang={lang} pid={pid} onBack={()=>setRoute("home")} onAdd={addToCart} onCart={()=>setRoute("cart")}/>}
        {route === "cart"     && <ShopCart     t={t} lang={lang} cart={cart} setCart={setCart} onBack={()=>setRoute("home")} onCheckout={()=>setRoute("checkout")}/>}
        {route === "checkout" && <ShopCheckout t={t} lang={lang} cart={cart} onBack={()=>setRoute("cart")} onDone={()=>{setCart([]); setRoute("orders");}}/>}
        {route === "orders"   && <ShopOrders   t={t} lang={lang}/>}
        {route === "profile"  && (signedIn ? <ShopProfile t={t} lang={lang} onSignOut={()=>setSignedIn(false)}/> : <ShopAuth t={t} lang={lang} onSignIn={()=>setSignedIn(true)}/>)}
      </div>

      {route !== "checkout" && route !== "detail" && (
        <nav className="thiny-shop-nav">
          <button className={route === "home" ? "active" : ""} onClick={()=>setRoute("home")}>
            <Icon name="home" size={20}/>
            <span>{t.shop.home}</span>
          </button>
          <button className={route === "explore" ? "active" : ""} onClick={()=>setRoute("explore")}>
            <Icon name="search" size={20}/>
            <span>{t.shop.explore}</span>
          </button>
          <button className={`thiny-shop-nav-cart ${route === "cart" ? "active" : ""}`} onClick={()=>setRoute("cart")}>
            <div className="thiny-shop-nav-cart-icon">
              <Icon name="cart" size={20}/>
              {cartCount > 0 && <span className="thiny-shop-nav-badge">{cartCount}</span>}
            </div>
            <span>{t.shop.cart}</span>
          </button>
          <button className={route === "orders" ? "active" : ""} onClick={()=>setRoute("orders")}>
            <Icon name="preorders" size={20}/>
            <span>{t.shop.orders}</span>
          </button>
          <button className={route === "profile" ? "active" : ""} onClick={()=>setRoute("profile")}>
            <Icon name="user" size={20}/>
            <span>{t.shop.profile}</span>
          </button>
        </nav>
      )}
    </div>
  );
};

// ---------- HOME ----------
const ShopHome = ({ t, lang, onPick, onSearch }) => {
  const { PRODUCTS, CATEGORIES } = window.THINY_DATA;
  return (
    <div className="thiny-shop-scroll">
      <header className="thiny-shop-header">
        <div>
          <div className="thiny-shop-hi">{t.shop.hello}, Praewa</div>
          <div className="thiny-shop-greet">{t.shop.greeting}</div>
        </div>
        <button className="thiny-shop-avatar">P</button>
      </header>

      <button className="thiny-shop-search" onClick={onSearch}>
        <Icon name="search" size={16}/>
        <span>{t.common.search}</span>
      </button>

      <div className="thiny-shop-hero">
        <div className="thiny-shop-hero-tag">{t.shop.bestseller}</div>
        <div className="thiny-shop-hero-title">{t.shop.free} ทุกออเดอร์</div>
        <div className="thiny-shop-hero-sub">เฉพาะวันนี้ — สมาชิกรับเพิ่ม 2× points</div>
        <div className="thiny-shop-hero-art">
          <div className="thiny-shop-hero-blob"></div>
          <div className="thiny-shop-hero-blob2"></div>
        </div>
      </div>

      <section className="thiny-shop-section">
        <div className="thiny-shop-section-head">
          <h3>{t.shop.categories}</h3>
        </div>
        <div className="thiny-shop-cats">
          {CATEGORIES.map((c, i) => {
            const sample = PRODUCTS.find(p => p.category === c.id);
            return (
              <button key={c.id} className="thiny-shop-cat">
                <div className="thiny-shop-cat-img">
                  <ProductImg id={sample?.image || "box"} size="md" rounded="rounded-lg"/>
                </div>
                <span>{c.name[lang]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="thiny-shop-section">
        <div className="thiny-shop-section-head">
          <h3>{t.shop.featured}</h3>
          <button className="thiny-link">{t.dash.viewAll}</button>
        </div>
        <div className="thiny-shop-grid">
          {PRODUCTS.slice(0,6).map(p => (
            <ProductCard key={p.id} p={p} t={t} lang={lang} onPick={onPick}/>
          ))}
        </div>
      </section>

      <section className="thiny-shop-section">
        <div className="thiny-shop-section-head">
          <h3>{t.shop.bestseller}</h3>
        </div>
        <div className="thiny-shop-hlist">
          {PRODUCTS.slice(6, 12).map(p => (
            <button key={p.id} className="thiny-shop-hcard" onClick={()=>onPick(p.id)}>
              <ProductImg id={p.image} size="md" rounded="rounded-lg"/>
              <div className="thiny-shop-hcard-name">{p.name[lang]}</div>
              <div className="thiny-shop-hcard-price">{fmtMoney(p.price, lang)}</div>
            </button>
          ))}
        </div>
      </section>

      <div style={{height: 24}}/>
    </div>
  );
};

const ProductCard = ({ p, t, lang, onPick }) => {
  const total = Object.values(p.stockByLoc).reduce((a,b)=>a+b,0);
  const low = total < p.reorder * 2;
  return (
    <button className="thiny-shop-card" onClick={()=>onPick(p.id)}>
      <div className="thiny-shop-card-img">
        <ProductImg id={p.image} size="lg" rounded="rounded-lg"/>
        <span className="thiny-shop-heart" role="button" tabIndex={-1} onClick={(e)=>{e.stopPropagation();}}><Icon name="heart" size={14}/></span>
        {low && <span className="thiny-shop-tag">{t.status.low}</span>}
      </div>
      <div className="thiny-shop-card-body">
        <div className="thiny-shop-card-name">{p.name[lang]}</div>
        <div className="thiny-shop-card-meta">
          <Icon name="star" size={10}/>
          <span>4.{Math.floor(Math.random()*9)+1}</span>
          <span className="thiny-fg-3">· {Math.floor(Math.random()*900)+100} sold</span>
        </div>
        <div className="thiny-shop-card-price">{fmtMoney(p.price, lang)}</div>
      </div>
    </button>
  );
};

// ---------- EXPLORE ----------
const ShopExplore = ({ t, lang, onPick }) => {
  const { PRODUCTS, CATEGORIES } = window.THINY_DATA;
  const [q, setQ] = useStateS("");
  const [cat, setCat] = useStateS("all");
  const filtered = PRODUCTS.filter(p =>
    (cat === "all" || p.category === cat) &&
    (q === "" || p.name[lang].toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="thiny-shop-scroll">
      <header className="thiny-shop-header thiny-shop-header-tight">
        <h2>{t.shop.explore}</h2>
      </header>
      <div className="thiny-shop-searchbar">
        <Icon name="search" size={16}/>
        <input placeholder={t.common.search} value={q} onChange={e=>setQ(e.target.value)}/>
        <Icon name="barcode" size={16} className="thiny-fg-3"/>
      </div>
      <div className="thiny-shop-cattabs">
        <button className={cat === "all" ? "active" : ""} onClick={()=>setCat("all")}>{t.common.all}</button>
        {CATEGORIES.map(c => (
          <button key={c.id} className={cat === c.id ? "active" : ""} onClick={()=>setCat(c.id)}>{c.name[lang]}</button>
        ))}
      </div>
      <div className="thiny-shop-grid" style={{padding: "0 16px"}}>
        {filtered.map(p => (
          <ProductCard key={p.id} p={p} t={t} lang={lang} onPick={onPick}/>
        ))}
      </div>
      <div style={{height: 24}}/>
    </div>
  );
};

// ---------- DETAIL ----------
const ShopDetail = ({ t, lang, pid, onBack, onAdd, onCart }) => {
  const p = window.THINY_DATA.PRODUCTS.find(x => x.id === pid);
  const [qty, setQty] = useStateS(1);
  const [added, setAdded] = useStateS(false);
  const total = Object.values(p.stockByLoc).reduce((a,b)=>a+b,0);
  const handleAdd = () => {
    onAdd(p.id, qty);
    setAdded(true);
    setTimeout(()=>setAdded(false), 1500);
  };
  return (
    <div className="thiny-shop-scroll thiny-shop-detail">
      <header className="thiny-shop-detail-bar">
        <button className="thiny-shop-circle" onClick={onBack}><Icon name="chev" size={16} className="thiny-rot180"/></button>
        <div style={{display:"flex",gap:8}}>
          <button className="thiny-shop-circle"><Icon name="heart" size={16}/></button>
          <button className="thiny-shop-circle" onClick={onCart}><Icon name="cart" size={16}/></button>
        </div>
      </header>

      <div className="thiny-shop-detail-hero">
        <ProductImg id={p.image} size="xl" rounded="rounded-xl"/>
      </div>

      <div className="thiny-shop-detail-body">
        <div className="thiny-shop-detail-cat">{window.THINY_DATA.CATEGORIES.find(c=>c.id===p.category).name[lang]}</div>
        <h2 className="thiny-shop-detail-name">{p.name[lang]}</h2>
        <div className="thiny-shop-detail-meta">
          <div className="thiny-shop-rating">
            <Icon name="star" size={12}/>
            <strong>4.8</strong>
            <span className="thiny-fg-3">({Math.floor(Math.random()*900)+200} {t.shop.reviews})</span>
          </div>
          <span className="thiny-shop-instock">● {t.shop.inStock} {total}</span>
        </div>
        <div className="thiny-shop-detail-price">{fmtMoney(p.price, lang)}</div>

        <div className="thiny-shop-detail-section">
          <div className="thiny-shop-detail-label">{t.shop.description}</div>
          <p className="thiny-shop-detail-desc">วัสดุคุณภาพดี ออกแบบเรียบง่าย ใช้งานได้ทุกวัน · เหมาะกับทุกโอกาส · มีรับประกัน 30 วัน · จัดส่งฟรีเมื่อสั่งครบ 500 บาท</p>
        </div>

        <div className="thiny-shop-detail-section">
          <div className="thiny-shop-detail-label">{t.common.qty}</div>
          <div className="thiny-shop-qty">
            <button onClick={()=>setQty(Math.max(1, qty-1))}>−</button>
            <span>{qty}</span>
            <button onClick={()=>setQty(qty+1)}>+</button>
          </div>
        </div>
      </div>

      <div className="thiny-shop-detail-bottom">
        <div className="thiny-shop-detail-bottom-price">
          <div className="thiny-fg-3 thiny-xs">{t.common.total}</div>
          <div className="thiny-shop-detail-total">{fmtMoney(p.price * qty, lang)}</div>
        </div>
        <button className={`thiny-shop-detail-add ${added ? "added" : ""}`} onClick={handleAdd}>
          {added ? <><Icon name="check" size={16}/>เพิ่มแล้ว</> : <><Icon name="cart" size={16}/>{t.shop.addToCart}</>}
        </button>
      </div>
    </div>
  );
};

// ---------- CART ----------
const ShopCart = ({ t, lang, cart, setCart, onBack, onCheckout }) => {
  const { PRODUCTS } = window.THINY_DATA;
  const items = cart.map(c => ({ ...PRODUCTS.find(p => p.id === c.pid), qty: c.qty }));
  const subtotal = items.reduce((a, b) => a + b.price * b.qty, 0);
  const shipping = subtotal > 500 || subtotal === 0 ? 0 : 40;
  const total = subtotal + shipping;
  const updateQty = (pid, delta) => {
    setCart(prev => prev.map(c => c.pid === pid ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0));
  };
  return (
    <div className="thiny-shop-scroll">
      <header className="thiny-shop-header thiny-shop-header-tight">
        <h2>{t.shop.cart}</h2>
      </header>

      {items.length === 0 ? (
        <div className="thiny-shop-empty">
          <Icon name="cart" size={48} className="thiny-fg-3"/>
          <h3>{t.shop.empty}</h3>
          <button className="thiny-shop-btn-primary" onClick={onBack}>{t.shop.explore}</button>
        </div>
      ) : (
        <>
          <div className="thiny-shop-cartlist">
            {items.map(it => (
              <div key={it.id} className="thiny-shop-cartrow">
                <ProductImg id={it.image} size="md" rounded="rounded-lg"/>
                <div className="thiny-shop-cartinfo">
                  <div className="thiny-shop-cartname">{it.name[lang]}</div>
                  <div className="thiny-fg-3 thiny-xs">{it.sku}</div>
                  <div className="thiny-shop-cartprice">{fmtMoney(it.price, lang)}</div>
                </div>
                <div className="thiny-shop-cartqty">
                  <button onClick={()=>updateQty(it.id, -1)}>−</button>
                  <span>{it.qty}</span>
                  <button onClick={()=>updateQty(it.id, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="thiny-shop-summary">
            <div className="thiny-shop-sumrow"><span className="thiny-fg-2">Subtotal</span><span>{fmtMoney(subtotal, lang)}</span></div>
            <div className="thiny-shop-sumrow"><span className="thiny-fg-2">{t.shop.free}</span><span>{shipping === 0 ? <span style={{color:"var(--c-ok)"}}>FREE</span> : fmtMoney(shipping, lang)}</span></div>
            <div className="thiny-shop-sumrow thiny-shop-sumrow-total"><span>{t.common.total}</span><span>{fmtMoney(total, lang)}</span></div>
          </div>
          <div className="thiny-shop-detail-bottom">
            <div className="thiny-shop-detail-bottom-price">
              <div className="thiny-fg-3 thiny-xs">{t.common.total}</div>
              <div className="thiny-shop-detail-total">{fmtMoney(total, lang)}</div>
            </div>
            <button className="thiny-shop-detail-add" onClick={onCheckout}>{t.shop.checkout}<Icon name="chev" size={14}/></button>
          </div>
        </>
      )}
    </div>
  );
};

// ---------- CHECKOUT ----------
const ShopCheckout = ({ t, lang, cart, onBack, onDone }) => {
  const { PRODUCTS } = window.THINY_DATA;
  const items = cart.map(c => ({ ...PRODUCTS.find(p => p.id === c.pid), qty: c.qty }));
  const subtotal = items.reduce((a, b) => a + b.price * b.qty, 0);
  const shipping = subtotal > 500 ? 0 : 40;
  const total = subtotal + shipping;
  const [pay, setPay] = useStateS("promptpay");
  return (
    <div className="thiny-shop-scroll">
      <header className="thiny-shop-detail-bar" style={{background:"var(--c-bg)",borderBottom:"1px solid var(--c-line)"}}>
        <button className="thiny-shop-circle" onClick={onBack}><Icon name="chev" size={16} className="thiny-rot180"/></button>
        <h3 style={{margin:0,fontSize:16}}>{t.shop.checkout}</h3>
        <div style={{width:36}}/>
      </header>
      <div className="thiny-shop-co-section">
        <div className="thiny-shop-co-label">{t.shop.address}</div>
        <div className="thiny-shop-co-card">
          <Icon name="location" size={16}/>
          <div>
            <div className="thiny-strong">บ้าน · Praewa T.</div>
            <div className="thiny-fg-3 thiny-xs">123/4 ซ.สุขุมวิท 21, แขวงคลองเตยเหนือ, กรุงเทพฯ 10110</div>
          </div>
          <Icon name="chev" size={14} className="thiny-fg-3"/>
        </div>
      </div>

      <div className="thiny-shop-co-section">
        <div className="thiny-shop-co-label">{t.shop.payment}</div>
        <div className="thiny-shop-paylist">
          {[
            { id: "promptpay", label: "PromptPay QR", sub: "0812345678" },
            { id: "card", label: "Credit / Debit", sub: "**** 4221" },
            { id: "cod", label: "Cash on Delivery", sub: "เก็บเงินปลายทาง" },
          ].map(o => (
            <button key={o.id} className={`thiny-shop-payrow ${pay === o.id ? "active" : ""}`} onClick={()=>setPay(o.id)}>
              <div className="thiny-shop-payradio">{pay === o.id && <div/>}</div>
              <div className="thiny-shop-payinfo">
                <div className="thiny-strong">{o.label}</div>
                <div className="thiny-fg-3 thiny-xs">{o.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="thiny-shop-co-section">
        <div className="thiny-shop-co-label">Order</div>
        {items.map(it => (
          <div key={it.id} className="thiny-shop-co-item">
            <ProductImg id={it.image} size="sm" rounded="rounded-md"/>
            <div style={{flex:1}}>
              <div className="thiny-strong" style={{fontSize:13}}>{it.name[lang]}</div>
              <div className="thiny-fg-3 thiny-xs">×{it.qty} · {fmtMoney(it.price, lang)}</div>
            </div>
            <div><strong>{fmtMoney(it.price * it.qty, lang)}</strong></div>
          </div>
        ))}
      </div>

      <div className="thiny-shop-summary">
        <div className="thiny-shop-sumrow"><span className="thiny-fg-2">Subtotal</span><span>{fmtMoney(subtotal, lang)}</span></div>
        <div className="thiny-shop-sumrow"><span className="thiny-fg-2">Shipping</span><span>{shipping === 0 ? <span style={{color:"var(--c-ok)"}}>FREE</span> : fmtMoney(shipping, lang)}</span></div>
        <div className="thiny-shop-sumrow thiny-shop-sumrow-total"><span>{t.common.total}</span><span>{fmtMoney(total, lang)}</span></div>
      </div>

      <div className="thiny-shop-detail-bottom">
        <div className="thiny-shop-detail-bottom-price">
          <div className="thiny-fg-3 thiny-xs">{t.common.total}</div>
          <div className="thiny-shop-detail-total">{fmtMoney(total, lang)}</div>
        </div>
        <button className="thiny-shop-detail-add" onClick={onDone}>Place order<Icon name="check" size={16}/></button>
      </div>
    </div>
  );
};

// ---------- ORDERS ----------
const ShopOrders = ({ t, lang }) => {
  const orders = [
    { id: "TS-92841", status: "shipped", date: "2026-05-18", total: 1880, items: [{ pid: "P003", qty: 1 }, { pid: "P004", qty: 2 }] },
    { id: "TS-92822", status: "delivered", date: "2026-05-14", total: 690, items: [{ pid: "P005", qty: 1 }] },
    { id: "TS-92788", status: "delivered", date: "2026-05-08", total: 1490, items: [{ pid: "P009", qty: 1 }] },
    { id: "TS-92745", status: "delivered", date: "2026-04-30", total: 940, items: [{ pid: "P011", qty: 2 }, { pid: "P010", qty: 1 }] },
  ];
  const { PRODUCTS } = window.THINY_DATA;
  return (
    <div className="thiny-shop-scroll">
      <header className="thiny-shop-header thiny-shop-header-tight">
        <h2>{t.shop.myOrders}</h2>
      </header>

      <div className="thiny-shop-orderlist">
        {orders.map(o => (
          <div key={o.id} className="thiny-shop-order">
            <div className="thiny-shop-order-head">
              <div>
                <div className="thiny-mono thiny-xs thiny-fg-3">{o.id}</div>
                <div className="thiny-strong">{o.date}</div>
              </div>
              <span className={`thiny-shop-orderstatus thiny-shop-orderstatus-${o.status}`}>● {t.status[o.status]}</span>
            </div>
            <div className="thiny-shop-order-items">
              {o.items.map((it, i) => {
                const p = PRODUCTS.find(x => x.id === it.pid);
                return (
                  <div key={i} className="thiny-shop-order-item">
                    <ProductImg id={p.image} size="sm" rounded="rounded-md"/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13}}>{p.name[lang]}</div>
                      <div className="thiny-fg-3 thiny-xs">×{it.qty}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="thiny-shop-order-foot">
              <span className="thiny-fg-3 thiny-xs">{o.items.length} ชิ้น</span>
              <strong>{fmtMoney(o.total, lang)}</strong>
            </div>
          </div>
        ))}
      </div>
      <div style={{height: 24}}/>
    </div>
  );
};

// ---------- PROFILE ----------
const ShopProfile = ({ t, lang, onSignOut }) => {
  const items = [
    { icon: "user",      label: t.shop.profile,  sub: "Praewa T." },
    { icon: "location",  label: t.shop.address,  sub: "1 saved" },
    { icon: "cart",      label: t.shop.payment,  sub: "PromptPay · Card" },
    { icon: "star",      label: t.shop.points,   sub: "5,231 pts" },
    { icon: "bell",      label: "Notifications", sub: "Stock alerts · promos" },
    { icon: "chat",      label: t.shop.help,     sub: "FAQ · contact" },
  ];
  return (
    <div className="thiny-shop-scroll">
      <header className="thiny-shop-profile-hero">
        <div className="thiny-shop-profile-pic">P</div>
        <div className="thiny-shop-profile-name">Praewa T.</div>
        <div className="thiny-shop-profile-tier"><span>♛ PLATINUM</span> · {t.shop.member} since 2023</div>
        <div className="thiny-shop-profile-stats">
          <div><div className="thiny-shop-profile-num">47</div><div className="thiny-fg-3 thiny-xs">{t.customers.orders}</div></div>
          <div><div className="thiny-shop-profile-num">5,231</div><div className="thiny-fg-3 thiny-xs">{t.shop.points}</div></div>
          <div><div className="thiny-shop-profile-num">12</div><div className="thiny-fg-3 thiny-xs">Saved</div></div>
        </div>
      </header>

      <div className="thiny-shop-profile-list">
        {items.map((it, i) => (
          <button key={i} className="thiny-shop-profile-item">
            <Icon name={it.icon} size={18}/>
            <div className="thiny-shop-profile-item-body">
              <div className="thiny-strong">{it.label}</div>
              <div className="thiny-fg-3 thiny-xs">{it.sub}</div>
            </div>
            <Icon name="chev" size={14} className="thiny-fg-3"/>
          </button>
        ))}
      </div>

      <button className="thiny-shop-signout" onClick={onSignOut}>{t.shop.logout}</button>
      <div style={{height: 24}}/>
    </div>
  );
};

// ---------- AUTH (signup/signin) ----------
const ShopAuth = ({ t, lang, onSignIn }) => {
  const [mode, setMode] = useStateS("signin");
  return (
    <div className="thiny-shop-scroll thiny-shop-auth">
      <div className="thiny-shop-auth-hero">
        <div className="thiny-shop-auth-logo">T</div>
        <h2>{t.appName}</h2>
        <p className="thiny-fg-3">{mode === "signin" ? t.shop.signin : t.shop.signup}</p>
      </div>

      <div className="thiny-shop-auth-seg">
        <button className={mode === "signin" ? "active" : ""} onClick={()=>setMode("signin")}>{t.shop.signin}</button>
        <button className={mode === "signup" ? "active" : ""} onClick={()=>setMode("signup")}>{t.shop.signup}</button>
      </div>

      <div className="thiny-shop-auth-form">
        {mode === "signup" && (
          <div className="thiny-shop-input">
            <label>ชื่อ</label>
            <input placeholder="ชื่อของคุณ"/>
          </div>
        )}
        <div className="thiny-shop-input">
          <label>เบอร์โทร / Email</label>
          <input placeholder="08X-XXX-XXXX"/>
        </div>
        <div className="thiny-shop-input">
          <label>รหัสผ่าน</label>
          <input type="password" placeholder="••••••••"/>
        </div>
        {mode === "signup" && (
          <div className="thiny-shop-auth-check">
            <div className="thiny-shop-checkbox"><Icon name="check" size={12}/></div>
            <span className="thiny-fg-2 thiny-xs">รับโปรโมชั่นและคูปองพิเศษทาง LINE/Email</span>
          </div>
        )}
        <button className="thiny-shop-auth-cta" onClick={onSignIn}>{mode === "signin" ? t.shop.signin : t.shop.signup + " · รับ 100 pts"}</button>
        <div className="thiny-shop-auth-divider"><span>หรือ</span></div>
        <button className="thiny-shop-auth-social">เข้าสู่ระบบด้วย LINE</button>
        <button className="thiny-shop-auth-social">เข้าสู่ระบบด้วย Google</button>
      </div>
    </div>
  );
};

Object.assign(window, { ShopApp, ShopHome, ShopExplore, ShopDetail, ShopCart, ShopCheckout, ShopOrders, ShopProfile, ShopAuth });
