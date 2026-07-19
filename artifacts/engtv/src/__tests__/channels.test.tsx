import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Channels from "@/pages/admin/channels";

const mockUseLocation = vi.hoisted(() => vi.fn(() => ["/admin/channels", vi.fn()]));
const mockUseListAdminChannels = vi.hoisted(() => vi.fn());
const mockUseListAdminCategories = vi.hoisted(() => vi.fn());
const mockUseListSources = vi.hoisted(() => vi.fn());
const mockUseCreateChannel = vi.hoisted(() => vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })));
const mockUseUpdateChannel = vi.hoisted(() => vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })));
const mockUseDeleteChannel = vi.hoisted(() => vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })));
const mockUseDeleteAllChannels = vi.hoisted(() => vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })));
const mockUseBulkDeleteChannels = vi.hoisted(() => vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })));
const mockUseBulkUpdateChannelStatus = vi.hoisted(() => vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })));
const mockUseBulkUpdateChannelCategory = vi.hoisted(() => vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })));
const mockUseRunHealthCheck = vi.hoisted(() => vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })));
const mockGetListAdminChannelsQueryKey = vi.hoisted(() => vi.fn(() => ["adminChannels"]));
const mockGetGetAdminStatsQueryKey = vi.hoisted(() => vi.fn(() => ["adminStats"]));

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
        "channels.title": "القنوات",
        "channels.empty": "لا توجد قنوات",
        "channels.add_channel": "إضافة قناة",
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
  useListAdminChannels: mockUseListAdminChannels,
  useListAdminCategories: mockUseListAdminCategories,
  useListSources: mockUseListSources,
  useCreateChannel: mockUseCreateChannel,
  useUpdateChannel: mockUseUpdateChannel,
  useDeleteChannel: mockUseDeleteChannel,
  useDeleteAllChannels: mockUseDeleteAllChannels,
  useBulkDeleteChannels: mockUseBulkDeleteChannels,
  useBulkUpdateChannelStatus: mockUseBulkUpdateChannelStatus,
  useBulkUpdateChannelCategory: mockUseBulkUpdateChannelCategory,
  useRunHealthCheck: mockUseRunHealthCheck,
  getListAdminChannelsQueryKey: mockGetListAdminChannelsQueryKey,
  getGetAdminStatsQueryKey: mockGetGetAdminStatsQueryKey,
}));

describe("Channels page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render header with title", () => {
    mockUseListAdminChannels.mockReturnValue({ data: [], isLoading: false });
    mockUseListAdminCategories.mockReturnValue({ data: [] });
    mockUseListSources.mockReturnValue({ data: [] });

    render(<Channels />, { wrapper: createWrapper() });
    expect(screen.getAllByText("القنوات").length).toBeGreaterThanOrEqual(1);
  });

  it("should show loading skeleton when loading", () => {
    mockUseListAdminChannels.mockReturnValue({ data: [], isLoading: true });
    mockUseListAdminCategories.mockReturnValue({ data: [] });
    mockUseListSources.mockReturnValue({ data: [] });

    const { container } = render(<Channels />, { wrapper: createWrapper() });
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("should show empty state when no channels", () => {
    mockUseListAdminChannels.mockReturnValue({ data: [], isLoading: false });
    mockUseListAdminCategories.mockReturnValue({ data: [] });
    mockUseListSources.mockReturnValue({ data: [] });

    render(<Channels />, { wrapper: createWrapper() });
    expect(screen.getByText("لا توجد قنوات")).toBeInTheDocument();
  });

  it("should render channel rows", () => {
    mockUseListAdminChannels.mockReturnValue({
      data: [
        {
          id: 1,
          name: "Test Channel",
          stream_url: "http://example.com/stream",
          logo_url: null,
          category_id: null,
          source_id: null,
          is_active: true,
          sort_order: 0,
          language: "en",
          country: null,
          created_at: new Date().toISOString(),
          is_healthy: null,
        },
      ],
      isLoading: false,
    });
    mockUseListAdminCategories.mockReturnValue({ data: [] });
    mockUseListSources.mockReturnValue({ data: [] });

    render(<Channels />, { wrapper: createWrapper() });
    expect(screen.getByText("Test Channel")).toBeInTheDocument();
  });
});
