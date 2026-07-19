import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetAdminStats } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { Tv, FolderTree, PlayCircle, Radio, HeartPulse, XCircle } from "lucide-react";
import { Link } from "wouter";
import { StatsSkeleton } from "@/components/admin/table-skeleton";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();
  const { t } = useTranslation();

  const statCards = [
    {
      label: t('dashboard.total_channels'),
      value: stats?.total_channels ?? 0,
      sub: `${stats?.active_channels ?? 0} ${t('dashboard.active')}`,
      icon: Tv,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      href: "/admin/channels",
    },
    {
      label: t('dashboard.categories'),
      value: stats?.total_categories ?? 0,
      sub: t('dashboard.category'),
      icon: FolderTree,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      href: "/admin/categories",
    },
    {
      label: t('dashboard.sources'),
      value: stats?.total_sources ?? 0,
      sub: `${stats?.active_sources ?? 0} ${t('dashboard.active')}`,
      icon: Radio,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      href: "/admin/sources",
    },
    {
      label: t('dashboard.active_channels'),
      value: stats?.active_channels ?? 0,
      sub: `${t('dashboard.of')} ${stats?.total_channels ?? 0}`,
      icon: PlayCircle,
      color: "text-green-400",
      bg: "bg-green-500/10",
      href: "/admin/channels",
    },
    {
      label: t('dashboard.healthy_channels'),
      value: stats?.healthy_channels ?? 0,
      sub: t('dashboard.checked'),
      icon: HeartPulse,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      href: "/admin/channels",
    },
    {
      label: t('dashboard.broken_channels'),
      value: stats?.broken_channels ?? 0,
      sub: t('dashboard.needs_review'),
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      href: "/admin/channels",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('dashboard.subtitle')}
            {stats?.last_sync_at && (
              <span className="ms-2 text-xs text-primary">
                {t('dashboard.last_sync')}: {new Date(stats.last_sync_at).toLocaleString("ar")}
              </span>
            )}
          </p>
        </div>

        {isLoading ? (
          <StatsSkeleton />
        ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
        )}

        {/* Quick links */}
        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">{t('dashboard.quick_actions')}</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/sources">
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                + {t('dashboard.add_source')}
              </button>
            </Link>
            <Link href="/admin/channels">
              <button className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                + {t('dashboard.add_channel')}
              </button>
            </Link>
            <Link href="/admin/categories">
              <button className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                + {t('dashboard.add_category')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
