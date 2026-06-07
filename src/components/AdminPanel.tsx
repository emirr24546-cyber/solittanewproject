import React, { useState, useEffect } from "react";
import { KeyRound, Shield, Gem, Megaphone, ReceiptText, PlusCircle, Trash2, Calendar, User, Search, RefreshCw, Layers } from "lucide-react";
import { Reference, WhitelistUser, VipUser, CommandLog, Announcement } from "../types";

interface AdminPanelProps {
  adminDiscordId: string;
}

export default function AdminPanel({ adminDiscordId }: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"references" | "whitelist" | "vip" | "announcements" | "logs">("references");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stateful confirmations to prevent iframe bugs with native window.confirm()
  const [pendingConfirm, setPendingConfirm] = useState<{ [key: string]: boolean }>({});

  const triggerDelete = (keyId: string, onDeleteAction: () => Promise<void>) => {
    if (pendingConfirm[keyId]) {
      onDeleteAction();
      setPendingConfirm(prev => {
        const copy = { ...prev };
        delete copy[keyId];
        return copy;
      });
    } else {
      setPendingConfirm(prev => ({ ...prev, [keyId]: true }));
      // Auto-reset state for security after 3 seconds
      setTimeout(() => {
        setPendingConfirm(prev => {
          const copy = { ...prev };
          delete copy[keyId];
          return copy;
        });
      }, 4000);
    }
  };

  // States
  const [references, setReferences] = useState<Reference[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistUser[]>([]);
  const [vips, setVips] = useState<VipUser[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [logs, setLogs] = useState<CommandLog[]>([]);

  // Input States
  const [refInput, setRefInput] = useState("");
  const [whitelistIdInput, setWhitelistIdInput] = useState("");
  const [whitelistNameInput, setWhitelistNameInput] = useState("");
  const [vipIdInput, setVipIdInput] = useState("");
  const [vipNameInput, setVipNameInput] = useState("");
  const [annId, setAnnId] = useState<string | null>(null);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");

  // Fetch functions
  const fetchReferences = async () => {
    try {
      const res = await fetch("/api/admin/references");
      const data = await res.json();
      if (res.ok) setReferences(data);
    } catch (e) { console.error(e); }
  };

  const fetchWhitelist = async () => {
    try {
      const res = await fetch("/api/admin/whitelist");
      const data = await res.json();
      if (res.ok) setWhitelist(data);
    } catch (e) { console.error(e); }
  };

  const fetchVips = async () => {
    try {
      const res = await fetch("/api/admin/vips");
      const data = await res.json();
      if (res.ok) setVips(data);
    } catch (e) { console.error(e); }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      if (res.ok) setAnnouncements(data);
    } catch (e) { console.error(e); }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/logs");
      const data = await res.json();
      if (res.ok) setLogs(data);
    } catch (e) { console.error(e); }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchReferences(),
      fetchWhitelist(),
      fetchVips(),
      fetchAnnouncements(),
      fetchLogs()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // Poll logs and other data every 5 seconds to keep it live!
    const interval = setInterval(() => {
      fetchLogs();
      fetchReferences();
      fetchWhitelist();
      fetchVips();
      fetchAnnouncements();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleCreateReference = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: refInput ? refInput.toUpperCase().trim() : undefined,
          createdBy: adminDiscordId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Referans oluşturma başarısız!");
      setRefInput("");
      fetchReferences();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteReference = async (code: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/references/${code}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Silme başarısız!");
      fetchReferences();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whitelistIdInput.trim()) return;
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordId: whitelistIdInput.trim(),
          username: whitelistNameInput.trim() || undefined,
          addedBy: adminDiscordId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ekleme başarısız!");
      setWhitelistIdInput("");
      setWhitelistNameInput("");
      fetchWhitelist();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteWhitelist = async (id: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/whitelist/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kaldırma başarısız!");
      fetchWhitelist();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleAddVip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vipIdInput.trim()) return;
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/vips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordId: vipIdInput.trim(),
          username: vipNameInput.trim() || undefined,
          addedBy: adminDiscordId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "VIP verme başarısız!");
      setVipIdInput("");
      setVipNameInput("");
      fetchVips();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteVip = async (id: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/vips/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yetki alma başarısız!");
      fetchVips();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    setErrorMsg(null);

    try {
      const url = annId ? `/api/admin/announcements/${annId}` : "/api/admin/announcements";
      const method = annId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: annTitle, content: annContent })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "İşlem başarısız!");

      setAnnId(null);
      setAnnTitle("");
      setAnnContent("");
      fetchAnnouncements();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Silme başarısız!");
      fetchAnnouncements();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleEditAnnouncementClick = (ann: Announcement) => {
    setAnnId(ann.id);
    setAnnTitle(ann.title);
    setAnnContent(ann.content);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            ⚙️ Sistem Yönetim ve Denetim Paneli
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Giriş referans anahtarlarını, whitelist üyeliklerini, VIP ayrıcalıklarını ve duyuruları canlı olarak kontrol edin.
          </p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="cursor-pointer bg-dark-900 border border-emerald-950 text-emerald-400 text-xs px-4 py-2 rounded-lg hover:bg-emerald-950/20 active:scale-95 transition flex items-center gap-2"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Verileri Yenile
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-red-950/25 border border-red-500/30 p-4 text-xs text-red-300">
          ⚠️ Hata: {errorMsg}
        </div>
      )}

      {/* Primary Inner Admin Sub-Tabs */}
      <div className="flex border-b border-gray-900 overflow-x-auto whitespace-nowrap bg-[#0b101c] p-1.5 rounded-lg">
        <button
          onClick={() => { setActiveSubTab("references"); setErrorMsg(null); }}
          className={`cursor-pointer px-4 py-2.5 rounded-md text-xs font-bold transition flex items-center gap-2 mr-1 ${activeSubTab === "references" ? "bg-emerald-500 text-[#070b13]" : "text-gray-400 hover:text-white"}`}
        >
          <KeyRound className="h-4 w-4" />
          Referans Kodu Yönetimi ({references.length})
        </button>
        <button
          onClick={() => { setActiveSubTab("whitelist"); setErrorMsg(null); }}
          className={`cursor-pointer px-4 py-2.5 rounded-md text-xs font-bold transition flex items-center gap-2 mr-1 ${activeSubTab === "whitelist" ? "bg-emerald-500 text-[#070b13]" : "text-gray-400 hover:text-white"}`}
        >
          <Shield className="h-4 w-4" />
          Whitelist Sistemi ({whitelist.length})
        </button>
        <button
          onClick={() => { setActiveSubTab("vip"); setErrorMsg(null); }}
          className={`cursor-pointer px-4 py-2.5 rounded-md text-xs font-bold transition flex items-center gap-2 mr-1 ${activeSubTab === "vip" ? "bg-emerald-500 text-[#070b13]" : "text-gray-400 hover:text-white"}`}
        >
          <Gem className="h-4 w-4" />
          VIP Ayrıcalık Yönetimi ({vips.length})
        </button>
        <button
          onClick={() => { setActiveSubTab("announcements"); setErrorMsg(null); }}
          className={`cursor-pointer px-4 py-2.5 rounded-md text-xs font-bold transition flex items-center gap-2 mr-1 ${activeSubTab === "announcements" ? "bg-emerald-500 text-[#070b13]" : "text-gray-400 hover:text-white"}`}
        >
          <Megaphone className="h-4 w-4" />
          Duyuru Yönetimi ({announcements.length})
        </button>
        <button
          onClick={() => { setActiveSubTab("logs"); setErrorMsg(null); }}
          className={`cursor-pointer px-4 py-2.5 rounded-md text-xs font-bold transition flex items-center gap-2 ${activeSubTab === "logs" ? "bg-emerald-500 text-[#070b13]" : "text-gray-400 hover:text-white"}`}
        >
          <ReceiptText className="h-4 w-4" />
          İşlem Günlükleri ({logs.length})
        </button>
      </div>

      {/* TAB 1: References Manager */}
      {activeSubTab === "references" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Reference Form */}
          <div className="bg-[#0e1422] rounded-xl border border-emerald-950 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PlusCircle className="h-4.5 w-4.5 text-emerald-400" />
              Referans Kodu Oluştur
            </h3>
            <p className="text-xs text-gray-400">
              Sisteme yeni kullanıcı davet etmek için özel veya rastgele bir kod oluşturun.
            </p>
            <form onSubmit={handleCreateReference} className="space-y-4 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase">
                  Özel Referans Kodu (Boşsa rastgele üretilir)
                </label>
                <input
                  type="text"
                  placeholder="DEMO-REF-99"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value)}
                  className="w-full rounded-lg bg-[#080d19] border border-gray-800 py-2.5 px-3.5 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-[#070b13] py-2.5 rounded-lg text-xs font-bold transition"
              >
                Yeni Referans Oluştur
              </button>
            </form>
          </div>

          {/* References Table List */}
          <div className="lg:col-span-2 bg-[#0e1422] rounded-xl border border-emerald-950 p-5">
            <h3 className="text-sm font-bold text-white mb-4">Sistemdeki Referans Kodları</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead>
                  <tr className="border-b border-gray-900 text-gray-500 font-bold uppercase text-[10px]">
                    <th className="pb-3">Referans Açıklaması / Kod</th>
                    <th className="pb-3">Durum</th>
                    <th className="pb-3">Kullanan Kullanıcı</th>
                    <th className="pb-3 text-right">Eylemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {references.map((r, idx) => (
                    <tr key={idx} className="hover:bg-[#0c1220]/50 transition">
                      <td className="py-3 font-mono font-bold text-white">{r.code}</td>
                      <td className="py-3">
                        {r.usedBy ? (
                          <span className="text-[10px] bg-red-950/40 text-red-400 border border-red-900/40 px-2 py-0.5 rounded">
                            Kullanıldı
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded">
                            Boşta / Aktif
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {r.usedBy ? (
                          <span className="font-mono text-[11px] text-gray-200">ID: {r.usedBy}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => triggerDelete(`ref-${r.code}`, () => handleDeleteReference(r.code))}
                          className={`cursor-pointer border p-1.5 rounded transition inline-flex items-center gap-1 text-[11px] ${
                            pendingConfirm[`ref-${r.code}`]
                              ? "bg-red-500 border-red-400 text-[#070b13] font-bold animate-pulse"
                              : "text-red-400 hover:text-red-300 bg-red-950/20 border-red-900/30"
                          }`}
                        >
                          <Trash2 className="h-3 w-3" />
                          {pendingConfirm[`ref-${r.code}`] ? "Onaylamak İçin Tekrar Tıklayın" : "Sil"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {references.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        Sistemde kayıtlı referans bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Whitelist Systems */}
      {activeSubTab === "whitelist" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add to Whitelist Form */}
          <div className="bg-[#0e1422] rounded-xl border border-emerald-950 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PlusCircle className="h-4.5 w-4.5 text-emerald-400" />
              Whitelist Koruma Girişi
            </h3>
            <p className="text-xs text-gray-400">
              Whiteliste eklenen hesap sahiplerinin token checker sorgulamalarında korunması sağlanır.
            </p>
            <form onSubmit={handleAddWhitelist} className="space-y-4 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase">
                  Discord ID Numarası (Snowflake)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 1365990690349121536"
                  value={whitelistIdInput}
                  onChange={(e) => setWhitelistIdInput(e.target.value)}
                  className="w-full rounded-lg bg-[#080d19] border border-gray-800 py-2.5 px-3.5 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase">
                  Kullanıcı Adı (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="emirr24"
                  value={whitelistNameInput}
                  onChange={(e) => setWhitelistNameInput(e.target.value)}
                  className="w-full rounded-lg bg-[#080d19] border border-gray-800 py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-[#070b13] py-2.5 rounded-lg text-xs font-bold transition"
              >
                Korumalı Whitelist Ekle
              </button>
            </form>
          </div>

          {/* Whitelisted Profiles List */}
          <div className="lg:col-span-2 bg-[#0e1422] rounded-xl border border-emerald-950 p-5">
            <h3 className="text-sm font-bold text-white mb-4">Sistemdeki Whitelist Koruma Üyeleri</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead>
                  <tr className="border-b border-gray-900 text-gray-500 font-bold uppercase text-[10px]">
                    <th className="pb-3">Kullanıcı</th>
                    <th className="pb-3">Kayıt Tarihi</th>
                    <th className="pb-3 text-right">Eylemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {whitelist.map((w, idx) => (
                    <tr key={idx} className="hover:bg-[#0c1220]/50 transition">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={w.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                            alt="Avatar"
                            className="h-9 w-9 rounded-full object-cover border border-emerald-500/20"
                          />
                          <div>
                            <span className="font-bold text-white block">@{w.username}</span>
                            <span className="font-mono text-[10px] text-gray-500">ID: {w.discordId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-gray-400 font-mono text-[11px]">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => triggerDelete(`wl-${w.discordId}`, () => handleDeleteWhitelist(w.discordId))}
                          className={`cursor-pointer border p-1.5 rounded transition inline-flex items-center gap-1 text-[11px] ${
                            pendingConfirm[`wl-${w.discordId}`]
                              ? "bg-red-500 border-red-400 text-[#070b13] font-bold animate-pulse"
                              : "text-red-400 hover:text-red-300 bg-red-950/20 border-red-900/30"
                          }`}
                        >
                          <Trash2 className="h-3 w-3" />
                          {pendingConfirm[`wl-${w.discordId}`] ? "Onayla" : "Sil"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {whitelist.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-500">
                        Whitelist kayıtlı kimse bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VIP Manager */}
      {activeSubTab === "vip" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add VIP Form */}
          <div className="bg-[#0e1422] rounded-xl border border-emerald-950 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Gem className="h-4.5 w-4.5 text-emerald-400" />
              VIP Statüsü Verme
            </h3>
            <p className="text-xs text-gray-400">
              VIP yaptığınız kullanıcılar, sol paneldeki VIP Çözümleri id checker aracına canlı erişim sağlayabilirler.
            </p>
            <form onSubmit={handleAddVip} className="space-y-4 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase">
                  Discord ID Numarası (VIP)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 9876543210123"
                  value={vipIdInput}
                  onChange={(e) => setVipIdInput(e.target.value)}
                  className="w-full rounded-lg bg-[#080d19] border border-gray-800 py-2.5 px-3.5 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase">
                  Görünür İsim / Not
                </label>
                <input
                  type="text"
                  placeholder="VIP Üye Emir"
                  value={vipNameInput}
                  onChange={(e) => setVipNameInput(e.target.value)}
                  className="w-full rounded-lg bg-[#080d19] border border-gray-800 py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-[#070b13] py-2.5 rounded-lg text-xs font-bold transition"
              >
                VIP Ayrıcalığı Tanı herşey canlı
              </button>
            </form>
          </div>

          {/* VIP list table */}
          <div className="lg:col-span-2 bg-[#0e1422] rounded-xl border border-emerald-950 p-5">
            <h3 className="text-sm font-bold text-white mb-4">Mevcut VIP Yetkili Kullanıcılar</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead>
                  <tr className="border-b border-gray-900 text-gray-500 font-bold uppercase text-[10px]">
                    <th className="pb-3">Kullanıcı Numarası / Bilgi</th>
                    <th className="pb-3">Kayıt Alındığı Tarih</th>
                    <th className="pb-3 text-right">Eylemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {vips.map((v, idx) => (
                    <tr key={idx} className="hover:bg-[#0c1220]/50 transition">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-amber-500/10 rounded-full border border-amber-500/25 flex items-center justify-center text-amber-400">
                            <Gem className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white block">@{v.username}</span>
                            <span className="font-mono text-[10px] text-gray-500">ID: {v.discordId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-gray-400 font-mono text-[11px]">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => triggerDelete(`vip-${v.discordId}`, () => handleDeleteVip(v.discordId))}
                          className={`cursor-pointer border p-1.5 rounded transition inline-flex items-center gap-1 text-[11px] ${
                            pendingConfirm[`vip-${v.discordId}`]
                              ? "bg-red-500 border-red-400 text-[#070b13] font-bold animate-pulse"
                              : "text-red-400 hover:text-red-300 bg-red-950/20 border-red-900/30"
                          }`}
                        >
                          <Trash2 className="h-3 w-3" />
                          {pendingConfirm[`vip-${v.discordId}`] ? "Onayla" : "Sil"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vips.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-500">
                        Kayıtlı VIP bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Announcements (CRUD) */}
      {activeSubTab === "announcements" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Announcement Form */}
          <div className="bg-[#0e1422] rounded-xl border border-emerald-950 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Megaphone className="h-4.5 w-4.5 text-emerald-400" />
              {annId ? "Duyuruyu Düzenle" : "Duyuru At"}
            </h3>
            <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase">
                  Duyuru Başlığı
                </label>
                <input
                  type="text"
                  required
                  placeholder="📣 Önemli Güncelleme!"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full rounded-lg bg-[#080d19] border border-gray-800 py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase">
                  Duyuru İçeriği
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Sitenin en aşağısındaki bölgeye bu duyuru yansıtılacaktır..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full rounded-lg bg-[#080d19] border border-gray-800 py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="cursor-pointer flex-1 bg-emerald-500 hover:bg-emerald-400 text-[#070b13] py-2.5 rounded-lg text-xs font-bold transition"
                >
                  {annId ? "Kaydet & Yayınla" : "Yayınla"}
                </button>
                {annId && (
                  <button
                    type="button"
                    onClick={() => { setAnnId(null); setAnnTitle(""); setAnnContent(""); }}
                    className="cursor-pointer bg-dark-900 border border-gray-800 text-gray-400 px-3 py-2 text-xs rounded transition"
                  >
                    İptal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Announcements */}
          <div className="lg:col-span-2 bg-[#0e1422] rounded-xl border border-emerald-950 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white mb-4">Yayınlanan Duyurular</h3>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {announcements.map((ann, idx) => (
                <div key={idx} className="bg-[#080d19] p-4 rounded-lg border border-gray-900 space-y-2 flex justify-between items-start">
                  <div className="space-y-1 pr-6 flex-1">
                    <h4 className="text-xs font-bold text-emerald-400">{ann.title}</h4>
                    <p className="text-xs text-gray-300 leading-relaxed font-normal">{ann.content}</p>
                    <span className="text-[9px] text-gray-600 font-mono block pt-1.5">
                      Duyuruldu: {new Date(ann.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleEditAnnouncementClick(ann)}
                      className="cursor-pointer text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 py-1 px-2.5 rounded hover:bg-emerald-950 transition"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => triggerDelete(`ann-${ann.id}`, () => handleDeleteAnnouncement(ann.id))}
                      className={`cursor-pointer text-xs border py-1 px-2.5 rounded transition ${
                        pendingConfirm[`ann-${ann.id}`]
                          ? "bg-red-500 border-red-400 text-[#070b13] font-bold animate-pulse"
                          : "bg-red-950/40 text-red-400 border border-red-900/30 hover:bg-red-950"
                      }`}
                    >
                      {pendingConfirm[`ann-${ann.id}`] ? "Onayla" : "Sil"}
                    </button>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center py-12 text-gray-500 text-xs">
                  Hiçbir duyuru yayınlanmadı. Duyuru at kısmından hemen yapın!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Live usage logs */}
      {activeSubTab === "logs" && (
        <div className="bg-[#0e1422] rounded-xl border border-emerald-950 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ReceiptText className="h-4.5 w-4.5 text-emerald-400" />
              Sistem Araçları Kullanım Takip Günlüğü (Canlı)
            </h3>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-mono animate-pulse">
              Otomatik güncelleniyor (5s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead>
                <tr className="border-b border-gray-900 text-gray-500 font-bold uppercase text-[10px]">
                  <th className="pb-3">Tarih / Saat</th>
                  <th className="pb-3">Sorgulayan Kullanıcı</th>
                  <th className="pb-3">Kullanılan Araç</th>
                  <th className="pb-3">Açıklama / Parametre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900 font-mono text-[11px]">
                {logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-[#0c1220]/30 transition">
                    <td className="py-3.5 text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5">
                      <span className="text-[#10b981] font-bold">@{log.username}</span>
                      <span className="text-gray-600 text-[10px] block">ID: {log.discordId}</span>
                    </td>
                    <td className="py-3.5 font-sans">
                      <span className="text-xs bg-emerald-950/30 text-emerald-400 border border-emerald-900/40 px-2.5 py-0.5 rounded-full font-semibold">
                        {log.command}
                      </span>
                    </td>
                    <td className="py-3.5 text-gray-300 whitespace-normal break-all max-w-[300px]">
                      {log.details}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      Henüz herhangi bir işlem günlüğü kaydedilmedi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
