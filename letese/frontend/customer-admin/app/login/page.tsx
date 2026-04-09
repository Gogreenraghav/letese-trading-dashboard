"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";

export default function CustomerAdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("ca_token");
    if (token) router.push("/");
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Send OTP first
      const otpRes = await fetch("http://139.59.65.82:8001/api/v1/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) throw new Error(otpData.detail || "Failed to send OTP");

      // Prompt for OTP
      const otp = prompt(`OTP sent to your email/phone. Enter the 6-digit OTP:`);
      if (!otp || otp.length !== 6) throw new Error("OTP required");

      const loginRes = await fetch("http://139.59.65.82:8001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await loginRes.json();
      if (!loginRes.ok) throw new Error(data.detail || "Login failed");

      localStorage.setItem("ca_token", data.access_token);
      localStorage.setItem("ca_user", JSON.stringify(data.user));
      localStorage.setItem("ca_tenant", JSON.stringify(data.tenant));
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
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00D4FF, #0066FF)" }}>
            <Scale size={20} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">LETESE</div>
            <div className="text-xs" style={{ color: "#00D4FF" }}>CUSTOMER ADMIN</div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-white text-center mb-2">Sign In</h1>
        <p className="text-sm text-center mb-6" style={{ color: "#64748B" }}>Manage your law firm dashboard</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="advocate@firm.in"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
            style={{ background: loading ? "#0066FF80" : "linear-gradient(135deg, #00D4FF, #0066FF)" }}
          >
            {loading ? "Sending OTP..." : "Sign In with OTP"}
          </button>
        </form>

        <p className="text-xs text-center mt-6" style={{ color: "#334155" }}>
          Not an admin? Contact your firm admin for access.
        </p>
      </div>
    </div>
  );
}
