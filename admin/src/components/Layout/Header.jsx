import React from 'react'
import {
  Search,
  Plus,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header({
  title,
  subtitle,
  isOnline,
  isRefreshing,
  onRefresh,
  onQuickAction,
  user,
  onLogout
}) {
  return (
    <header className="h-16 px-8 flex items-center justify-between sticky top-0 z-20 bg-background/60 backdrop-blur-xl border-none">
      {/* Page Title */}
      <div className="flex flex-col">
        <h1 className="text-base font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && (
          <span className="text-[11px] text-muted-foreground/80 mt-0.5">{subtitle}</span>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Backend Status indicator - Minimal pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-accent/40 text-muted-foreground">
          {isOnline ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-emerald-500">API ONLINE</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="text-[11px] font-medium text-amber-500/90">LOCAL CACHE</span>
            </>
          )}
        </div>

        {/* Sync Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </Button>

        {/* Quick Action Button */}
        {onQuickAction && (
          <Button
            size="sm"
            onClick={onQuickAction}
            className="h-8 px-3.5 gap-1.5 text-xs font-semibold rounded-lg shadow-xs bg-foreground text-background hover:bg-foreground/90 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create New</span>
          </Button>
        )}

        {/* User Profile Pill & Quick Logout */}
        {user && (
          <div className="flex items-center pl-1 border-l border-border/60 ml-1">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-accent/40 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-foreground max-w-[130px] truncate" title={user.email}>
                {user.email || 'hello@hellozed.com'}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
