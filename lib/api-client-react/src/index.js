// Stub for vitest ESM resolution - real module is mocked in tests
export const useAdminLogin = () => ({ mutateAsync: async () => {}, isPending: false });
export const useGetAdminStats = () => ({ data: undefined, isLoading: true });
export const useListAdminChannels = () => ({ data: [], isLoading: true });
export const useListAdminCategories = () => ({ data: [], isLoading: true });
export const useListSources = () => ({ data: [], isLoading: true });
export const useCreateChannel = () => ({ mutateAsync: async () => {} });
export const useUpdateChannel = () => ({ mutateAsync: async () => {} });
export const useDeleteChannel = () => ({ mutateAsync: async () => {} });
export const useDeleteAllChannels = () => ({ mutateAsync: async () => {} });
export const useBulkDeleteChannels = () => ({ mutateAsync: async () => {} });
export const useBulkUpdateChannelStatus = () => ({ mutateAsync: async () => {} });
export const useBulkUpdateChannelCategory = () => ({ mutateAsync: async () => {} });
export const useRunHealthCheck = () => ({ mutateAsync: async () => {} });
export const useCreateSource = () => ({ mutateAsync: async () => {} });
export const useUpdateSource = () => ({ mutateAsync: async () => {} });
export const useDeleteSource = () => ({ mutateAsync: async () => {} });
export const useSyncSource = () => ({ mutateAsync: async () => {} });
export const useSyncAllSources = () => ({ mutateAsync: async () => {} });
export const useRetrySyncSource = () => ({ mutateAsync: async () => {} });
export const useGetSyncHistory = () => ({ data: [], isLoading: true });
export const useGetSchedulerStatus = () => ({ data: undefined, isLoading: true });
export const useExportBackup = () => ({ mutateAsync: async () => {}, data: undefined });
export const useRestoreBackup = () => ({ mutateAsync: async () => {} });
export const useListChannels = () => ({ data: [], isLoading: true });
export const useGetChannel = () => ({ data: undefined, isLoading: true });
export const useGetCategory = () => ({ data: undefined, isLoading: true });
export const useGetSettings = () => ({ data: undefined, isLoading: true });
export const getListAdminChannelsQueryKey = () => ["adminChannels"];
export const getListSourcesQueryKey = () => ["sources"];
export const getGetAdminStatsQueryKey = () => ["adminStats"];
export const getGetSchedulerStatusQueryKey = () => ["schedulerStatus"];
export function setAuthTokenGetter() {}
export function setBaseUrl() {}
export async function customFetch() {}
