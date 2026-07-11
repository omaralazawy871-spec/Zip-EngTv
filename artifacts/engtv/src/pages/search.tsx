import { useState, useEffect } from "react";
import { ViewerLayout } from "@/components/layout/viewer-layout";
import { ChannelCard, ChannelCardSkeleton } from "@/components/channel-card";
import { useListChannels } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  // Only search if query > 1 char, otherwise skip fetch
  const shouldSearch = debouncedQuery.trim().length > 1;
  
  const { data: results, isLoading } = useListChannels(
    { q: debouncedQuery, active_only: true },
    { query: { enabled: shouldSearch } }
  );

  return (
    <ViewerLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-12">
        <div className="relative">
          <div className="absolute inset-y-0 start-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-6 w-6 text-muted-foreground mr-4" />
          </div>
          <Input
            autoFocus
            type="search"
            placeholder="ابحث عن قناة..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 h-16 text-lg rounded-2xl bg-card border-2 border-card-border focus-visible:ring-primary shadow-lg"
          />
        </div>

        {query.trim().length <= 1 ? (
          <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
            <SearchIcon className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">اكتب اسم القناة للبحث</p>
          </div>
        ) : isLoading && shouldSearch ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <ChannelCardSkeleton key={i} />)}
          </div>
        ) : results?.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            لا توجد نتائج لـ "{query}"
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results?.map(channel => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>
        )}
      </div>
    </ViewerLayout>
  );
}
