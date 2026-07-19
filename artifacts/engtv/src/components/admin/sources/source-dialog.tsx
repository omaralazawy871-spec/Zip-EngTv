import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import type { Source } from "@workspace/api-client-react";

type SourceType = "m3u" | "xtream";

export interface SourceForm {
  name: string;
  type: SourceType;
  status: "active" | "inactive";
  url: string;
  server_url: string;
  username: string;
  password: string;
  filter_language: "all" | "arabic" | "english" | "arabic_english";
  filter_countries: string;
  filter_categories: string;
  sync_interval_hours: number;
}

export const defaultForm: SourceForm = {
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

export const INTERVAL_OPTIONS = [
  { value: 0, label: "يدوي فقط" },
  { value: 1, label: "كل ساعة" },
  { value: 3, label: "كل 3 ساعات" },
  { value: 6, label: "كل 6 ساعات" },
  { value: 12, label: "كل 12 ساعة" },
  { value: 24, label: "كل يوم" },
  { value: 48, label: "كل يومين" },
  { value: 168, label: "كل أسبوع" },
];

interface SourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSource: Source | null;
  form: SourceForm;
  onChange: (form: SourceForm) => void;
  onSubmit: () => void;
  isMutating: boolean;
}

export function SourceDialog({
  open,
  onOpenChange,
  editingSource,
  form,
  onChange,
  onSubmit,
  isMutating,
}: SourceDialogProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const updateForm = (partial: Partial<SourceForm>) => onChange({ ...form, ...partial });

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const payload = {
        type: form.type,
        url: form.type === "m3u" ? form.url.trim() || undefined : undefined,
        server_url: form.type === "xtream" ? form.server_url.trim() || undefined : undefined,
        username: form.type === "xtream" ? form.username.trim() || undefined : undefined,
        password: form.type === "xtream" ? form.password.trim() || undefined : undefined,
      };
      const token = localStorage.getItem("engtv_admin_token");
      const res = await fetch("/api/admin/sources/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, message: "فشل الاتصال بالخادم" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

            <TabsContent value="source" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label>نوع المصدر</Label>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  {(["m3u", "xtream"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateForm({ type: t })}
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
                  onChange={(e) => updateForm({ name: e.target.value })}
                />
              </div>
              {form.type === "m3u" ? (
                <div className="space-y-1.5">
                  <Label>رابط M3U *</Label>
                  <Input
                    placeholder="http://..."
                    value={form.url}
                    onChange={(e) => updateForm({ url: e.target.value })}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label>رابط السيرفر *</Label>
                    <Input
                      placeholder="http://server.example.com:8080"
                      value={form.server_url}
                      onChange={(e) => updateForm({ server_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>اسم المستخدم</Label>
                    <Input
                      placeholder="username"
                      value={form.username}
                      onChange={(e) => updateForm({ username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>كلمة المرور</Label>
                    <Input
                      type="password"
                      placeholder="password"
                      value={form.password}
                      onChange={(e) => updateForm({ password: e.target.value })}
                    />
                  </div>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testing}
                className="w-full"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : testResult?.success ? (
                  <Wifi className="w-4 h-4 ml-2 text-green-500" />
                ) : testResult !== null ? (
                  <WifiOff className="w-4 h-4 ml-2 text-destructive" />
                ) : (
                  <Wifi className="w-4 h-4 ml-2" />
                )}
                {testing ? "جارٍ الاختبار..." : "اختبار الاتصال"}
              </Button>
              {testResult && (
                <div className={`text-sm p-2 rounded ${testResult.success ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
                  {testResult.message}
                </div>
              )}
              <div className="space-y-1.5">
                <Label>الحالة</Label>
                <Select value={form.status} onValueChange={(v) => updateForm({ status: v as "active" | "inactive" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">معطل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4 mt-0">
              <p className="text-xs text-muted-foreground">
                تُطبَّق هذه الفلاتر تلقائياً أثناء كل مزامنة — فقط القنوات المطابقة تُستورَد.
              </p>
              <div className="space-y-1.5">
                <Label>اللغة</Label>
                <Select
                  value={form.filter_language}
                  onValueChange={(v) => updateForm({ filter_language: v as "all" | "arabic" | "english" | "arabic_english" })}
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
                  onChange={(e) => updateForm({ filter_countries: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">رموز ISO مفصولة بفواصل. مثال: SA,AE,EG</p>
              </div>
              <div className="space-y-1.5">
                <Label>التصنيفات</Label>
                <Input
                  placeholder="بي إن,mbc,رياضة (فارغ = كل التصنيفات)"
                  value={form.filter_categories}
                  onChange={(e) => updateForm({ filter_categories: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  كلمات مفتاحية مفصولة بفواصل — القناة تُستورَد إذا تضمّن تصنيفها أي منها.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4 mt-0">
              <p className="text-xs text-muted-foreground">
                المزامنة التلقائية تعمل في الخلفية — لا حاجة لبقاء المتصفح مفتوحاً.
              </p>
              <div className="space-y-1.5">
                <Label>تكرار المزامنة</Label>
                <Select
                  value={String(form.sync_interval_hours)}
                  onValueChange={(v) => updateForm({ sync_interval_hours: Number(v) })}
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
          <Button variant="ghost" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={onSubmit} disabled={isMutating}>
            {isMutating && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            {editingSource ? "حفظ التغييرات" : "إضافة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
