import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { useGetChannel, useListChannels } from "@workspace/api-client-react";
import { ViewerLayout } from "@/components/layout/viewer-layout";
import { useLastWatched } from "@/hooks/use-last-watched";
import { useFavorites } from "@/hooks/use-favorites";
import { ChannelCard } from "@/components/channel-card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Heart, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Hls from "hls.js";

export default function WatchPage() {
  const { id } = useParams();
  const channelId = parseInt(id || "0", 10);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamError, setStreamError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  
  const { setWatched } = useLastWatched();
  const { favorites, toggleFavorite } = useFavorites();
  const isFav = favorites.includes(channelId);

  const { data: channel, isLoading: isChannelLoading, isError: isChannelError } = useGetChannel(channelId, {
    query: { enabled: !!channelId }
  });

  const { data: relatedChannels } = useListChannels(
    { category_id: channel?.category_id ?? undefined, active_only: true },
    { query: { enabled: !!channel?.category_id } }
  );

  useEffect(() => {
    if (channel?.id) {
      setWatched(channel.id);
    }
  }, [channel?.id, setWatched]);

  useEffect(() => {
    if (!channel?.stream_url || !videoRef.current) return;

    setStreamError(false);
    setIsBuffering(true);
    let hls: Hls | null = null;

    const initPlayer = () => {
      const video = videoRef.current;
      if (!video) return;

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        
        hls.loadSource(channel.stream_url);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(e => console.error("Auto-play prevented:", e));
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError();
                break;
              default:
                setStreamError(true);
                hls?.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = channel.stream_url;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(e => console.error("Auto-play prevented:", e));
        });
        video.addEventListener('error', () => {
          setStreamError(true);
        });
      }
    };

    initPlayer();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [channel?.stream_url]);

  const handleVideoPlaying = () => setIsBuffering(false);
  const handleVideoWaiting = () => setIsBuffering(true);

  if (isChannelLoading) {
    return (
      <ViewerLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">جاري تحميل القناة...</p>
        </div>
      </ViewerLayout>
    );
  }

  if (isChannelError || !channel) {
    return (
      <ViewerLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-destructive">
          <AlertCircle className="w-12 h-12 mb-4" />
          <h2 className="text-xl font-bold">القناة غير موجودة</h2>
        </div>
      </ViewerLayout>
    );
  }

  const otherRelated = relatedChannels?.filter(c => c.id !== channel.id).slice(0, 5) || [];

  return (
    <ViewerLayout>
      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Player Container */}
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 ring-1 ring-white/10">
            {streamError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/90 backdrop-blur-sm z-20 text-center p-6">
                <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                <h3 className="text-2xl font-bold mb-2">البث غير متاح حالياً</h3>
                <p className="text-muted-foreground mb-6">نعتذر، هناك مشكلة في مصدر البث. يرجى المحاولة مرة أخرى لاحقاً.</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  إعادة المحاولة
                </Button>
              </div>
            ) : (
              <>
                {isBuffering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 pointer-events-none">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  </div>
                )}
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                  autoPlay
                  onPlaying={handleVideoPlaying}
                  onWaiting={handleVideoWaiting}
                />
              </>
            )}
          </div>

          {/* Channel Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-card rounded-2xl border border-card-border">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                {channel.logo_url ? (
                  <img src={channel.logo_url} alt={channel.name} className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-2xl font-bold text-primary">{channel.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{channel.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">مباشر الآن</span>
                </div>
              </div>
            </div>
            
            <Button 
              size="lg" 
              variant={isFav ? "secondary" : "default"}
              onClick={() => toggleFavorite(channel.id)}
              className="gap-2 shrink-0"
            >
              <Heart className={cn("w-5 h-5", isFav && "fill-destructive text-destructive")} />
              {isFav ? 'إزالة من المفضلة' : 'أضف للمفضلة'}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-lg px-2 border-b border-border/40 pb-2">قنوات ذات صلة</h3>
          {otherRelated.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-4">
              {otherRelated.map(c => (
                <ChannelCard key={c.id} channel={c} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm p-4 text-center bg-card rounded-xl border border-card-border">
              لا توجد قنوات أخرى في هذا التصنيف.
            </p>
          )}
        </div>
      </div>
    </ViewerLayout>
  );
}
