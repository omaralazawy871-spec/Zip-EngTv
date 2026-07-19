import { vi } from "vitest";

export const useAdminLogin = vi.fn();
export const useGetAdminStats = vi.fn();
export const useListAdminChannels = vi.fn();
export const useListAdminCategories = vi.fn();
export const useListSources = vi.fn();
export const useCreateChannel = vi.fn();
export const useUpdateChannel = vi.fn();
export const useDeleteChannel = vi.fn();
export const useDeleteAllChannels = vi.fn();
export const useBulkDeleteChannels = vi.fn();
export const useBulkUpdateChannelStatus = vi.fn();
export const useBulkUpdateChannelCategory = vi.fn();
export const useRunHealthCheck = vi.fn();
export const useCreateSource = vi.fn();
export const useUpdateSource = vi.fn();
export const useDeleteSource = vi.fn();
export const useSyncSource = vi.fn();
export const useSyncAllSources = vi.fn();
export const useRetrySyncSource = vi.fn();
export const useGetSyncHistory = vi.fn();
export const useGetSchedulerStatus = vi.fn();
export const useExportBackup = vi.fn();
export const useRestoreBackup = vi.fn();
export const useListChannels = vi.fn();
export const useGetChannel = vi.fn();
export const useGetCategory = vi.fn();
export const useGetSettings = vi.fn();
export const getListAdminChannelsQueryKey = vi.fn(() => ["adminChannels"]);
export const getListSourcesQueryKey = vi.fn(() => ["sources"]);
export const getGetAdminStatsQueryKey = vi.fn(() => ["adminStats"]);
export const getGetSchedulerStatusQueryKey = vi.fn(() => ["schedulerStatus"]);

export function setAuthTokenGetter() {}
export function setBaseUrl() {}
export async function customFetch() {}
