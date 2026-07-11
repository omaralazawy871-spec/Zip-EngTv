import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";

interface SettingsForm {
  app_name: string;
  app_logo_url: string;
  footer_text: string;
}

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const [form, setForm] = useState<SettingsForm>({
    app_name: "",
    app_logo_url: "",
    footer_text: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        app_name: settings.app_name ?? "",
        app_logo_url: settings.app_logo_url ?? "",
        footer_text: settings.footer_text ?? "",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        data: {
          app_name: form.app_name.trim() || undefined,
          app_logo_url: form.app_logo_url.trim() || null,
          footer_text: form.footer_text.trim() || null,
        },
      });
      toast({ title: "تم الحفظ", description: "تم حفظ الإعدادات بنجاح" });
      queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
    } catch {
      toast({ title: "خطأ", description: "فشل حفظ الإعدادات", variant: "destructive" });
    }
  };

  const isPending = updateSettings.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">إعدادات التطبيق</h1>
          <p className="text-muted-foreground text-sm mt-1">
            تخصيص إعدادات منصة البث
          </p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl shadow-sm p-6 max-w-2xl">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label>اسم التطبيق</Label>
                <Input
                  placeholder="EngTv"
                  value={form.app_name}
                  onChange={(e) => setForm((f) => ({ ...f, app_name: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>رابط شعار التطبيق</Label>
                <Input
                  placeholder="https://..."
                  value={form.app_logo_url}
                  onChange={(e) => setForm((f) => ({ ...f, app_logo_url: e.target.value }))}
                />
                {form.app_logo_url && (
                  <div className="mt-2">
                    <img
                      src={form.app_logo_url}
                      alt="معاينة الشعار"
                      className="h-12 object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>نص التذييل</Label>
                <Textarea
                  placeholder="نص ظاهر في أسفل الصفحة..."
                  value={form.footer_text}
                  onChange={(e) => setForm((f) => ({ ...f, footer_text: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="pt-2">
                <Button onClick={handleSave} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 ml-2" />
                  )}
                  حفظ الإعدادات
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
