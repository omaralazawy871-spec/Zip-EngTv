import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useExportBackup, useRestoreBackup } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Upload, AlertTriangle } from "lucide-react";

export default function AdminBackup() {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const { data: backupData, isLoading, refetch } = useExportBackup();
  const restoreBackup = useRestoreBackup();

  const handleExport = async () => {
    try {
      const { data } = await refetch();
      if (!data) return;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `engtv-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "تم التصدير", description: "تم تحميل ملف النسخة الاحتياطية" });
    } catch {
      toast({ title: "خطأ", description: "فشل تصدير البيانات", variant: "destructive" });
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (!window.confirm("استيراد البيانات سيحل محل جميع البيانات الحالية. هل أنت متأكد؟")) return;
      if (!window.confirm("تأكيد أخير: استيراد البيانات وحذف كل ما هو موجود؟")) return;

      setImporting(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const result = await restoreBackup.mutateAsync({ data });
        toast({
          title: "تم الاستيراد",
          description: `تم استيراد ${result.channels_imported} قناة، ${result.categories_imported} تصنيف، ${result.sources_imported} مصدر، ${result.settings_imported} إعداد`,
        });
      } catch {
        toast({ title: "خطأ", description: "فشل استيراد البيانات. تحقق من صحة الملف.", variant: "destructive" });
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-5 animate-in fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">النسخ الاحتياطي</h1>
          <p className="text-muted-foreground text-sm mt-1">تصدير أو استيراد جميع البيانات (القنوات، التصنيفات، المصادر، الإعدادات)</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card border border-card-border rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Export */}
          <div className="bg-card border border-card-border rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">تصدير البيانات</h3>
                <p className="text-sm text-muted-foreground">تحميل نسخة احتياطية من جميع البيانات</p>
              </div>
            </div>
            <Button onClick={handleExport} disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 ml-2" />
              )}
              تحميل النسخة الاحتياطية
            </Button>
            {backupData && (
              <p className="text-xs text-muted-foreground text-center">
                آخر تصدير: {new Date(backupData.exported_at).toLocaleString("ar-EG")}
              </p>
            )}
          </div>

          {/* Import */}
          <div className="bg-card border border-card-border rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Upload className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold">استيراد البيانات</h3>
                <p className="text-sm text-muted-foreground">استعادة نسخة احتياطية (سيحل محل البيانات الحالية)</p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handleImport}
              disabled={importing}
              className="w-full"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 ml-2" />
              )}
              استيراد من ملف
            </Button>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-400 text-xs">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>تحذير: الاستيراد سيحذف جميع البيانات الموجودة قبل إضافة البيانات الجديدة</span>
            </div>
          </div>
        </div>
        )}
      </div>
    </AdminLayout>
  );
}
