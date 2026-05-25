/* global React */
// Shared UI primitives, icons, and product image placeholders for THINY SHOP

// ---- Icons (stroke-based, minimal) ----
const Icon = ({ name, size = 18, className = "" }) => {
  const s = size;
  const sw = 1.6;
  const p = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round", className };
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    products: <><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></>,
    preorders: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4M16 3v4"/><path d="M8 14l2 2 4-4"/></>,
    stock: <><path d="M3 7v10l9 4 9-4V7"/><path d="M3 7l9 4 9-4"/><path d="M3 7l9-4 9 4"/><path d="M12 11v10"/></>,
    movement: <><path d="M4 7h12"/><path d="M13 4l3 3-3 3"/><path d="M20 17H8"/><path d="M11 14l-3 3 3 3"/></>,
    customers: <><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15 20a4.5 4.5 0 016.5-4"/></>,
    scan: <><path d="M4 7V5a1 1 0 011-1h2"/><path d="M20 7V5a1 1 0 00-1-1h-2"/><path d="M4 17v2a1 1 0 001 1h2"/><path d="M20 17v2a1 1 0 01-1 1h-2"/><path d="M7 9v6M10 9v6M13 9v6M16 9v6"/></>,
    reports: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 17v-5M12 17V8M16 17v-3"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.9-2.9l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.9-2.9l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.9 2.9l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    bell: <><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 004 0"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    chev: <><path d="m9 6 6 6-6 6"/></>,
    chevDown: <><path d="m6 9 6 6 6-6"/></>,
    up: <><path d="m6 15 6-6 6 6"/></>,
    down: <><path d="m6 9 6 6 6-6"/></>,
    arrowUp: <><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></>,
    arrowDown: <><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></>,
    arrowRight: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
    check: <><path d="M20 6 9 17l-5-5"/></>,
    x: <><path d="M18 6 6 18M6 6l12 12"/></>,
    star: <><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z"/></>,
    heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></>,
    cart: <><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/><path d="M3 3h2l2.7 12.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 8H6"/></>,
    home: <><path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    location: <><path d="M12 22s8-7.5 8-13a8 8 0 1 0-16 0c0 5.5 8 13 8 13z"/><circle cx="12" cy="9" r="2.5"/></>,
    download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
    refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="2.5"/></>,
    trash: <><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></>,
    box: <><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/></>,
    truck: <><rect x="1" y="6" width="14" height="11" rx="1"/><path d="M15 9h4l3 4v4h-7"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,
    moon: <><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    menu: <><path d="M3 6h18M3 12h18M3 18h18"/></>,
    filter: <><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>,
    barcode: <><path d="M3 5v14M6 5v14M8.5 5v14M11 5v14M13.5 5v14M16 5v14M18.5 5v14M21 5v14"/></>,
    flash: <><path d="m13 2-9 12h7l-1 8 9-12h-7z"/></>,
    sparkle: <><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/></>,
    chat: <><path d="M21 12a8 8 0 0 1-12 7l-5 1 1-5a8 8 0 1 1 16-3z"/></>,
    map: <><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></>,
  };
  return <svg {...p}>{paths[name] || null}</svg>;
};

// ---- Product image: real upload OR geometric placeholder fallback ----
const ProductImg = ({ id, size = "md", rounded = "rounded-lg" }) => {
  const sizes = { sm: 56, md: 96, lg: 160, xl: 240 };
  const dim = sizes[size] || 96;

  // ถ้า id เป็น URL จริง (data: base64 หรือ http) → render <img>
  if (typeof id === "string" && (id.startsWith("data:image") || id.startsWith("http"))) {
    return (
      <div className={`thiny-prodimg ${rounded}`} style={{ width: dim, height: dim, position: "relative", overflow: "hidden", flexShrink: 0, background: "#f7f7f5" }}>
        <img src={id} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }

  // Deterministic color from id
  const palettes = {
    "linen-tee":   ["#F2EBE0", "#C9B79C", "#7A6A55"],
    "twill-pants": ["#E8E1D6", "#3B4151", "#1E2230"],
    "vitc-serum":  ["#FFF4DC", "#F0B842", "#A87425"],
    "lip-balm":    ["#FDE4E0", "#E48A7C", "#7B3A36"],
    "candle":      ["#EFE6D8", "#9B7D5C", "#4A3826"],
    "mug":         ["#E5E5E2", "#3D3D3A", "#1A1A1A"],
    "coffee":      ["#E8DCC6", "#6B4220", "#2A1A0E"],
    "honey":       ["#FFEFCC", "#E1A20A", "#7A5604"],
    "earbuds":     ["#EEEEEE", "#1A1A1A", "#4A4A4A"],
    "cable":       ["#E6E6E6", "#2A2A2A", "#888"],
    "hat":         ["#F0E8DA", "#8E7553", "#3F3325"],
    "mask":        ["#EFE7F5", "#9B7BC4", "#3E2B5C"],
  };
  const palette = palettes[id] || ["#EEE", "#999", "#333"];
  // Different shape compositions per product type
  const shapeMap = {
    "linen-tee":   "tshirt",
    "twill-pants": "pants",
    "vitc-serum":  "bottle",
    "lip-balm":    "tube",
    "candle":      "candle",
    "mug":         "mug",
    "coffee":      "bag",
    "honey":       "jar",
    "earbuds":     "earbuds",
    "cable":       "cable",
    "hat":         "hat",
    "mask":        "pouch",
  };
  const shape = shapeMap[id] || "box";
  return (
    <div className={`thiny-prodimg ${rounded}`} style={{ width: dim, height: dim, background: palette[0], position: "relative", overflow: "hidden", flexShrink: 0 }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <ShapeGlyph shape={shape} c1={palette[1]} c2={palette[2]} />
      </svg>
    </div>
  );
};

const ShapeGlyph = ({ shape, c1, c2 }) => {
  switch (shape) {
    case "tshirt":
      return <>
        <path d="M25 28 L40 18 L50 24 L60 18 L75 28 L72 38 L65 36 L65 80 L35 80 L35 36 L28 38 Z" fill={c1}/>
        <path d="M40 18 L50 28 L60 18" stroke={c2} strokeWidth="1.5" fill="none"/>
      </>;
    case "pants":
      return <>
        <path d="M32 22 L68 22 L66 84 L54 84 L52 50 L48 50 L46 84 L34 84 Z" fill={c1}/>
        <path d="M32 30 L68 30" stroke={c2} strokeWidth="1.2" opacity="0.5"/>
      </>;
    case "bottle":
      return <>
        <rect x="42" y="14" width="16" height="8" fill={c2}/>
        <path d="M38 22 L62 22 L60 32 L60 84 L40 84 L40 32 Z" fill={c1}/>
        <rect x="44" y="48" width="12" height="22" fill={c2} opacity="0.25"/>
      </>;
    case "tube":
      return <>
        <rect x="40" y="14" width="20" height="6" fill={c2}/>
        <path d="M36 22 L64 22 L62 76 L60 84 L40 84 L38 76 Z" fill={c1}/>
      </>;
    case "candle":
      return <>
        <rect x="32" y="32" width="36" height="48" fill={c1}/>
        <ellipse cx="50" cy="32" rx="18" ry="3" fill={c2} opacity="0.35"/>
        <path d="M50 24 Q53 20 50 14 Q47 20 50 24Z" fill={c2}/>
      </>;
    case "mug":
      return <>
        <rect x="30" y="28" width="34" height="44" rx="3" fill={c1}/>
        <path d="M64 36 Q78 36 78 50 Q78 64 64 64" fill="none" stroke={c1} strokeWidth="5"/>
        <ellipse cx="47" cy="28" rx="17" ry="3" fill={c2} opacity="0.3"/>
      </>;
    case "bag":
      return <>
        <path d="M28 20 L72 20 L70 84 L30 84 Z" fill={c1}/>
        <rect x="38" y="44" width="24" height="14" fill={c2} opacity="0.5"/>
      </>;
    case "jar":
      return <>
        <rect x="36" y="16" width="28" height="8" fill={c2}/>
        <path d="M32 24 L68 24 L66 84 L34 84 Z" fill={c1}/>
        <rect x="38" y="44" width="24" height="14" fill={c2} opacity="0.5"/>
      </>;
    case "earbuds":
      return <>
        <circle cx="36" cy="50" r="14" fill={c1}/>
        <circle cx="64" cy="50" r="14" fill={c1}/>
        <rect x="34" y="58" width="4" height="20" rx="2" fill={c2}/>
        <rect x="62" y="58" width="4" height="20" rx="2" fill={c2}/>
      </>;
    case "cable":
      return <>
        <path d="M20 50 Q40 30 50 50 T80 50" stroke={c1} strokeWidth="6" fill="none" strokeLinecap="round"/>
        <rect x="16" y="42" width="10" height="16" rx="2" fill={c2}/>
        <rect x="74" y="42" width="10" height="16" rx="2" fill={c2}/>
      </>;
    case "hat":
      return <>
        <path d="M28 60 L72 60 L72 72 L28 72 Z" fill={c2}/>
        <path d="M34 30 L66 30 L70 60 L30 60 Z" fill={c1}/>
      </>;
    case "pouch":
      return <>
        <path d="M28 24 L72 24 L70 84 L30 84 Z" fill={c1}/>
        <rect x="38" y="38" width="24" height="3" fill={c2}/>
        <rect x="38" y="48" width="24" height="3" fill={c2}/>
        <rect x="38" y="58" width="14" height="3" fill={c2}/>
      </>;
    default:
      return <rect x="20" y="20" width="60" height="60" fill={c1}/>;
  }
};

// ---- Helpers ----
const fmtMoney = (n, lang = "th") => {
  const prefix = lang === "lo" ? "₭" : "฿";
  return prefix + Math.round(n).toLocaleString("en-US");
};

const fmtNum = (n) => Math.round(n).toLocaleString("en-US");

// ---- Channel pill ----
const ChannelPill = ({ id, size = "md" }) => {
  const ch = window.THINY_DATA.CHANNELS.find(c => c.id === id);
  if (!ch) return null;
  const dim = size === "sm" ? 18 : size === "lg" ? 28 : 22;
  return (
    <span title={ch.name} className="thiny-chpill" style={{ width: dim, height: dim, background: ch.color, color: "#fff", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: dim * 0.5, fontWeight: 700, fontFamily: "system-ui" }}>
      {ch.icon}
    </span>
  );
};

// ---- Status badge ----
const StatusBadge = ({ kind, label }) => {
  const styles = {
    active:    { bg: "var(--c-ok-bg)",   fg: "var(--c-ok)",    dot: "var(--c-ok)" },
    low:       { bg: "var(--c-warn-bg)", fg: "var(--c-warn)",  dot: "var(--c-warn)" },
    out:       { bg: "var(--c-err-bg)",  fg: "var(--c-err)",   dot: "var(--c-err)" },
    pending:   { bg: "var(--c-warn-bg)", fg: "var(--c-warn)",  dot: "var(--c-warn)" },
    packing:   { bg: "var(--c-info-bg)", fg: "var(--c-info)",  dot: "var(--c-info)" },
    shipped:   { bg: "var(--c-accent-soft)", fg: "var(--c-accent)",  dot: "var(--c-accent)" },
    delivered: { bg: "var(--c-ok-bg)",   fg: "var(--c-ok)",    dot: "var(--c-ok)" },
    cancelled: { bg: "var(--c-mute)",    fg: "var(--c-fg-2)",  dot: "var(--c-fg-3)" },
    in:        { bg: "var(--c-ok-bg)",   fg: "var(--c-ok)",    dot: "var(--c-ok)" },
    out_:      { bg: "var(--c-err-bg)",  fg: "var(--c-err)",   dot: "var(--c-err)" },
    transfer:  { bg: "var(--c-info-bg)", fg: "var(--c-info)",  dot: "var(--c-info)" },
    adjust:    { bg: "var(--c-warn-bg)", fg: "var(--c-warn)",  dot: "var(--c-warn)" },
  };
  const k = kind === "out" && label ? "out_" : kind;
  const s = styles[k] || styles.active;
  return (
    <span className="thiny-badge" style={{ background: s.bg, color: s.fg }}>
      <span className="thiny-badge-dot" style={{ background: s.dot }} />
      {label}
    </span>
  );
};

// ---- Sparkline ----
const Sparkline = ({ data, width = 200, height = 40, stroke = "currentColor", fill = "none" }) => {
  if (!data || !data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => [i * step, height - ((v - min) / range) * (height - 4) - 2]);
  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const fillPath = fill === "none" ? null : `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      {fillPath && <path d={fillPath} fill={fill} opacity="0.15"/>}
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// ---- Bar chart ----
const BarChart = ({ data, width = 480, height = 160, accent = "currentColor" }) => {
  const max = Math.max(...data.map(d => d.v));
  const barW = (width - 16) / data.length - 4;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = (d.v / max) * (height - 24);
        const x = 8 + i * (barW + 4);
        const y = height - h - 16;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx="3" fill={accent} opacity={d.hl ? 1 : 0.85}/>
            <text x={x + barW/2} y={height - 4} textAnchor="middle" fontSize="9" fill="var(--c-fg-3)" fontFamily="system-ui">{d.l}</text>
          </g>
        );
      })}
    </svg>
  );
};

// expose
Object.assign(window, { Icon, ProductImg, ChannelPill, StatusBadge, Sparkline, BarChart, fmtMoney, fmtNum });
