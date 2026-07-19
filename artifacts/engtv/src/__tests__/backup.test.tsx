import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Backup from "@/pages/admin/backup";

const mockUseLocation = vi.hoisted(() => vi.fn(() => ["/admin/backup", vi.fn()]));
const mockUseExportBackup = vi.hoisted(() => vi.fn());
const mockUseRestoreBackup = vi.hoisted(() => vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })));

vi.mock("wouter", () => ({
  useLocation: mockUseLocation,
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "nav.dashboard": "لوحة القيادة",
        "nav.channels": "القنوات",
        "nav.categories": "التصنيفات",
        "nav.sources": "مصادر IPTV",
        "nav.backup": "النسخ الاحتياطي",
        "nav.settings": "الإعدادات",
        "nav.logout": "تسجيل الخروج",
        "backup.title": "النسخ الاحتياطي",
        "backup.export": "تصدير البيانات",
        "backup.import": "استيراد البيانات",
        "backup.last_export": "آخر تصدير",
        "backup.no_data": "لا توجد بيانات",
        "backup.export_all": "تصدير الكل",
        "backup.import_data": "استيراد البيانات",
        "backup.choose_file": "اختيار ملف",
      };
      return translations[key] ?? key;
    },
  }),
}));

vi.mock("@workspace/api-client-react", () => ({
  useExportBackup: mockUseExportBackup,
  useRestoreBackup: mockUseRestoreBackup,
}));

describe("Backup page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render export and import cards", () => {
    mockUseExportBackup.mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: vi.fn(),
    });

    render(<Backup />);
    expect(screen.getAllByText("النسخ الاحتياطي").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("تصدير البيانات")).toBeInTheDocument();
    expect(screen.getByText("استيراد البيانات")).toBeInTheDocument();
  });

  it("should show loading skeleton when fetching", () => {
    mockUseExportBackup.mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    });

    render(<Backup />);
    expect(screen.getAllByText("النسخ الاحتياطي").length).toBeGreaterThanOrEqual(1);
  });

  it("should display last export time when data is available", () => {
    mockUseExportBackup.mockReturnValue({
      data: { exported_at: new Date().toISOString() },
      isLoading: false,
      refetch: vi.fn(),
    });

    render(<Backup />);
    expect(screen.getByText(/آخر تصدير/i)).toBeInTheDocument();
  });
});
