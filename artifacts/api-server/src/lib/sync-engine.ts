import { eq, and, inArray, or } from "drizzle-orm";
import { db, sourcesTable, categoriesTable, channelsTable, syncHistoryTable } from "@workspace/db";
import type { Source } from "@workspace/db";
import { decrypt } from "./crypto";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskSensitive(value: string): string {
  if (value.length <= 4) return "****";
  return value.slice(0, 2) + "****" + value.slice(-2);
}

function truncateError(msg: string): string {
  return msg.slice(0, 200);
}

// ─── Language detection ────────────────────────────────────────────────────

const ARABIC_PATTERNS = [
  /\b(ar|ara|arabic)\b/i,
  /[\u0600-\u06FF]/,
  /\b(KSA|UAE|EGY|SAU|ARA|LBN|JOR|IRQ|SYR|YEM|OMN|KWT|BHR|QAT|MAR|DZA|TUN|LIB|MRT|SDN|SOM|DJI|COM)\b/i,
];
const ENGLISH_PATTERNS = [/\b(en|eng|english)\b/i, /\b(USA|UK|GBR|AUS|CAN|NZL|IRL)\b/i];

const ARABIC_KEYWORDS = ["العربية", "عربي", "عرب", "قناة", "تلفزيون", "الجزيرة", "mbc", "bein"];
const ENGLISH_KEYWORDS = ["english", "english news", "en ", " en,"];

function detectLanguage(name: string, group?: string): "ar" | "en" | "unknown" {
  const combined = `${name} ${group || ""}`.toLowerCase();
  if (ARABIC_PATTERNS.some((p) => p.test(combined))) return "ar";
  if (ARABIC_KEYWORDS.some((k) => combined.includes(k.toLowerCase()))) return "ar";
  if (ENGLISH_PATTERNS.some((p) => p.test(combined))) return "en";
  if (ENGLISH_KEYWORDS.some((k) => combined.includes(k.toLowerCase()))) return "en";
  return "unknown";
}

function matchesLanguageFilter(lang: string, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "arabic") return lang === "ar";
  if (filter === "english") return lang === "en";
  if (filter === "arabic_english") return lang === "ar" || lang === "en";
  return true;
}

function parseCommaSeparated(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function matchesCountryFilter(country: string | undefined, filterCountries: string[]): boolean {
  if (filterCountries.length === 0) return true;
  if (!country) return false;
  return filterCountries.includes(country.toLowerCase());
}

function matchesCategoryFilter(group: string | undefined, filterCategories: string[]): boolean {
  if (filterCategories.length === 0) return true;
  if (!group) return false;
  const lowerGroup = group.toLowerCase();
  return filterCategories.some((pattern) => lowerGroup.includes(pattern));
}

// ─── M3U ─────────────────────────────────────────────────────────────────

interface M3UEntry {
  name: string;
  logo?: string;
  group?: string;
  url: string;
  tvgId?: string;
  tvgCountry?: string;
  tvgLanguage?: string;
}

function parseM3U(content: string): M3UEntry[] {
  const lines = content.split("\n").map((l) => l.trim());
  const entries: M3UEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("#EXTINF:")) continue;

    const nextLine = lines[i + 1];
    if (!nextLine || nextLine.startsWith("#")) continue;

    const nameMatch = line.match(/,([^,]+)$/);
    const logoMatch = line.match(/tvg-logo="([^"]*)"/);
    const groupMatch = line.match(/group-title="([^"]*)"/);
    const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
    const tvgCountryMatch = line.match(/tvg-country="([^"]*)"/);
    const tvgLanguageMatch = line.match(/tvg-language="([^"]*)"/);

    const name = nameMatch ? nameMatch[1].trim() : "Unknown";
    if (!name || name.toLowerCase() === "unknown") continue;

    entries.push({
      name,
      logo: logoMatch ? logoMatch[1] : undefined,
      group: groupMatch ? groupMatch[1] : undefined,
      url: nextLine,
      tvgId: tvgIdMatch ? tvgIdMatch[1] : undefined,
      tvgCountry: tvgCountryMatch ? tvgCountryMatch[1] : undefined,
      tvgLanguage: tvgLanguageMatch ? tvgLanguageMatch[1] : undefined,
    });
  }

  return entries;
}

async function fetchM3U(url: string): Promise<M3UEntry[]> {
  const response = await fetch(url, {
    headers: { "User-Agent": "EngTv/1.0" },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const content = await response.text();
  return parseM3U(content);
}

// ─── Xtream ────────────────────────────────────────────────────────────────

interface XtreamCategory {
  category_id: string;
  category_name: string;
}

interface XtreamStream {
  stream_id: number;
  name: string;
  stream_icon: string;
  category_id: string;
  stream_url?: string;
  direct_source?: string;
}

async function fetchXtream(
  serverUrl: string,
  username: string,
  password: string
): Promise<{ entries: M3UEntry[]; categories: XtreamCategory[] }> {
  const base = serverUrl.replace(/\/$/, "");

  const [catRes, streamRes] = await Promise.all([
    fetch(
      `${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_categories`,
      { signal: AbortSignal.timeout(30000) }
    ),
    fetch(
      `${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_streams`,
      { signal: AbortSignal.timeout(30000) }
    ),
  ]);

  if (!catRes.ok || !streamRes.ok) {
    throw new Error("فشل الاتصال بخادم Xtream Codes");
  }

  const categories = await catRes.json() as XtreamCategory[];
  const streams = await streamRes.json() as XtreamStream[];

  const catMap = new Map(categories.map((c) => [String(c.category_id), c.category_name]));

  const validStreams = streams.filter(
    (s) => s.stream_id && s.name && String(s.name).trim()
  );

  const entries: M3UEntry[] = validStreams.map((s) => {
    const streamUrl =
      (s.direct_source && s.direct_source.startsWith("http"))
        ? s.direct_source
        : `${base}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${s.stream_id}.m3u8`;

    const logo = s.stream_icon && s.stream_icon.startsWith("http")
      ? s.stream_icon
      : undefined;

    const catKey = s.category_id != null ? String(s.category_id) : null;

    return {
      name: s.name,
      logo,
      group: catKey ? catMap.get(catKey) : undefined,
      url: streamUrl,
      tvgId: String(s.stream_id),
    };
  });

  return { entries, categories };
}

// ─── Standard category auto-detection ────────────────────────────────────

interface StandardCategory {
  name: string;
  icon: string;
  patterns: RegExp[];
}

const STANDARD_CATEGORIES: StandardCategory[] = [
  {
    name: "رياضة",
    icon: "⚽",
    patterns: [
      /\bsport/i, /\bfootball\b/i, /\bsoccer\b/i, /\bbasketball\b/i,
      /\btennis\b/i, /\bcricket\b/i, /\bbeIN\b/i, /\bleague\b/i,
      /\bchampion/i, /\bworldcup\b/i, /رياض/, /كرة/, /كأس/, /دوري/,
    ],
  },
  {
    name: "أفلام",
    icon: "🎬",
    patterns: [
      /\bmovie/i, /\bfilm/i, /\bcinema\b/i, /\bflix\b/i,
      /أفلام/, /سينما/, /\bفيلم\b/,
    ],
  },
  {
    name: "مسلسلات",
    icon: "📺",
    patterns: [
      /\bseries\b/i, /\bdrama\b/i, /\bepisode/i,
      /مسلسل/, /دراما/, /\bserial\b/i,
    ],
  },
  {
    name: "أخبار",
    icon: "📰",
    patterns: [
      /\bnews\b/i, /\bcnn\b/i, /\bbbc\b/i, /\bal.?jazeera\b/i,
      /\beuronews\b/i, /\bnewsy\b/i, /أخبار/, /اخبار/, /الجزيرة/,
      /العربية/, /نشرة/, /\bbreaking\b/i,
    ],
  },
  {
    name: "أطفال",
    icon: "👶",
    patterns: [
      /\bkid/i, /\bchild/i, /\bcartoon/i, /\bbaby\b/i,
      /\btoyor\b/i, /\banimat/i, /أطفال/, /اطفال/, /كرتون/, /طيور/,
    ],
  },
  {
    name: "قرآن",
    icon: "🕌",
    patterns: [
      /\bquran\b/i, /\bquran\b/i, /\bislamic\b/i, /\bmuslim\b/i,
      /قرآن/, /قران/, /إسلام/, /اسلام/, /ديني/, /مسجد/,
    ],
  },
];

const STANDARD_CATEGORY_BY_NAME = new Map(
  STANDARD_CATEGORIES.map((c) => [c.name, c])
);

function detectStandardCategory(name: string, group?: string): StandardCategory | null {
  const haystack = `${name} ${group ?? ""}`;
  for (const cat of STANDARD_CATEGORIES) {
    if (cat.patterns.some((p) => p.test(haystack))) return cat;
  }
  return null;
}

// ─── Batch size for memory optimization ───────────────────────────────────
const BATCH_SIZE = 500;

interface SyncResult {
  success: boolean;
  channels_imported: number;
  categories_imported: number;
  channels_deactivated: number;
  error_message: string | null;
  duration_ms: number;
}

// ─── Normalize channel name for deduplication ─────────────────────────────

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Main sync ─────────────────────────────────────────────────────────────

export async function syncSource(source: Source, retrying = false): Promise<SyncResult> {
  const startTime = Date.now();

  try {
    // ── Phase 1: Fetch ────────────────────────────────────────────────────
    let entries: M3UEntry[] = [];
    let xtreamCategories: XtreamCategory[] = [];

    if (source.type === "m3u") {
      if (!source.url) throw new Error("لم يتم تحديد رابط M3U");
      entries = await fetchM3U(source.url);
    } else if (source.type === "xtream") {
      if (!source.server_url || !source.username || !source.password) {
        throw new Error("بيانات Xtream Codes غير مكتملة");
      }
      const decryptedPassword = decrypt(source.password);
      const result = await fetchXtream(source.server_url, source.username, decryptedPassword);
      entries = result.entries;
      xtreamCategories = result.categories;
    }

    // ── Phase 2: Filter ───────────────────────────────────────────────────
    const filterLang = source.filter_language ?? "all";
    const filterCountries = parseCommaSeparated(source.filter_countries);
    const filterCategories = parseCommaSeparated(source.filter_categories);

    entries = entries.filter((entry) => {
      let lang: "ar" | "en" | "unknown" = "unknown";
      if (entry.tvgLanguage) {
        const tl = entry.tvgLanguage.toLowerCase();
        if (tl.includes("ara") || tl === "ar") lang = "ar";
        else if (tl.includes("eng") || tl === "en") lang = "en";
      } else {
        lang = detectLanguage(entry.name, entry.group);
      }

      if (!matchesLanguageFilter(lang, filterLang)) return false;

      const country = entry.tvgCountry?.toUpperCase();
      if (!matchesCountryFilter(country?.toLowerCase(), filterCountries)) return false;

      if (!matchesCategoryFilter(entry.group, filterCategories)) return false;

      return true;
    });

    // Auto-categorize
    for (const entry of entries) {
      const standard = detectStandardCategory(entry.name, entry.group);
      if (standard) {
        entry.group = standard.name;
      }
    }

    // ── Phase 3: DB operations (inside transaction) ───────────────────────
    const dbResult = await db.transaction(async (tx) => {
      // Create sync history record
      const [historyRecord] = await tx
        .insert(syncHistoryTable)
        .values({ source_id: source.id, status: "running" })
        .returning();

      // Upsert categories
      const categoryCache = new Map<string, number>();
      let categoriesCreated = 0;

      const uniqueGroups = [...new Set(entries.map((e) => e.group).filter(Boolean))] as string[];
      let nextCategorySortOrder = (await tx.select().from(categoriesTable)).length;

      for (const groupName of uniqueGroups) {
        const existingBefore = await tx
          .select()
          .from(categoriesTable)
          .where(eq(categoriesTable.name, groupName));
        const wasNew = existingBefore.length === 0;

        const catIcon = STANDARD_CATEGORY_BY_NAME.get(groupName)?.icon;

        if (existingBefore.length > 0) {
          if (catIcon && !existingBefore[0].icon) {
            await tx
              .update(categoriesTable)
              .set({ icon: catIcon })
              .where(eq(categoriesTable.id, existingBefore[0].id));
          }
          categoryCache.set(groupName, existingBefore[0].id);
        } else {
          const [created] = await tx
            .insert(categoriesTable)
            .values({ name: groupName, icon: catIcon ?? null, sort_order: nextCategorySortOrder, is_visible: true })
            .returning();
          categoryCache.set(groupName, created.id);
          categoriesCreated++;
          nextCategorySortOrder++;
        }
      }

      // Cross-source deduplication: load active channels for dedup maps
      const allChannels = await tx.select().from(channelsTable);

      const byExternalId = new Map<string, typeof allChannels[0]>();
      const byNormalizedName = new Map<string, typeof allChannels[0][]>();

      for (const ch of allChannels) {
        if (ch.external_id) {
          byExternalId.set(ch.external_id, ch);
        }
        const norm = normalizeName(ch.name);
        if (!byNormalizedName.has(norm)) {
          byNormalizedName.set(norm, []);
        }
        byNormalizedName.get(norm)!.push(ch);
      }

      let channelsImported = 0;
      const seenExternalIds = new Set<string>();
      const seenNames = new Set<string>();

      // Determine total existing channel count once
      const existingCount = allChannels.length;

      // Process entries in batches for memory efficiency
      for (let batchStart = 0; batchStart < entries.length; batchStart += BATCH_SIZE) {
        const batch = entries.slice(batchStart, batchStart + BATCH_SIZE);

        const updates: { entry: M3UEntry; existingId: number; logoUrl: string | null }[] = [];
        const inserts: { entry: M3UEntry; sortBase: number }[] = [];

        for (const [idx, entry] of batch.entries()) {
          const categoryId = entry.group ? (categoryCache.get(entry.group) ?? null) : null;
          const externalId = entry.tvgId || null;

          let storedLang: "ar" | "en" | "unknown" = "unknown";
          if (entry.tvgLanguage) {
            const tl = entry.tvgLanguage.toLowerCase();
            if (tl.includes("ara") || tl === "ar") storedLang = "ar";
            else if (tl.includes("eng") || tl === "en") storedLang = "en";
          } else {
            storedLang = detectLanguage(entry.name, entry.group);
          }

          if (externalId) seenExternalIds.add(externalId);
          seenNames.add(entry.name);

          let existingChannel = externalId ? byExternalId.get(externalId) : undefined;

          if (!existingChannel) {
            const norm = normalizeName(entry.name);
            const candidates = byNormalizedName.get(norm) || [];
            existingChannel = candidates.find((c) => c.source_id === source.id)
              ?? candidates[0];
          }

          if (existingChannel) {
            updates.push({ entry, existingId: existingChannel.id, logoUrl: entry.logo || existingChannel.logo_url });
            if (externalId) byExternalId.set(externalId, existingChannel);
          } else {
            inserts.push({ entry, sortBase: existingCount + batchStart + idx });
          }

          channelsImported++;
        }

        // Batch updates
        for (const u of updates) {
          await tx
            .update(channelsTable)
            .set({
              name: u.entry.name,
              stream_url: u.entry.url,
              logo_url: u.logoUrl,
              is_active: true,
            })
            .where(eq(channelsTable.id, u.existingId));
        }

        // Batch inserts
        if (inserts.length > 0) {
          const insertValues = inserts.map((ins) => {
            const categoryId = ins.entry.group ? (categoryCache.get(ins.entry.group) ?? null) : null;
            const externalId = ins.entry.tvgId || null;
            let storedLang: "ar" | "en" | "unknown" = "unknown";
            if (ins.entry.tvgLanguage) {
              const tl = ins.entry.tvgLanguage.toLowerCase();
              if (tl.includes("ara") || tl === "ar") storedLang = "ar";
              else if (tl.includes("eng") || tl === "en") storedLang = "en";
            } else {
              storedLang = detectLanguage(ins.entry.name, ins.entry.group);
            }
            return {
              name: ins.entry.name,
              stream_url: ins.entry.url,
              logo_url: ins.entry.logo || null,
              category_id: categoryId,
              source_id: source.id,
              external_id: externalId,
              is_active: true,
              sort_order: ins.sortBase,
              language: storedLang,
            };
          });

          const inserted = await tx.insert(channelsTable).values(insertValues).returning();

          // Update dedup maps with newly inserted channels
          for (const ins of inserted) {
            if (ins.external_id) byExternalId.set(ins.external_id, ins);
            const norm = normalizeName(ins.name);
            if (!byNormalizedName.has(norm)) {
              byNormalizedName.set(norm, []);
            }
            byNormalizedName.get(norm)!.push(ins);
          }
        }
      }

      // Deactivate channels from this source no longer present
      const existingSourceChannels = await tx
        .select()
        .from(channelsTable)
        .where(and(eq(channelsTable.source_id, source.id), eq(channelsTable.is_active, true)));

      const toDeactivate = existingSourceChannels.filter((ch) => {
        if (ch.external_id && seenExternalIds.has(ch.external_id)) return false;
        if (!ch.external_id && seenNames.has(ch.name)) return false;
        return true;
      });

      let channelsDeactivated = 0;
      if (toDeactivate.length > 0) {
        // Deactivate in batches
        for (let i = 0; i < toDeactivate.length; i += BATCH_SIZE) {
          const batch = toDeactivate.slice(i, i + BATCH_SIZE);
          await tx
            .update(channelsTable)
            .set({ is_active: false, is_healthy: false, health_error: "لم يعد متاحاً في المصدر" })
            .where(inArray(channelsTable.id, batch.map((c) => c.id)));
        }
        channelsDeactivated = toDeactivate.length;
      }

      const duration = Date.now() - startTime;

      // Update sync history
      await tx
        .update(syncHistoryTable)
        .set({
          status: "success",
          channels_imported: channelsImported,
          categories_imported: categoriesCreated,
          channels_deactivated: channelsDeactivated,
          completed_at: new Date(),
        })
        .where(eq(syncHistoryTable.id, historyRecord.id));

      // Update source
      const intervalHours = source.sync_interval_hours ?? 0;
      const nextSyncAt =
        intervalHours > 0
          ? new Date(Date.now() + intervalHours * 60 * 60 * 1000)
          : null;

      await tx
        .update(sourcesTable)
        .set({
          last_sync_at: new Date(),
          last_successful_sync_at: new Date(),
          channel_count: channelsImported,
          category_count: xtreamCategories.length || uniqueGroups.length,
          updated_at: new Date(),
          ...(nextSyncAt !== undefined ? { next_sync_at: nextSyncAt } : {}),
        })
        .where(eq(sourcesTable.id, source.id));

      return { channelsImported, categoriesCreated, channelsDeactivated, duration };
    });

    return {
      success: true,
      channels_imported: dbResult.channelsImported,
      categories_imported: dbResult.categoriesCreated,
      channels_deactivated: dbResult.channelsDeactivated,
      error_message: null,
      duration_ms: dbResult.duration,
    };
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : "خطأ غير معروف";
    const errorMessage = truncateError(rawMessage);
    const duration = Date.now() - startTime;

    // Record failure outside transaction (or we can start one if it's safe)
    try {
      // Minimal write to mark failure
      await db
        .update(sourcesTable)
        .set({ last_sync_at: new Date(), updated_at: new Date() })
        .where(eq(sourcesTable.id, source.id));
    } catch {
      // Ignore secondary failures
    }

    // Auto-retry with exponential backoff for transient errors
    if (!retrying) {
      const isTransient = err instanceof Error && (
        err.message.includes("HTTP") ||
        err.message.includes("timeout") ||
        err.message.includes("ETIMEDOUT") ||
        err.message.includes("ECONNRESET") ||
        err.message.includes("fetch failed")
      );
      if (isTransient) {
        const backoffMs = Math.min((source.retry_count ?? 0 + 1) * 5_000, 30_000);
        await new Promise((r) => setTimeout(r, backoffMs));
        // Increment retry count on source for tracking
        try {
          await db
            .update(sourcesTable)
            .set({ retry_count: (source.retry_count ?? 0) + 1, updated_at: new Date() })
            .where(eq(sourcesTable.id, source.id));
        } catch { /* best-effort */ }
        return syncSource(source, true);
      }
    }

    return {
      success: false,
      channels_imported: 0,
      categories_imported: 0,
      channels_deactivated: 0,
      error_message: errorMessage,
      duration_ms: duration,
    };
  }
}
