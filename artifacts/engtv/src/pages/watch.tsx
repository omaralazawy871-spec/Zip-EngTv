import { useEffect, useRef, useState, useCallback } from "react";
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
  const hlsRef = useRef<Hls | null>(null);
  const [streamError, setStreamError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const { setWatched } = useLastWatched();
  const { favorites, toggleFavorite } = useFavorites();
  const isFav = favorites.includes(channelId);

  const { data: channel, isLoading: isChannelLoading, isError: isChannelError } = useGetChannel(channelId);

  const { data: relatedChannels } = useListChannels({
    category_id: channel?.category_id ?? undefined,
    active_only: true,
  });

  useEffect(() => {
    if (channel?.id) setWatched(channel.id);
  }, [channel?.id, setWatched]);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const initPlayer = useCallback(() => {
    const video = videoRef.current;
    const streamUrl = channel?.stream_url;
    if (!video || !streamUrl) return;

    destroyHls();
    setStreamError(false);
    setIsBuffering(true);

    if (Hls.isSupported()) {
      const hls = new Hls({
        // Live-edge tuning — duration-based only (do NOT mix with DurationCount
        // variants; HLS.js 1.x throws if both families are present)
        liveSyncDuration: 3,              // target 3s behind live edge
        liveMaxLatencyDuration: 10,       // max 10s behind live edge
        maxLiveSyncPlaybackRate: 1.5,     // catch up at 1.5x when falling behind

        // Buffering
        maxBufferLength: 30,              // keep up to 30s forward buffer
        maxBufferSize: 60 * 1000 * 1000, // 60 MB buffer cap
        backBufferLength: 8,              // keep 8s backward for seek
        highBufferWatchdogPeriod: 3,      // watchdog fires after 3s of high-buffer stall

        // Network timeouts & retries
        fragLoadingTimeOut: 10000,        // 10s per segment fetch
        manifestLoadingTimeOut: 10000,    // 10s manifest load
        levelLoadingTimeOut: 10000,
        fragLoadingMaxRetry: 6,
        manifestLoadingMaxRetry: 4,
        levelLoadingMaxRetry: 4,
        fragLoadingRetryDelay: 500,
        fragLoadingMaxRetryTimeout: 4000,

        // Quality & startup
        startLevel: -1,                   // auto quality on start
        autoStartLoad: true,
        enableWorker: true,

        // Low-latency mode (LL-HLS streams)
        lowLatencyMode: true,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        // Once first fragment is buffered, hide spinner
        setIsBuffering(false);
      });

      // Auto-recover from fatal errors; non-fatal errors are ignored
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            // Try to recover: reload manifest after short delay
            setTimeout(() => {
              if (hlsRef.current) {
                hlsRef.current.startLoad();
              }
            }, 2000);
            break;

          case Hls.ErrorTypes.MEDIA_ERROR:
            // Attempt media error recovery
            hlsRef.current?.recoverMediaError();
            break;

          default:
            // Unrecoverable — show error UI
            setStreamError(true);
            destroyHls();
            break;
        }
      });

      // Level-switch watchdog: if video stalls for > 8s, jump to live edge
      let stallTimer: ReturnType<typeof setTimeout> | null = null;
      video.addEventListener("waiting", () => {
        setIsBuffering(true);
        stallTimer = setTimeout(() => {
          if (hlsRef.current) {
            try { hlsRef.current.currentLevel = -1; } catch { /* noop */ }
            // Jump to live edge
            if (isFinite(video.duration) && video.duration > 0) {
              video.currentTime = video.duration - 2;
            }
          }
        }, 8000);
      });
      video.addEventListener("playing", () => {
        setIsBuffering(false);
        if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; }
      });

    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS (Safari/iOS)
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(() => {});
        setIsBuffering(false);
      });
      video.addEventListener("error", () => setStreamError(true));
    } else {
      setStreamError(true);
    }
  }, [channel?.stream_url, destroyHls]);

  useEffect(() => {
    initPlayer();
    return () => destroyHls();
  }, [initPlayer, destroyHls]);

  const handleRetry = () => {
    setStreamError(false);
    setRetryCount((c) => c + 1);
    setTimeout(initPlayer, 300);
  };

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
          {/* Player */}
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 ring-1 ring-white/10">
            {streamError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/90 backdrop-blur-sm z-20 text-center p-6">
                <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                <h3 className="text-2xl font-bold mb-2">البث غير متاح حالياً</h3>
                <p className="text-muted-foreground mb-6">
                  نعتذر، هناك مشكلة في مصدر البث. يرجى المحاولة مرة أخرى.
                  {retryCount > 0 && <span className="block text-xs mt-1 text-muted-foreground/60">محاولة #{retryCount}</span>}
                </p>
                <Button onClick={handleRetry} variant="outline" className="gap-2">
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
                  muted={false}
                />
              </>
            )}
          </div>

          {/* Channel Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-card rounded-2xl border border-card-border">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                <span className="text-2xl font-bold text-primary">{channel.name.charAt(0)}</span>
                {channel.logo_url && (
                  <img
                    src={channel.logo_url}
                    alt={channel.name}
                    className="absolute inset-0 w-full h-full object-contain p-2 bg-secondary"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{channel.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
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
              {isFav ? "إزالة من المفضلة" : "أضف للمفضلة"}
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
