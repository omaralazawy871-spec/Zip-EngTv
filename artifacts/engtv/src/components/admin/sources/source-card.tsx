import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, RotateCcw, Pencil, Trash2, Clock } from "lucide-react";
import type { Source } from "@workspace/api-client-react";
import type { SyncHistory } from "@workspace/api-client-react";

interface SourceCardProps {
  source: Source;
  isSyncing: boolean;
  isRetrying: boolean;
  lastFailed: SyncHistory | undefined;
  lastSyncFailed: boolean;
  onSync: () => void;
  onRetry: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "لم يتم بعد";
  return new Date(dateStr).toLocaleString("ar");
}

export function SourceCard({
  source,
  isSyncing,
  isRetrying,
  lastFailed,
  lastSyncFailed,
  onSync,
  onRetry,
  onEdit,
  onDelete,
}: SourceCardProps) {
  return (
    <div className="bg-card border border-card-border rounded-2xl shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base leading-tight truncate">{source.name}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="secondary" className="text-xs">
              {source.type === "xtream" ? "Xtream Codes" : "M3U"}
            </Badge>
            {source.status === "active" ? (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                نشط
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" />
                معطل
              </span>
            )}
            {source.filter_language !== "all" && (
              <Badge variant="outline" className="text-xs">
                {source.filter_language === "arabic"
                  ? "🇸🇦 عربي"
                  : source.filter_language === "english"
                  ? "🇺🇸 إنجليزي"
                  : "🇸🇦🇺🇸 عربي+إنجليزي"}
              </Badge>
            )}
            {source.sync_interval_hours > 0 && (
              <Badge variant="outline" className="text-xs gap-1">
                <Clock className="w-3 h-3" />
                {source.sync_interval_hours}س
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{source.channel_count ?? 0} قناة</span>
        <span>{source.category_count ?? 0} تصنيف</span>
      </div>

      <div className="text-xs text-muted-foreground space-y-0.5">
        <p>آخر مزامنة: {formatDate(source.last_sync_at)}</p>
        {lastSyncFailed && lastFailed?.error_message && (
          <p className="text-destructive truncate" title={lastFailed.error_message}>
            ⚠️ {lastFailed.error_message}
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-1 border-t border-border flex-wrap">
        <Button variant="ghost" size="sm" className="flex-1" onClick={onSync} disabled={isSyncing || isRetrying}>
          {isSyncing ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <RefreshCw className="w-4 h-4 ml-1" />}
          مزامنة
        </Button>
        {lastSyncFailed && (
          <Button variant="ghost" size="sm" onClick={onRetry} disabled={isSyncing || isRetrying}>
            {isRetrying ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <RotateCcw className="w-4 h-4 ml-1" />}
            إعادة
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="w-4 h-4 ml-1" />
          تعديل
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="w-4 h-4 ml-1" />
          حذف
        </Button>
      </div>
    </div>
  );
}
