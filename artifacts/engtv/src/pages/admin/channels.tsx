import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListAdminChannels,
  useListAdminCategories,
  useListSources,
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
  useDeleteAllChannels,
  useBulkDeleteChannels,
  useBulkUpdateChannelStatus,
  useRunHealthCheck,
  getListAdminChannelsQueryKey,
  getGetAdminStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Plus, Pencil, Trash2, Search, ChevronDown, HeartPulse, CheckCheck, X, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Channel } from "@workspace/api-client-react";

interface ChannelForm {
  name: string;
  stream_url: string;
  logo_url: string;
  category_id: string;
  is_active: boolean;
}

const defaultForm: ChannelForm = {
  name: "",
  stream_url: "",
  logo_url: "",
  category_id: "",
  is_active: true,
};

const LANGUAGE_OPTIONS = [
  { value: "all", label: "كل اللغات" },
  { value: "ar", label: "عربي" },
  { value: "en", label: "إنجليزي" },
  { value: "unknown", label: "غير محدد" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "كل الحالات" },
  { value: "true", label: "نشط" },
  { value: "false", label: "معطل" },
];

const HEALTH_OPTIONS = [
  { value: "all", label: "كل الحالات" },
  { value: "true", label: "يعمل" },
  { value: "false", label: "معطل" },
  { value: "null", label: "غير مفحوص" },
];

function HealthBadge({ isHealthy }: { isHealthy: boolean | null }) {
  if (isHealthy === null || isHealthy === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return isHealthy ? (
    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">يعمل</Badge>
  ) : (
    <Badge variant="destructive" className="text-xs">معطل</Badge>
  );
}

export default function AdminChannels() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [form, setForm] = useState<ChannelForm>(defaultForm);

  // Health check progress
  const [healthChecking, setHealthChecking] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const queryParams = {
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
    ...(categoryFilter !== "all" ? { category_id: Number(categoryFilter) } : {}),
    ...(sourceFilter !== "all" ? { source_id: Number(sourceFilter) } : {}),
    ...(languageFilter !== "all" ? { language: languageFilter } : {}),
    ...(statusFilter !== "all" ? { is_active: statusFilter === "true" } : {}),
    // is_healthy filter handled client-side (null case can't be sent as query param)
  };

  const { data: channels = [], isLoading } = useListAdminChannels(queryParams);
  const { data: categories = [] } = useListAdminCategories();
  const { data: sources = [] } = useListSources();

  // Client-side health filter (handles the null/unchecked case)
  const filteredChannels = useMemo(() => {
    if (healthFilter === "all") return channels;
    if (healthFilter === "true") return channels.filter((c) => c.is_healthy === true);
    if (healthFilter === "false") return channels.filter((c) => c.is_healthy === false);
    if (healthFilter === "null") return channels.filter((c) => c.is_healthy == null);
    return channels;
  }, [channels, healthFilter]);

  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();
  const deleteChannel = useDeleteChannel();
  const deleteAllChannels = useDeleteAllChannels({
    request: { headers: { "x-confirm-delete-all": "yes" } },
  });
  const bulkDeleteChannels = useBulkDeleteChannels();
  const bulkUpdateStatus = useBulkUpdateChannelStatus();
  const runHealthCheck = useRunHealthCheck();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListAdminChannelsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  };

  // ── Selection ──────────────────────────────────────────────────────────────

  const allVisible = filteredChannels.map((c) => c.id);
  const allSelected = allVisible.length > 0 && allVisible.every((id) => selectedIds.has(id));
  const someSelected = allVisible.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allVisible));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingChannel(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (ch: Channel) => {
    setEditingChannel(ch);
    setForm({
      name: ch.name,
      stream_url: ch.stream_url,
      logo_url: ch.logo_url ?? "",
      category_id: ch.category_id != null ? String(ch.category_id) : "",
      is_active: ch.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.stream_url.trim()) {
      toast({ title: "خطأ", description: "الاسم ورابط البث مطلوبان", variant: "destructive" });
      return;
    }
    const payload = {
      name: form.name.trim(),
      stream_url: form.stream_url.trim(),
      logo_url: form.logo_url.trim() || null,
      category_id: form.category_id ? Number(form.category_id) : null,
      is_active: form.is_active,
    };
    try {
      if (editingChannel) {
        await updateChannel.mutateAsync({ id: editingChannel.id, data: payload });
        toast({ title: "تم التحديث", description: "تم تحديث القناة بنجاح" });
      } else {
        await createChannel.mutateAsync({ data: payload });
        toast({ title: "تمت الإضافة", description: "تمت إضافة القناة بنجاح" });
      }
      setDialogOpen(false);
      invalidate();
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الحفظ", variant: "destructive" });
    }
  };

  const handleDelete = async (ch: Channel) => {
    if (!window.confirm(`هل تريد حذف القناة "${ch.name}"؟`)) return;
    try {
      await deleteChannel.mutateAsync({ id: ch.id });
      toast({ title: "تم الحذف", description: "تم حذف القناة" });
      invalidate();
    } catch {
      toast({ title: "خطأ", description: "فشل حذف القناة", variant: "destructive" });
    }
  };

  const handleToggleActive = async (ch: Channel) => {
    try {
      await updateChannel.mutateAsync({ id: ch.id, data: { is_active: !ch.is_active } });
      invalidate();
    } catch {
      toast({ title: "خطأ", description: "فشل تحديث حالة القناة", variant: "destructive" });
    }
  };

  // ── Bulk ops ───────────────────────────────────────────────────────────────

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`هل تريد حذف ${selectedIds.size} قناة محددة؟`)) return;
    try {
      const result = await bulkDeleteChannels.mutateAsync({ data: { ids: [...selectedIds] } });
      toast({ title: "تم الحذف", description: `تم حذف ${result.deleted_count} قناة` });
      clearSelection();
      invalidate();
    } catch {
      toast({ title: "خطأ", description: "فشل الحذف الجماعي", variant: "destructive" });
    }
  };

  const handleBulkEnable = async (is_active: boolean) => {
    if (selectedIds.size === 0) return;
    try {
      const result = await bulkUpdateStatus.mutateAsync({
        data: { ids: [...selectedIds], is_active },
      });
      toast({
        title: is_active ? "تم التفعيل" : "تم التعطيل",
        description: `تم تحديث ${result.updated_count} قناة`,
      });
      clearSelection();
      invalidate();
    } catch {
      toast({ title: "خطأ", description: "فشل التحديث الجماعي", variant: "destructive" });
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("هل أنت متأكد؟ سيتم حذف جميع القنوات نهائياً!")) return;
    if (!window.confirm("تأكيد أخير: حذف جميع القنوات؟")) return;
    try {
      const result = await deleteAllChannels.mutateAsync();
      toast({ title: "تم الحذف الكامل", description: `تم حذف ${result.deleted_count} قناة` });
      clearSelection();
      invalidate();
    } catch {
      toast({ title: "خطأ", description: "فشل الحذف الكامل", variant: "destructive" });
    }
  };

  const handleHealthCheck = async (ids?: number[]) => {
    setHealthChecking(true);
    try {
      const result = await runHealthCheck.mutateAsync({
        data: ids ? { ids, concurrency: 10 } : { concurrency: 10 },
      });
      toast({
        title: "اكتمل الفحص",
        description: `✅ ${result.healthy} يعمل  ❌ ${result.broken} معطل  (فحص ${result.checked} قناة)`,
      });
      clearSelection();
      invalidate();
    } catch {
      toast({ title: "خطأ", description: "فشل فحص الصحة", variant: "destructive" });
    } finally {
      setHealthChecking(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getCategoryName = (categoryId?: number | null) =>
    categoryId ? categories.find((c) => c.id === categoryId)?.name ?? null : null;

  const getSourceName = (sourceId?: number | null) =>
    sourceId ? sources.find((s) => s.id === sourceId)?.name ?? null : null;

  const isMutating = createChannel.isPending || updateChannel.isPending;
  const selectionCount = selectedIds.size;
  const hasSelection = selectionCount > 0;

  return (
    <AdminLayout>
      <div className="space-y-5 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">القنوات</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {filteredChannels.length} قناة
              {hasSelection && (
                <span className="ms-2 text-primary font-medium">· {selectionCount} محدد</span>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Health check */}
            <Button
              variant="secondary"
              onClick={() => handleHealthCheck()}
              disabled={healthChecking}
              size="sm"
            >
              {healthChecking ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <HeartPulse className="w-4 h-4 ml-2" />
              )}
              فحص الصحة
            </Button>

            {/* Bulk actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" disabled={!hasSelection}>
                  إجراءات ({selectionCount})
                  <ChevronDown className="w-4 h-4 mr-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkEnable(true)}>
                  <CheckCheck className="w-4 h-4 ml-2 text-green-400" />
                  تفعيل المحددة
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkEnable(false)}>
                  <X className="w-4 h-4 ml-2 text-muted-foreground" />
                  تعطيل المحددة
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleHealthCheck([...selectedIds])}
                  disabled={healthChecking}
                >
                  <HeartPulse className="w-4 h-4 ml-2 text-blue-400" />
                  فحص المحددة
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف المحددة
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add */}
            <Button onClick={openAdd} size="sm">
              <Plus className="w-4 h-4 ml-2" />
              إضافة قناة
            </Button>

            {/* Delete all */}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAll}
              disabled={deleteAllChannels.isPending}
            >
              {deleteAllChannels.isPending ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <ShieldAlert className="w-4 h-4 ml-2" />
              )}
              حذف الكل
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Search */}
          <div className="relative col-span-2 sm:col-span-3 lg:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          {/* Category */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue placeholder="التصنيف" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل التصنيفات</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.icon} {cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Source */}
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger><SelectValue placeholder="المصدر" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المصادر</SelectItem>
              {sources.map((src) => (
                <SelectItem key={src.id} value={String(src.id)}>{src.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Language */}
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger><SelectValue placeholder="اللغة" /></SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Status / Health */}
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={healthFilter} onValueChange={setHealthFilter}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="الصحة" /></SelectTrigger>
              <SelectContent>
                {HEALTH_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-card-border rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <p className="text-lg">لا توجد قنوات</p>
              <p className="text-sm mt-1">جرب تعديل الفلاتر أو أضف قناة جديدة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-right">
                    <Checkbox
                      checked={allSelected}
                      ref={(el) => {
                        if (el) (el as any).indeterminate = someSelected && !allSelected;
                      }}
                      onCheckedChange={toggleSelectAll}
                      aria-label="تحديد الكل"
                    />
                  </TableHead>
                  <TableHead className="text-right">الشعار</TableHead>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">التصنيف</TableHead>
                  <TableHead className="text-right">المصدر</TableHead>
                  <TableHead className="text-right">اللغة</TableHead>
                  <TableHead className="text-right">الصحة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChannels.map((ch) => (
                  <TableRow
                    key={ch.id}
                    className={cn(selectedIds.has(ch.id) && "bg-primary/5")}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(ch.id)}
                        onCheckedChange={() => toggleSelect(ch.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="relative w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs overflow-hidden">
                        📺
                        {ch.logo_url && (
                          <img
                            src={ch.logo_url}
                            alt={ch.name}
                            className="absolute inset-0 w-full h-full object-contain p-1 bg-muted"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-[180px] truncate">{ch.name}</TableCell>
                    <TableCell>
                      {getCategoryName(ch.category_id) ? (
                        <Badge variant="secondary" className="text-xs">{getCategoryName(ch.category_id)}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getSourceName(ch.source_id) ? (
                        <span className="text-xs text-muted-foreground">{getSourceName(ch.source_id)}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {ch.language === "ar" ? "🇸🇦 عربي" : ch.language === "en" ? "🇺🇸 إنج" : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <HealthBadge isHealthy={ch.is_healthy ?? null} />
                    </TableCell>
                    <TableCell>
                      <Switch checked={ch.is_active} onCheckedChange={() => handleToggleActive(ch)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(ch)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(ch)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingChannel ? "تعديل القناة" : "إضافة قناة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>اسم القناة *</Label>
              <Input
                placeholder="أدخل اسم القناة"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>رابط البث *</Label>
              <Input
                placeholder="https://..."
                value={form.stream_url}
                onChange={(e) => setForm((f) => ({ ...f, stream_url: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>رابط الشعار</Label>
              <Input
                placeholder="https://..."
                value={form.logo_url}
                onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>التصنيف</Label>
              <Select
                value={form.category_id}
                onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="بدون تصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون تصنيف</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
              <Label>نشطة</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={isMutating}>
              {isMutating && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              {editingChannel ? "حفظ التغييرات" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
