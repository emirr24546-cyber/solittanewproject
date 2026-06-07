import React, { useState, useEffect, useRef } from "react";
import { Play, Square, Trash2, ShieldAlert, Cpu, Terminal, Disc, Zap, Activity, ShieldCheck, Key } from "lucide-react";
import { SessionInfo } from "../types";

interface ForcesDataProps {
  session: SessionInfo;
}

interface LogEntry {
  id: string;
  text: string;
  type: "success" | "error" | "info";
  timestamp: string;
}

export default function ForcesData({ session }: ForcesDataProps) {
  const [targetId, setTargetId] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(100); // ms delay
  const [successRate, setSuccessRate] = useState(85); // % of 200 OK
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    errors: 0,
    currentLatency: 0,
  });

  // Profile lookup states
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [copiedPrefix, setCopiedPrefix] = useState(false);

  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const isRunningRef = useRef(false);
  const speedRef = useRef(100);
  const successRateRef = useRef(85);
  const logsRef = useRef<LogEntry[]>([]);
  const intervalRef = useRef<any>(null);

  // Sync refs to prevent obsolete state closure issues in setInterval
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    successRateRef.current = successRate;
  }, [successRate]);

  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  // Keyboard listener for '0' key to stop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "0" && isRunningRef.current) {
        stopSimulation();
        addLog("[!] Kullanıcı klavyeden '0' tuşuna bastı. İşlem durduruluyor...", "info");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle active stream
  useEffect(() => {
    if (isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        runStep();
      }, speed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, speed]);

  // Auto-scroll terminal ONLY within its element (does not push viewport down)
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (text: string, type: "success" | "error" | "info") => {
    const timeStr = new Date().toLocaleTimeString("tr-TR");
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      type,
      timestamp: timeStr,
    };
    setLogs((prev) => [...prev.slice(-149), newEntry]);
  };

  const runStep = () => {
    const latency = Math.floor(Math.random() * (150 - 20 + 1)) + 20;
    const randomSeedId = Math.floor(100000000000000000 + Math.random() * 900000000000000000);
    const isSuccess = Math.random() * 100 <= successRateRef.current;

    setStats((prev) => ({
      total: prev.total + 1,
      success: prev.success + (isSuccess ? 1 : 0),
      errors: prev.errors + (isSuccess ? 0 : 1),
      currentLatency: latency,
    }));

    if (isSuccess) {
      addLog(`[+] Deneniyor: ${randomSeedId} | Status: 200 | Latency: ${latency}ms`, "success");
    } else {
      addLog(`[-] Hata: ${randomSeedId} | Status: 403 | Latency: ${latency}ms`, "error");
    }
  };

  // Fetch real target user details
  const fetchTargetProfile = async (id: string) => {
    if (!id.trim()) return;
    setProfileLoading(true);
    try {
      const res = await fetch("/api/tools/id-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: id.trim(),
          callerId: session.discordId,
          callerUsername: "VIP Üye"
        })
      });
      if (res.ok) {
        const d = await res.json();
        if (d && d.ok && d.data) {
          setProfileData(d.data);
          addLog(`[+] Hedef ${id} profili başarıyla çözümlendi: @${d.data.username}`, "info");
        }
      } else {
        setProfileData(null);
      }
    } catch (err) {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const startSimulation = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      try {
        e.stopPropagation();
      } catch (err) {}
    }
    if (!targetId.trim()) {
      alert("Lütfen önce hedef bir Discord ID'si seçin!");
      return;
    }
    if (isRunning) return;

    setIsRunning(true);
    setLogs([]);
    addLog(`[+] Solitta Force's başlatılıyor... (Hedef ID: ${targetId.trim()})`, "info");
    addLog(`[+] İşlem başlatılıyor... (Durdurmak için '0' tuşuna basın)`, "info");

    fetchTargetProfile(targetId);
  };

  const stopSimulation = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      try {
        e.stopPropagation();
      } catch (err) {}
    }
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    addLog("[!] İşlem kullanıcı tarafından durduruldu.", "info");
  };

  const clearConsole = () => {
    setLogs([]);
    setStats({
      total: 0,
      success: 0,
      errors: 0,
      currentLatency: 0,
    });
    setProfileData(null);
    addLog("[*] Konsol ve istatistik önbelleği başarıyla temizlendi.", "info");
  };

  if (!session.isVip && !session.isAdmin) {
    return (
      <div className="rounded-xl bg-[#0e1422] border-2 border-red-500/20 p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-red-500/5 blur-3xl"></div>
        <div className="flex items-center gap-3.5 mb-4">
          <div className="h-10 w-10 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/30 text-red-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Erişim Engellendi (VIP Feature)</h2>
            <p className="text-xs text-red-400">Forces Data modülü sadece VIP üyelerimize özeldir.</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed mb-4">
          Solitta Force API tünelleri ve brute-force simülasyon sistemleri yüksek sunucu kaynakları tüketmektedir.
          Yükseltme yapmak veya üye kodunuzu VIP olarak değiştirmek için lütfen sistem yöneticisiyle iletişime geçin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER BAR AND META */}
      <div className="rounded-xl bg-[#0e1422] border-2 border-emerald-500/20 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="flex items-center gap-3.5 mb-2">
          <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/30 text-emerald-400">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-1.5">
              Solitta Force's Simulator
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono py-0.5 px-2 rounded-full uppercase">VIP</span>
            </h2>
            <p className="text-xs text-emerald-400">⚡ Discord Altyapı Hız Testi & Solitta Force Simüle Edilmiş Paket Sorgulama</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Yüksek gecikme filtreleri ile özel tasarlanmış Python modülünün web platformuna entegre edilmiş canlı simülatörüdür. 
          Klavye üzerinden <kbd className="bg-[#080d19] border border-gray-750 px-1 py-0.5 rounded text-white font-mono text-[11px]">0</kbd> tuşuna basarak veya aşağıdaki stop butonuna basarak işlemi anlık dondurabilirsiniz.
        </p>
      </div>

      {/* PARAMETERS AND STATISTICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* INPUT FORM CONTROLS */}
        <div className="lg:col-span-1 bg-[#0e1422] rounded-xl border border-emerald-950/40 p-5 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
              <Cpu className="h-4 w-4 text-emerald-400" />
              Simülatör Parametreleri
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  🎯 Hedef Discord ID'si
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    disabled={isRunning}
                    placeholder="Örn: 1365990690349121536"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="flex-1 rounded-lg bg-[#080d19] border border-gray-800 py-2 px-3 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
                  />
                  <button
                    type="button"
                    disabled={profileLoading || !targetId.trim()}
                    onClick={() => fetchTargetProfile(targetId)}
                    className="cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition disabled:opacity-40"
                  >
                    {profileLoading ? "..." : "Çöz"}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs text-gray-300 uppercase tracking-wider mb-2">
                  <span>⚡ Sorgu Hızı (Gecikme)</span>
                  <span className="text-emerald-400 font-mono font-bold">{speed}ms</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="1000"
                  step="10"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-[#080d19] rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                  <span>En Hızlı (30ms)</span>
                  <span>Yavaş (1s)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs text-gray-300 uppercase tracking-wider mb-2">
                  <span>📈 Doğruluk Oranı (Status 200)</span>
                  <span className="text-emerald-400 font-mono font-bold">{successRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={successRate}
                  onChange={(e) => setSuccessRate(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-[#080d19] rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                  <span>Hatalı (%0)</span>
                  <span>Sıfır Hata (%100)</span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                {!isRunning ? (
                  <button
                    type="button"
                    onClick={(e) => startSimulation(e)}
                    className="flex-1 cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-dark-950 py-2.5 rounded-lg font-bold text-xs text-[#070b13] flex items-center justify-center gap-1.5 transition"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Başlat
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => stopSimulation(e)}
                    className="flex-1 cursor-pointer bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition animate-pulse"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                    Durdur (0)
                  </button>
                )}

                <button
                  type="button"
                  onClick={clearConsole}
                  className="cursor-pointer bg-[#080d19] hover:bg-red-950/20 text-gray-400 border border-gray-850 hover:text-red-400 py-2.5 px-3.5 rounded-lg text-xs transition"
                  title="Sıfırla"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LIVE STATS DISPLAY */}
        <div className="lg:col-span-2 bg-[#0e1422] rounded-xl border border-emerald-950/40 p-5 flex flex-col justify-between space-y-4">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400 animate-bounce" />
            Canlı İşlem Bilgileri & İstatistikleri
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 items-center justify-center">
            
            <div className="bg-[#080d19] border border-gray-850 p-3.5 rounded-lg text-center">
              <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-wider mb-1">Denenen Paket</span>
              <span className="text-xl font-bold font-mono text-white block animate-pulse">
                {stats.total.toLocaleString()}
              </span>
            </div>

            <div className="bg-[#080d19] border border-gray-850 p-3.5 rounded-lg text-center">
              <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-wider mb-1">Status 200 OK</span>
              <span className="text-xl font-bold font-mono text-emerald-400 block">
                {stats.success.toLocaleString()}
              </span>
            </div>

            <div className="bg-[#080d19] border border-gray-850 p-3.5 rounded-lg text-center">
              <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-wider mb-1">Status 403 Err</span>
              <span className="text-xl font-bold font-mono text-red-500 block">
                {stats.errors.toLocaleString()}
              </span>
            </div>

            <div className="bg-[#080d19] border border-gray-850 p-3.5 rounded-lg text-center">
              <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-wider mb-1">Delay Latency</span>
              <span className="text-xl font-bold font-mono text-amber-400 block">
                {stats.currentLatency}ms
              </span>
            </div>

          </div>

          <div className="border-t border-gray-900 pt-3 text-[11px] text-gray-500 font-mono flex flex-wrap justify-between gap-2">
            <span>Server Channel: solitta_force_sandbox</span>
            <span className={isRunning ? "text-emerald-400 animate-pulse font-bold" : "text-gray-500"}>
              {isRunning ? "STATUS: ENGINE OPERATIVE" : "STATUS: CRADLED"}
            </span>
          </div>

        </div>

      </div>

      {/* TARGET PROFILE CARD (IF DETECTED RELIABLY IN SELECTION) */}
      {profileData && (
        <div className="rounded-xl bg-[#0e1422] border border-emerald-950/45 p-5 relative overflow-hidden transition-all duration-300">
          {profileData.banner && (
            <div className="absolute top-0 left-0 w-full h-16 overflow-hidden opacity-10">
              <img src={profileData.banner} alt="Profile Custom Banner" className="w-full object-cover h-full" />
            </div>
          )}
          <div className="relative flex flex-col md:flex-row gap-5 items-center justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <img
                src={profileData.avatar || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60"}
                alt="Profile Live Photo"
                className="h-16 w-16 rounded-2xl border-2 border-emerald-500/20 object-cover"
              />
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h4 className="text-lg font-bold text-white">{profileData.globalName || profileData.username}</h4>
                  <span className="text-[11px] bg-[#080d19] py-0.5 px-2 rounded-full text-emerald-400 font-mono">@{profileData.username}</span>
                </div>
                <p className="text-xs text-gray-400 font-mono mt-1">Sorgulanıyor: {profileData.id}</p>
                
                {/* Whitelist control on Base64 display */}
                {profileData.systemStats?.isWhitelisted ? (
                  <div className="mt-1 text-[11px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 py-0.5 px-2 rounded w-fit">
                    🛡️ Whitelist korumalı üye; Base64 Token Öneki çıkarılamaz!
                  </div>
                ) : (
                  <div className="mt-1.5 flex items-center justify-center sm:justify-start gap-2 bg-[#080d19] border border-gray-850 px-2 py-1 rounded w-fit">
                    <span className="text-[10px] text-gray-550 font-mono">Token Öneki:</span>
                    <span className="text-[11px] text-amber-400 font-mono select-all truncate max-w-[120px] sm:max-w-none block">
                      {btoa(profileData.id.trim())}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(btoa(profileData.id.trim()));
                        setCopiedPrefix(true);
                        setTimeout(() => setCopiedPrefix(false), 2000);
                      }}
                      className="cursor-pointer text-[9px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded transition"
                    >
                      {copiedPrefix ? "Kopyalandı!" : "Kopyala"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-2 shrink-0">
              {profileData.systemStats?.isWhitelisted && (
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2.5 py-1 rounded-md block text-center uppercase tracking-wider font-mono">
                  🛡️ Whitelist
                </span>
              )}
              {profileData.systemStats?.isVip && (
                <span className="text-[10px] bg-[#10b981]/15 border border-[#10b981]/30 text-emerald-400 font-bold px-2.5 py-1 rounded-md block text-center uppercase tracking-wider font-mono">
                  👑 VIP Üye
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BEAUTIFUL MATRIX BLACK-BOX TERMINAL EMULATOR */}
      <div className="rounded-xl border border-emerald-900/30 overflow-hidden bg-[#05080f] shadow-2xl">
        
        {/* Terminal top header */}
        <div className="bg-[#0b0f1a] px-4 py-2 flex items-center justify-between border-b border-emerald-950">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-gray-400 tracking-wider">Solitta Force's Terminal Output</span>
          </div>
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500/40"></span>
            <span className="h-2 w-2 rounded-full bg-yellow-500/40"></span>
            <span className="h-2 w-2 rounded-full bg-green-500/40"></span>
          </div>
        </div>

        {/* Terminal body */}
        <div 
          ref={terminalContainerRef}
          className="p-4 h-[300px] overflow-y-auto font-mono text-xs space-y-1.5 scrollbar-thin scrollbar-thumb-emerald-950/50"
        >
          
          <div className="text-gray-505 text-[11px] mb-2 border-b border-gray-900 pb-1.5">
            // Solitta Force's Shell v2.1 (Ağ Bağlantısı Aktif) <br />
            // Gerçek zamanlı gecikme algılama simülasyon terminal günlüğü. <br />
            // İptal edip dondurmak için yukarıdaki Stop butonunu kullanabilir veya klavyeden '0' tuşuna basabilirsiniz.
          </div>

          {logs.length === 0 && (
            <div className="text-gray-650 italic text-center py-12">
              Terminal boş. Simülasyonu başlatmak için hedef ID'yi yazıp 'Başlat' butonuna tıklayınız.
            </div>
          )}

          {logs.map((log) => {
            let colorCls = "text-gray-300";
            if (log.type === "success") colorCls = "text-emerald-400";
            if (log.type === "error") colorCls = "text-red-500";
            if (log.type === "info") colorCls = "text-amber-400 font-bold";

            return (
              <div key={log.id} className={`${colorCls} leading-relaxed flex items-start gap-1`}>
                <span className="text-[10px] text-gray-600 select-none shrink-0 font-light pr-1">[{log.timestamp}]</span>
                <span className="whitespace-pre-wrap">{log.text}</span>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
