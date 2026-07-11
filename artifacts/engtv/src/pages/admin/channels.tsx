import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListAdminChannels,
  useListAdminCategories,
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
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
import { Loader2, Plus, Pencil, Trash2, Search } from "lucide-react";
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

export default function AdminChannels() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [form, setForm] = useState<ChannelForm>(defaultForm);

  const debouncedSearch = useDebounce(search, 300);

  const params = {
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
    ...(categoryFilter && categoryFilter !== "all" ? { category_id: Number(categoryFilter) } : {}),
  };

  const { data: channels = [], isLoading } = useListAdminChannels(params);
  const { data: categories = [] } = useListAdminCategories();

  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();
  const deleteChannel = useDeleteChannel();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListAdminChannelsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  };

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

  const getCategoryName = (categoryId?: number | null) => {
    if (!categoryId) return null;
    return categories.find((c) => c.id === categoryId)?.name ?? null;
  };

  const isMutating = createChannel.isPending || updateChannel.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">القنوات</h1>
            <p className="text-muted-foreground text-sm mt-1">
              إجمالي {channels.length} قناة
            </p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة قناة
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن قناة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="كل التصنيفات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل التصنيفات</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border border-card-border rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : channels.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <p className="text-lg">لا توجد قنوات</p>
              <p className="text-sm mt-1">أضف قناة جديدة للبدء</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الشعار</TableHead>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">التصنيف</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((ch) => (
                  <TableRow key={ch.id}>
                    <TableCell>
                      {ch.logo_url ? (
                        <img
                          src={ch.logo_url}
                          alt={ch.name}
                          className="w-10 h-10 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                          📺
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{ch.name}</TableCell>
                    <TableCell>
                      {getCategoryName(ch.category_id) ? (
                        <Badge variant="secondary">{getCategoryName(ch.category_id)}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={ch.is_active}
                        onCheckedChange={() => handleToggleActive(ch)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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

      {/* Dialog */}
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
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
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
