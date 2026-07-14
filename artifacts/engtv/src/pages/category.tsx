import { useGetCategory } from "@workspace/api-client-react";
import { ViewerLayout } from "@/components/layout/viewer-layout";
import { ChannelCard, ChannelCardSkeleton } from "@/components/channel-card";
import { useParams } from "wouter";

export default function CategoryPage() {
  const { id } = useParams();
  const categoryId = parseInt(id || "0", 10);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: category, isLoading, isError } = useGetCategory(categoryId, { query: { enabled: !!categoryId } as any });

  return (
    <ViewerLayout>
      {isLoading ? (
        <div className="space-y-8">
          <div className="h-12 w-64 bg-muted animate-pulse rounded-md mx-auto" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <ChannelCardSkeleton key={i} />)}
          </div>
        </div>
      ) : isError || !category ? (
        <div className="text-center py-20 text-destructive text-lg font-medium">
          تعذر تحميل التصنيف.
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="text-center space-y-2 py-8 bg-card rounded-2xl border border-card-border shadow-sm">
            <span className="text-5xl block mb-4">{category.icon}</span>
            <h1 className="text-3xl font-bold">{category.name}</h1>
            <p className="text-muted-foreground">
              {category.channels.filter(c => c.is_active).length} قناة
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {category.channels.filter(c => c.is_active).map(channel => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>
          
          {category.channels.filter(c => c.is_active).length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد قنوات نشطة في هذا التصنيف.
            </div>
          )}
        </div>
      )}
    </ViewerLayout>
  );
}
