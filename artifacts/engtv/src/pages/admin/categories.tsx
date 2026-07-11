import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListAdminCategories,
  useListAdminChannels,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  getListAdminCategoriesQueryKey,
  getGetAdminStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import type { Category } from "@workspace/api-client-react";

interface CategoryForm {
  name: string;
  icon: string;
  is_visible: boolean;
}

const defaultForm: CategoryForm = {
  name: "",
  icon: "",
  is_visible: true,
};

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(defaultForm);

  const { data: categories = [], isLoading } = useListAdminCategories();
  const { data: allChannels = [] } = useListAdminChannels();

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListAdminCategoriesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  };

  const getChannelCount = (categoryId: number) =>
    allChannels.filter((ch) => ch.category_id === categoryId).length;

  const openAdd = () => {
    setEditingCategory(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      icon: cat.icon ?? "",
      is_visible: cat.is_visible,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: "خطأ", description: "اسم التصنيف مطلوب", variant: "destructive" });
      return;
    }
    const payload = {
      name: form.name.trim(),
      icon: form.icon.trim() || null,
      is_visible: form.is_visible,
    };
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, data: payload });
        toast({ title: "تم التحديث", description: "تم تحديث التصنيف بنجاح" });
      } else {
        await createCategory.mutateAsync({ data: payload });
        toast({ title: "تمت الإضافة", description: "تمت إضافة التصنيف بنجاح" });
      }
      setDialogOpen(false);
      invalidate();
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الحفظ", variant: "destructive" });
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`هل تريد حذف التصنيف "${cat.name}"؟`)) return;
    try {
      await deleteCategory.mutateAsync({ id: cat.id });
      toast({ title: "تم الحذف", description: "تم حذف التصنيف" });
      invalidate();
    } catch {
      toast({ title: "خطأ", description: "فشل حذف التصنيف", variant: "destructive" });
    }
  };

  const isMutating = createCategory.isPending || updateCategory.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">التصنيفات</h1>
            <p className="text-muted-foreground text-sm mt-1">
              إجمالي {categories.length} تصنيف
            </p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة تصنيف
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card border border-card-border rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <p className="text-lg">لا توجد تصنيفات</p>
              <p className="text-sm mt-1">أضف تصنيفاً جديداً للبدء</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الأيقونة</TableHead>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الظهور</TableHead>
                  <TableHead className="text-right">عدد القنوات</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      <span className="text-2xl">{cat.icon ?? "📁"}</span>
                    </TableCell>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>
                      {cat.is_visible ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          نشط
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground">
                          مخفي
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {getChannelCount(cat.id)} قناة
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(cat)}
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
            <DialogTitle>
              {editingCategory ? "تعديل التصنيف" : "إضافة تصنيف جديد"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>اسم التصنيف *</Label>
              <Input
                placeholder="أدخل اسم التصنيف"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الأيقونة</Label>
              <Input
                placeholder="مثال: 📺"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_visible}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_visible: v }))}
              />
              <Label>مرئي للمستخدمين</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={isMutating}>
              {isMutating && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              {editingCategory ? "حفظ التغييرات" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
