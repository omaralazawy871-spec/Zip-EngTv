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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Pencil, Trash2, RefreshCw, RotateCcw, Clock } from "lucide-react";
import type { Source } from "@workspace/api-client-react";

type SourceType = "m3u" | "xtream";

interface SourceForm {
  name: string;
  type: SourceType;
  status: "active" | "inactive";
  // M3U
  url: string;
  // Xtream
  server_url: string;
  username: string;
  password: string;
  // Filters
  filter_language: "all" | "arabic" | "english" | "arabic_english";
  filter_countries: string;
  filter_categories: string;
  // Scheduler
  sync_interval_hours: number;
}

const defaultForm: SourceForm = {
  name: "",
  type: "m3u",
  status: "active",
  url: "",
  server_url: "",
  username: "",
  password: "",
  filter_language: "all",
  filter_countries: "",
  filter_categories: "",
  sync_interval_hours: 0,
};

const INTERVAL_OPTIONS = [
  { value: 0, label: "يدوي فقط" },
  { value: 1, label: "كل ساعة" },
  { value: 3, label: "كل 3 ساعات" },
  { value: 6, label: "كل 6 ساعات" },
  { value: 12, label: "كل 12 ساعة" },
  { value: 24, label: "كل يوم" },
  { value: 48, label: "كل يومين" },
  { value: 168, label: "كل أسبوع" },
];

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
      type: src.type as SourceType,
      status: src.status as "active" | "inactive",
      url: src.url ?? "",
      server_url: src.server_url ?? "",
      username: src.username ?? "",
      password: src.password ?? "",
      filter_language: (src.filter_language as "all" | "arabic" | "english" | "arabic_english") ?? "all",
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

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "لم يتم بعد";
    return new Date(dateStr).toLocaleString("ar");
  };

  const isMutating = createSource.isPending || updateSource.isPending;
  const isSyncingAll = syncAllSources.isPending;

  const getSourceFromHistory = (sourceId: number) =>
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

        {/* Scheduler status */}
        {schedulerStatus && schedulerStatus.scheduled_sources.length > 0 && (
          <div className="bg-card border border-card-border rounded-xl p-4 flex flex-wrap gap-3 items-center">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-medium">المزامنة التلقائية:</span>
            {schedulerStatus.scheduled_sources.map((ss) => (
              <div key={ss.source_id} className="flex items-center gap-2 text-xs bg-secondary rounded-lg px-3 py-1">
                <span className="font-medium">{ss.source_name}</span>
                <span className="text-muted-foreground">كل {ss.sync_interval_hours}س</span>
                {ss.next_sync_at && (
                  <span className="text-muted-foreground">· القادمة: {formatDate(ss.next_sync_at)}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sources Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
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
              const lastSyncFailed =
                src.last_sync_at &&
                (!src.last_successful_sync_at ||
                  new Date(src.last_sync_at) > new Date(src.last_successful_sync_at));

              return (
                <div key={src.id} className="bg-card border border-card-border rounded-2xl shadow-sm p-6 flex flex-col gap-4">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base leading-tight truncate">{src.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <Badge variant="secondary" className="text-xs">
                          {src.type === "xtream" ? "Xtream Codes" : "M3U"}
                        </Badge>
                        {src.status === "active" ? (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                            نشط
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" />
                            معطل
                          </span>
                        )}
                        {/* Filter tags */}
                        {src.filter_language !== "all" && (
                          <Badge variant="outline" className="text-xs">
                            {src.filter_language === "arabic"
                              ? "🇸🇦 عربي"
                              : src.filter_language === "english"
                              ? "🇺🇸 إنجليزي"
                              : "🇸🇦🇺🇸 عربي+إنجليزي"}
                          </Badge>
                        )}
                        {src.sync_interval_hours > 0 && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Clock className="w-3 h-3" />
                            {src.sync_interval_hours}س
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{src.channel_count ?? 0} قناة</span>
                    <span>{src.category_count ?? 0} تصنيف</span>
                  </div>

                  {/* Last sync */}
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>آخر مزامنة: {formatDate(src.last_sync_at)}</p>
                    {lastSyncFailed && lastFailed?.error_message && (
                      <p className="text-destructive truncate" title={lastFailed.error_message}>
                        ⚠️ {lastFailed.error_message}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t border-border flex-wrap">
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleSync(src)} disabled={isSyncing || isRetrying}>
                      {isSyncing ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <RefreshCw className="w-4 h-4 ml-1" />}
                      مزامنة
                    </Button>
                    {lastSyncFailed && (
                      <Button variant="ghost" size="sm" onClick={() => handleRetry(src)} disabled={isSyncing || isRetrying}>
                        {isRetrying ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <RotateCcw className="w-4 h-4 ml-1" />}
                        إعادة
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEdit(src)}>
                      <Pencil className="w-4 h-4 ml-1" />
                      تعديل
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(src)}>
                      <Trash2 className="w-4 h-4 ml-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sync History */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">سجل المزامنة</h2>
          <div className="bg-card border border-card-border rounded-2xl shadow-sm overflow-hidden">
            {syncHistory.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                لا يوجد سجل مزامنة بعد
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">المصدر</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">مستورد</TableHead>
                    <TableHead className="text-right">محذوف</TableHead>
                    <TableHead className="text-right">رسالة الخطأ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(entry.started_at).toLocaleString("ar")}
                      </TableCell>
                      <TableCell className="text-sm">{getSourceFromHistory(entry.source_id)}</TableCell>
                      <TableCell>
                        {entry.status === "success" ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">نجاح</Badge>
                        ) : entry.status === "failed" ? (
                          <Badge variant="destructive">فشل</Badge>
                        ) : (
                          <Badge variant="secondary">جارٍ</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{entry.channels_imported ?? 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{entry.channels_deactivated ?? 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {entry.error_message ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>{editingSource ? "تعديل المصدر" : "إضافة مصدر جديد"}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pe-1 -me-1">
            <Tabs defaultValue="source" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="source" className="flex-1">المصدر</TabsTrigger>
                <TabsTrigger value="filters" className="flex-1">فلاتر الاستيراد</TabsTrigger>
                <TabsTrigger value="schedule" className="flex-1">الجدولة</TabsTrigger>
              </TabsList>

              {/* Source tab */}
              <TabsContent value="source" className="space-y-4 mt-0">
                {/* Type selector */}
                <div className="space-y-1.5">
                  <Label>نوع المصدر</Label>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {(["m3u", "xtream"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, type: t }))}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${
                          form.type === t
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t === "m3u" ? "M3U" : "Xtream Codes"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>الاسم *</Label>
                  <Input
                    placeholder="اسم المصدر"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                {form.type === "m3u" ? (
                  <div className="space-y-1.5">
                    <Label>رابط M3U *</Label>
                    <Input
                      placeholder="http://..."
                      value={form.url}
                      onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label>رابط السيرفر *</Label>
                      <Input
                        placeholder="http://server.example.com:8080"
                        value={form.server_url}
                        onChange={(e) => setForm((f) => ({ ...f, server_url: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>اسم المستخدم</Label>
                      <Input
                        placeholder="username"
                        value={form.username}
                        onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>كلمة المرور</Label>
                      <Input
                        type="password"
                        placeholder="password"
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label>الحالة</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as "active" | "inactive" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">معطل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* Filters tab */}
              <TabsContent value="filters" className="space-y-4 mt-0">
                <p className="text-xs text-muted-foreground">
                  تُطبَّق هذه الفلاتر تلقائياً أثناء كل مزامنة — فقط القنوات المطابقة تُستورَد.
                </p>
                <div className="space-y-1.5">
                  <Label>اللغة</Label>
                  <Select
                    value={form.filter_language}
                    onValueChange={(v) => setForm((f) => ({ ...f, filter_language: v as "all" | "arabic" | "english" | "arabic_english" }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل اللغات</SelectItem>
                      <SelectItem value="arabic">🇸🇦 عربي فقط</SelectItem>
                      <SelectItem value="english">🇺🇸 إنجليزي فقط</SelectItem>
                      <SelectItem value="arabic_english">🇸🇦🇺🇸 عربي + إنجليزي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>الدول</Label>
                  <Input
                    placeholder="SA,AE,EG,KW (فارغ = كل الدول)"
                    value={form.filter_countries}
                    onChange={(e) => setForm((f) => ({ ...f, filter_countries: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    رموز ISO مفصولة بفواصل. مثال: SA,AE,EG
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>التصنيفات</Label>
                  <Input
                    placeholder="بي إن,mbc,رياضة (فارغ = كل التصنيفات)"
                    value={form.filter_categories}
                    onChange={(e) => setForm((f) => ({ ...f, filter_categories: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    كلمات مفتاحية مفصولة بفواصل — القناة تُستورَد إذا تضمّن تصنيفها أي منها.
                  </p>
                </div>
              </TabsContent>

              {/* Schedule tab */}
              <TabsContent value="schedule" className="space-y-4 mt-0">
                <p className="text-xs text-muted-foreground">
                  المزامنة التلقائية تعمل في الخلفية — لا حاجة لبقاء المتصفح مفتوحاً.
                </p>
                <div className="space-y-1.5">
                  <Label>تكرار المزامنة</Label>
                  <Select
                    value={String(form.sync_interval_hours)}
                    onValueChange={(v) => setForm((f) => ({ ...f, sync_interval_hours: Number(v) }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INTERVAL_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.sync_interval_hours > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary">
                    سيتم مزامنة هذا المصدر تلقائياً كل {form.sync_interval_hours} ساعة.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter className="shrink-0 pt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={isMutating}>
              {isMutating && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              {editingSource ? "حفظ التغييرات" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
