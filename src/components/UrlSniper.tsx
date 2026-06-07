import React, { useState } from "react";
import { Link2, ShieldAlert, CheckCircle, Search, Users, ShieldAlert as VerifiedShield, User, Layers, HelpCircle } from "lucide-react";
import { SessionInfo } from "../types";

interface UrlSniperProps {
  session: SessionInfo;
}

export default function UrlSniper({ session }: UrlSniperProps) {
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSnipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/url-sniper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlInput.trim(),
          callerId: session.discordId,
          callerUsername: "Aktif Kullanıcı"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sunucu davet sorgulaması başarısız!");
      }

      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const decodeVerificationLevel = (level: number) => {
    switch (level) {
      case 0:
        return "Yok (Kısıtlama Yok)";
      case 1:
        return "Düşük (E-posta doğrulanmış olmalı)";
      case 2:
        return "Orta (Discord üyesi 5 dk geçmiş olmalı)";
      case 3:
        return "Yüksek ((╯°□°）╯︵ ┻━┻ - Sunucuda 10 dk geçmiş olmalı)";
      case 4:
        return "En Yüksek (┻━┻ ﾐ( ˚益˚)ﾐ ┻━┻ - Telefon onaylı olmalı)";
      default:
        return "Bilinmiyor";
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-[#0e1422] border border-emerald-950/40 p-6 shadow-xl relative overflow-hidden">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-emerald-400" />
          Discord URL Invite Sniper
        </h2>
        <p className="text-xs text-gray-400 mb-6">
          Yazılan davet linkinde herhangi bir discord sunucusu var mı kontrol eder. Sunucu aktifse kaç kişi çevrimiçi, kaç kişi toplam üye ve davet detaylarını listeler.
        </p>

        <form onSubmit={handleSnipe} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Discord Sunucu Davet Linki veya Kodu
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                required
                placeholder="Örn: https://discord.gg/minecraft veya sadece 'minecraft'"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
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
      </div>

      {errorMsg && (
        <div className="flex gap-2 rounded-lg bg-red-950/20 border border-red-500/20 p-4 text-sm text-red-200">
          <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Snipe Result */}
      {result && result.exists && (
        <div className="rounded-xl bg-[#0e1422] border border-emerald-950 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-gray-900 pb-4">
            <span className="text-xs text-gray-500 flex items-center gap-1.5 font-mono">
              Kaynak: {result.source}
            </span>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/40">
              Sunucu Aktif
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mt-4">
            {/* Server Avatar / Badge */}
            <div className="flex flex-row md:flex-col items-center gap-4 text-center">
              <img
                src={result.data.guildIcon || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60"}
                alt="Sunucu Logosu"
                className="h-20 w-20 md:h-24 md:w-24 rounded-3xl border border-emerald-500/25 object-cover bg-neutral-900"
              />
              <div className="text-left md:text-center mt-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Davet Kodu</span>
                <span className="text-sm font-mono text-emerald-300 font-bold">discord.gg/{result.data.code}</span>
              </div>
            </div>

            {/* Server Details Grid */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                  {result.data.guildName}
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">Sunucu ID: {result.data.guildId}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Active Member Stats */}
                <div className="bg-[#080d19] p-4 rounded-lg border border-gray-900 space-y-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    📊 Üye İstatistikleri
                  </span>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Aktif / Çevrimiçi:
                      </span>
                      <span className="text-white font-bold font-mono">{result.data.activeCount.toLocaleString()} kullanıcı</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                        Çevrimdışı:
                      </span>
                      <span className="text-white font-bold font-mono">{result.data.offlineCount.toLocaleString()} kullanıcı</span>
                    </div>
                    <div className="border-t border-gray-900 pt-1.5 flex justify-between font-semibold mt-1.5">
                      <span className="text-gray-300">Toplam Üye:</span>
                      <span className="text-emerald-400 font-mono">{result.data.memberCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Metadata */}
                <div className="bg-[#080d19] p-4 rounded-lg border border-gray-900 space-y-2.5">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    🛡️ Sunucu Güvenlik Bilgisi
                  </span>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Doğrulama Seviyesi:</span>
                      <span className="text-white font-medium text-right max-w-[150px] truncate">{result.data.verificationLevel}</span>
                    </div>
                    <span className="text-[10px] text-amber-500 bg-amber-950/20 border border-amber-950/40 rounded py-0.5 px-2.5 block text-center">
                      🔐 {decodeVerificationLevel(result.data.verificationLevel)}
                    </span>
                    <div className="flex justify-between pt-1 font-mono text-[11px]">
                      <span className="text-gray-500">Kanal Adı:</span>
                      <span className="text-emerald-400">#{result.data.channelName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Creator user information if exists */}
              {result.data.inviter && (
                <div className="bg-emerald-950/10 p-3.5 rounded-lg border border-emerald-900/20 flex items-center gap-3">
                  <div className="h-8 w-8 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center text-emerald-400">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">Davet Eden Kullanıcı:</span>
                    <span className="text-white font-bold ml-1.5">@{result.data.inviter.username}</span>
                    <span className="text-gray-500 ml-1 font-mono">({result.data.inviter.id})</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
