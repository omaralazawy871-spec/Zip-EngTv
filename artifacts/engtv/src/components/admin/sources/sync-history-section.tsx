import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SyncHistory } from "@workspace/api-client-react";

interface SyncHistorySectionProps {
  history: SyncHistory[];
  getSourceName: (sourceId: number) => string;
}

export function SyncHistorySection({ history, getSourceName }: SyncHistorySectionProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">سجل المزامنة</h2>
      <div className="bg-card border border-card-border rounded-2xl shadow-sm overflow-hidden">
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            لا يوجد سجل مزامنة بعد
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">المصدر</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">مستورد</TableHead>
                <TableHead className="text-right">محذوف</TableHead>
                <TableHead className="text-right">رسالة الخطأ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {new Date(entry.started_at).toLocaleString("ar")}
                  </TableCell>
                  <TableCell className="text-sm">{getSourceName(entry.source_id)}</TableCell>
                  <TableCell>
                    {entry.status === "success" ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">نجاح</Badge>
                    ) : entry.status === "failed" ? (
                      <Badge variant="destructive">فشل</Badge>
                    ) : (
                      <Badge variant="secondary">جارٍ</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{entry.channels_imported ?? 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.channels_deactivated ?? 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {entry.error_message ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
