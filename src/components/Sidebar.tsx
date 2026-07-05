'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileSummary from '@/components/UserProfileSummary';
import UserAvatar from '@/components/ui/UserAvatar';
import { useNotifications } from '@/hooks/useNotifications';
import AppLogo from '@/components/ui/AppLogo';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import {
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  BarChart3,
  Layers,
  Calendar,
  BrainCircuit,
  Target,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Download,
  Users,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  activePath?: string;
}

export default function Sidebar({ activePath }: SidebarProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { profile, displayName, isLoading, signOut } = useAuth();
  const { unreadCount } = useNotifications();

  const primaryNavItems: NavItem[] = [
    {
      id: 'nav-dashboard',
      label: t('sidebar.nav.dashboard'),
      href: '/dashboard',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'nav-add-trade',
      label: t('sidebar.nav.addTrade'),
      href: '/add-trade',
      icon: <PlusCircle size={18} />,
    },
    {
      id: 'nav-history',
      label: t('sidebar.nav.tradeHistory'),
      href: '/trade-history',
      icon: <BookOpen size={18} />,
    },
    {
      id: 'nav-analytics',
      label: t('sidebar.nav.analytics'),
      href: '/analytics',
      icon: <BarChart3 size={18} />,
    },
    {
      id: 'nav-calendar',
      label: t('sidebar.nav.calendar'),
      href: '/dashboard/calendar',
      icon: <Calendar size={18} />,
    },
    {
      id: 'nav-strategies',
      label: t('sidebar.nav.strategies'),
      href: '/strategies',
      icon: <Layers size={18} />,
    },
    {
      id: 'nav-ai-coach',
      label: t('sidebar.nav.aiCoach'),
      href: '/ai-coach',
      icon: <BrainCircuit size={18} />,
    },
    {
      id: 'nav-exports',
      label: t('sidebar.nav.exports'),
      href: '/exports',
      icon: <Download size={18} />,
    },
    {
      id: 'nav-community',
      label: 'Community',
      href: '/community',
      icon: <Users size={18} />,
    },
  ];

  // Root Cause Fix: Automatically close mobile menu on route change.
  // This ensures that when the user navigates, the persistent layout state is reset.
  useEffect(() => {
    if (isMobileOpen) {
      console.log('Navigation triggered');
      console.log('Current sidebar state:', isMobileOpen);
      console.log('Closing sidebar via pathname change...');
      setIsMobileOpen(false);
    }
  }, [pathname, isMobileOpen]);

  // Memoize nav items to prevent unnecessary re-renders
  const secondaryNavItems: NavItem[] = useMemo(() => {
    return [
      {
        id: 'nav-goals',
        label: t('sidebar.nav.goals'),
        href: '/goals',
        icon: <Target size={18} />,
      },
      {
        id: 'nav-notifications',
        label: t('sidebar.nav.notifications'),
        href: '/dashboard/notifications',
        icon: <Bell size={18} />,
        badge: unreadCount > 0 ? unreadCount : undefined,
      },
      {
        id: 'nav-profile',
        label: t('sidebar.nav.profile'),
        href: '/profile',
        icon: <User size={18} />,
      },
      {
        id: 'nav-settings',
        label: t('sidebar.nav.settings'),
        href: '/settings',
        icon: <Settings size={18} />,
      },
    ];
  }, [unreadCount, t]);

  const handleLogout = useCallback(async () => {
    console.log('Sidebar item clicked');
    console.log('Current sidebar state:', isMobileOpen);
    console.log('Closing sidebar...');
    setIsMobileOpen(false);
    await signOut();
    router.replace('/');
    router.refresh();
  }, [router, signOut, isMobileOpen]);

  const handleNavItemClick = useCallback(() => {
    console.log('Sidebar item clicked');
    console.log('Current sidebar state:', isMobileOpen);
    console.log('Closing sidebar...');
    setIsMobileOpen(false);
  }, [isMobileOpen]);

  // Ensure activePath falls back to the current pathname if not provided by parent
  const effectivePath = activePath || pathname;

  return (
    <>
      {/* Mobile Header Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/50 backdrop-blur-3xl border-b border-white/[0.05] z-40 px-5 flex items-center justify-between">
        <Link href="/dashboard" onClick={handleNavItemClick} className="flex items-center gap-2">
          <AppLogo size={30} />
          <span className="font-bold text-[18px] tracking-[-0.03em] text-white">AITrade</span>
        </Link>
        <button
          onClick={() => {
            console.log('[Sidebar] Toggling mobile sidebar. Previous state:', isMobileOpen);
            setIsMobileOpen(!isMobileOpen);
          }}
          className="p-2 text-muted-foreground hover:text-foreground"
          aria-label={isMobileOpen ? t('sidebar.aria.closeMenu') : t('sidebar.aria.openMenu')}
        >
          {isMobileOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </header>

      {/* Mobile Sidebar (Drawer) */}
      <div className="lg:hidden">
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-white/[0.05] 
            flex flex-col h-screen transition-transform duration-300 ease-in-out overflow-hidden
            ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          `}
        >
          <SidebarContent
            collapsed={false}
            onLogout={handleLogout}
            activePath={effectivePath}
            isLoading={isLoading}
            profile={profile}
            displayName={displayName}
            secondaryNavItems={secondaryNavItems}
            primaryNavItems={primaryNavItems}
            onNavItemClick={handleNavItemClick}
            t={t}
          />
        </aside>
      </div>

      {/* Desktop Sidebar (Permanent) */}
      <aside
        className={`
          hidden lg:flex flex-col h-screen bg-card/20 backdrop-blur-3xl border-r border-white/[0.05] 
          sidebar-transition relative flex-shrink-0 overflow-hidden
          ${collapsed ? 'w-16' : 'w-64'}
        `}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[4.5rem] z-10 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-muted transition-colors duration-150 shadow-sm"
          aria-label={
            collapsed ? t('sidebar.aria.expandSidebar') : t('sidebar.aria.collapseSidebar')
          }
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        <SidebarContent
          collapsed={collapsed}
          onLogout={handleLogout}
          activePath={effectivePath}
          isLoading={isLoading}
          profile={profile}
          displayName={displayName}
          secondaryNavItems={secondaryNavItems}
          primaryNavItems={primaryNavItems}
          t={t}
        />
      </aside>
    </>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  onLogout: () => void;
  activePath?: string;
  isLoading: boolean;
  profile: Record<string, unknown> | null;
  displayName: string | null;
  secondaryNavItems: NavItem[];
  primaryNavItems: NavItem[];
  onNavItemClick?: () => void;
  t: (key: string) => string;
}

function SidebarContent({
  collapsed,
  onLogout,
  activePath: effectivePath = '',
  isLoading,
  profile,
  displayName,
  secondaryNavItems,
  primaryNavItems,
  onNavItemClick,
  t,
}: SidebarContentProps) {
  return (
    <>
      <Link
        href="/dashboard"
        onClick={onNavItemClick}
        className={`flex items-center h-20 px-6 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${collapsed ? 'justify-center' : 'gap-3'}`}
      >
        <AppLogo size={collapsed ? 28 : 36} />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-[18px] text-white tracking-tight leading-none">
              AITrade
            </span>
            <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mt-1">
              {t('common.saaSIntelligence')}
            </span>
          </div>
        )}
      </Link>

      {collapsed ? (
        (profile || isLoading) && (
          <Link
            href="/profile"
            onClick={onNavItemClick}
            className="flex justify-center mt-4 mb-2 px-2 hover:opacity-80 transition-opacity"
            title={displayName || ''}
          >
            <UserAvatar size="sm" />
          </Link>
        )
      ) : (
        <Link
          href="/profile"
          onClick={onNavItemClick}
          className="block mx-4 mt-6 mb-2 p-4 bg-white/[0.03] rounded-[24px] border border-white/[0.05] hover:bg-white/[0.06] transition-colors"
        >
          <UserProfileSummary size="sm" layout="horizontal" compact />
        </Link>
      )}

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {!collapsed && (
          <p className="px-4 py-2 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">
            {t('sidebar.sections.trading')}
          </p>
        )}
        {primaryNavItems.map((item) => {
          // Robust comparison: Exact for dashboard, startsWith for deep routes (history, analytics, etc)
          const isActive =
            item.href === '/dashboard'
              ? effectivePath === '/dashboard' || effectivePath === '/' // Keep '/' for dashboard if it's the default logged-in route
              : effectivePath.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavItemClick}
              className={`nav-item transition-all duration-200 motion-safe:hover:translate-x-1 active:scale-95 ${
                isActive
                  ? 'text-blue-500'
                  : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.badge && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}

        <div className="my-4 border-t border-white/[0.05]" />

        {!collapsed && (
          <p className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
            {t('sidebar.sections.account')}
          </p>
        )}
        {secondaryNavItems.map((item: NavItem) => {
          const isActive = effectivePath.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavItemClick}
              className={`nav-item py-3 px-3 rounded-xl transition-all duration-200 motion-safe:hover:translate-x-1 active:scale-95 ${
                isActive
                  ? 'text-blue-500'
                  : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="bg-muted text-muted-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/[0.03] space-y-1">
        <button
          onClick={onLogout}
          className={`nav-item py-3 px-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors w-full ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? t('sidebar.nav.logout') : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>{t('sidebar.nav.logout')}</span>}
        </button>
      </div>
    </>
  );
}
