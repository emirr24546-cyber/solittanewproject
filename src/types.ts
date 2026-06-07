export interface Reference {
  code: string;
  createdBy: string;
  usedBy: string | null;
  createdAt: string;
  usedAt: string | null;
}

export interface WhitelistUser {
  discordId: string;
  username: string;
  avatar: string | null;
  addedBy: string;
  createdAt: string;
}

export interface VipUser {
  discordId: string;
  username: string;
  addedBy: string;
  createdAt: string;
}

export interface CommandLog {
  id: string;
  discordId: string;
  username: string;
  command: string;
  details: string;
  timestamp: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionInfo {
  discordId: string;
  isAdmin: boolean;
  isVip: boolean;
  isWhitelisted: boolean;
  hasAccess: boolean;
  referenceCode: string | null;
}
