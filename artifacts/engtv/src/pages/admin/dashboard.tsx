import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetAdminStats } from "@workspace/api-client-react";
import { Tv, FolderTree, PlayCircle, Radio, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      label: "إجمالي القنوات",
      value: stats?.total_channels ?? 0,
      sub: `${stats?.active_channels ?? 0} نشط`,
      icon: Tv,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      href: "/admin/channels",
    },
    {
      label: "التصنيفات",
      value: stats?.total_categories ?? 0,
      sub: "تصنيف",
      icon: FolderTree,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      href: "/admin/categories",
    },
    {
      label: "مصادر IPTV",
      value: stats?.total_sources ?? 0,
      sub: `${stats?.active_sources ?? 0} نشط`,
      icon: Radio,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      href: "/admin/sources",
    },
    {
      label: "القنوات النشطة",
      value: stats?.active_channels ?? 0,
      sub: `من ${stats?.total_channels ?? 0}`,
      icon: PlayCircle,
      color: "text-green-400",
      bg: "bg-green-500/10",
      href: "/admin/channels",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">لوحة القيادة</h1>
          <p className="text-muted-foreground mt-2">
            نظرة عامة على منصة البث الخاصة بك.
            {stats?.last_sync_at && (
              <span className="ms-2 text-xs text-primary">
                آخر مزامنة: {new Date(stats.last_sync_at).toLocaleString("ar")}
              </span>
            )}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.href + stat.label} href={stat.href}>
                <div className="bg-card border border-card-border p-6 rounded-2xl shadow-sm flex items-center gap-5 cursor-pointer glow-border transition-all hover:-translate-y-0.5">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-0.5">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick links */}
        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">إجراءات سريعة</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/sources">
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                + إضافة مصدر IPTV
              </button>
            </Link>
            <Link href="/admin/channels">
              <button className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                + إضافة قناة يدوياً
              </button>
            </Link>
            <Link href="/admin/categories">
              <button className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                + إضافة تصنيف
              </button>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
