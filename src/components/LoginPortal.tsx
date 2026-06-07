import React, { useState } from "react";
import { KeyRound, ShieldAlert, Fingerprint, Flame, ShieldCheck, User, ShieldAlert as GuardIcon } from "lucide-react";
import { SessionInfo } from "../types";

interface LoginPortalProps {
  onLoginSuccess: (session: SessionInfo) => void;
}

export default function LoginPortal({ onLoginSuccess }: LoginPortalProps) {
  const [loginMode, setLoginMode] = useState<"member" | "admin">("member");
  const [discordId, setDiscordId] = useState("");
  const [refCode, setRefCode] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = discordId.trim();
    if (!cleanId) {
      setErrorMsg("Lütfen Discord ID'nizi girin!");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload: any = { discordId: cleanId };

      if (loginMode === "admin") {
        const cleanPassword = adminPassword.trim();
        if (!cleanPassword) {
          setErrorMsg("Giriş yapmak için Yönetici Güvenlik Şifresi gereklidir!");
          setLoading(false);
          return;
        }
        payload.adminPassword = cleanPassword;
      } else {
        const cleanRef = refCode.trim();
        if (!cleanRef) {
          setErrorMsg("Giriş yapmak için referans kodu gereklidir!");
          setLoading(false);
          return;
        }
        payload.referenceCode = cleanRef;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Giriş işlemi başarısız oldu!");
      }

      onLoginSuccess(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b13] bg-dark-grid px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-[#0e1422] border border-emerald-950 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl"></div>
        <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl"></div>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <Flame className="h-7 w-7 text-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Discord Tools Portal
          </h1>
          <p className="text-xs text-gray-400">
            Sisteme erişmek için kimlik bilgilerinizi veya aktif referans kodunuzu girin.
          </p>
        </div>

        {/* TABS SELECTOR */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#080d19] rounded-lg mb-6 border border-gray-900">
          <button
            type="button"
            onClick={() => {
              setLoginMode("member");
              setErrorMsg(null);
            }}
            className={`py-1.5 text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMode === "member"
                ? "bg-emerald-500 text-[#070b13] shadow-md shadow-emerald-500/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Üye Girişi
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode("admin");
              setErrorMsg(null);
              // Autofill template admin id as shortcut hint
              if (!discordId) setDiscordId("1365990690349121536");
            }}
            className={`py-1.5 text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMode === "admin"
                ? "bg-emerald-500 text-[#070b13] shadow-md shadow-emerald-500/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <GuardIcon className="h-3.5 w-3.5" />
            Yönetici Girişi
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 flex gap-2 rounded-lg bg-red-950/30 border border-red-500/20 p-4 text-xs text-red-200">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
            <div>{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Discord ID numaranız
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Fingerprint className="h-5 w-5" />
              </span>
              <input
                type="text"
                required
                placeholder="Örn: 1087004362284478484"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
                className="w-full rounded-lg bg-[#080d19] border border-gray-800 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono"
              />
            </div>
          </div>

          {loginMode === "admin" ? (
            <div>
              <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                🔒 Yönetici Güvenlik Şifresi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Yönetici şifresi (Örn: emir546)"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full rounded-lg bg-[#080d19] border border-gray-800 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-650 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono"
                />
              </div>
              <p className="mt-1.5 text-[10px] text-amber-500">
                Panele tam yetkili kurucu sıfatıyla erişmek için şifreyi girin.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Referans Access Kodu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Seçtiğiniz referans kodunu girin"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  className="w-full rounded-lg bg-[#080d19] border border-gray-800 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-dark-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98] transition disabled:opacity-50 text-[#070b13] flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></span>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Giriş Yap & Modülleri Aç
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-gray-900 pt-5 text-center">
          <p className="text-[11px] text-gray-500">
            Platform sadece doğrulanmış topluluk üyeleri içindir. <br />
            ID numaraları Discord API üzerinden sorgulanır.
          </p>
        </div>
      </div>
    </div>
  );
}
