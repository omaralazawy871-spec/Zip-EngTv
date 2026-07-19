import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Dashboard from "@/pages/admin/dashboard";

const { mockUseGetAdminStats } = vi.hoisted(() => ({
  mockUseGetAdminStats: vi.fn(),
}));

vi.mock("@workspace/api-client-react", () => ({
  useGetAdminStats: mockUseGetAdminStats,
}));

vi.mock("wouter", () => ({
  useLocation: vi.fn(() => ["/admin", vi.fn()]),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "dashboard.title": "لوحة القيادة",
        "dashboard.subtitle": "نظرة عامة على منصة البث الخاصة بك.",
        "dashboard.total_channels": "إجمالي القنوات",
        "dashboard.active": "نشط",
        "dashboard.categories": "التصنيفات",
        "dashboard.category": "تصنيف",
        "dashboard.sources": "مصادر IPTV",
        "dashboard.active_channels": "القنوات النشطة",
        "dashboard.of": "من",
        "dashboard.healthy_channels": "قنوات تعمل",
        "dashboard.checked": "تم فحصها",
        "dashboard.broken_channels": "قنوات معطلة",
        "dashboard.needs_review": "تحتاج مراجعة",
        "dashboard.quick_actions": "إجراءات سريعة",
        "dashboard.add_source": "إضافة مصدر IPTV",
        "dashboard.add_channel": "إضافة قناة يدوياً",
        "dashboard.add_category": "إضافة تصنيف",
        "nav.dashboard": "لوحة القيادة",
        "nav.channels": "القنوات",
        "nav.categories": "التصنيفات",
        "nav.sources": "مصادر IPTV",
        "nav.backup": "النسخ الاحتياطي",
        "nav.settings": "الإعدادات",
        "nav.logout": "تسجيل الخروج",
      };
      return translations[key] ?? key;
    },
  }),
}));

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading skeleton initially", () => {
    mockUseGetAdminStats.mockReturnValue({ data: undefined, isLoading: true });
    render(<Dashboard />);
    expect(screen.getAllByText("لوحة القيادة").length).toBeGreaterThanOrEqual(1);
  });

  it("should display stat cards with data", () => {
    mockUseGetAdminStats.mockReturnValue({
      data: {
        total_channels: 100,
        active_channels: 80,
        healthy_channels: 60,
        broken_channels: 20,
        total_categories: 10,
        total_sources: 5,
        active_sources: 3,
        last_sync_at: new Date().toISOString(),
      },
      isLoading: false,
    });
    render(<Dashboard />);
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
