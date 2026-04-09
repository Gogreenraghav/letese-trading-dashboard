"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";

export default function SuperAdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@letese.in");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("sa_token");
    if (token) router.push("/");
  }, [router]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError("Email required"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://139.59.65.82:8001/api/v1/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send OTP");
      setStep("otp");
    } catch (err: unknown) {
      setError(String(err));
    }
    setLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!otp || otp.length !== 6) { setError("Enter 6-digit OTP"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://139.59.65.82:8001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");

      if (data.user?.role !== "super_admin") {
        throw new Error("Access denied. Super Admin credentials required.");
      }

      localStorage.setItem("sa_token", data.access_token);
      localStorage.setItem("sa_user", JSON.stringify(data.user));
      localStorage.setItem("sa_tenant", JSON.stringify(data.tenant));
      router.push("/");
    } catch (err: unknown) {
      setError(String(err));
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A0E1A, #0f1629)" }}>
      <div className="w-full max-w-md p-8 rounded-2xl" style={{ background: "rgba(17,24,39,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1A4FBF, #8B5CF6)" }}>
            <Scale size={20} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">LETESE</div>
            <div className="text-xs" style={{ color: "#00D4FF" }}>SUPER ADMIN</div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-white text-center mb-2">
          {step === "email" ? "Sign In" : "Enter OTP"}
        </h1>
        <p className="text-sm text-center mb-6" style={{ color: "#64748B" }}>
          {step === "email"
            ? "Enter your email to receive OTP"
            : `OTP sent to ${email}`}
        </p>

        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@letese.in"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition"
              style={{ background: loading ? "#1A4FBF80" : "linear-gradient(135deg, #1A4FBF, #8B5CF6)" }}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
            <div className="text-center">
              <button type="button" onClick={() => setStep("otp")} className="text-xs text-blue-400 hover:text-blue-300">
                Already have OTP? Enter here →
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">6-Digit OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl text-sm text-white text-center tracking-[0.5em] font-mono placeholder:text-slate-600 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                autoFocus
              />
            </div>
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition"
              style={{ background: loading ? "#1A4FBF80" : "linear-gradient(135deg, #1A4FBF, #8B5CF6)" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <div className="flex justify-between text-xs">
              <button type="button" onClick={() => setStep("email")} className="text-slate-500 hover:text-white">
                ← Change email
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-blue-400 hover:text-blue-300"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
