import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListSources,
  useCreateSource,
  useUpdateSource,
  useDeleteSource,
  useSyncSource,
  useSyncAllSources,
  useRetrySyncSource,
  useGetSyncHistory,
  useGetSchedulerStatus,
  getListSourcesQueryKey,
  getGetAdminStatsQueryKey,
  getGetSchedulerStatusQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CardGridSkeleton } from "@/components/admin/table-skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import { SourceCard } from "@/components/admin/sources/source-card";
import { SchedulerStatusBar } from "@/components/admin/sources/scheduler-status-bar";
import { SyncHistorySection } from "@/components/admin/sources/sync-history-section";
import { SourceDialog, defaultForm } from "@/components/admin/sources/source-dialog";
import type { Source } from "@workspace/api-client-react";
import type { SourceForm } from "@/components/admin/sources/source-dialog";

export default function AdminSources() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [form, setForm] = useState<SourceForm>(defaultForm);
  const [syncingIds, setSyncingIds] = useState<Set<number>>(new Set());
  const [retryingIds, setRetryingIds] = useState<Set<number>>(new Set());

  const { data: sources = [], isLoading } = useListSources();
  const { data: syncHistory = [] } = useGetSyncHistory();
  const { data: schedulerStatus } = useGetSchedulerStatus();

  const createSource = useCreateSource();
  const updateSource = useUpdateSource();
  const deleteSource = useDeleteSource();
  const syncSource = useSyncSource();
  const retrySyncSource = useRetrySyncSource();
  const syncAllSources = useSyncAllSources();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListSourcesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSchedulerStatusQueryKey() });
  };

  const openAdd = () => {
    setEditingSource(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (src: Source) => {
    setEditingSource(src);
    setForm({
      name: src.name,
      type: src.type as SourceForm["type"],
      status: src.status as SourceForm["status"],
      url: src.url ?? "",
      server_url: src.server_url ?? "",
      username: src.username ?? "",
      password: src.password ?? "",
      filter_language: (src.filter_language as SourceForm["filter_language"]) ?? "all",
      filter_countries: src.filter_countries ?? "",
      filter_categories: src.filter_categories ?? "",
      sync_interval_hours: src.sync_interval_hours ?? 0,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: "خطأ", description: "الاسم مطلوب", variant: "destructive" });
      return;
    }
    if (form.type === "m3u" && !form.url.trim()) {
      toast({ title: "خطأ", description: "رابط M3U مطلوب", variant: "destructive" });
      return;
    }
    if (form.type === "xtream" && !form.server_url.trim()) {
      toast({ title: "خطأ", description: "رابط السيرفر مطلوب", variant: "destructive" });
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      status: form.status,
      url: form.type === "m3u" ? form.url.trim() : null,
      server_url: form.type === "xtream" ? form.server_url.trim() : null,
      username: form.type === "xtream" ? form.username.trim() || null : null,
      password: form.type === "xtream" ? form.password.trim() || null : null,
      filter_language: form.filter_language,
      filter_countries: form.filter_countries.trim() || null,
      filter_categories: form.filter_categories.trim() || null,
      sync_interval_hours: form.sync_interval_hours,
    };

    try {
      if (editingSource) {
        await updateSource.mutateAsync({ id: editingSource.id, data: payload });
        toast({ title: "تم التحديث", description: "تم تحديث المصدر بنجاح" });
      } else {
        await createSource.mutateAsync({ data: payload });
        toast({ title: "تمت الإضافة", description: "تمت إضافة المصدر بنجاح" });
      }
      setDialogOpen(false);
      invalidate();
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الحفظ", variant: "destructive" });
    }
  };

  const handleDelete = async (src: Source) => {
    if (!window.confirm(`هل تريد حذف المصدر "${src.name}"؟`)) return;
    try {
      await deleteSource.mutateAsync({ id: src.id });
      toast({ title: "تم الحذف", description: "تم حذف المصدر" });
      invalidate();
    } catch {
      toast({ title: "خطأ", description: "فشل حذف المصدر", variant: "destructive" });
    }
  };

  const handleSync = async (src: Source) => {
    setSyncingIds((prev) => new Set(prev).add(src.id));
    try {
      const result = await syncSource.mutateAsync({ id: src.id });
      toast({
        title: "تمت المزامنة",
        description: `✅ ${result.channels_imported} قناة  🗂 ${result.categories_imported} تصنيف  ❌ ${result.channels_deactivated ?? 0} محذوف`,
      });
      invalidate();
    } catch {
      toast({ title: "خطأ", description: "فشل المزامنة", variant: "destructive" });
    } finally {
      setSyncingIds((prev) => { const n = new Set(prev); n.delete(src.id); return n; });
    }
  };

  const handleRetry = async (src: Source) => {
    setRetryingIds((prev) => new Set(prev).add(src.id));
    try {
      const result = await retrySyncSource.mutateAsync({ id: src.id });
      toast({
        title: result.success ? "تمت إعادة المزامنة" : "فشلت المزامنة مجدداً",
        description: result.success
          ? `تم استيراد ${result.channels_imported} قناة`
          : result.error_message ?? "خطأ غير معروف",
        variant: result.success ? "default" : "destructive",
      });
      invalidate();
    } catch {
      toast({ title: "خطأ", description: "فشل إعادة المحاولة", variant: "destructive" });
    } finally {
      setRetryingIds((prev) => { const n = new Set(prev); n.delete(src.id); return n; });
    }
  };

  const handleSyncAll = async () => {
    try {
      const result = await syncAllSources.mutateAsync();
      toast({
        title: "تمت مزامنة الكل",
        description: `تم استيراد ${result.total_channels} قناة من ${result.sources_synced} مصدر`,
      });
      invalidate();
    } catch {
      toast({ title: "خطأ", description: "فشل مزامنة المصادر", variant: "destructive" });
    }
  };

  const isMutating = createSource.isPending || updateSource.isPending;
  const isSyncingAll = syncAllSources.isPending;

  const getSourceName = (sourceId: number) =>
    sources.find((s) => s.id === sourceId)?.name ?? `مصدر #${sourceId}`;

  const getLastFailedSyncForSource = (sourceId: number) =>
    syncHistory
      .filter((h) => h.source_id === sourceId && h.status === "failed")
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">مصادر IPTV</h1>
            <p className="text-muted-foreground text-sm mt-1">إدارة مصادر البث والمزامنة</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSyncAll} disabled={isSyncingAll}>
              {isSyncingAll ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <RefreshCw className="w-4 h-4 ml-2" />}
              مزامنة الكل
            </Button>
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة مصدر
            </Button>
          </div>
        </div>

        <SchedulerStatusBar status={schedulerStatus} />

        {/* Sources Grid */}
        {isLoading ? (
          <CardGridSkeleton count={6} />
        ) : sources.length === 0 ? (
          <div className="bg-card border border-card-border rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-lg font-medium">لا توجد مصادر IPTV</p>
            <p className="text-sm mt-1">أضف مصدر M3U أو Xtream Codes لاستيراد القنوات</p>
            <Button className="mt-4" onClick={openAdd}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة مصدر
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sources.map((src) => {
              const isSyncing = syncingIds.has(src.id);
              const isRetrying = retryingIds.has(src.id);
              const lastFailed = getLastFailedSyncForSource(src.id);
              const lastSyncFailed = !!(
                src.last_sync_at &&
                (!src.last_successful_sync_at ||
                  new Date(src.last_sync_at) > new Date(src.last_successful_sync_at))
              );

              return (
                <SourceCard
                  key={src.id}
                  source={src}
                  isSyncing={isSyncing}
                  isRetrying={isRetrying}
                  lastFailed={lastFailed}
                  lastSyncFailed={lastSyncFailed}
                  onSync={() => handleSync(src)}
                  onRetry={() => handleRetry(src)}
                  onEdit={() => openEdit(src)}
                  onDelete={() => handleDelete(src)}
                />
              );
            })}
          </div>
        )}

        <SyncHistorySection history={syncHistory} getSourceName={getSourceName} />
      </div>

      <SourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingSource={editingSource}
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        isMutating={isMutating}
      />
    </AdminLayout>
  );
}
