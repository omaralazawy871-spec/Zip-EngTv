import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react/src/custom-fetch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const loginMutation = useAdminLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!password.trim()) {
      setError("الرجاء إدخال كلمة المرور");
      return;
    }

    loginMutation.mutate({ data: { password } }, {
      onSuccess: (res) => {
        localStorage.setItem("engtv_admin_token", res.token);
        setAuthTokenGetter(() => res.token);
        setLocation("/admin");
      },
      onError: () => {
        setError("كلمة المرور غير صحيحة");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-card-border p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-primary/20">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">لوحة التحكم</h1>
          <p className="text-muted-foreground">أدخل كلمة مرور الإدارة للمتابعة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 relative">
            <div className="absolute inset-y-0 start-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-muted-foreground mr-3" />
            </div>
            <Input
              type="password"
              placeholder="كلمة المرور..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-4 h-14 text-lg bg-background/50 text-center"
              dir="ltr"
            />
            {error && <p className="text-sm text-destructive font-medium mt-2">{error}</p>}
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-14 text-lg rounded-xl font-bold" 
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              "دخول"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
