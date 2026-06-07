import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");

// Middleware
app.use(express.json());

// Initialize Local JSON Database
function initDatabase() {
  const defaultDb = {
    references: [
      { code: "EMIR-DEV-ACCESS", createdBy: "SYSTEM", usedBy: null, createdAt: new Date().toISOString(), usedAt: null },
      { code: "VIP-SPECIAL", createdBy: "SYSTEM", usedBy: null, createdAt: new Date().toISOString(), usedAt: null },
      { code: "DISCORD-TOOL-99", createdBy: "SYSTEM", usedBy: null, createdAt: new Date().toISOString(), usedAt: null }
    ],
    whitelist: [
      { discordId: "1365990690349121536", username: "emirr24546", avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", addedBy: "SYSTEM", createdAt: new Date().toISOString() }
    ],
    vips: [
      { discordId: "1365990690349121536", username: "emirr24546", addedBy: "SYSTEM", createdAt: new Date().toISOString() }
    ],
    logs: [
      { id: "log-init", discordId: "SYSTEM", username: "System", command: "Startup", details: "Discord tools database engine online", timestamp: new Date().toISOString() }
    ],
    announcements: [
      { id: "ann-1", title: "⭐ Discord Tools Platform v2.0 Çıktı!", content: "Yeni Whitelist Koruma sistemi ve VIP ID Checker özellikleri eklendi! Keyifli kullanımlar dileriz.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ]
  };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf8");
    return defaultDb;
  }

  try {
    const fileContent = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error reading database file, resetting to default:", error);
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf8");
    return defaultDb;
  }
}

// Read database
function readDb() {
  try {
    const fileContent = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(fileContent);
  } catch {
    return initDatabase();
  }
}

// Write database
function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write to database:", err);
  }
}

// Initialize database
initDatabase();

// Auth Check Helper
function checkUserAccess(discordId: string, adminToken?: string) {
  const db = readDb();
  const sanitizedId = discordId.trim();
  
  const requiredPassword = process.env.ADMIN_PASSWORD || "emir546";
  const isAdminSession = (sanitizedId === "1365990690349121536") || (adminToken && adminToken.trim() === requiredPassword.trim());
  
  if (isAdminSession) {
    return {
      discordId: sanitizedId,
      isAdmin: true,
      isVip: true,
      isWhitelisted: true,
      hasAccess: true,
      referenceCode: "ADMIN-BYPASS"
    };
  }

  // Check Whitelist
  const isWhitelisted = db.whitelist.some((u: any) => u.discordId === sanitizedId);
  
  // Check VIP
  const isVip = db.vips.some((v: any) => v.discordId === sanitizedId);

  // Check Reference Code mapped to this user
  const matchingRef = db.references.find((r: any) => r.usedBy === sanitizedId);

  // User has access if whitelisted or has completed a reference match
  const hasAccess = isWhitelisted || !!matchingRef;

  return {
    discordId: sanitizedId,
    isAdmin: false,
    isVip,
    isWhitelisted,
    hasAccess,
    referenceCode: matchingRef ? matchingRef.code : null
  };
}

// Helper: Parse user id from Discord User Token
function extractUserIdFromToken(token: string): string | null {
  try {
    // Discord tokens have 3 parts separated by dots: Part1_UserIdBase64.Part2_Timestamp.Part3_HMAC
    const cleanedToken = token.trim();
    const parts = cleanedToken.split(".");
    if (parts.length > 0) {
      let base64Part = parts[0];
      // Normalize base64 padding
      while (base64Part.length % 4 !== 0) {
        base64Part += "=";
      }
      const decoded = Buffer.from(base64Part, "base64").toString("utf8");
      // Check if it's a numeric string (Discord ID is ~17-20 digits long)
      if (/^\d{17,21}$/.test(decoded)) {
        return decoded;
      }
    }
  } catch (e) {
    // Ignore and return null
  }
  return null;
}

// ------------------- API ROUTES -------------------

// Auth Status / Session Check
app.post("/api/auth/session", (req, res) => {
  const { discordId, adminToken } = req.body;
  if (!discordId) {
    return res.status(400).json({ error: "discordId gereklidir" });
  }

  const sanitizedId = discordId.trim();
  const session = checkUserAccess(sanitizedId, adminToken);
  res.json(session);
});

// User Login (via Discord ID & Reference)
app.post("/api/auth/login", (req, res) => {
  const { discordId, referenceCode, adminPassword } = req.body;
  if (!discordId) {
    return res.status(400).json({ error: "Discord ID gereklidir!" });
  }

  const sanitizedId = discordId.trim();
  const db = readDb();
  const requiredPassword = process.env.ADMIN_PASSWORD || "emir546";

  // Admin access validation (by ID or by entering any ID + correct Admin Password!)
  if (sanitizedId === "1365990690349121536" || (adminPassword && adminPassword.trim() === requiredPassword.trim())) {
    if (!adminPassword || adminPassword.trim() !== requiredPassword.trim()) {
      return res.status(401).json({ error: "Yönetici şifresi geçersiz! Lütfen doğru şifreyi girin." });
    }
    const session = checkUserAccess(sanitizedId, adminPassword);
    return res.json({ ...session, adminToken: requiredPassword.trim() });
  }

  // Check if they are already registered or have access via Whitelist
  const isWhitelisted = db.whitelist.some((u: any) => u.discordId === sanitizedId);
  if (isWhitelisted) {
    const session = checkUserAccess(sanitizedId);
    return res.json(session);
  }

  // If already has an existing reference code, log them in
  const existingUserRef = db.references.find((r: any) => r.usedBy === sanitizedId);
  if (existingUserRef) {
    const session = checkUserAccess(sanitizedId);
    return res.json(session);
  }

  // Otherwise, a reference code is REQUIRED
  if (!referenceCode) {
    return res.status(401).json({ error: "Sisteme giriş yapmak için referans kodu gereklidir!" });
  }

  // Validate Reference Code
  const refIndex = db.references.findIndex((r: any) => r.code.toUpperCase() === referenceCode.trim().toUpperCase());
  if (refIndex === -1) {
    return res.status(404).json({ error: "Geçersiz referans kodu!" });
  }

  const ref = db.references[refIndex];
  if (ref.usedBy && ref.usedBy !== sanitizedId) {
    return res.status(400).json({ error: "Bu referans kodu başka bir hesap tarafından kullanılmış!" });
  }

  // Claim reference
  if (!ref.usedBy) {
    db.references[refIndex].usedBy = sanitizedId;
    db.references[refIndex].usedAt = new Date().toISOString();
    writeDb(db);
  }

  const session = checkUserAccess(sanitizedId);
  res.json(session);
});

// Normal Category: Token Checker & Account Checker
app.post("/api/tools/token-checker", async (req, res) => {
  const { token, callerId, callerUsername } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Token bulunamadı!" });
  }

  const db = readDb();

  // Parse target User ID from token
  const targetId = extractUserIdFromToken(token);
  
  if (targetId) {
    // SECURITY: Whitelisted users do not show up in token checker!
    const isWhitelisted = db.whitelist.some((w: any) => w.discordId === targetId);
    if (isWhitelisted) {
      // Create safe log inside history
      const log = {
        id: "log_" + Date.now(),
        discordId: callerId || "Bilinmeyen",
        username: callerUsername || "Kullanıcı",
        command: "Token Checker",
        details: `Korumalı ID Engellendi (*${targetId.substring(0, 4)}...*)`,
        timestamp: new Date().toISOString()
      };
      db.logs.unshift(log);
      writeDb(db);

      return res.json({
        whitelisted: true,
        message: "🛡️ Kullanıcı Koruma Altında! Bu ID whiteliste ekli olduğu için Token Checker sorgulaması engellendi."
      });
    }
  }

  // Add Log of action
  const cleanLogToken = token.length > 25 ? `${token.substring(0, 15)}...${token.substring(token.length - 10)}` : "Gizli Token";
  const log = {
    id: "log_" + Date.now(),
    discordId: callerId || "Bilinmeyen",
    username: callerUsername || "Kullanıcı",
    command: "Token Checker",
    details: `Sorgulama yapıldı: ID: ${targetId || "Ayrıştırılamadı"}, Token: ${cleanLogToken}`,
    timestamp: new Date().toISOString()
  };
  db.logs.unshift(log);
  writeDb(db);

  // Attempt real query to Discord Web API
  try {
    let response = await fetch("https://discord.com/api/v10/users/@me", {
      headers: {
        "Authorization": token.startsWith("Bot ") ? token : token
      }
    });

    if (response.ok) {
      const userData = await response.json();
      return res.json({
        valid: true,
        whitelisted: false,
        source: "Discord API",
        data: {
          id: userData.id,
          username: userData.username,
          globalName: userData.global_name,
          avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : null,
          verified: userData.verified,
          email: userData.email || "Gizli",
          phone: userData.phone || "Kayıtlı Değil",
          mfaEnabled: userData.mfa_enabled,
          flags: userData.flags,
          premiumType: userData.premium_type // Nitro status
        }
      });
    } else {
      return res.status(response.status).json({ error: `Sorgulanan token geçersiz veya yetkilendirme hatası (Kodu: ${response.status})` });
    }
  } catch (err: any) {
    return res.status(500).json({ error: `Discord API sorgusu ağ hatası nedeniyle yapılamadı! ${err.message || ""}` });
  }
});

// Normal Category: Account Checker
app.post("/api/tools/account-checker", async (req, res) => {
  const { token, callerId, callerUsername } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Token bulunamadı!" });
  }

  const db = readDb();
  const targetId = extractUserIdFromToken(token);

  if (targetId) {
    // Shield whitelisted users
    const isWhitelisted = db.whitelist.some((w: any) => w.discordId === targetId);
    if (isWhitelisted) {
      const log = {
        id: "log_" + Date.now(),
        discordId: callerId || "Bilinmeyen",
        username: callerUsername || "Kullanıcı",
        command: "Account Checker",
        details: `Korumalı ID Engellendi (*${targetId.substring(0, 4)}...*)`,
        timestamp: new Date().toISOString()
      };
      db.logs.unshift(log);
      writeDb(db);

      return res.json({
        whitelisted: true,
        message: "🛡️ Hesap Koruma Altında! Ekli whiteliste olan hesapların hesap detayları sorgulanamaz."
      });
    }
  }

  const cleanLogToken = token.length > 25 ? `${token.substring(0, 15)}...${token.substring(token.length - 10)}` : "Gizli Token";
  const log = {
    id: "log_" + Date.now(),
    discordId: callerId || "Bilinmeyen",
    username: callerUsername || "Kullanıcı",
    command: "Account Checker",
    details: `Hesap sorgulaması yapıldı: ID: ${targetId || "Ayrıştırılamadı"}, Token: ${cleanLogToken}`,
    timestamp: new Date().toISOString()
  };
  db.logs.unshift(log);
  writeDb(db);

  // Perform full fetch (Connections, billing profile, guilds, user profile info)
  try {
    const authHeaders = { "Authorization": token };
    const [userRes, guildsRes, connectionsRes] = await Promise.all([
      fetch("https://discord.com/api/v10/users/@me", { headers: authHeaders }),
      fetch("https://discord.com/api/v10/users/@me/guilds", { headers: authHeaders }).catch(() => null),
      fetch("https://discord.com/api/v10/users/@me/connections", { headers: authHeaders }).catch(() => null)
    ]);

    if (userRes.ok) {
      const u = await userRes.json();
      const guilds = guildsRes && guildsRes.ok ? await guildsRes.json() : [];
      const connections = connectionsRes && connectionsRes.ok ? await connectionsRes.json() : [];

      return res.json({
        ok: true,
        whitelisted: false,
        source: "Discord API Live",
        account: {
          id: u.id,
          username: u.username,
          globalName: u.global_name,
          avatar: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png` : null,
          banner: u.banner ? `https://cdn.discordapp.com/banners/${u.id}/${u.banner}.png` : null,
          accentColor: u.accent_color,
          mfaEnabled: u.mfa_enabled,
          locale: u.locale,
          verified: u.verified,
          email: u.email || "Aktif Değil",
          phone: u.phone || "Kayıtlı Değil",
          flags: u.flags,
          premiumType: u.premium_type,
          guildCount: guilds.length,
          connections: connections,
          ownedServerCount: guilds.filter((g: any) => g.owner).length
        }
      });
    } else {
      return res.status(userRes.status).json({ error: `Hesap tokeni geçersiz veya Discord API hatası (Kodu: ${userRes.status})` });
    }
  } catch (err: any) {
    return res.status(500).json({ error: `Discord API bağlantı hatası oluştu! ${err.message || ""}` });
  }
});

// Normal Category: Url Sniper (Invite verification)
app.post("/api/tools/url-sniper", async (req, res) => {
  const { url, callerId, callerUsername } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Sorgulanacak URL veya davet kodu bulunamadı!" });
  }

  // Extract invite code
  let inviteCode = url.trim();
  const patterns = [
    /discord\.gg\/([a-zA-Z0-9-]+)/,
    /discord\.com\/invite\/([a-zA-Z0-9-]+)/,
    /discordapp\.com\/invite\/([a-zA-Z0-9-]+)/
  ];

  for (const regex of patterns) {
    const match = inviteCode.match(regex);
    if (match && match[1]) {
      inviteCode = match[1];
      break;
    }
  }

  const db = readDb();
  const log = {
    id: "log_" + Date.now(),
    discordId: callerId || "Bilinmeyen",
    username: callerUsername || "Kullanıcı",
    command: "Url Sniper",
    details: `Davet kontrolü yapıldı: ${inviteCode}`,
    timestamp: new Date().toISOString()
  };
  db.logs.unshift(log);
  writeDb(db);

  // Call official Discord Invite endpoint
  try {
    const response = await fetch(`https://discord.com/api/v10/invites/${inviteCode}?with_counts=true`);
    if (response.ok) {
      const invite = await response.json();
      return res.json({
        exists: true,
        source: "Discord Official API",
        data: {
          code: invite.code,
          guildName: invite.guild?.name || "Bilinmeyen Sunucu",
          guildId: invite.guild?.id,
          guildIcon: invite.guild?.icon ? `https://cdn.discordapp.com/icons/${invite.guild.id}/${invite.guild.icon}.png` : null,
          guildBanner: invite.guild?.banner ? `https://cdn.discordapp.com/banners/${invite.guild.id}/${invite.guild.banner}.png` : null,
          memberCount: invite.approximate_member_count || 0,
          activeCount: invite.approximate_presence_count || 0,
          offlineCount: (invite.approximate_member_count || 0) - (invite.approximate_presence_count || 0),
          channelName: invite.channel?.name || "Lobi",
          inviter: invite.inviter ? {
            username: invite.inviter.username,
            id: invite.inviter.id
          } : null,
          verificationLevel: invite.guild?.verification_level || 0
        }
      });
    } else {
      return res.status(response.status).json({ error: `Sorgulanan Discord sunucu davet linki veya kodu bulunamadı! (Hata: ${response.status})` });
    }
  } catch (error: any) {
    return res.status(500).json({ error: `Discord API davet sorgusu ağ hatası! ${error.message || ""}` });
  }
});

// VIP Category: ID Checker
app.post("/api/tools/id-checker", async (req, res) => {
  const { targetId, callerId, callerUsername } = req.body;
  if (!targetId) {
    return res.status(400).json({ error: "Sorgulanacak Discord ID'si belirtilmelidir!" });
  }

  const db = readDb();
  const systemBotToken = process.env.DISCORD_BOT_TOKEN || "";

  // Log VIP activity
  const log = {
    id: "log_" + Date.now(),
    discordId: callerId || "Bilinmeyen",
    username: callerUsername || "Kullanıcı",
    command: "VIP ID Checker",
    details: `Discord ID sorgulandı: ${targetId} (Sistem Bot Tokeni kullanıldı)`,
    timestamp: new Date().toISOString()
  };
  db.logs.unshift(log);
  writeDb(db);

  // Check database info for this ID as well
  const isTargetWhitelisted = db.whitelist.some((u: any) => u.discordId === targetId);
  const isTargetVip = db.vips.some((v: any) => v.discordId === targetId);
  const matchingRef = db.references.find((r: any) => r.usedBy === targetId);

  try {
    const response = await fetch(`https://discord.com/api/v10/users/${targetId}`, {
      headers: {
        "Authorization": `Bot ${systemBotToken}`
      }
    });

    if (response.ok) {
      const d = await response.json();
      return res.json({
        ok: true,
        source: "Discord API",
        data: {
          id: d.id,
          username: d.username,
          globalName: d.global_name,
          avatar: d.avatar ? `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.png` : null,
          banner: d.banner ? `https://cdn.discordapp.com/banners/${d.id}/${d.banner}.png` : null,
          accentColor: d.accent_color,
          flags: d.public_flags,
          systemStats: {
            isWhitelisted: isTargetWhitelisted,
            isVip: isTargetVip,
            usedReferenceCode: matchingRef ? matchingRef.code : "Yok"
          }
        }
      });
    } else {
      if (response.status === 404) {
        return res.status(404).json({ error: "Sorgulanan Discord ID sistem dışı veya böyle bir kullanıcı bulunamadı!" });
      } else if (response.status === 401) {
        return res.status(401).json({ error: "Yönetici Bot Token kimlik doğrulaması başarısız oldu! (401 Unauthorized)" });
      } else {
        return res.status(response.status).json({ error: `Discord API sorgusu başarısız oldu (Hata Kodu: ${response.status})` });
      }
    }
  } catch (e: any) {
    return res.status(500).json({ error: `Ağ bağlantı hatası: Discord API'sine ulaşılamadı. ${e.message || ""}` });
  }
});

// ------------------- ADMIN PANEL API ROUTHS -------------------

// 1. References GET
app.get("/api/admin/references", (req, res) => {
  const db = readDb();
  res.json(db.references);
});

// 2. References POST (Generate)
app.post("/api/admin/references", (req, res) => {
  const { code, createdBy } = req.body;
  const db = readDb();

  let newCode = code ? code.trim().toUpperCase() : `REF-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  
  // Guard duplicate code
  if (db.references.some((r: any) => r.code === newCode)) {
    return res.status(400).json({ error: "Bu referans kodu zaten mevcut!" });
  }

  const newRef = {
    code: newCode,
    createdBy: createdBy || "1365990690349121536",
    usedBy: null,
    createdAt: new Date().toISOString(),
    usedAt: null
  };

  db.references.push(newRef);
  writeDb(db);
  res.json(newRef);
});

// 3. References DELETE
app.delete("/api/admin/references/:code", (req, res) => {
  const { code } = req.params;
  const db = readDb();

  const initialCount = db.references.length;
  // Filter out
  db.references = db.references.filter((r: any) => r.code !== code);
  
  if (db.references.length === initialCount) {
    return res.status(404).json({ error: "Referans kodu bulunamadı!" });
  }

  writeDb(db);
  res.json({ success: true, message: "Referans silindi. Bu kodu kullanan kullanıcının erişimi sıfırlandı." });
});

// 4. Whitelist GET
app.get("/api/admin/whitelist", (req, res) => {
  const db = readDb();
  res.json(db.whitelist);
});

// 5. Whitelist POST (Add)
app.post("/api/admin/whitelist", (req, res) => {
  const { discordId, username, addedBy } = req.body;
  
  if (!discordId) {
    return res.status(400).json({ error: "Discord ID gereklidir!" });
  }

  const db = readDb();

  // Guard duplicate
  if (db.whitelist.some((w: any) => w.discordId === discordId)) {
    return res.status(400).json({ error: "Bu kullanıcı zaten whitelisted!" });
  }

  const cleanUsername = username ? username.trim() : `W_User_${discordId.substring(0, 4)}`;

  const newWhitelistUser = {
    discordId: discordId.trim(),
    username: cleanUsername,
    avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    addedBy: addedBy || "1365990690349121536",
    createdAt: new Date().toISOString()
  };

  db.whitelist.push(newWhitelistUser);
  writeDb(db);
  res.json(newWhitelistUser);
});

// 6. Whitelist DELETE
app.delete("/api/admin/whitelist/:discordId", (req, res) => {
  const { discordId } = req.params;
  const db = readDb();

  db.whitelist = db.whitelist.filter((w: any) => w.discordId !== discordId);
  writeDb(db);
  res.json({ success: true, message: "Kullanıcı whitelistten silindi." });
});

// 7. VIPs GET
app.get("/api/admin/vips", (req, res) => {
  const db = readDb();
  res.json(db.vips);
});

// 8. VIPs POST (Give VIP Status)
app.post("/api/admin/vips", (req, res) => {
  const { discordId, username, addedBy } = req.body;
  if (!discordId) {
    return res.status(400).json({ error: "Discord ID gereklidir!" });
  }

  const db = readDb();

  if (db.vips.some((v: any) => v.discordId === discordId)) {
    return res.status(400).json({ error: "Kullanıcı zaten VIP yetkilisine sahip!" });
  }

  const cleanUsername = username ? username.trim() : `VIP_User_${discordId.substring(0, 4)}`;

  const newVip = {
    discordId: discordId.trim(),
    username: cleanUsername,
    addedBy: addedBy || "1365990690349121536",
    createdAt: new Date().toISOString()
  };

  db.vips.push(newVip);
  writeDb(db);
  res.json(newVip);
});

// 9. VIPs DELETE
app.delete("/api/admin/vips/:discordId", (req, res) => {
  const { discordId } = req.params;
  const db = readDb();

  db.vips = db.vips.filter((v: any) => v.discordId !== discordId);
  writeDb(db);
  res.json({ success: true, message: "VIP yetkisi geri alındı." });
});

// 10. Command Logs GET
app.get("/api/admin/logs", (req, res) => {
  const db = readDb();
  res.json(db.logs);
});

// 11. Announcements GET
app.get("/api/admin/announcements", (req, res) => {
  const db = readDb();
  res.json(db.announcements);
});

// 12. Announcements POST (Create)
app.post("/api/admin/announcements", (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Başlık ve içerik gereklidir!" });
  }

  const db = readDb();
  const newAnn = {
    id: "ann-" + Date.now(),
    title: title.trim(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.announcements.unshift(newAnn);
  writeDb(db);
  res.json(newAnn);
});

// 13. Announcements PUT (Update)
app.put("/api/admin/announcements/:id", (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Başlık ve içerik gereklidir!" });
  }

  const db = readDb();
  const index = db.announcements.findIndex((a: any) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Duyuru bulunamadı!" });
  }

  db.announcements[index] = {
    ...db.announcements[index],
    title: title.trim(),
    content: content.trim(),
    updatedAt: new Date().toISOString()
  };

  writeDb(db);
  res.json(db.announcements[index]);
});

// 14. Announcements DELETE
app.delete("/api/admin/announcements/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();

  db.announcements = db.announcements.filter((a: any) => a.id !== id);
  writeDb(db);
  res.json({ success: true, message: "Duyuru başarıyla silindi." });
});


// ------------------- VITE ASSET CONTROLLER -------------------

async function startServer() {
  const distPath = path.join(process.cwd(), "dist");
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(distPath);

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
