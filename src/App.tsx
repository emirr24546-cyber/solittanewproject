import React, { useState, useEffect } from "react";
import { Key, Compass, Link2, Gem, Shield, Megaphone, Terminal, LogOut, Radio, UserCheck, Flame, ChevronDown, ChevronRight, MessageSquareCode, ShieldCheck, Activity } from "lucide-react";
import { SessionInfo, Announcement } from "./types";
import LoginPortal from "./components/LoginPortal";
import TokenChecker from "./components/TokenChecker";
import AccountChecker from "./components/AccountChecker";
import UrlSniper from "./components/UrlSniper";
import IdChecker from "./components/IdChecker";
import ForcesData from "./components/ForcesData";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [activeTab, setActiveTab] = useState<string>("token-checker");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isVipSubMenuOpen, setIsVipSubMenuOpen] = useState(true);
  const [whitelistCheckId, setWhitelistCheckId] = useState("");
  const [whitelistCheckResult, setWhitelistCheckResult] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [discordProfile, setDiscordProfile] = useState<any>(null);

  // Track live clock in UTC
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString("tr-TR", { timeZone: "UTC" }) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real-time logged-in user profile from Discord
  useEffect(() => {
    if (session?.discordId) {
      fetch("/api/tools/id-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: session.discordId,
          callerId: session.discordId,
          callerUsername: "Sistem Otomatik"
        })
      })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((d) => {
        if (d && d.ok && d.data) {
          setDiscordProfile(d.data);
        }
      })
      .catch(() => {});
    } else {
      setDiscordProfile(null);
    }
  }, [session?.discordId]);

  // Sync session from localStorage on load
  useEffect(() => {
    const cachedSession = localStorage.getItem("discord_tools_session");
    if (cachedSession) {
      try {
        const parsed = JSON.parse(cachedSession);
        // Quick session check from server
        fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discordId: parsed.discordId, adminToken: parsed.adminToken }),
        })
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error();
          })
          .then((data) => {
            if (data.hasAccess) {
              setSession(data);
              // If admin, default active tab to admin management
              if (data.isAdmin) {
                setActiveTab("admin-management");
              }
            } else {
              localStorage.removeItem("discord_tools_session");
            }
          })
          .catch(() => {
            // Server offline or session invalid, keep cached fallback
            setSession(parsed);
          });
      } catch (e) {
        localStorage.removeItem("discord_tools_session");
      }
    }
  }, []);

  // Fetch announcements sitewide at bottom of screen
  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (e) {
      console.error("Duyuru çekilemedi:", e);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (newSession: SessionInfo) => {
    setSession(newSession);
    localStorage.setItem("discord_tools_session", JSON.stringify(newSession));
    if (newSession.isAdmin) {
      setActiveTab("admin-management");
    } else {
      setActiveTab("token-checker");
    }
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem("discord_tools_session");
    setActiveTab("token-checker");
  };

  // Whitelist Client Lookup feature
  const handleWhitelistCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whitelistCheckId.trim()) return;

    try {
      const res = await fetch("/api/admin/whitelist");
      const list = await res.json();
      const match = list.find((u: any) => u.discordId === whitelistCheckId.trim());
      if (match) {
        setWhitelistCheckResult(`🛡️ Bu ID (${whitelistCheckId.trim()}) whitelist koruması altındadır!`);
      } else {
        setWhitelistCheckResult(`❌ Bu ID (${whitelistCheckId.trim()}) sistemde kayıtlı korumaya sahip değildir.`);
      }
    } catch {
      setWhitelistCheckResult("Sorgu başarısız.");
    }
  };

  // If visitor is not logged in, render Authorization Portal
  if (!session) {
    return <LoginPortal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex bg-[#070b13] bg-dark-grid selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* SIDEBAR MAIN WRAPPER */}
      <aside className="w-64 border-r border-[#0e1422] bg-[#090d16] flex flex-col justify-between shrink-0">
        
        {/* TOP SECTION: Header branding & session */}
        <div className="p-5 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
              <Flame className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide uppercase">D-Tools Portal</h1>
              <span className="text-[10px] text-gray-500 font-mono">v2.0 Canlı Panel</span>
            </div>
          </div>

          {/* Connected Profile Details */}
          <div className="bg-[#0e1422] rounded-xl p-3.5 border border-emerald-950/20 flex items-center gap-3 relative">
            <div className="relative">
              <img
                src={discordProfile?.avatar || (session.isAdmin ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60" : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80")}
                alt="Profile"
                className="h-10 w-10 rounded-full object-cover border-2 border-emerald-500/20"
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#0e1422]"></span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                {discordProfile?.globalName || discordProfile?.username || (session.isAdmin ? "emirr24546" : `discord_user_${session?.discordId ? String(session.discordId).substring(0, 4) : "unknown"}`)}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 mt-0.5 block">
                {session.isAdmin ? "👑 Yönetici" : session.isVip ? "💎 VIP Üye" : "🔒 Üye"}
              </span>
            </div>
          </div>

          {/* MENU NAVIGATION LINKS */}
          <nav className="space-y-4">
            
            {/* NORMAL FEATURES CATEGORY */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 block mb-2">
                Normal Features
              </span>
              <button
                onClick={() => setActiveTab("token-checker")}
                className={`w-full cursor-pointer text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${activeTab === "token-checker" ? "bg-emerald-950/30 border-l-2 border-emerald-500 text-emerald-400 font-bold" : "text-gray-400 hover:text-white"}`}
              >
                <Key className="h-4 w-4" />
                Token Checker
              </button>
              <button
                onClick={() => setActiveTab("account-checker")}
                className={`w-full cursor-pointer text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${activeTab === "account-checker" ? "bg-emerald-950/30 border-l-2 border-emerald-500 text-emerald-400 font-bold" : "text-gray-400 hover:text-white"}`}
              >
                <Compass className="h-4 w-4" />
                Account Checker
              </button>
              <button
                onClick={() => setActiveTab("url-sniper")}
                className={`w-full cursor-pointer text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${activeTab === "url-sniper" ? "bg-emerald-950/30 border-l-2 border-emerald-500 text-emerald-400 font-bold" : "text-gray-400 hover:text-white"}`}
              >
                <Link2 className="h-4 w-4" />
                Url Sniper
              </button>
              <button
                onClick={() => setActiveTab("whitelist-check")}
                className={`w-full cursor-pointer text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${activeTab === "whitelist-check" ? "bg-emerald-950/30 border-l-2 border-emerald-500 text-emerald-400 font-bold" : "text-gray-400 hover:text-white"}`}
              >
                <Shield className="h-4 w-4" />
                Whitelist Sorgu
              </button>
            </div>

            {/* PREMIUM CATEGORY HEADER - NESTED VIP SOLUTIONS */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 flex items-center gap-1.5 block mb-2">
                <Gem className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                Premium
              </span>
              
              <div className="rounded-lg bg-emerald-950/15 border border-emerald-500/10 overflow-hidden">
                <button
                  onClick={() => setIsVipSubMenuOpen(!isVipSubMenuOpen)}
                  className="w-full text-left px-3 py-2.5 text-xs font-bold flex items-center justify-between text-emerald-400 bg-emerald-950/15"
                >
                  <span className="flex items-center gap-2">
                    👑 VIP Çözümleri
                  </span>
                  {isVipSubMenuOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>

                {isVipSubMenuOpen && (
                  <div className="p-1 space-y-0.5 bg-[#080d15] border-t border-emerald-950/40">
                    <button
                      onClick={() => setActiveTab("id-checker")}
                      className={`w-full cursor-pointer text-left px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition ${activeTab === "id-checker" ? "text-emerald-400 font-bold" : "text-gray-400 hover:text-emerald-300"}`}
                    >
                      <Terminal className="h-3.5 w-3.5 text-[#10b981]" />
                      Discord ID
                    </button>
                    <button
                      onClick={() => setActiveTab("forces-data")}
                      className={`w-full cursor-pointer text-left px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition ${activeTab === "forces-data" ? "text-emerald-400 font-bold" : "text-gray-400 hover:text-emerald-300"}`}
                    >
                      <Activity className="h-3.5 w-3.5 text-emerald-400" />
                      Forces Data
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SYSTEM ADMIN SPECIAL PERM LINK */}
            {session.isAdmin && (
              <div className="space-y-1 pt-2 border-t border-gray-900 mt-2">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-2 block mb-2">
                  System Guard
                </span>
                <button
                  onClick={() => setActiveTab("admin-management")}
                  className={`w-full cursor-pointer text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${activeTab === "admin-management" ? "bg-red-950/30 border-l-2 border-red-500 text-red-400 font-bold" : "text-gray-400 hover:text-red-400"}`}
                >
                  <MessageSquareCode className="h-4 w-4" />
                  Admin Paneli
                </button>
              </div>
            )}

          </nav>
        </div>

        {/* BOTTOM SECTION: Clock and Logout button */}
        <div className="p-5 border-t border-gray-900 space-y-3 bg-[#070b13]">
          <div className="flex items-center justify-between text-[11px] font-mono text-gray-500">
            <span>Sistem Saati:</span>
            <span className="text-gray-400">{currentTime}</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full cursor-pointer bg-red-950/10 border border-red-950 hover:bg-red-950/30 text-red-400 font-bold rounded-lg px-3 py-2 text-xs flex items-center justify-center gap-2 transition active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" />
            Oturumu Kapat
          </button>
        </div>
      </aside>

      {/* DASHBOARD CONTENT PANEL */}
      <main className="flex-1 flex flex-col justify-between overflow-y-auto">
        
        {/* INTERACTIVE COMPONENT SWITCHER PORTAL */}
        <div className="p-8 max-w-6xl w-full mx-auto space-y-6">
          {activeTab === "token-checker" && <TokenChecker session={session} />}
          {activeTab === "account-checker" && <AccountChecker session={session} />}
          {activeTab === "url-sniper" && <UrlSniper session={session} />}
          
          {/* Whitelist checks Client mode */}
          {activeTab === "whitelist-check" && (
            <div className="rounded-xl bg-[#0e1422] border border-emerald-950/40 p-6 shadow-xl relative overflow-hidden">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                Sorunsuz Whitelist Sorgu Modülü
              </h2>
              <p className="text-xs text-gray-400 mb-6">
                Herhangi bir kullanıcının veri tabanımızda güvenli whitelist koruması olup olmadığını ID bilgisiyle sorgulayın.
              </p>

              <form onSubmit={handleWhitelistCheck} className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Discord ID numarasını girin"
                    value={whitelistCheckId}
                    onChange={(e) => setWhitelistCheckId(e.target.value)}
                    className="flex-1 rounded-lg bg-[#080d19] border border-gray-800 py-3 px-4 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                  <button
                    type="submit"
                    className="cursor-pointer bg-emerald-500 text-dark-950 hover:bg-emerald-400 text-[#070b13] px-6 py-3 rounded-lg font-bold text-sm transition"
                  >
                    Korumayı Check Et
                  </button>
                </div>
              </form>

              {whitelistCheckResult && (
                <div className="mt-6 p-4 rounded-lg bg-[#080d19]/80 border border-emerald-950 text-xs font-mono text-emerald-300">
                  {whitelistCheckResult}
                </div>
              )}
            </div>
          )}

          {activeTab === "id-checker" && <IdChecker session={session} />}
          {activeTab === "forces-data" && <ForcesData session={session} />}
          
          {activeTab === "admin-management" && session.isAdmin && (
            <AdminPanel adminDiscordId={session.discordId} />
          )}
        </div>

        {/* BOTTOM ANNOUNCEMENTS CONTAINER SITE-WIDE */}
        <div className="border-t border-[#0e1422] bg-[#080c14] p-6 mt-12">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-gray-900 pb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#10b981] flex items-center gap-2 font-mono">
                <Megaphone className="h-4 w-4 animate-bounce" />
                📣 Canlı Platform Duyuruları
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            {announcements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcements.slice(0, 4).map((ann, idx) => (
                  <div key={idx} className="bg-[#0e1422] p-4 rounded-lg border border-emerald-950/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-10 w-10 text-emerald-400 opacity-5">
                      <Radio className="h-full w-full" />
                    </div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      {ann.title}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1.5 font-normal leading-relaxed">
                      {ann.content}
                    </p>
                    <span className="text-[10px] text-gray-500 font-mono block mt-2 pt-1.5 border-t border-gray-900">
                      Tarih: {new Date(ann.createdAt).toLocaleString("tr-TR")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 font-normal py-4">
                Sistemde güncel olarak yayınlanmış herhangi bir duyuru bulunmuyor.
              </p>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
