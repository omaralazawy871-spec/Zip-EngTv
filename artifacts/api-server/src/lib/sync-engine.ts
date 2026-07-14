import { eq } from "drizzle-orm";
import { db, sourcesTable, categoriesTable, channelsTable, syncHistoryTable } from "@workspace/db";
import type { Source } from "@workspace/db";

interface SyncResult {
  success: boolean;
  channels_imported: number;
  categories_imported: number;
  error_message: string | null;
  duration_ms: number;
}

interface M3UEntry {
  name: string;
  logo?: string;
  group?: string;
  url: string;
  tvgId?: string;
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

    const name = nameMatch ? nameMatch[1].trim() : "Unknown";
    if (!name || name.toLowerCase() === "unknown") continue;

    entries.push({
      name,
      logo: logoMatch ? logoMatch[1] : undefined,
      group: groupMatch ? groupMatch[1] : undefined,
      url: nextLine,
      tvgId: tvgIdMatch ? tvgIdMatch[1] : undefined,
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
    fetch(`${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_categories`, {
      signal: AbortSignal.timeout(30000),
    }),
    fetch(`${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_streams`, {
      signal: AbortSignal.timeout(30000),
    }),
  ]);

  if (!catRes.ok || !streamRes.ok) {
    throw new Error("فشل الاتصال بخادم Xtream Codes");
  }

  const categories: XtreamCategory[] = await catRes.json();
  const streams: XtreamStream[] = await streamRes.json();

  const catMap = new Map(categories.map((c) => [c.category_id, c.category_name]));

  const entries: M3UEntry[] = streams.map((s) => ({
    name: s.name,
    logo: s.stream_icon || undefined,
    group: s.category_id ? catMap.get(s.category_id) : undefined,
    url: `${base}/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${s.stream_id}`,
    tvgId: String(s.stream_id),
  }));

  return { entries, categories };
}

async function getOrCreateCategory(name: string, nextSortOrder: number): Promise<number> {
  const existing = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.name, name));

  if (existing.length > 0) return existing[0].id;

  const [created] = await db
    .insert(categoriesTable)
    .values({ name, sort_order: nextSortOrder, is_visible: true })
    .returning();

  return created.id;
}

export async function syncSource(source: Source): Promise<SyncResult> {
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

    // Track category IDs created/found this sync
    const categoryCache = new Map<string, number>();
    let categoriesImported = 0;

    // Upsert categories
    const uniqueGroups = [...new Set(entries.map((e) => e.group).filter(Boolean))] as string[];
    let nextCategorySortOrder = (await db.select().from(categoriesTable)).length;
    for (const groupName of uniqueGroups) {
      const catId = await getOrCreateCategory(groupName, nextCategorySortOrder);
      categoryCache.set(groupName, catId);
      categoriesImported++;
      nextCategorySortOrder++;
    }

    // Upsert channels - match by external_id + source_id, or name + source_id
    // Fetch existing channels for this source ONCE up front (not per-entry) to
    // avoid O(n) full-table scans per channel, which times out large playlists.
    let channelsImported = 0;

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
      const categoryId = entry.group ? categoryCache.get(entry.group) ?? null : null;
      const externalId = entry.tvgId || null;

      const existingChannel =
        (externalId ? byExternalId.get(externalId) : undefined) ?? byName.get(entry.name) ?? null;

      if (existingChannel) {
        // Update existing
        await db
          .update(channelsTable)
          .set({
            name: entry.name,
            stream_url: entry.url,
            logo_url: entry.logo || existingChannel.logo_url,
            category_id: categoryId,
            is_active: true,
          })
          .where(eq(channelsTable.id, existingChannel.id));
      } else {
        // Insert new
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
          })
          .returning();

        // Keep local caches in sync so later duplicate entries in the same
        // playlist match against this newly-inserted row instead of re-inserting.
        if (externalId) byExternalId.set(externalId, inserted);
        byName.set(entry.name, inserted);
      }

      channelsImported++;
    }

    const duration = Date.now() - startTime;

    // Update sync history
    await db
      .update(syncHistoryTable)
      .set({
        status: "success",
        channels_imported: channelsImported,
        categories_imported: categoriesImported,
        completed_at: new Date(),
      })
      .where(eq(syncHistoryTable.id, historyRecord.id));

    // Update source stats
    await db
      .update(sourcesTable)
      .set({
        last_sync_at: new Date(),
        last_successful_sync_at: new Date(),
        channel_count: channelsImported,
        category_count: xtreamCategories.length || uniqueGroups.length,
        updated_at: new Date(),
      })
      .where(eq(sourcesTable.id, source.id));

    return {
      success: true,
      channels_imported: channelsImported,
      categories_imported: categoriesImported,
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

    return {
      success: false,
      channels_imported: 0,
      categories_imported: 0,
      error_message: errorMessage,
      duration_ms: duration,
    };
  }
}
