import React, { useState } from "react";
import { Compass, ShieldAlert, CheckCircle, Search, User, ShieldCheck, Gem, UserCheck, KeyRound, HardDrive } from "lucide-react";
import { SessionInfo } from "../types";

interface IdCheckerProps {
  session: SessionInfo;
}

export default function IdChecker({ session }: IdCheckerProps) {
  const [targetId, setTargetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId.trim()) return;

    if (!session.isVip && !session.isAdmin) {
      setErrorMsg("⚠️ Bu özelliğe erişmek için VIP statüsüne sahip olmanız gerekir.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/id-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: targetId.trim(),
          callerId: session.discordId,
          callerUsername: "VIP Üye"
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
    return badges.length > 0 ? badges : ["Sıradan Kullanıcı"];
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-[#0e1422] border-2 border-emerald-500/20 p-6 shadow-xl relative overflow-hidden">
        {/* Neon glow gradient background for VIP aesthetics */}
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl"></div>
        
        <div className="flex items-center gap-3.5 mb-2">
          <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/30 text-emerald-400">
            <Gem className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              VIP ID Tracker & Profiler
            </h2>
            <p className="text-xs text-[#10b981]">👑 VIP Premium Ayrıcalıklı Özelleştirilmiş Çözümler</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 mb-6">
          Sadece ID kullanarak Discord genel API'leri, whitelisting durumu, sisteme kayıtlı referans kodları ve kullanıcı profillerini anında çeker. 
          Sorgulama, arka planda entegre gerçek Discord Bot Tokeni ile yetkilendirilerek anlık canlı veri sorgusu şeklinde gerçekleştirilir.
        </p>

        <form onSubmit={handleCheck} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Sorgulanacak Discord User ID
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                placeholder="Örn: 1365990690349121536"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-lg bg-[#080d19] border border-gray-800 py-3 pl-10 pr-4 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-dark-950 py-3 rounded-lg font-bold text-sm text-[#070b13] shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></span>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Hedef ID'yi Derinlemesine Sorgula
              </>
            )}
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="flex gap-2 rounded-lg bg-red-950/20 border border-red-500/20 p-4 text-sm text-red-200">
          <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profiler Output details */}
      {result && result.ok && result.data && (
        <div className="space-y-6">
          <div className="rounded-xl bg-[#0e1422] border-2 border-emerald-500/10 p-6 shadow-xl relative overflow-hidden">
            {result.data.banner && (
              <div className="absolute top-0 left-0 w-full h-24 overflow-hidden opacity-20">
                <img src={result.data.banner} alt="Banner" className="w-full object-cover h-full" />
              </div>
            )}
            <div className={`relative flex flex-col md:flex-row gap-6 items-start md:items-center ${result.data.banner ? "mt-12" : ""}`}>
              <img
                src={result.data.avatar || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60"}
                alt="Avatar"
                className="h-24 w-24 rounded-3xl border-4 border-[#0e1422] object-cover ring-2 ring-emerald-500/30"
              />
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-bold text-white">{result.data.globalName || result.data.username}</h3>
                  <span className="text-xs bg-[#080d19] py-0.5 px-2 rounded-full text-emerald-400 font-mono">@{result.data.username}</span>
                </div>
                <p className="text-xs text-gray-400 font-mono">Sorgulanan Hesap No: {result.data.id}</p>
                {result.data.systemStats.isWhitelisted ? (
                  <div className="mt-2 p-2.5 bg-emerald-950/20 border border-emerald-900/40 rounded-lg flex items-center gap-2 max-w-sm">
                    <span className="text-[11px] text-emerald-400 font-medium">
                      🛡️ Bu kullanıcı Whitelist korumasında olduğu için Token Öneki gizlenmiştir!
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 p-2 bg-[#080d19] border border-gray-800 rounded-lg flex items-center justify-between gap-3 max-w-sm">
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-wider">Base64 Token Öneki</span>
                      <span className="text-xs text-amber-400 font-mono select-all truncate block">
                        {btoa(result.data.id.trim())}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(btoa(result.data.id.trim()));
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className={`cursor-pointer text-[10px] py-1 px-3 rounded transition font-mono shrink-0 ${
                        copied 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse font-bold"
                          : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {copied ? "Kopyalandı!" : "Kopyala"}
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {decodeFlagsName(result.data.flags || 0).map((badge, idx) => (
                    <span key={idx} className="text-[10px] bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 py-0.5 px-2 rounded-full">
                      💎 {badge}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 bg-[#080d19] py-0.5 px-2 rounded font-mono block">Crawl Modu: {result.source}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Registry details database on this portal */}
            <div className="bg-[#0e1422] rounded-xl border border-emerald-950/40 p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-emerald-400" />
                Sistem Veri Tabanı Kayıtları
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between items-center bg-[#080d19] p-3 rounded border border-gray-950">
                  <span className="text-xs text-gray-400">🛡️ Portal Whitelist Durumu:</span>
                  {result.data.systemStats.isWhitelisted ? (
                    <span className="text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-900/40 px-2.5 py-0.5 rounded font-bold">
                      Korumalı / Whitelisted
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 bg-gray-900 px-2.5 py-0.5 rounded">
                      Liste Dışı / Korumasız
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center bg-[#080d19] p-3 rounded border border-gray-950">
                  <span className="text-xs text-gray-400">👑 Portal VIP Yetkisi:</span>
                  {result.data.systemStats.isVip ? (
                    <span className="text-xs text-[#10b981] bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-0.5 rounded font-bold">
                      Aktif VIP Üye
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 bg-gray-900 px-2.5 py-0.5 rounded">
                      Yok (Standart Hesap)
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center bg-[#080d19] p-3 rounded border border-gray-950">
                  <span className="text-xs text-gray-400">🎫 Kullanılan Referans Kodu:</span>
                  <span className="text-xs text-amber-400 font-mono font-semibold bg-amber-950/20 border border-amber-950/40 px-2 rounded">
                    {result.data.systemStats.usedReferenceCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick action shortcuts */}
            <div className="bg-[#0e1422] rounded-xl border border-emerald-950/40 p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2 mb-3.5">
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                  VIP Analiz İstihbaratı
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Bu hesaba dair her şey sürekli yenilenecektir. Admin paneli üzerinden bu kullanıcının VIP veya Whitelisted yetkilerini anında değiştirebilir, referans kodlarını takip edebilir ve silebilirsiniz. Değişiklik yaptığınız an sisteme canlı olarak yansıyacaktır.
                </p>
              </div>

              <div className="border-t border-gray-900 pt-4 mt-4 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                <span>Gelişmiş Filtreleme Modülü</span>
                <span className="text-[#10b981] font-semibold flex items-center gap-1">
                  Active Connection OK
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
