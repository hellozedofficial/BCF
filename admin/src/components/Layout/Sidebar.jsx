import React from 'react'
import {
  LayoutDashboard,
  Trophy,
  Radio,
  Users,
  ClipboardList,
  Newspaper,
  Sun,
  Moon,
  ShieldCheck,
  CircleDot,
  ExternalLink,
  LogOut
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getClientWebsiteUrl } from '@/services/api'

export function Sidebar({ activeTab, onSelectTab, counts = {}, isDark, onToggleTheme, user, onLogout }) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'tournaments',
      label: 'Tournaments',
      icon: Trophy,
      badge: counts.tournaments ? String(counts.tournaments) : null
    },
    {
      id: 'matches',
      label: 'Live Match',
      icon: Radio,
      badge: counts.liveMatches ? `${counts.liveMatches}` : null,
      isLiveBadge: true
    },
    {
      id: 'players',
      label: 'Players & Rankings',
      icon: Users,
      badge: counts.players ? String(counts.players) : null
    },
    {
      id: 'registrations',
      label: 'Registrations',
      icon: ClipboardList,
      badge: counts.pendingRegistrations ? String(counts.pendingRegistrations) : null,
      badgeVariant: 'pending'
    },
    {
      id: 'news',
      label: 'News & Notices',
      icon: Newspaper,
      badge: null
    }
  ]

  return (
    <aside className="w-64 bg-background/80 flex flex-col h-screen sticky top-0 select-none border-none">
      {/* Brand Header - Borderless & Clean */}
      <div className="p-6 pb-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-foreground text-background flex items-center justify-center font-bold shadow-sm">
          <CircleDot className="h-5 w-5 stroke-[2.2]" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-foreground">BCF ADMIN</span>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground font-semibold">
              PRO
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            Bangladesh Carrom Fed.
          </span>
        </div>
      </div>

      {/* Navigation Links - Refined, subtle, no bulky white blocks */}
      <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
          Management
        </div>

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 group ${isActive
                ? 'bg-accent/80 text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground font-medium'
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                />
                <span className="tracking-tight">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold transition-all ${item.isLiveBadge
                    ? 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20'
                    : item.badgeVariant === 'pending'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                      : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}

        <div className="pt-5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
          Public Website
        </div>
        <a
          href={getClientWebsiteUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-colors group"
        >
          <span className="flex items-center gap-2.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Live Client Portal
          </span>
          <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground">5173 ↗</span>
        </a>
      </nav>

      {/* Footer / Account / Theme Toggle - Borderless */}
      <div className="p-4 pt-2 flex flex-col gap-2">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            <span className="text-[11px] font-medium text-muted-foreground">Admin Session Active</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="h-7 w-7 rounded-lg hover:bg-accent/60 text-muted-foreground hover:text-foreground"
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>
        </div>

        <div className="p-2.5 rounded-xl bg-accent/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-[10px] shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'BCF'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate text-foreground flex items-center gap-1">
                {user?.name || 'Super Admin'} <ShieldCheck className="h-3 w-3 text-muted-foreground shrink-0 inline" />
              </span>
              <span className="text-[10px] text-muted-foreground truncate font-mono">
                {user?.email || 'hello@hellozed.com'}
              </span>
            </div>
          </div>

          {onLogout && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              title="Sign Out of Admin Console"
              className="h-7 w-7 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
