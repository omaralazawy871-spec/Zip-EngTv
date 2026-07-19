import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Sources from "@/pages/admin/sources";

const mockUseLocation = vi.hoisted(() => vi.fn(() => ["/admin/sources", vi.fn()]));
const mockUseListSources = vi.hoisted(() => vi.fn());
const mockUseCreateSource = vi.hoisted(() => vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })));
const mockUseUpdateSource = vi.hoisted(() => vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })));
const mockUseDeleteSource = vi.hoisted(() => vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })));
const mockUseSyncSource = vi.hoisted(() => vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })));
const mockUseSyncAllSources = vi.hoisted(() => vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })));
const mockUseRetrySyncSource = vi.hoisted(() => vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })));
const mockUseGetSyncHistory = vi.hoisted(() => vi.fn(() => ({ data: [] })));
const mockUseGetSchedulerStatus = vi.hoisted(() => vi.fn(() => ({ data: undefined })));
const mockGetListSourcesQueryKey = vi.hoisted(() => vi.fn(() => ["sources"]));
const mockGetGetAdminStatsQueryKey = vi.hoisted(() => vi.fn(() => ["adminStats"]));
const mockGetGetSchedulerStatusQueryKey = vi.hoisted(() => vi.fn(() => ["schedulerStatus"]));

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
        "sources.title": "مصادر IPTV",
        "sources.empty": "لا توجد مصادر IPTV",
        "sources.add_source": "إضافة مصدر",
      };
      return translations[key] ?? key;
    },
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

vi.mock("@workspace/api-client-react", () => ({
  useListSources: mockUseListSources,
  useCreateSource: mockUseCreateSource,
  useUpdateSource: mockUseUpdateSource,
  useDeleteSource: mockUseDeleteSource,
  useSyncSource: mockUseSyncSource,
  useSyncAllSources: mockUseSyncAllSources,
  useRetrySyncSource: mockUseRetrySyncSource,
  useGetSyncHistory: mockUseGetSyncHistory,
  useGetSchedulerStatus: mockUseGetSchedulerStatus,
  getListSourcesQueryKey: mockGetListSourcesQueryKey,
  getGetAdminStatsQueryKey: mockGetGetAdminStatsQueryKey,
  getGetSchedulerStatusQueryKey: mockGetGetSchedulerStatusQueryKey,
}));

describe("Sources page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render header", () => {
    mockUseListSources.mockReturnValue({ data: [], isLoading: false });

    render(<Sources />, { wrapper: createWrapper() });
    expect(screen.getAllByText("مصادر IPTV").length).toBeGreaterThanOrEqual(1);
  });

  it("should show card grid skeleton when loading", () => {
    mockUseListSources.mockReturnValue({ data: [], isLoading: true });

    const { container } = render(<Sources />, { wrapper: createWrapper() });
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("should show empty state when no sources", () => {
    mockUseListSources.mockReturnValue({ data: [], isLoading: false });

    render(<Sources />, { wrapper: createWrapper() });
    expect(screen.getByText("لا توجد مصادر IPTV")).toBeInTheDocument();
  });

  it("should render source cards", () => {
    mockUseListSources.mockReturnValue({
      data: [
        {
          id: 1,
          name: "Test Source",
          type: "m3u",
          status: "active",
          url: "http://example.com",
          server_url: null,
          username: null,
          password: null,
          channel_count: 10,
          category_count: 5,
          last_sync_at: null,
          last_successful_sync_at: null,
          filter_language: "all",
          filter_countries: null,
          filter_categories: null,
          sync_interval_hours: 0,
          created_at: new Date().toISOString(),
        },
      ],
      isLoading: false,
    });

    render(<Sources />, { wrapper: createWrapper() });
    expect(screen.getByText("Test Source")).toBeInTheDocument();
  });
});
