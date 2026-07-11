import { useListCategories, useListChannels, useGetChannel } from "@workspace/api-client-react";
import { ViewerLayout } from "@/components/layout/viewer-layout";
import { ChannelCard, ChannelCardSkeleton } from "@/components/channel-card";
import { useLastWatched } from "@/hooks/use-last-watched";
import { Link } from "wouter";
import { ChevronLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: categories, isLoading: catsLoading } = useListCategories();
  const { data: channels, isLoading: channelsLoading } = useListChannels({ active_only: true });
  const { lastWatched } = useLastWatched();
  const { data: lastChannel } = useGetChannel(lastWatched!, { query: { enabled: !!lastWatched } });

  return (
    <ViewerLayout>
      <div className="space-y-12 pb-12">
        {/* Hero Spotlight */}
        {lastChannel && lastChannel.is_active && (
          <section className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-card to-background border border-card-border p-6 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <div className="relative z-10 w-32 h-32 md:w-48 md:h-48 flex-shrink-0 bg-secondary rounded-2xl flex items-center justify-center p-4 shadow-xl border border-border/50">
              {lastChannel.logo_url ? (
                 <img src={lastChannel.logo_url} alt={lastChannel.name} className="w-full h-full object-contain" />
              ) : (
                 <span className="text-5xl text-primary font-bold">{lastChannel.name.charAt(0)}</span>
              )}
            </div>
            <div className="relative z-10 flex-1 text-center md:text-start space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                آخر ما شاهدت
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{lastChannel.name}</h1>
              <p className="text-muted-foreground max-w-lg mx-auto md:mx-0">
                أكمل مشاهدة {lastChannel.name} من حيث توقفت. البث جاهز ومتاح الآن.
              </p>
              <Link href={`/watch/${lastChannel.id}`}>
                <Button size="lg" className="mt-4 gap-2 text-lg px-8 rounded-full h-14">
                  <Play className="w-5 h-5 fill-current" />
                  متابعة المشاهدة
                </Button>
              </Link>
            </div>
          </section>
        )}

        {/* Categories Rows */}
        {catsLoading || channelsLoading ? (
          <div className="space-y-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-4">
                <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[1, 2, 3, 4, 5, 6].map(j => <ChannelCardSkeleton key={j} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {categories?.map(category => {
              const categoryChannels = channels?.filter(c => c.category_id === category.id) || [];
              if (categoryChannels.length === 0) return null;
              
              return (
                <section key={category.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                      <span>{category.icon}</span>
                      {category.name}
                    </h2>
                    <Link href={`/category/${category.id}`} className="text-muted-foreground hover:text-primary flex items-center gap-1 text-sm font-medium transition-colors">
                      عرض الكل
                      <ChevronLeft className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 snap-x snap-mandatory hide-scrollbar">
                    {categoryChannels.slice(0, 6).map(channel => (
                      <div key={channel.id} className="min-w-[140px] sm:min-w-0 snap-start">
                        <ChannelCard channel={channel} />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
        
        {(!catsLoading && !channelsLoading && (!categories?.length || !channels?.length)) && (
          <div className="text-center py-20 text-muted-foreground">
            لا توجد قنوات متاحة حالياً.
          </div>
        )}
      </div>
    </ViewerLayout>
  );
}
