import * as React from "react"
import { Channel } from "@workspace/api-client-react"
import { Link } from "wouter"
import { Heart } from "lucide-react"
import { useFavorites } from "@/hooks/use-favorites"
import { cn } from "@/lib/utils"

interface ChannelCardProps {
  channel: Channel;
}

export function ChannelCard({ channel }: ChannelCardProps) {
  const { favorites, toggleFavorite } = useFavorites();
  const isFav = favorites.includes(channel.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(channel.id);
  };

  return (
    <Link href={`/watch/${channel.id}`}>
      <div className="group relative flex flex-col items-center p-4 bg-card rounded-xl border border-card-border transition-all duration-300 hover:glow-border hover:-translate-y-1 cursor-pointer">
        <button
          onClick={handleFavorite}
          className={cn(
            "absolute top-3 end-3 p-1.5 rounded-full bg-background/80 backdrop-blur-sm transition-colors z-10",
            isFav ? "text-destructive" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
        </button>

        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-primary/20 text-primary flex items-center justify-center text-3xl font-bold mb-4 shadow-inner">
          {channel.name.charAt(0)}
          {channel.logo_url && (
            <img
              src={channel.logo_url}
              alt={channel.name}
              className="absolute inset-0 w-full h-full object-contain p-2 bg-secondary/50"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
        </div>
        
        <h3 className="font-semibold text-sm sm:text-base text-center line-clamp-1 w-full px-2">
          {channel.name}
        </h3>
      </div>
    </Link>
  );
}

export function ChannelCardSkeleton() {
  return (
    <div className="flex flex-col items-center p-4 bg-card rounded-xl border border-card-border">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-muted animate-pulse mb-4" />
      <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
    </div>
  )
}
