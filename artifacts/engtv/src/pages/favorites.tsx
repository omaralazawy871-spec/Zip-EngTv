import { ViewerLayout } from "@/components/layout/viewer-layout";
import { ChannelCard, ChannelCardSkeleton } from "@/components/channel-card";
import { useListChannels } from "@workspace/api-client-react";
import { useFavorites } from "@/hooks/use-favorites";
import { Heart } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const { data: channels, isLoading } = useListChannels({ active_only: true });

  const favoriteChannels = channels?.filter(c => favorites.includes(c.id)) || [];

  return (
    <ViewerLayout>
      <div className="space-y-8 animate-in fade-in pb-12">
        <div className="flex items-center gap-3 py-4 border-b border-border/40">
          <Heart className="w-8 h-8 text-destructive fill-destructive" />
          <h1 className="text-3xl font-bold tracking-tight">قنواتي المفضلة</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4].map(i => <ChannelCardSkeleton key={i} />)}
          </div>
        ) : favoriteChannels.length === 0 ? (
          <div className="text-center py-32 flex flex-col items-center bg-card rounded-3xl border border-card-border shadow-sm">
            <Heart className="w-20 h-20 text-muted-foreground/30 mb-6" />
            <h2 className="text-2xl font-bold mb-2">لا توجد قنوات مفضلة بعد</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              اضغط على أيقونة القلب على أي قناة لإضافتها إلى قائمتك المفضلة والوصول إليها بسرعة هنا.
            </p>
            <Link href="/">
              <Button size="lg" className="rounded-full px-8">
                تصفح القنوات
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {favoriteChannels.map(channel => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>
        )}
      </div>
    </ViewerLayout>
  );
}
