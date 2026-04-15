'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://139.59.65.82:3021';
const SIDEBAR = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  { icon: '📈', label: 'Signals', href: '/dashboard/signals' },
  { icon: '💰', label: 'My Trades', href: '/dashboard/trades' },
  { icon: '📋', label: 'Portfolio', href: '/dashboard/portfolio' },
  { icon: '⭐', label: 'Watchlist', href: '/dashboard/watchlist' },
  { icon: '🪙', label: 'Credits', href: '/dashboard/credits' },
  { icon: '🔗', label: 'Broker API', href: '/dashboard/brokers' },
  { icon: '📋', label: 'Plans', href: '/dashboard/plans' },
  { icon: '⚙️', label: 'Settings', href: '/dashboard/account' },
];

async function apiCall(endpoint, opts = {}) {
  const token = localStorage.getItem('user_token');
  const res = await fetch(`${API}${endpoint}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401) { window.location.href = '/'; return null; }
  return res.json();
}

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const PKG_ICONS  = ['🎯', '🚀', '⚡', '💎', '🏢'];
const PKG_COLORS = ['#60a5fa', '#a78bfa', '#34d393', '#fbbf24', '#f472b6'];

export default function CreditsPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState({ balance: 0, total_spent: 0, transactions: [] });
  const [packages, setPackages] = useState([]);
  const [razorpayStatus, setRazorpayStatus] = useState(null);
  const [purchasing, setPurchasing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [selectedPkg, setSelectedPkg] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) { router.push('/'); return; }
    async function load() {
      const [w, pkgs, pStatus] = await Promise.all([
        apiCall('/api/credits/wallet'),
        apiCall('/api/credits/packages'),
        apiCall('/api/payments/status'),
      ]);
      if (!w) return;
      setWallet(w);
      if (pkgs?.packages) setPackages(pkgs.packages);
      if (pStatus) setRazorpayStatus(pStatus);
      setLoading(false);
    }
    load();
  }, []);

  async function handlePurchase(pkg) {
    setPaymentSuccess(null);
    setPaymentError(null);
    setSelectedPkg(pkg);

    if (!razorpayStatus?.razorpay_configured) {
      // Demo mode — instant purchase without payment
      setPurchasing(pkg.id);
      try {
        const res = await apiCall('/api/payments/create-order', {
          method: 'POST',
          body: JSON.stringify({ package_id: pkg.id }),
        });
        if (res?.demo_mode) {
          setWallet(w => ({ ...w, balance: res.new_balance }));
          setPaymentSuccess(`✅ Demo purchase successful! +${res.credits_added} credits added. New balance: ${res.new_balance}`);
        } else if (res?.error) {
          setPaymentError(`❌ Error: ${res.error}`);
        }
      } catch (e) {
        setPaymentError('❌ ' + e.message);
      }
      setPurchasing(null);
      return;
    }

    // Live Razorpay flow
    setPurchasing(pkg.id);
    try {
      const orderRes = await apiCall('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ package_id: pkg.id }),
      });

      if (orderRes?.demo_mode) {
        setWallet(w => ({ ...w, balance: orderRes.new_balance }));
        setPaymentSuccess(`✅ +${orderRes.credits_added} credits purchased! Balance: ${orderRes.new_balance}`);
        setPurchasing(null);
        return;
      }

      if (orderRes?.error) {
        setPaymentError('❌ ' + orderRes.error);
        setPurchasing(null);
        return;
      }

      // Load Razorpay checkout
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');

      const rzOptions = {
        key: orderRes.key_id,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: 'NSE-BSE Trading',
        description: `${orderRes.credits} Credits — ${orderRes.package_name}`,
        order_id: orderRes.order_id,
        prefill: {
          name: (localStorage.getItem('user_name') || ''),
          email: (localStorage.getItem('user_email') || ''),
        },
        theme: { color: '#1e40ff' },
        handler: async function (response) {
          // Verify payment
          const verifyRes = await apiCall('/api/payments/verify', {
            method: 'POST',
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              credits_added: orderRes.credits,
              package_name: orderRes.package_name,
            }),
          });

          if (verifyRes?.success) {
            setWallet(w => ({ ...w, balance: verifyRes.new_balance }));
            setPaymentSuccess(`✅ Payment successful! +${verifyRes.credits_added} credits added. New balance: ${verifyRes.new_balance}`);
          } else {
            setPaymentError('⚠️ Payment received but verification failed. Contact support with Payment ID: ' + response.razorpay_payment_id);
          }
          // Reload wallet
          const w = await apiCall('/api/credits/wallet');
          if (w) setWallet(w);
        },
        modal: {
          ondismiss: () => {
            setPaymentError('Payment cancelled. No charges were made.');
            setPurchasing(null);
          },
        },
      };

      const rzp = new window.Razorpay(rzOptions);
      rzp.on('payment.failed', function (response) {
        setPaymentError(`❌ Payment failed: ${response.error.description}. Ref: ${response.error.metadata.payment_id}`);
        setPurchasing(null);
      });
      rzp.open();
    } catch (e) {
      setPaymentError('❌ ' + e.message);
    }
    setPurchasing(null);
  }

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    router.push('/');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0e1a', color: '#60a5fa', fontFamily: 'system-ui' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
      <div style={{ fontSize: 18 }}>Loading credits...</div>
    </div>
  );

  const cpc = (pkg) => ((pkg.price_paise / 100) / pkg.credits).toFixed(2); // cost per credit

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', fontFamily: 'system-ui' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#0d1117', borderRight: '1px solid #1f2937', position: 'fixed', top: 0, left: 0, bottom: 0, overflow: 'auto' }}>
        <div style={{ padding: '28px 16px 20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 2 }}>📈 NSE-BSE Trading</div>
          <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>AI-Powered Trading Platform</div>
        </div>
        <nav style={{ padding: '12px 0' }}>
          {SIDEBAR.map(item => (
            <a key={item.href} href="#" onClick={e => { e.preventDefault(); router.push(item.href); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: item.href === '/dashboard/credits' ? '#60a5fa' : '#9ca3af',
                background: item.href === '/dashboard/credits' ? 'rgba(96,165,250,0.1)' : 'transparent',
                borderLeft: item.href === '/dashboard/credits' ? '3px solid #60a5fa' : '3px solid transparent',
                textDecoration: 'none', fontSize: 13, fontWeight: item.href === '/dashboard/credits' ? 600 : 500 }}
              onMouseEnter={e => { if (item.href !== '/dashboard/credits') { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#fff'; }}}
              onMouseLeave={e => { if (item.href !== '/dashboard/credits') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid #1f2937' }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Logged in</div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #1f2937', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, padding: '32px 40px', width: 'calc(100% - 240px)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>🪙 Credits & Billing</h1>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Purchase credits to enable auto-trading. Each executed trade costs 1 credit.</p>
          </div>
          {!razorpayStatus?.razorpay_configured && (
            <div style={{ background: '#450a0a', border: '1px solid #dc2626', borderRadius: 12, padding: '10px 16px', maxWidth: 280 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171', marginBottom: 4 }}>⚠️ Demo Mode</div>
              <div style={{ fontSize: 11, color: '#fca5a5' }}>No Razorpay configured. Add <code>RAZORPAY_KEY_ID</code> + <code>RAZORPAY_KEY_SECRET</code> to backend .env to enable live payments.</div>
            </div>
          )}
          {razorpayStatus?.razorpay_configured && (
            <div style={{ background: '#064e3b', border: '1px solid #059669', borderRadius: 12, padding: '10px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#34d393' }}>✅ Razorpay {razorpayStatus.mode === 'test' ? '(Test Mode)' : '(Live)'}</div>
            </div>
          )}
        </div>

        {/* Balance Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(30,64,255,0.25), rgba(96,165,250,0.1))', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 20, padding: 24, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 80, opacity: 0.05 }}>🪙</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#60a5fa', fontFamily: 'monospace', position: 'relative' }}>{wallet.balance}</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Available Credits</div>
            {wallet.balance < 20 && wallet.balance > 0 && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#fbbf24', fontWeight: 600, background: 'rgba(251,191,36,0.1)', padding: '4px 10px', borderRadius: 8, display: 'inline-block' }}>
                ⚠️ Running low
              </div>
            )}
            {wallet.balance === 0 && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#f87171', fontWeight: 600, background: 'rgba(248,113,113,0.1)', padding: '4px 10px', borderRadius: 8, display: 'inline-block' }}>
                ❌ No credits
              </div>
            )}
          </div>
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 20, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#a78bfa', fontFamily: 'monospace' }}>₹{wallet.total_spent}</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Total Spent on Credits</div>
          </div>
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 20, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#34d393', fontFamily: 'monospace' }}>{Math.floor(wallet.balance / 1)}</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Est. Trades Available</div>
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>@ 1 credit/trade</div>
          </div>
        </div>

        {/* How it works */}
        <div style={{ background: '#111827', borderRadius: 16, padding: 20, border: '1px solid #1f2937', marginBottom: 32, display: 'flex', gap: 24, alignItems: 'center' }}>
          <span style={{ fontSize: 32, flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>How Auto-Trading Credits Work</div>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, lineHeight: 1.6 }}>
              Credits are deducted when the bot <strong style={{ color: '#fff' }}>auto-executes a trade</strong> on your behalf. Signal alerts (manual trading) do <strong style={{ color: '#fff' }}>not</strong> consume credits. Only Auto-Trade plans use credits.
            </p>
          </div>
        </div>

        {/* Success / Error alerts */}
        {paymentSuccess && (
          <div style={{ background: '#064e3b', border: '1px solid #059669', borderRadius: 12, padding: '14px 20px', marginBottom: 20, color: '#34d393', fontSize: 14, fontWeight: 600 }}>
            {paymentSuccess}
          </div>
        )}
        {paymentError && (
          <div style={{ background: '#450a0a', border: '1px solid #dc2626', borderRadius: 12, padding: '14px 20px', marginBottom: 20, color: '#f87171', fontSize: 13, lineHeight: 1.6 }}>
            {paymentError}
          </div>
        )}

        {/* Credit Packages */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 20 }}>💳 Buy Credit Packages</h2>

        {/* Package comparison table */}
        <div style={{ background: '#111827', borderRadius: 16, border: '1px solid #1f2937', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', background: '#0d1117', borderBottom: '1px solid #1f2937' }}>
            {['Package', 'Credits', 'Price', 'Per Credit', 'Best For', 'Buy'].map(h => (
              <div key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', textAlign: 'center' }}>{h}</div>
            ))}
          </div>
          {packages.map((pkg, i) => {
            const best = pkg.name === 'Pro';
            const pricePerCred = cpc(pkg);
            const isPurchasing = purchasing === pkg.id;

            return (
              <div key={pkg.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', borderBottom: '1px solid #1f2937', alignItems: 'center',
                background: best ? 'rgba(30,64,255,0.08)' : 'transparent',
                transition: 'background 0.15s' }}>
                {/* Package name */}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{PKG_ICONS[i] || '📦'}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{pkg.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{pkg.description}</div>
                    </div>
                    {best && <span style={{ padding: '2px 8px', background: '#1e40ff', borderRadius: 9999, fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>⭐ Best Value</span>}
                  </div>
                </div>
                {/* Credits */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: PKG_COLORS[i % PKG_COLORS.length], fontFamily: 'monospace' }}>{pkg.credits}</div>
                  <div style={{ fontSize: 10, color: '#6b7280' }}>credits</div>
                </div>
                {/* Price */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{pkg.price_display}</div>
                </div>
                {/* Per credit */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#34d393', fontFamily: 'monospace' }}>₹{pricePerCred}</div>
                  <div style={{ fontSize: 10, color: '#6b7280' }}>per credit</div>
                </div>
                {/* Best for */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    {pkg.credits <= 100 ? 'Try out'
                    : pkg.credits <= 500 ? 'Starter'
                    : pkg.credits <= 1500 ? 'Regular'
                    : pkg.credits <= 5000 ? 'Active'
                    : 'Power trader'}
                  </div>
                </div>
                {/* Buy button */}
                <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <button
                    onClick={() => handlePurchase(pkg)}
                    disabled={isPurchasing}
                    style={{
                      width: '100%', padding: '8px 12px',
                      borderRadius: 10, border: 'none',
                      fontSize: 13, fontWeight: 700,
                      cursor: isPurchasing ? 'not-allowed' : 'pointer',
                      background: best ? '#1e40ff' : '#1f2937',
                      color: '#fff',
                      opacity: isPurchasing ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}>
                    {isPurchasing ? '⏳...' : 'Buy →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing notes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 40 }}>
          <div style={{ background: '#111827', borderRadius: 14, padding: 16, border: '1px solid #1f2937', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Secure Payments</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Razorpay — PCI DSS compliant. Your card details never touch our servers.</div>
          </div>
          <div style={{ background: '#111827', borderRadius: 14, padding: 16, border: '1px solid #1f2937', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Instant Delivery</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Credits added to your wallet immediately after payment confirmation.</div>
          </div>
          <div style={{ background: '#111827', borderRadius: 14, padding: 16, border: '1px solid #1f2937', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📜</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Full Refund Policy</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Unused credits are refundable within 7 days. Contact support.</div>
          </div>
        </div>

        {/* Transaction History */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 20 }}>📜 Transaction History</h2>
        <div style={{ background: '#111827', borderRadius: 16, border: '1px solid #1f2937', overflow: 'hidden' }}>
          {(wallet.transactions || []).length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#4b5563', fontSize: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              No transactions yet. Buy a credit package above to get started with auto-trading.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d1117', borderBottom: '1px solid #1f2937' }}>
                  {['Date', 'Type', 'Credits', 'Amount', 'Status', 'Description'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(wallet.transactions || []).map((tx, idx) => (
                  <tr key={tx.id || idx} style={{ borderBottom: '1px solid #1f2937' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>{timeAgo(tx.created_at)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700,
                        background: tx.amount > 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                        color: tx.amount > 0 ? '#34d393' : '#f87171',
                        textTransform: 'capitalize' }}>
                        {tx.transaction_type?.replace(/_/g, ' ') || 'unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: tx.amount > 0 ? '#34d393' : '#f87171', fontFamily: 'monospace' }}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af' }}>—</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700,
                        background: tx.status === 'completed' ? 'rgba(52,211,153,0.15)' : tx.status === 'pending' ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)',
                        color: tx.status === 'completed' ? '#34d393' : tx.status === 'pending' ? '#fbbf24' : '#f87171',
                        textTransform: 'capitalize' }}>
                        {tx.status || 'completed'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af' }}>{tx.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Razorpay branding */}
        {razorpayStatus?.razorpay_configured && (
          <div style={{ marginTop: 24, textAlign: 'center', color: '#4b5563', fontSize: 12 }}>
            Payments secured by <span style={{ fontWeight: 700, color: '#6b7280' }}>Razorpay</span> · PCI DSS compliant · Instant delivery
          </div>
        )}
      </main>
    </div>
  );
}
