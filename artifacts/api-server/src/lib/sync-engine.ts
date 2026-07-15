import { eq, and, inArray, notInArray } from "drizzle-orm";
import { db, sourcesTable, categoriesTable, channelsTable, syncHistoryTable } from "@workspace/db";
import type { Source } from "@workspace/db";

// ─── Language detection ────────────────────────────────────────────────────

const ARABIC_PATTERNS = [
  /\b(ar|ara|arabic)\b/i,
  /[\u0600-\u06FF]/, // Arabic unicode range
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

  const categories: XtreamCategory[] = await catRes.json();
  const streams: XtreamStream[] = await streamRes.json();

  // Normalise category_id to string — Xtream servers sometimes return it as
  // an integer in JSON, which would cause Map lookups to silently miss when
  // comparing against string keys.
  const catMap = new Map(categories.map((c) => [String(c.category_id), c.category_name]));

  // Filter out malformed stream entries before mapping
  const validStreams = streams.filter(
    (s) => s.stream_id && s.name && String(s.name).trim()
  );

  const entries: M3UEntry[] = validStreams.map((s) => {
    // Prefer direct_source when provided; otherwise build the standard Xtream
    // HLS URL.  The URL MUST end in .m3u8 so the server returns an HLS
    // manifest — without the extension most Xtream servers send raw MPEG-TS
    // which HLS.js cannot play.
    const streamUrl =
      (s.direct_source && s.direct_source.startsWith("http"))
        ? s.direct_source
        : `${base}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${s.stream_id}.m3u8`;

    // stream_icon is a full URL or an empty string — treat empty as absent
    const logo = s.stream_icon && s.stream_icon.startsWith("http")
      ? s.stream_icon
      : undefined;

    // Normalise category_id to string for the lookup (mirrors catMap key above)
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

// ─── Category helpers ──────────────────────────────────────────────────────

async function getOrCreateCategory(name: string, nextSortOrder: number): Promise<number> {
  const existing = await db.select().from(categoriesTable).where(eq(categoriesTable.name, name));
  if (existing.length > 0) return existing[0].id;

  const [created] = await db
    .insert(categoriesTable)
    .values({ name, sort_order: nextSortOrder, is_visible: true })
    .returning();
  return created.id;
}

// ─── Dead channel detection ────────────────────────────────────────────────

async function deactivateMissingChannels(
  sourceId: number,
  seenExternalIds: Set<string>,
  seenNames: Set<string>
): Promise<number> {
  // Find channels from this source that were NOT seen in this sync
  const existingChannels = await db
    .select()
    .from(channelsTable)
    .where(and(eq(channelsTable.source_id, sourceId), eq(channelsTable.is_active, true)));

  const toDeactivate = existingChannels.filter((ch) => {
    if (ch.external_id && seenExternalIds.has(ch.external_id)) return false;
    if (!ch.external_id && seenNames.has(ch.name)) return false;
    return true;
  });

  if (toDeactivate.length > 0) {
    await db
      .update(channelsTable)
      .set({ is_active: false, is_healthy: false, health_error: "لم يعد متاحاً في المصدر" })
      .where(
        inArray(
          channelsTable.id,
          toDeactivate.map((c) => c.id)
        )
      );
  }

  return toDeactivate.length;
}

// ─── Main sync ─────────────────────────────────────────────────────────────

interface SyncResult {
  success: boolean;
  channels_imported: number;
  categories_imported: number;
  channels_deactivated: number;
  error_message: string | null;
  duration_ms: number;
}

export async function syncSource(source: Source, retrying = false): Promise<SyncResult> {
  const startTime = Date.now();

  // Create sync history record
  const [historyRecord] = await db
    .insert(syncHistoryTable)
    .values({ source_id: source.id, status: "running" })
    .returning();

  try {
    let entries: M3UEntry[] = [];
    let xtreamCategories: XtreamCategory[] = [];

    if (source.type === "m3u") {
      if (!source.url) throw new Error("لم يتم تحديد رابط M3U");
      entries = await fetchM3U(source.url);
    } else if (source.type === "xtream") {
      if (!source.server_url || !source.username || !source.password) {
        throw new Error("بيانات Xtream Codes غير مكتملة");
      }
      const result = await fetchXtream(source.server_url, source.username, source.password);
      entries = result.entries;
      xtreamCategories = result.categories;
    }

    // ── Apply per-source import filters ────────────────────────────────────
    const filterLang = source.filter_language ?? "all";
    const filterCountries = parseCommaSeparated(source.filter_countries);
    const filterCategories = parseCommaSeparated(source.filter_categories);

    entries = entries.filter((entry) => {
      // Determine language: prefer tvg-language tag, fallback to detection
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

    // ── Upsert categories ──────────────────────────────────────────────────
    const categoryCache = new Map<string, number>();
    let categoriesCreated = 0;

    const uniqueGroups = [...new Set(entries.map((e) => e.group).filter(Boolean))] as string[];
    let nextCategorySortOrder = (await db.select().from(categoriesTable)).length;

    for (const groupName of uniqueGroups) {
      const existingBefore = await db
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.name, groupName));
      const wasNew = existingBefore.length === 0;

      const catId = await getOrCreateCategory(groupName, nextCategorySortOrder);
      categoryCache.set(groupName, catId);

      if (wasNew) {
        categoriesCreated++;
        nextCategorySortOrder++;
      }
    }

    // ── Upsert channels ────────────────────────────────────────────────────
    let channelsImported = 0;
    const seenExternalIds = new Set<string>();
    const seenNames = new Set<string>();

    const existingForSource = await db
      .select()
      .from(channelsTable)
      .where(eq(channelsTable.source_id, source.id));

    const byExternalId = new Map(
      existingForSource.filter((c) => c.external_id).map((c) => [c.external_id as string, c])
    );
    const byName = new Map(existingForSource.map((c) => [c.name, c]));

    const totalChannelsCount = (await db.select().from(channelsTable)).length;
    let nextSortOrder = totalChannelsCount;

    for (const entry of entries) {
      const categoryId = entry.group ? (categoryCache.get(entry.group) ?? null) : null;
      const externalId = entry.tvgId || null;
      const country = entry.tvgCountry?.toUpperCase() || null;

      // Determine language for storage
      let storedLang: "ar" | "en" | "unknown" = "unknown";
      if (entry.tvgLanguage) {
        const tl = entry.tvgLanguage.toLowerCase();
        if (tl.includes("ara") || tl === "ar") storedLang = "ar";
        else if (tl.includes("eng") || tl === "en") storedLang = "en";
      } else {
        storedLang = detectLanguage(entry.name, entry.group);
      }

      // Track seen for dead-channel detection
      if (externalId) seenExternalIds.add(externalId);
      seenNames.add(entry.name);

      const existingChannel =
        (externalId ? byExternalId.get(externalId) : undefined) ??
        byName.get(entry.name) ??
        null;

      if (existingChannel) {
        await db
          .update(channelsTable)
          .set({
            name: entry.name,
            stream_url: entry.url,
            logo_url: entry.logo || existingChannel.logo_url,
            category_id: categoryId,
            is_active: true,
            language: storedLang,
            country,
          })
          .where(eq(channelsTable.id, existingChannel.id));
      } else {
        const [inserted] = await db
          .insert(channelsTable)
          .values({
            name: entry.name,
            stream_url: entry.url,
            logo_url: entry.logo || null,
            category_id: categoryId,
            source_id: source.id,
            external_id: externalId,
            is_active: true,
            sort_order: nextSortOrder++,
            language: storedLang,
            country,
          })
          .returning();

        if (externalId) byExternalId.set(externalId, inserted);
        byName.set(entry.name, inserted);
      }

      channelsImported++;
    }

    // ── Deactivate channels no longer in source ────────────────────────────
    const channelsDeactivated = await deactivateMissingChannels(
      source.id,
      seenExternalIds,
      seenNames
    );

    const duration = Date.now() - startTime;

    // Update sync history with deactivation count
    await db
      .update(syncHistoryTable)
      .set({
        status: "success",
        channels_imported: channelsImported,
        categories_imported: categoriesCreated,
        channels_deactivated: channelsDeactivated,
        completed_at: new Date(),
      })
      .where(eq(syncHistoryTable.id, historyRecord.id));

    // Compute next_sync_at for auto-scheduler
    const intervalHours = source.sync_interval_hours ?? 0;
    const nextSyncAt =
      intervalHours > 0
        ? new Date(Date.now() + intervalHours * 60 * 60 * 1000)
        : null;

    await db
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

    return {
      success: true,
      channels_imported: channelsImported,
      categories_imported: categoriesCreated,
      channels_deactivated: channelsDeactivated,
      error_message: null,
      duration_ms: duration,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "خطأ غير معروف";
    const duration = Date.now() - startTime;

    await db
      .update(syncHistoryTable)
      .set({
        status: "failed",
        error_message: errorMessage,
        completed_at: new Date(),
      })
      .where(eq(syncHistoryTable.id, historyRecord.id));

    await db
      .update(sourcesTable)
      .set({ last_sync_at: new Date(), updated_at: new Date() })
      .where(eq(sourcesTable.id, source.id));

    // Auto-retry once for network errors
    if (!retrying && err instanceof Error && err.message.includes("HTTP")) {
      await new Promise((r) => setTimeout(r, 5000));
      return syncSource(source, true);
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
