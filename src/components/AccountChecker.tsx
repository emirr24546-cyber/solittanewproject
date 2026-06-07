import React, { useState } from "react";
import { ShieldAlert, RefreshCw, BadgeInfo, Users, CreditCard, Link, Shield, Globe, Compass, ExternalLink } from "lucide-react";
import { SessionInfo } from "../types";

interface AccountCheckerProps {
  session: SessionInfo;
}

export default function AccountChecker({ session }: AccountCheckerProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/account-checker", {
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

  const decodeFlagsName = (flags: number) => {
    const badges = [];
    if (flags & 1) badges.push("Discord Staff");
    if (flags & 2) badges.push("Partnered Server Owner");
    if (flags & 4) badges.push("HypeSquad Events Coordinator");
    if (flags & 8) badges.push("Bug Hunter Level 1");
    if (flags & 64) badges.push("HypeSquad Bravery");
    if (flags & 128) badges.push("HypeSquad Brilliance");
    if (flags & 256) badges.push("HypeSquad Balance");
    if (flags & 512) badges.push("Early Nitro Supporter");
    if (flags & 16384) badges.push("Bug Hunter Level 2");
    if (flags & 131072) badges.push("Active Developer");
    if (flags & 4194304) badges.push("Active Bot Developer");
    return badges.length > 0 ? badges : ["Standart Üye"];
  };

  const getNitroTag = (premiumType: number) => {
    switch (premiumType) {
      case 1:
        return { label: "Nitro Classic", color: "bg-purple-900/30 text-purple-400 border-purple-800/40" };
      case 2:
        return { label: "Nitro Boost (Full Extra)", color: "bg-pink-900/30 text-pink-400 border-pink-800/40" };
      case 3:
        return { label: "Nitro Basic", color: "bg-indigo-900/30 text-indigo-400 border-indigo-800/40" };
      default:
        return { label: "Kullanmıyor", color: "bg-gray-900 text-gray-500 border-gray-800" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-[#0e1422] border border-emerald-950/40 p-6 shadow-xl relative overflow-hidden">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Compass className="h-5 w-5 text-emerald-400" />
          General Account Checker (Discord API Crawler)
        </h2>
        <p className="text-xs text-gray-400 mb-6 font-normal">
          Discord apisinden çekebildiği tüm herşeyi çeker (Hesap durumu, ödeme yöntemleri, bağlantılar, nitro statüsü vb.) <br />
          Tokeninizin durumunu anında grafikleştirir ve özetler.
        </p>

        <form onSubmit={handleCheck} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Büyük Boyutlu Hesap Tokeni
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                required
                placeholder="Örn: MTMyODg5N... (Tokeninizi girin)"
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
                  <RefreshCw className="h-4 w-4" />
                )}
                Ayrıntılı Tara
              </button>
            </div>
          </div>
        </form>
      </div>

      {errorMsg && (
        <div className="flex gap-2 rounded-lg bg-red-950/20 border border-red-500/20 p-4 text-sm text-red-200">
          <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Whitelist Block Result */}
      {result && result.whitelisted && (
        <div className="rounded-xl bg-emerald-950/20 border-2 border-emerald-500/40 p-6 flex flex-col md:flex-row items-start md:items-center gap-5 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/30 text-emerald-400">
            <Shield className="h-10 w-10 shrink-0" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-300 mb-1">
              🛡️ Hesap Koruma Kalkanı Devrede
            </h3>
            <p className="text-sm text-gray-300 font-normal">
              Bu tokenin sahibi veritabanımızda whiteliste kayıtlıdır. 
              Sitenin güvenlik protokolü gereğince, whiteliste kayıtlı kişilerin sunucu sayıları, ödeme biçimleri, bağlı sosyal medya hesapları gizli tutulur.
            </p>
          </div>
        </div>
      )}

      {/* Crawled Results */}
      {result && !result.whitelisted && result.account && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-xl bg-[#0e1422] border border-emerald-950 p-6 shadow-xl relative overflow-hidden">
            {result.account.banner && (
              <div className="absolute top-0 left-0 w-full h-24 overflow-hidden opacity-30">
                <img src={result.account.banner} alt="Banner" className="w-full object-cover h-full" />
              </div>
            )}
            <div className={`relative pt-4 flex flex-col md:flex-row gap-6 items-start md:items-center ${result.account.banner ? "mt-12" : ""}`}>
              <img
                src={result.account.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60"}
                alt="Avatar"
                className="h-24 w-24 rounded-3xl border-4 border-[#0e1422] object-cover ring-2 ring-emerald-500/30"
              />
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-bold text-white">{result.account.globalName || result.account.username}</h3>
                  <span className="text-xs bg-[#080d19] py-0.5 px-2 rounded-full text-gray-500 font-mono">@{result.account.username}</span>
                  {result.account.verified && (
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900/50 py-0.5 px-2 rounded font-semibold uppercase">Doğrulanmış E-posta</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 font-mono">Discord Kayıt ID: {result.account.id}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {decodeFlagsName(result.account.flags).map((badge, idx) => (
                    <span key={idx} className="text-[10px] bg-[#0c1322] border border-emerald-500/25 text-emerald-400 py-0.5 px-2 rounded-full font-light">
                      🔰 {badge}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 block">Sorgulama Modu</span>
                <span className="text-xs text-emerald-400 font-bold font-mono bg-emerald-950/30 border border-emerald-900/30 px-3 py-1 rounded-full mt-1 inline-block">
                  {result.source}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <div className="bg-[#0e1422] rounded-xl border border-emerald-950/30 p-5 space-y-4 shadow-md">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                Topluluk Verileri
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#080d19] p-4 rounded-lg border border-gray-900 text-center">
                  <span className="text-[11px] text-gray-500 block">Sunucu Listesi</span>
                  <span className="text-2xl font-bold text-white mt-1 block">{result.account.guildCount}</span>
                  <span className="text-[9px] text-gray-600 block">Kayıtlı olduğu</span>
                </div>
                <div className="bg-[#080d19] p-4 rounded-lg border border-gray-900 text-center">
                  <span className="text-[11px] text-gray-500 block">Sahiplik Yetkisi</span>
                  <span className="text-2xl font-bold text-white mt-1 block">{result.account.ownedServerCount}</span>
                  <span className="text-[9px] text-emerald-500 block">Yönetici Sunucu</span>
                </div>
              </div>

              <div className="bg-[#080d19] p-3 rounded-lg border border-gray-900 space-y-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Nitro Yetki Sınıfı</span>
                {(() => {
                  const tag = getNitroTag(result.account.premiumType);
                  return (
                    <div className={`text-md font-bold px-3 py-1.5 text-center rounded border ${tag.color}`}>
                      {tag.label}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Social Connections */}
            <div className="bg-[#0e1422] rounded-xl border border-emerald-950/30 p-5 space-y-4 shadow-md">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <Link className="h-4 w-4 text-emerald-400" />
                Bağlı Hesaplar (Connections)
              </h4>
              {result.account.connections && result.account.connections.length > 0 ? (
                <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                  {result.account.connections.map((conn: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-[#080d19] p-3 rounded border border-gray-900">
                      <div className="flex items-center gap-2.5">
                        <span className="text-emerald-400 text-xs font-bold bg-emerald-950/40 p-1 rounded font-mono uppercase">
                          {conn.type.substring(0, 3)}
                        </span>
                        <div>
                          <span className="text-xs font-medium text-white block">{conn.name}</span>
                          <span className="text-[9px] text-gray-500 block capitalize">{conn.type} entegrasyonu</span>
                        </div>
                      </div>
                      {conn.verified ? (
                        <span className="text-[9px] text-emerald-400 bg-emerald-950/50 border border-emerald-900/40 px-1.5 py-0.5 rounded">Doğrulanmış</span>
                      ) : (
                        <span className="text-[9px] text-gray-600 bg-gray-900 px-1.5 py-0.5 rounded">Standard</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-gray-500 border border-dashed border-gray-900 rounded-lg">
                  Kullanıcının bağlı herhangi bir hesabı bulunamadı.
                </div>
              )}
            </div>

            {/* Payment Systems (Clipped methods) */}
            <div className="bg-[#0e1422] rounded-xl border border-emerald-950/30 p-5 space-y-4 shadow-md">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                Ödeme Yöntemleri & Cihazlar
              </h4>
              <div className="space-y-2">
                <div className="bg-[#080d19] p-3 rounded border border-gray-900">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">MFA Durumu:</span>
                    <span className="text-emerald-400 font-semibold">{result.account.mfaEnabled ? "Evet (Gelişmiş)" : "Hayır (Riskli)"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Bölge (Dil):</span>
                    <span className="text-gray-300 font-mono">{result.account.locale || "tr-TR"}</span>
                  </div>
                </div>

                <div className="bg-emerald-950/10 p-3 rounded border border-emerald-900/20 space-y-2">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block tracking-wider">💳 Ödeme Metotları</span>
                  {result.account.paymentMethods && result.account.paymentMethods.length > 0 ? (
                    <div className="space-y-1.5">
                      {result.account.paymentMethods.map((p: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs text-gray-300 font-mono">
                          <span>{p.type} ({p.brand || "PayPal"})</span>
                          <span className="text-emerald-400 font-semibold">{p.last4 ? `**** ${p.last4}` : p.email}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-500">
                      Sorgulanan token üzerinde kayıtlı Visa/Mastercard veya Paypal bilgisi bulunamadı.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
