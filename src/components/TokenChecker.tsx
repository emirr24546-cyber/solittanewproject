import React, { useState, useEffect } from "react";
import { Search, ShieldAlert, BadgeInfo, CheckCircle, Shield, User, Mail, Phone, Calendar, Key } from "lucide-react";
import { SessionInfo } from "../types";

interface TokenCheckerProps {
  session: SessionInfo;
}

export default function TokenChecker({ session }: TokenCheckerProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [parsedId, setParsedId] = useState<string | null>(null);
  const [encodedId, setEncodedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live decode first part of Token to ID & show Base64
  useEffect(() => {
    if (!tokenInput.trim()) {
      setParsedId(null);
      setEncodedId(null);
      return;
    }

    try {
      const parts = tokenInput.trim().split(".");
      if (parts.length > 0) {
        const firstPart = parts[0];
        setEncodedId(firstPart);

        // Normalize base64 for decoding
        let padded = firstPart;
        while (padded.length % 4 !== 0) {
          padded += "=";
        }

        const decoded = atob(padded.replace(/_/g, "/").replace(/-/g, "+"));
        if (/^\d{17,21}$/.test(decoded)) {
          setParsedId(decoded);
        } else {
          setParsedId(null);
        }
      } else {
        setParsedId(null);
        setEncodedId(null);
      }
    } catch {
      setParsedId(null);
      setEncodedId(null);
    }
  }, [tokenInput]);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/token-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenInput.trim(),
          callerId: session.discordId,
          callerUsername: "Aktif Kullanıcı"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sorgulama başarısız oldu!");
      }

      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const getPremiumTypeName = (type: number) => {
    switch (type) {
      case 1:
        return "Nitro Classic";
      case 2:
        return "Nitro Booster (Full)";
      case 3:
        return "Nitro Basic";
      default:
        return "Yok (Standart Hesap)";
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-[#0e1422] border border-emerald-950/40 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Key className="h-24 w-24 text-emerald-400" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Key className="h-5 w-5 text-emerald-400" />
          Token Checker (Discord ID Base64 Encode)
        </h2>
        <p className="text-xs text-gray-400 mb-6">
          Girdiğiniz Discord tokeninin geçerliliğini ve hesap detaylarını kontrol eder. <br />
          Tokenin ilk kısmı, hesabın Discord ID numarasının Base64 kodlanmış halidir.
        </p>

        <form onSubmit={handleCheck} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Discord Token (User veya Bot Token)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                required
                placeholder="Örn: MTM2NTk5MDY5MDM0... (Token buraya)"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="flex-1 rounded-lg bg-[#080d19] border border-gray-800 py-3 px-4 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-[#070b13] px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></span>
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Sorgula
              </button>
            </div>
          </div>
        </form>

        {/* Real-time Base64 Parser Widget */}
        {tokenInput && (
          <div className="mt-5 rounded-lg bg-[#080d19]/80 border border-emerald-950/50 p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              ⚡ Canlı Token Analizi & ID Ayrıştırma
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-gray-500">ID Base64 Kısmı:</span>
                <div className="font-mono bg-[#0c1220] py-1.5 px-3 rounded text-amber-300 overflow-x-auto whitespace-nowrap">
                  {encodedId || "Ayrıştırılamadı"}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500">Çözümlenen Discord ID:</span>
                <div className="font-mono bg-[#0c1220] py-1.5 px-3 rounded text-emerald-300 overflow-x-auto whitespace-nowrap flex items-center justify-between">
                  <span>{parsedId || "Geçersiz ID Formatı"}</span>
                  {parsedId && (
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded">
                      Doğru Yapı
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="flex gap-2 rounded-lg bg-red-950/20 border border-red-500/20 p-4 text-sm text-red-200">
          <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Result Display */}
      {result && result.whitelisted && (
        <div className="rounded-xl bg-emerald-950/20 border-2 border-emerald-500/40 p-6 flex flex-col md:flex-row items-start md:items-center gap-5 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/30 text-emerald-400">
            <Shield className="h-10 w-10 shrink-0" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-300 mb-1">
              🛡️ Sorgulama Engellendi (Korumalı Hesap)
            </h3>
            <p className="text-sm text-gray-300">
              Bu token sahibinin hesabı veri tabanımızda **Whitelist** koruması altındadır.
              Discord üzerinde güvenliğiniz için whiteliste eklenmiş hesapların token detayları hiçbir üçüncü taraf sızma aracıyla görüntülenemez!
            </p>
          </div>
        </div>
      )}

      {result && !result.whitelisted && result.valid && (
        <div className="rounded-xl bg-[#0e1422] border border-emerald-950 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-gray-900 pb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs text-gray-500">Sorgu Modu: {result.source}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/40">
              <CheckCircle className="h-3.5 w-3.5" />
              Aktif Token
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex gap-4 items-center">
                <img
                  src={result.data.avatar || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60"}
                  alt="Avatar"
                  className="h-20 w-20 rounded-2xl border-2 border-emerald-500/20 object-cover"
                />
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {result.data.globalName || result.data.username}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">@{result.data.username}</p>
                  <p className="text-xs text-gray-400 mt-1">ID: {result.data.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-[#080d19] p-3 rounded-lg border border-gray-900 flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <span className="block text-[10px] text-gray-500 uppercase font-semibold">Email Adresi</span>
                    <span className="text-xs text-white break-all">{result.data.email}</span>
                  </div>
                </div>

                <div className="bg-[#080d19] p-3 rounded-lg border border-gray-900 flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <span className="block text-[10px] text-gray-500 uppercase font-semibold">Telefon Numarası</span>
                    <span className="text-xs text-white">{result.data.phone}</span>
                  </div>
                </div>

                <div className="bg-[#080d19] p-3 rounded-lg border border-gray-900 flex items-center gap-3">
                  <Shield className="h-5 w-5 text-gray-500" />
                  <div>
                    <span className="block text-[10px] text-gray-500 uppercase font-semibold">Çift Faktörlü Doğrulama (2FA)</span>
                    <span className={`text-xs font-semibold ${result.data.mfaEnabled ? "text-emerald-400" : "text-amber-500"}`}>
                      {result.data.mfaEnabled ? "Aktif / Yetkilendirilmiş" : "Aktif Değil"}
                    </span>
                  </div>
                </div>

                <div className="bg-[#080d19] p-3 rounded-lg border border-gray-900 flex items-center gap-3">
                  <BadgeInfo className="h-5 w-5 text-gray-500" />
                  <div>
                    <span className="block text-[10px] text-gray-500 uppercase font-semibold">Nitro Statüsü</span>
                    <span className="text-xs text-amber-400 font-semibold">{getPremiumTypeName(result.data.premiumType)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
