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

const CHAT_STATUS_FLOW = ["new", "pending", "packing", "shipped", "delivered", "cancelled"];

const chatStatusBadge = (status, t) => {
  const map = {
    new:       { bg: "var(--c-warn-bg)",   fg: "var(--c-warn)",   label: t.chat.newStatus },
    pending:   { bg: "var(--c-info-bg)",   fg: "var(--c-info)",   label: t.status.pending },
    packing:   { bg: "var(--c-accent-soft)", fg: "var(--c-accent)", label: t.status.packing },
    shipped:   { bg: "var(--c-accent-soft)", fg: "var(--c-accent)", label: t.status.shipped },
    delivered: { bg: "var(--c-ok-bg)",     fg: "var(--c-ok)",     label: t.status.delivered },
    cancelled: { bg: "var(--c-mute)",      fg: "var(--c-fg-3)",   label: t.status.cancelled },
  };
  const s = map[status] || map.new;
  return (
    <span className="thiny-badge" style={{ background: s.bg, color: s.fg }}>
      <span className="thiny-badge-dot" style={{ background: s.fg }} />
      {s.label}
    </span>
  );
};

// =========================================================
// LIST + DETAIL screen (toggles via state)
// =========================================================
const ScreenChatOrders = ({ t, lang }) => {
  const [selectedId, setSelectedId] = useStateC(null);
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
  return <ChatOrderList t={t} lang={lang} onPick={setSelectedId} />;
};

const ChatOrderList = ({ t, lang, onPick }) => {
  const { CHAT_ORDERS, CHATS, PRODUCTS } = window.THINY_DATA;
  const [channel, setChannel] = useStateC("all");
  const [status, setStatus] = useStateC("all");
  const filtered = CHAT_ORDERS.filter(
    (o) =>
      (channel === "all" || o.channel === channel) &&
      (status === "all" || o.status === status)
  );
  const counts = {};
  CHAT_STATUS_FLOW.forEach((s) => {
    counts[s] = CHAT_ORDERS.filter((o) => o.status === s).length;
  });

  return (
    <div className="thiny-screen">
      <div className="thiny-screen-head">
        <div>
          <h1 className="thiny-h1">{t.chat.title}</h1>
          <p className="thiny-sub">{t.chat.sub} · เก็บทุก ออเดอร์ที่ลูกค้าทักมา</p>
        </div>
        <div className="thiny-top-actions">
          <button className="thiny-btn-ghost"><Icon name="download" size={14} />{t.common.export}</button>
          <button className="thiny-btn thiny-btn-primary"><Icon name="plus" size={14} />{t.chat.newOrder}</button>
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
            {s === "new" ? t.chat.newStatus : t.status[s]}
            <span className="thiny-tab-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      <div className="thiny-card thiny-card-flush">
        <table className="thiny-table">
          <thead>
            <tr>
              <th>Order</th>
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
              const firstItem = PRODUCTS.find((p) => p.id === o.items[0].pid);
              const totalQty = o.items.reduce((a, b) => a + b.qty, 0);
              return (
                <tr key={o.id} className="thiny-tr-click" onClick={() => onPick(o.id)}>
                  <td>
                    <div className="thiny-mono">{o.id}</div>
                    <div className="thiny-fg-3 thiny-xs">{o.created.split(" ")[1]}</div>
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
                    <ProductImg id={firstItem.image} size="sm" rounded="rounded-md" />
                    <div>
                      <div className="thiny-strong">{firstItem.name[lang]}</div>
                      <div className="thiny-fg-3 thiny-xs">
                        {o.items.length > 1 ? `+${o.items.length - 1} ${t.chat.itemCount} · ` : ""}
                        ×{totalQty}
                      </div>
                    </div>
                  </td>
                  <td>
                    {o.tracking ? (
                      <div>
                        <div className="thiny-mono thiny-xs">{o.tracking}</div>
                        <div className="thiny-fg-3 thiny-xs">{o.courier}</div>
                      </div>
                    ) : (
                      <span className="thiny-fg-3 thiny-xs">— {t.chat.noTracking}</span>
                    )}
                  </td>
                  <td><strong>{fmtMoney(o.total, lang)}</strong></td>
                  <td>{chatStatusBadge(o.status, t)}</td>
                  <td><button className="thiny-icon-btn"><Icon name="chev" size={14} /></button></td>
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
  const [copied, setCopied] = useStateC(false);
  const [scanMode, setScanMode] = useStateC(null); // "in" or "out"
  const [scanned, setScanned] = useStateC([]);

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
  };

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
                <div className="thiny-pd-cat" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ChatPill id={o.channel} size="sm" />
                  <span>{channel.name} · {o.id}</span>
                </div>
                <h2 className="thiny-h2">{o.customer.name}</h2>
                <div className="thiny-pd-codes">
                  <span className="thiny-chip">📞 {o.customer.phone}</span>
                  <span className="thiny-chip">{o.created}</span>
                  <span className="thiny-chip" style={{ background: "var(--c-surface)" }}>
                    {chatStatusBadge(o.status, t)}
                  </span>
                </div>
                <div className="thiny-pd-stats">
                  <div>
                    <div className="thiny-pd-stat-label">{t.chat.total}</div>
                    <div className="thiny-pd-stat-value">{fmtMoney(o.total, lang)}</div>
                  </div>
                  <div>
                    <div className="thiny-pd-stat-label">{t.chat.items}</div>
                    <div className="thiny-pd-stat-value">{o.items.reduce((a, b) => a + b.qty, 0)}</div>
                  </div>
                  <div>
                    <div className="thiny-pd-stat-label">{t.chat.courier}</div>
                    <div className="thiny-pd-stat-value" style={{ fontSize: 16 }}>{o.courier || "—"}</div>
                  </div>
                  <div>
                    <div className="thiny-pd-stat-label">{t.chat.tracking}</div>
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
                  {o.items.map((it) => {
                    const p = PRODUCTS.find((x) => x.id === it.pid);
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
              {o.items.map((it, idx) => {
                const p = PRODUCTS.find((x) => x.id === it.pid);
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
              })}
              <div className="thiny-chat-total">
                <span className="thiny-fg-2">{t.chat.total}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "var(--c-accent)" }}>{fmtMoney(o.total, lang)}</span>
              </div>
            </div>
          </div>

          {/* Status timeline */}
          <div className="thiny-pd-section">
            <h3 className="thiny-h3">Status</h3>
            <div className="thiny-chat-timeline">
              {CHAT_STATUS_FLOW.filter((s) => s !== "cancelled").map((s, i, arr) => {
                const currentIdx = arr.indexOf(o.status === "cancelled" ? "new" : o.status);
                const done = i <= currentIdx;
                const here = i === currentIdx;
                return (
                  <div key={s} className={`thiny-chat-step ${done ? "done" : ""} ${here ? "here" : ""}`}>
                    <div className="thiny-chat-step-dot">{done && <Icon name="check" size={10} />}</div>
                    <div className="thiny-chat-step-label">
                      {s === "new" ? t.chat.newStatus : t.status[s]}
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

          <div className="thiny-pd-divider" />

          <div className="thiny-card-title">Update status</div>
          <div className="thiny-card-sub">เปลี่ยนสถานะออเดอร์</div>
          <div style={{ height: 10 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button className="thiny-btn-ghost" style={{ justifyContent: "flex-start" }}>
              <Icon name="check" size={14} /> {t.chat.markPaid}
            </button>
            <button className="thiny-btn-ghost" style={{ justifyContent: "flex-start" }}>
              <Icon name="box" size={14} /> {t.chat.markPacked}
            </button>
            <button className="thiny-btn-ghost" style={{ justifyContent: "flex-start" }}>
              <Icon name="truck" size={14} /> {t.chat.markShipped}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenChatOrders, ChatOrderList, ChatOrderDetail, ChatPill });
