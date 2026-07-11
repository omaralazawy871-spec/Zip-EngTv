import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Link, useLocation } from "wouter"
import { Home, Heart, RefreshCw } from "lucide-react"
import { useGetSettings } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "../ui/button"

export function ViewerLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const { data: settings } = useGetSettings()
  const queryClient = useQueryClient()

  const handleRefresh = () => {
    queryClient.invalidateQueries()
  }

  const appName = settings?.app_name || "EngTv"

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {settings?.app_logo_url ? (
              <img src={settings.app_logo_url} alt={appName} className="h-8 w-auto object-contain" />
            ) : (
              <div className="bg-primary text-primary-foreground font-bold text-xl rounded-md w-10 h-10 flex items-center justify-center">
                {appName.charAt(0)}
              </div>
            )}
            <span className="font-bold text-xl tracking-tight hidden sm:block">{appName}</span>
          </Link>
          
          <nav className="flex items-center gap-1 sm:gap-4">
            <Link href="/" className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-accent/50",
              location === "/" ? "text-primary font-semibold" : "text-muted-foreground"
            )}>
              <Home className="w-5 h-5" />
              <span className="hidden sm:block">الرئيسية</span>
            </Link>
            
            <Link href="/search" className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-accent/50",
              location === "/search" ? "text-primary font-semibold" : "text-muted-foreground"
            )}>
              <Search className="w-5 h-5" />
              <span className="hidden sm:block">بحث</span>
            </Link>

            <Link href="/favorites" className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-accent/50",
              location === "/favorites" ? "text-primary font-semibold" : "text-muted-foreground"
            )}>
              <Heart className="w-5 h-5" />
              <span className="hidden sm:block">المفضلة</span>
            </Link>

            <div className="w-px h-6 bg-border mx-2" />

            <Button variant="ghost" size="icon" onClick={handleRefresh} className="text-muted-foreground hover:text-primary">
              <RefreshCw className="w-5 h-5" />
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      
      <footer className="py-6 border-t border-border/40 text-center text-sm text-muted-foreground mt-auto">
        <p>© {new Date().getFullYear()} {appName}. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  )
}
