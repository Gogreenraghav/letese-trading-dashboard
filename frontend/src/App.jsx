import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:8001";

function App() {
  const [view, setView] = useState("admin");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "", firm_name: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const r = await axios.post(API + "/auth/login", { email: authForm.email, password: authForm.password });
      if (r.data.access_token) {
        localStorage.setItem("token", r.data.access_token);
        setToken(r.data.access_token);
        setView("user");
      }
    } catch (e) { alert("Login failed"); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const r = await axios.post(API + "/auth/register", { email: authForm.email, password: authForm.password, name: authForm.name, firm_name: authForm.firm_name });
      if (r.data.access_token) {
        localStorage.setItem("token", r.data.access_token);
        setToken(r.data.access_token);
        setView("user");
      }
    } catch (e) { alert("Registration failed"); }
  };

  return (
    <div className="app">
      {view === "admin" && <AdminDashboard />}
      {view === "user" && <UserDashboard token={token} />}
      {view === "login" && (
        <div className="login-page">
          <div className="login-box">
            <div className="login-brand">📊 LETESE Trading</div>
            <h2>{isRegistering ? "Create Account" : "Welcome Back"}</h2>
            <form onSubmit={isRegistering ? handleRegister : handleLogin}>
              {isRegistering && (
                <>
                  <input type="text" placeholder="Full Name" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} required />
                  <input type="text" placeholder="Firm Name" value={authForm.firm_name} onChange={e => setAuthForm({...authForm, firm_name: e.target.value})} />
                </>
              )}
              <input type="email" placeholder="Email" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} required />
              <input type="password" placeholder="Password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} required />
              <button type="submit">{isRegistering ? "Create Account" : "Login"}</button>
            </form>
            <p className="login-toggle">
              {isRegistering ? "Already have account?" : "Don't have account?"} <span onClick={() => setIsRegistering(!isRegistering)}>{isRegistering ? "Login" : "Register"}</span>
            </p>
            <button className="back-btn" onClick={() => setView("admin")}>← Back to Admin</button>
          </div>
        </div>
      )}
      {!token && view !== "user" && (
        <div className="view-switcher">
          <button onClick={() => setView("admin")}>🏛️ Admin</button>
          <button onClick={() => setView("login")}>📊 User Trading</button>
        </div>
      )}
    </div>
  );
}

function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [newPlan, setNewPlan] = useState({ name: "", monthly_price: "", yearly_price: "", max_cases: "", max_advocates: "", features: "" });
  const [newUser, setNewUser] = useState({ email: "", password: "", name: "", role: "advocate", max_cases: "", subscription_id: "" });
  const [adminToken] = useState(() => {
    let t = localStorage.getItem("adminToken");
    if (!t) { t = "admin-secret-token-letese-2026"; localStorage.setItem("adminToken", t); }
    return t;
  });
  const adminAuth = { headers: { Authorization: "Bearer " + adminToken } };

  useEffect(() => { loadAll(); }, []);
  const loadAll = async () => {
    try {
      const [u, s, a] = await Promise.all([
        axios.get(API + "/admin/users", adminAuth),
        axios.get(API + "/admin/subscriptions", adminAuth),
        axios.get(API + "/admin/activity", adminAuth),
      ]);
      setUsers(u.data.users || []);
      setPlans(u.data.plans || []);
      setSubscriptions(s.data.subscriptions || []);
      setActivity(a.data.activity || []);
    } catch (e) {}
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API + "/auth/register", newUser, adminAuth);
      setNewUser({ email: "", password: "", name: "", role: "advocate", max_cases: "", subscription_id: "" });
      loadAll();
    } catch (e) { alert("Error: " + (e.response?.data?.detail || e.message)); }
  };

  const createPlan = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API + "/admin/plans", {
        name: newPlan.name, monthly_price: parseInt(newPlan.monthly_price),
        yearly_price: parseInt(newPlan.yearly_price), max_cases: parseInt(newPlan.max_cases),
        max_advocates: parseInt(newPlan.max_advocates),
        features: newPlan.features.split(",").map(f => f.trim())
      }, adminAuth);
      setNewPlan({ name: "", monthly_price: "", yearly_price: "", max_cases: "", max_advocates: "", features: "" });
      loadAll();
    } catch (e) { alert("Error"); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";
  const activeSubs = users.filter(u => u.is_active).length;
  const totalRevenue = subscriptions.reduce((s, sub) => s + (parseFloat(sub.amount_paid) || 0), 0);

  return (
    <div className="dashboard">
      <div className="top-bar">
        <div className="brand">⚖️ LETESE Admin</div>
        <div className="tabs">
          {["overview", "users", "plans", "subscriptions", "activity"].map(t => (
            <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
              {(t === "overview" ? "📊" : t === "users" ? "👥" : t === "plans" ? "📦" : t === "subscriptions" ? "💳" : "📜")} {" " + t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn-outline" onClick={() => { localStorage.clear(); window.location.reload(); }}>Logout</button>
      </div>
      <div className="content">
        {tab === "overview" && (
          <div>
            <div className="stats">
              <div className="stat"><div className="num">{users.length}</div><div className="label">Total Users</div></div>
              <div className="stat"><div className="num" style={{color:"#00C853"}}>{activeSubs}</div><div className="label">Active</div></div>
              <div className="stat"><div className="num" style={{color:"#3b82f6"}}>₹{totalRevenue.toFixed(0)}</div><div className="label">Revenue</div></div>
              <div className="stat"><div className="num">{plans.length}</div><div className="label">Plans</div></div>
            </div>
            <div className="recent-activity"><h3>📜 Recent Activity</h3>
              <table>
                <thead><tr><th>User</th><th>Action</th><th>Time</th></tr></thead>
                <tbody>
                  {activity.slice(0, 15).map((a, i) => <tr key={i}><td>{a.user_email || "System"}</td><td>{a.action}</td><td>{formatDate(a.timestamp)}</td></tr>)}
                  {activity.length === 0 && <tr><td colSpan={3} className="muted">No activity yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "users" && (
          <div>
            <div className="user-form-wrap"><h3>➕ Add New User</h3>
              <form className="user-form" onSubmit={createUser}>
                <input type="text" placeholder="Email *" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                <input type="password" placeholder="Password *" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                <input type="text" placeholder="Full Name *" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="advocate">Advocate</option><option value="admin">Admin</option><option value="clerk">Clerk</option><option value="paralegal">Paralegal</option><option value="intern">Intern</option>
                </select>
                <input type="number" placeholder="Max Cases" value={newUser.max_cases} onChange={e => setNewUser({...newUser, max_cases: e.target.value})} />
                <select value={newUser.subscription_id} onChange={e => setNewUser({...newUser, subscription_id: e.target.value})}>
                  <option value="">Select Plan</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.monthly_price}/mo)</option>)}
                </select>
                <button type="submit" className="btn-primary">Create User</button>
              </form>
            </div>
            <div className="table-wrap"><h3>👥 Users ({users.length})</h3>
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Plan</th><th>Cases</th><th>Status</th><th>Created</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.name || "—"}</strong></td>
                      <td><small>{u.email}</small></td>
                      <td><span className="role-badge">{u.role}</span></td>
                      <td>{u.plan_name || "—"}</td>
                      <td>{u.case_count || 0}/{u.max_cases || "∞"}</td>
                      <td><span className={"status-dot " + (u.is_active ? "green" : "gray")}></span>{u.is_active ? "Active" : "Inactive"}</td>
                      <td>{formatDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "plans" && (
          <div>
            <div className="user-form-wrap"><h3>📦 Create Plan</h3>
              <form className="user-form" onSubmit={createPlan}>
                <input type="text" placeholder="Plan Name *" required value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} />
                <input type="number" placeholder="Monthly Price (₹) *" required value={newPlan.monthly_price} onChange={e => setNewPlan({...newPlan, monthly_price: e.target.value})} />
                <input type="number" placeholder="Yearly Price (₹) *" required value={newPlan.yearly_price} onChange={e => setNewPlan({...newPlan, yearly_price: e.target.value})} />
                <input type="number" placeholder="Max Cases *" required value={newPlan.max_cases} onChange={e => setNewPlan({...newPlan, max_cases: e.target.value})} />
                <input type="number" placeholder="Max Advocates *" required value={newPlan.max_advocates} onChange={e => setNewPlan({...newPlan, max_advocates: e.target.value})} />
                <input type="text" placeholder="Features (comma separated)" value={newPlan.features} onChange={e => setNewPlan({...newPlan, features: e.target.value})} />
                <button type="submit" className="btn-primary">Create Plan</button>
              </form>
            </div>
            <div className="plans-grid">
              {plans.map(p => (
                <div key={p.id} className="plan-card">
                  <div className="plan-name">{p.name}</div>
                  <div className="plan-price">₹{p.monthly_price}<small>/mo</small></div>
                  <div className="plan-yearly">₹{p.yearly_price}<small>/yr</small></div>
                  <div className="plan-features">{p.features?.map((f, i) => <div key={i}>✓ {f}</div>)}</div>
                  <div className="plan-limits">Cases: {p.max_cases} | Advocates: {p.max_advocates}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "subscriptions" && (
          <div className="table-wrap"><h3>💳 Subscriptions ({subscriptions.length})</h3>
            <table>
              <thead><tr><th>User</th><th>Plan</th><th>Status</th><th>Amount</th><th>Razorpay ID</th><th>Started</th><th>Ends</th></tr></thead>
              <tbody>
                {subscriptions.map(s => (
                  <tr key={s.id}>
                    <td>{s.user_email || s.user_id}</td><td>{s.plan_name || "—"}</td>
                    <td><span className={"sub-badge " + (s.status === "active" ? "active" : "")}>{s.status}</span></td>
                    <td>₹{parseFloat(s.amount_paid || 0).toFixed(2)}</td>
                    <td><small>{s.razorpay_subscription_id || "—"}</small></td>
                    <td>{formatDate(s.started_at)}</td><td>{formatDate(s.ends_at)}</td>
                  </tr>
                ))}
                {subscriptions.length === 0 && <tr><td colSpan={7} className="muted">No subscriptions yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {tab === "activity" && (
          <div className="table-wrap"><h3>📜 Activity Log</h3>
            <table>
              <thead><tr><th>#</th><th>User</th><th>Action</th><th>Details</th><th>IP</th><th>Time</th></tr></thead>
              <tbody>
                {activity.map((a, i) => <tr key={i}><td>{i+1}</td><td><small>{a.user_email || "System"}</small></td><td>{a.action}</td><td><small>{a.details || "—"}</small></td><td><small>{a.ip_address || "—"}</small></td><td>{formatDate(a.timestamp)}</td></tr>)}
                {activity.length === 0 && <tr><td colSpan={6} className="muted">No activity</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function UserDashboard({ token }) {
  const [tab, setTab] = useState("portfolio");
  const [portfolio, setPortfolio] = useState(null);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [trades, setTrades] = useState([]);
  const [watchlist, setWatchlist] = useState(["RELIANCE", "TCS", "INFY", "NIFTY50", "SBIN", "HDFCBANK", "ADANIPORTS", "KOTAKBANK"]);
  const [quotes, setQuotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ symbol: "RELIANCE", exchange: "NSE", type: "BUY", qty: 1, price: "", product: "CNC", orderType: "LIMIT", variety: "NORMAL", triggerPrice: "" });
  const auth = { headers: { Authorization: "Bearer " + token } };

  useEffect(() => {
    if (token) { loadData(); const iv = setInterval(loadData, 15000); return () => clearInterval(iv); }
  }, [token]);

  const loadData = async () => {
    try {
      const [margins, pos, ords, holds, trds] = await Promise.allSettled([
        axios.get(API + "/instruments/margins", auth),
        axios.get(API + "/instruments/positions", auth),
        axios.get(API + "/instruments/orders", auth),
        axios.get(API + "/instruments/holdings", auth),
        axios.get(API + "/instruments/trades", auth),
      ]);
      if (margins.status === "fulfilled" && !margins.value.data?.error) setPortfolio(margins.value.data);
      if (pos.status === "fulfilled" && !pos.value.data?.error) setPositions(pos.value.data.net || []);
      if (ords.status === "fulfilled" && !ords.value.data?.error) setOrders(ords.value.data.orders || []);
      if (holds.status === "fulfilled" && !holds.value.data?.error) setHoldings(holds.value.data.holdings || []);
      if (trds.status === "fulfilled" && !trds.value.data?.error) setTrades(trds.value.data.trades || []);
      const base = { RELIANCE: 2800, TCS: 3850, INFY: 1480, NIFTY50: 22350, SBIN: 780, HDFCBANK: 1680, ADANIPORTS: 1250, KOTAKBANK: 1850 };
      const mq = {};
      watchlist.forEach(sym => { const b = base[sym] || 1500; const ch = (Math.random() - 0.5) * 30; mq[sym] = { last_price: b, change: ch, change_percent: ((ch / b) * 100).toFixed(2) }; });
      setQuotes(mq);
    } catch (e) {}
  };

  const placeOrder = async () => {
    if (!form.symbol) return alert("Enter symbol");
    setLoading(true);
    try {
      const r = await axios.post(API + "/instruments/order/place", {
        tradingsymbol: form.symbol, exchange: form.exchange, transaction_type: form.type,
        quantity: parseInt(form.qty), price: form.orderType === "MARKET" ? undefined : parseFloat(form.price),
        product: form.product, order_type: form.orderType, variety: form.variety,
        trigger_price: form.triggerPrice ? parseFloat(form.triggerPrice) : undefined,
      }, auth);
      if (r.data.success) { alert("Order placed! ID: " + r.data.order_id); loadData(); }
      else alert("Error: " + r.data.error);
    } catch (e) { alert("Order failed"); }
    setLoading(false);
  };

  const cancelOrder = async (order_id, variety = "NORMAL") => {
    if (!confirm("Cancel this order?")) return;
    try {
      const r = await axios.delete(API + "/instruments/order/cancel/" + order_id + "?variety=" + variety, auth);
      if (r.data.success) { alert("Cancelled"); loadData(); } else alert("Error: " + r.data.error);
    } catch (e) { alert("Cancel failed"); }
  };

  if (!token) return <div className="login-required"><h2>Please login first</h2></div>;
  const totalPnL = positions.reduce((s, p) => s + (parseFloat(p.m2m) || 0), 0);
  const dayPnL = positions.reduce((s, p) => s + (parseFloat(p.unrealised) || 0), 0);
  const tabs = ["portfolio", "positions", "orders", "holdings", "trades", "watchlist", "order"];
  const tabIcons = { portfolio: "💼", positions: "📈", orders: "📋", holdings: "🏦", trades: "🔁", watchlist: "👁️", order: "⚡" };

  return (
    <div className="user-dashboard">
      <div className="top-nav">
        <div className="brand"><span className="brand-icon">📊</span>LETESE Trading</div>
        <div className="nav-tabs">
          {tabs.map(t => (
            <button key={t} className={"nav-tab " + (tab === t ? "active" : "")} onClick={() => setTab(t)}>
              {tabIcons[t]} {" " + t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <button className="btn-refresh" onClick={loadData}>🔄 Refresh</button>
          <button className="btn-outline-sm" onClick={() => { localStorage.removeItem("token"); window.location.reload(); }}>Logout</button>
        </div>
      </div>
      <div className="dashboard-body">
        <div className="left-panel">
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-title">💰 Equity Margin</div><div className="stat-value">₹{(parseFloat(portfolio?.equity?.net?.available?.margins?.equity || 50000)).toLocaleString("en-IN")}</div></div>
            <div className="stat-card"><div className="stat-title">📦 Commodity Margin</div><div className="stat-value">₹{(parseFloat(portfolio?.commodity?.net?.available?.margins?.commodity || 25000)).toLocaleString("en-IN")}</div></div>
            <div className="stat-card"><div className="stat-title">📈 Day P&L</div><div className="stat-value" style={{color: dayPnL >= 0 ? "#00C853" : "#FF1744"}}>{dayPnL >= 0 ? "+" : ""}₹{dayPnL.toFixed(2)}</div></div>
            <div className="stat-card"><div className="stat-title">💹 M2M</div><div className="stat-value" style={{color: totalPnL >= 0 ? "#00C853" : "#FF1744"}}>{totalPnL >= 0 ? "+" : ""}₹{totalPnL.toFixed(2)}</div></div>
          </div>

          {tab === "portfolio" && (
            <div className="panel"><h3>💼 Portfolio & Margins</h3>
              {portfolio ? (
                <><div className="margin-section"><h4>💰 Equity</h4><div className="margin-grid">
                  {Object.entries(portfolio.equity?.net?.available || {}).map(([k, v]) => <div key={k} className="margin-item"><span>{k}</span><span>{typeof v === "number" ? "₹" + v.toLocaleString("en-IN") : String(v)}</span></div>)}
                </div></div>
                <div className="margin-section"><h4>📦 Commodity</h4><div className="margin-grid">
                  {Object.entries(portfolio.commodity?.net?.available || {}).map(([k, v]) => <div key={k} className="margin-item"><span>{k}</span><span>{typeof v === "number" ? "₹" + v.toLocaleString("en-IN") : String(v)}</span></div>)}
                </div></div></>
              ) : <p className="muted">Connect your Kite account to see portfolio</p>}
            </div>
          )}
          {tab === "positions" && (
            <div className="panel"><h3>📈 Live Positions ({positions.length})</h3>
              {positions.length > 0 ? (
                <table className="data-table"><thead><tr><th>Symbol</th><th>Qty</th><th>Avg</th><th>LTP</th><th>P&L</th><th>%</th><th>Product</th></tr></thead><tbody>
                  {positions.map((p, i) => {
                    const pnl = (parseFloat(p.ltp || 0) - parseFloat(p.avg_price || 0)) * parseInt(p.quantity || 0);
                    const pct = p.avg_price > 0 ? ((parseFloat(p.ltp || 0) - parseFloat(p.avg_price)) / parseFloat(p.avg_price) * 100).toFixed(2) : "0";
                    return <tr key={i} className={pnl >= 0 ? "row-profit" : "row-loss"}><td><strong>{p.tradingsymbol}</strong><br/><small>{p.exchange}</small></td><td>{p.quantity}</td><td>₹{parseFloat(p.avg_price || 0).toFixed(2)}</td><td>₹{parseFloat(p.ltp || 0).toFixed(2)}</td><td style={{color: pnl >= 0 ? "#00C853" : "#FF1744"}}>{pnl >= 0 ? "+" : ""}₹{pnl.toFixed(2)}</td><td style={{color: pnl >= 0 ? "#00C853" : "#FF1744"}}>{pct}%</td><td>{p.product}</td></tr>;
                  })}
                </tbody></table>
              ) : <p className="muted">No open positions — place an order to get started</p>}
            </div>
          )}
          {tab === "orders" && (
            <div className="panel"><h3>📋 Order Book ({orders.length})</h3>
              {orders.length > 0 ? (
                <table className="data-table"><thead><tr><th>Time</th><th>Symbol</th><th>Type</th><th>Qty</th><th>Price</th><th>Status</th><th>Action</th></tr></thead><tbody>
                  {orders.map((o, i) => (
                    <tr key={i}>
                      <td><small>{o.timestamp ? new Date(o.timestamp).toLocaleString("en-IN") : "—"}</small></td>
                      <td><strong>{o.tradingsymbol}</strong></td>
                      <td className={o.transaction_type === "BUY" ? "text-green" : "text-red"}>{o.transaction_type}</td>
                      <td>{o.quantity}</td><td>{o.price ? "₹" + o.price : "MKT"}</td>
                      <td><span className="badge" style={{background: o.status === "COMPLETE" ? "#00C853" : o.status === "REJECTED" ? "#FF1744" : "#FF9800", color: "#fff"}}>{o.status}</span></td>
                      <td>{(o.status === "OPEN" || o.status === "TRIGGER PENDING") && <button className="btn-sm btn-danger" onClick={() => cancelOrder(o.order_id, o.variety)}>✕ Cancel</button>}</td>
                    </tr>
                  ))}
                </tbody></table>
              ) : <p className="muted">No orders yet</p>}
            </div>
          )}
          {tab === "holdings" && (
            <div className="panel"><h3>🏦 Holdings ({holdings.length})</h3>
              {holdings.length > 0 ? (
                <table className="data-table"><thead><tr><th>Symbol</th><th>Qty</th><th>Avg Price</th><th>LTP</th><th>Value</th><th>P&L</th></tr></thead><tbody>
                  {holdings.map((h, i) => {
                    const val = parseInt(h.quantity || 0) * parseFloat(h.last_price || 0);
                    const cost = parseInt(h.quantity || 0) * parseFloat(h.avg_price || 0);
                    const pnl = val - cost;
                    return <tr key={i}><td><strong>{h.tradingsymbol}</strong></td><td>{h.quantity}</td><td>₹{parseFloat(h.avg_price || 0).toFixed(2)}</td><td>₹{parseFloat(h.last_price || 0).toFixed(2)}</td><td>₹{val.toFixed(2)}</td><td style={{color: pnl >= 0 ? "#00C853" : "#FF1744"}}>{pnl >= 0 ? "+" : ""}₹{pnl.toFixed(2)}</td></tr>;
                  })}
                </tbody></table>
              ) : <p className="muted">No holdings</p>}
            </div>
          )}
          {tab === "trades" && (
            <div className="panel"><h3>🔁 Trade Book ({trades.length})</h3>
              {trades.length > 0 ? (
                <table className="data-table"><thead><tr><th>Time</th><th>Symbol</th><th>Type</th><th>Qty</th><th>Price</th><th>Order ID</th></tr></thead><tbody>
                  {trades.map((t, i) => <tr key={i}><td><small>{t.timestamp ? new Date(t.timestamp).toLocaleString("en-IN") : "—"}</small></td><td><strong>{t.tradingsymbol}</strong></td><td className={t.transaction_type === "BUY" ? "text-green" : "text-red"}>{t.transaction_type}</td><td>{t.quantity}</td><td>₹{parseFloat(t.price || 0).toFixed(2)}</td><td><small>{t.order_id}</small></td></tr>)}
                </tbody></table>
              ) : <p className="muted">No trades yet</p>}
            </div>
          )}
          {tab === "watchlist" && (
            <div className="panel"><h3>👁️ Market Watch</h3>
              <div className="watchlist-add">
                <input type="text" placeholder="Add symbol and press Enter..." id="watch-add" onKeyDown={e => {
                  if (e.key === "Enter") { const v = document.getElementById("watch-add").value.trim().toUpperCase(); if (v && !watchlist.includes(v)) setWatchlist([...watchlist, v]); document.getElementById("watch-add").value = ""; }
                }} />
              </div>
              <div className="watch-grid">
                {watchlist.map(sym => {
                  const q = quotes[sym];
                  return (
                    <div key={sym} className="watch-card" onClick={() => { setForm({...form, symbol: sym}); setTab("order"); }}>
                      <div className="watch-sym">{sym}</div>
                      <div className="watch-price">{q ? "₹" + q.last_price?.toLocaleString("en-IN") : "..."}</div>
                      <div className="watch-change" style={{color: q && q.change >= 0 ? "#00C853" : "#FF1744"}}>
                        {q ? (q.change >= 0 ? "+" : "") + "₹" + q.change?.toFixed(2) + " (" + q.change_percent + "%)" : "..."}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {tab === "order" && (
            <div className="panel"><h3>⚡ Place Order</h3>
              <div className="order-form">
                <div className="form-row"><label>Symbol</label><input type="text" placeholder="e.g. RELIANCE" value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value.toUpperCase()})} /></div>
                <div className="form-row"><label>Exchange</label><select value={form.exchange} onChange={e => setForm({...form, exchange: e.target.value})}><option>NSE</option><option>BSE</option><option>MCX</option></select></div>
                <div className="form-row"><label>Transaction</label><div className="toggle-group"><button className={form.type === "BUY" ? "btn-buy active" : "btn-buy"} onClick={() => setForm({...form, type: "BUY"})}>BUY</button><button className={form.type === "SELL" ? "btn-sell active" : "btn-sell"} onClick={() => setForm({...form, type: "SELL"})}>SELL</button></div></div>
                <div className="form-row"><label>Quantity</label><input type="number" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} /></div>
                <div className="form-row"><label>Order Type</label><select value={form.orderType} onChange={e => setForm({...form, orderType: e.target.value})}><option>LIMIT</option><option value="MARKET">MARKET</option><option value="SL">SL</option><option value="SL-M">SL-M</option></select></div>
                {form.orderType !== "MARKET" && <div className="form-row"><label>Price</label><input type="number" placeholder="Price" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>}
                {form.orderType === "SL" && <div className="form-row"><label>Trigger Price</label><input type="number" placeholder="Trigger" value={form.triggerPrice} onChange={e => setForm({...form, triggerPrice: e.target.value})} /></div>}
                <div className="form-row"><label>Product</label><select value={form.product} onChange={e => setForm({...form, product: e.target.value})}><option value="CNC">CNC (Delivery)</option><option value="NRML">NRML (Positional)</option><option value="MIS">MIS (Intraday)</option></select></div>
                <div className="form-row"><label>Variety</label><select value={form.variety} onChange={e => setForm({...form, variety: e.target.value})}><option>NORMAL</option><option>BO</option><option>CO</option><option>AMO</option></select></div>
                <button className={"btn-submit full " + form.type.toLowerCase()} onClick={placeOrder} disabled={loading || !form.symbol}>
                  {loading ? "Placing Order..." : "Place " + form.type + " Order — " + form.symbol}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="right-panel">
          <div className="quick-order">
            <h4>⚡ Quick Order</h4>
            <input type="text" placeholder="Symbol" value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value.toUpperCase()})} />
            <div className="toggle-group">
              <button className={form.type === "BUY" ? "btn-buy active" : "btn-buy"} onClick={() => setForm({...form, type: "BUY"})}>BUY</button>
              <button className={form.type === "SELL" ? "btn-sell active" : "btn-sell"} onClick={() => setForm({...form, type: "SELL"})}>SELL</button>
            </div>
            <input type="number" placeholder="Qty" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} />
            <select value={form.orderType} onChange={e => setForm({...form, orderType: e.target.value})}><option>LIMIT</option><option value="MARKET">MARKET</option></select>
            {form.orderType === "LIMIT" && <input type="number" placeholder="Price" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />}
            <select value={form.product} onChange={e => setForm({...form, product: e.target.value})}><option value="CNC">CNC</option><option value="MIS">MIS</option><option value="NRML">NRML</option></select>
            <button className={"btn-submit " + form.type.toLowerCase()} onClick={placeOrder} disabled={loading}>
              {loading ? "..." : form.type + " " + form.symbol}
            </button>
          </div>
          <div className="movers-widget">
            <h4>📊 Market Overview</h4>
            <div className="mover-item"><span>NIFTY 50</span><span className="text-green">22,350.20 ↑</span></div>
            <div className="mover-item"><span>BANKNIFTY</span><span className="text-green">47,890.15 ↑</span></div>
            <div className="mover-item"><span>SENSEX</span><span className="text-green">73,850.30 ↑</span></div>
            <div className="mover-item"><span>USD/INR</span><span className="text-red">83.45 ↓</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
