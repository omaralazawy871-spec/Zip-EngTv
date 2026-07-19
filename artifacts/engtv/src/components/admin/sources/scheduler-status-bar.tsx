import { Clock } from "lucide-react";
import type { SchedulerStatus } from "@workspace/api-client-react";

interface SchedulerStatusBarProps {
  status: SchedulerStatus | undefined;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("ar");
}

export function SchedulerStatusBar({ status }: SchedulerStatusBarProps) {
  if (!status || status.scheduled_sources.length === 0) return null;

  return (
    <div className="bg-card border border-card-border rounded-xl p-4 flex flex-wrap gap-3 items-center">
      <Clock className="w-4 h-4 text-primary shrink-0" />
      <span className="text-sm font-medium">المزامنة التلقائية:</span>
      {status.scheduled_sources.map((ss) => (
        <div key={ss.source_id} className="flex items-center gap-2 text-xs bg-secondary rounded-lg px-3 py-1">
          <span className="font-medium">{ss.source_name}</span>
          <span className="text-muted-foreground">كل {ss.sync_interval_hours}س</span>
          {ss.next_sync_at && (
            <span className="text-muted-foreground">· القادمة: {formatDate(ss.next_sync_at)}</span>
          )}
        </div>
      ))}
    </div>
  );
}
