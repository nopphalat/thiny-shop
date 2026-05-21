/* global React */
// Authentication: LoginScreen + AuthProvider + UserMenu

const { useState: useStateAuth, useEffect: useEffectAuth } = React;

// ============ ROLE PERMISSIONS ============
const ROLE_INFO = {
  owner: {
    label: "👑 เจ้าของ",
    color: "#C77100",
    permissions: ["all"]
  },
  manager: {
    label: "💼 ผู้จัดการ",
    color: "#0F4C81",
    permissions: ["orders", "customers", "scan", "calendar", "finance", "reports", "products"]
  },
  staff: {
    label: "👷 พนักงาน",
    color: "#1F6F4A",
    permissions: ["orders", "customers", "scan", "calendar"]
  }
};

// Check if user can access a route
window.canAccess = function(user, route) {
  if (!user) return false;
  const role = ROLE_INFO[user.role];
  if (!role) return false;
  if (role.permissions.includes("all")) return true;
  // Route-permission mapping
  const map = {
    dashboard: ["orders", "all"],
    products: ["products", "all"],
    chatOrders: ["orders", "all"],
    customers: ["customers", "all"],
    scan: ["scan", "all"],
    calendar: ["calendar", "all"],
    finance: ["finance", "all"],
    reports: ["reports", "all"],
    settings: ["all"],
    users: ["all"],
    audit: ["all"]
  };
  const needed = map[route] || ["all"];
  return needed.some(p => role.permissions.includes(p));
};

// ============ LOGIN SCREEN ============
const LoginScreen = ({ onLoginSuccess }) => {
  const [username, setUsername] = useStateAuth("");
  const [password, setPassword] = useStateAuth("");
  const [loading, setLoading] = useStateAuth(false);
  const [error, setError] = useStateAuth("");
  const [showDemo, setShowDemo] = useStateAuth(true);

  const doLogin = async (u, p) => {
    if (!u || !p) {
      setError("กรุณากรอก username และ password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(window.API_BASE + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        setLoading(false);
        return;
      }
      window.setAuthSession(data.token, data.user);
      onLoginSuccess(data.user);
    } catch (err) {
      setError("ไม่สามารถเชื่อมต่อ server ได้: " + err.message);
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e?.preventDefault();
    doLogin(username, password);
  };

  const quickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
    doLogin(u, p);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #0F4C81 0%, #1565A8 50%, #5B3A8F 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      fontFamily: "'IBM Plex Sans Thai', 'Inter', system-ui, sans-serif"
    }}>
      <div style={{
        background: "white", borderRadius: 16, padding: 32, width: "100%", maxWidth: 420,
        boxShadow: "0 30px 80px rgba(0,0,0,0.3)"
      }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, background: "linear-gradient(135deg, #0F4C81, #5B3A8F)",
            color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, fontWeight: 800, fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic",
            boxShadow: "0 12px 30px rgba(15, 76, 129, 0.35)"
          }}>T</div>
          <h1 style={{ margin: "16px 0 4px", fontSize: 24, fontWeight: 700, color: "#222" }}>THINY SHOP</h1>
          <p style={{ margin: 0, color: "#888", fontSize: 13 }}>ระบบจัดการ Pre-order · เข้าสู่ระบบ</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#333" }}>👤 Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus
              placeholder="เช่น owner / manager / staff"
              style={{ width: "100%", padding: "12px 14px", border: "1px solid #ddd", borderRadius: 10, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#333" }}>🔒 Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", padding: "12px 14px", border: "1px solid #ddd", borderRadius: 10, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          {error && (
            <div style={{ padding: 10, background: "#FFE5E5", color: "#C53030", borderRadius: 8, fontSize: 13, marginBottom: 14, border: "1px solid #FFB3B3" }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{
              width: "100%", padding: "14px", border: "none", borderRadius: 10,
              background: loading ? "#999" : "linear-gradient(135deg, #0F4C81, #1565A8)",
              color: "white", fontWeight: 700, fontSize: 15, cursor: loading ? "wait" : "pointer",
              fontFamily: "inherit", boxShadow: "0 6px 20px rgba(15, 76, 129, 0.3)"
            }}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "🚪 เข้าสู่ระบบ"}
          </button>
        </form>

        {showDemo && (
          <div style={{ marginTop: 20, padding: 14, background: "#FAFAF7", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>🚀 Demo accounts · คลิกเพื่อล็อกอินทันที</span>
              <button onClick={() => setShowDemo(false)} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 14 }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button type="button" onClick={() => quickLogin("owner", "owner123")}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "white", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: "#C77100", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>SK</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>👑 owner · สิริกร</div>
                  <div style={{ fontSize: 10, color: "#888", fontFamily: "monospace" }}>password: owner123</div>
                </div>
              </button>
              <button type="button" onClick={() => quickLogin("manager", "manager123")}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "white", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: "#0F4C81", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>MR</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>💼 manager · มณีรัตน์</div>
                  <div style={{ fontSize: 10, color: "#888", fontFamily: "monospace" }}>password: manager123</div>
                </div>
              </button>
              <button type="button" onClick={() => quickLogin("staff", "staff123")}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "white", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: "#1F6F4A", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>NM</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>👷 staff · นัทธมน</div>
                  <div style={{ fontSize: 10, color: "#888", fontFamily: "monospace" }}>password: staff123</div>
                </div>
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 18, textAlign: "center", fontSize: 11, color: "#aaa" }}>
          THINY SHOP · Pre-order Management System
        </div>
      </div>
    </div>
  );
};

// ============ USER MENU (topbar) ============
const UserMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useStateAuth(false);
  if (!user) return null;
  const roleInfo = ROLE_INFO[user.role] || { label: user.role, color: "#888" };
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "white", border: "1px solid #ddd", borderRadius: 24, cursor: "pointer", fontFamily: "inherit" }}>
        <span style={{
          width: 28, height: 28, borderRadius: "50%", background: roleInfo.color,
          color: "white", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 11
        }}>{user.avatar || user.name?.[0]}</span>
        <div style={{ textAlign: "left", lineHeight: 1.2 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{user.name}</div>
          <div style={{ fontSize: 10, color: roleInfo.color, fontWeight: 700 }}>{roleInfo.label}</div>
        </div>
        <span style={{ fontSize: 10, color: "#999" }}>▼</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            background: "white", border: "1px solid #ddd", borderRadius: 10,
            boxShadow: "0 12px 30px rgba(0,0,0,0.15)", minWidth: 240, zIndex: 999,
            padding: 8
          }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{user.name}</div>
              <div style={{ fontSize: 11, color: "#888" }}>@{user.username} · {user.email}</div>
              <div style={{ fontSize: 11, color: roleInfo.color, fontWeight: 700, marginTop: 4 }}>{roleInfo.label}</div>
              {user.last_login && (
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>
                  Last login: {new Date(user.last_login).toLocaleString("th-TH")}
                </div>
              )}
            </div>
            <button onClick={() => { setOpen(false); alert("โปรไฟล์ของคุณ · ฟีเจอร์นี้กำลังพัฒนา"); }}
              style={{ display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: 13, fontFamily: "inherit", borderRadius: 6 }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#F5F2EA"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
              ⚙️ โปรไฟล์ของฉัน
            </button>
            <button onClick={onLogout}
              style={{ display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "#C53030", borderRadius: 6 }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#FFE5E5"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
              🚪 ออกจากระบบ
            </button>
          </div>
        </>
      )}
    </div>
  );
};

Object.assign(window, { LoginScreen, UserMenu, ROLE_INFO });
