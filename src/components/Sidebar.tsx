'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileSummary from '@/components/UserProfileSummary';
import UserAvatar from '@/components/ui/UserAvatar';
import { useNotifications } from '@/hooks/useNotifications';
import AppLogo from '@/components/ui/AppLogo';
import {
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  BarChart3,
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
  ShieldCheck,
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

const primaryNavItems: NavItem[] = [
  {
    id: 'nav-dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={18} />,
  },
  { id: 'nav-add-trade', label: 'Add Trade', href: '/add-trade', icon: <PlusCircle size={18} /> },
  { id: 'nav-history', label: 'Trade History', href: '/trade-history', icon: <BookOpen size={18} /> },
  { id: 'nav-analytics', label: 'Analytics', href: '/analytics', icon: <BarChart3 size={18} /> },
  {
    id: 'nav-ai-coach',
    label: 'AI Coach',
    href: '/ai-coach',
    icon: <BrainCircuit size={18} />,
  },
];

export default function Sidebar({ activePath }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { profile, displayName, isLoading, signOut } = useAuth();
  const { unreadCount } = useNotifications();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const secondaryNavItems: NavItem[] = [
    { id: 'nav-goals', label: 'Goals', href: '/goals', icon: <Target size={18} /> },
    {
      id: 'nav-notifications',
      label: 'Notifications',
      href: '/dashboard',
      icon: <Bell size={18} />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { id: 'nav-profile', label: 'Profile', href: '/profile', icon: <User size={18} /> },
    { id: 'nav-settings', label: 'Settings', href: '/settings', icon: <Settings size={18} /> },
  ];

  const handleLogout = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      {/* Mobile Header Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/50 backdrop-blur-3xl border-b border-white/[0.05] z-40 px-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AppLogo size={30} />
          <span className="font-bold text-[18px] tracking-[-0.03em] text-white">AITrade</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-muted-foreground hover:text-foreground"
          aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
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
            flex flex-col h-full transition-transform duration-300 ease-in-out
            ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          `}
        >
          <SidebarContent
            collapsed={false}
            onLogout={handleLogout}
            activePath={activePath}
            isLoading={isLoading}
            profile={profile}
            displayName={displayName}
            secondaryNavItems={secondaryNavItems}
          />
        </aside>
      </div>

      {/* Desktop Sidebar (Permanent) */}
      <aside
        className={`
          hidden lg:flex flex-col h-full bg-card/20 backdrop-blur-3xl border-r border-white/[0.05] 
          sidebar-transition relative flex-shrink-0
          ${collapsed ? 'w-16' : 'w-64'}
        `}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[4.5rem] z-10 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-muted transition-colors duration-150 shadow-sm"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        <SidebarContent
          collapsed={collapsed}
          onLogout={handleLogout}
          activePath={activePath}
          isLoading={isLoading}
          profile={profile}
          displayName={displayName}
          secondaryNavItems={secondaryNavItems}
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
}

function SidebarContent({
  collapsed,
  onLogout,
  activePath,
  isLoading,
  profile,
  displayName,
  secondaryNavItems,
}: SidebarContentProps) {
  return (
    <>
      <div className={`flex items-center h-20 px-6 border-b border-white/[0.03] ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <AppLogo size={collapsed ? 28 : 36} />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-[18px] text-white tracking-tight leading-none">AITrade</span>
            <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mt-1">SaaS Intelligence</span>
          </div>
        )}
      </div>

      {collapsed ? (
        (profile || isLoading) && (
          <div className="flex justify-center mt-4 mb-2 px-2" title={displayName || ''}>
            <UserAvatar size="sm" />
          </div>
        )
      ) : (
        <div className="mx-4 mt-6 mb-2 p-4 bg-white/[0.03] rounded-[24px] border border-white/[0.05]">
          <UserProfileSummary size="sm" layout="horizontal" compact />
        </div>
      )}

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-none">
        {!collapsed && (
          <p className="px-4 py-2 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">
            Trading
          </p>
        )}
        {primaryNavItems.map((item) => {
          const isActive = activePath === item.href || (item.href === '/dashboard' && activePath === '/');
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`nav-item ${isActive ? 'nav-item-active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
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
            Account
          </p>
        )}
        {secondaryNavItems.map((item: NavItem) => {
          const isActive = activePath === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`nav-item py-3 px-3 rounded-xl transition-all hover:bg-white/[0.03] ${isActive ? 'text-primary' : 'text-slate-400'} ${collapsed ? 'justify-center px-2' : ''}`}
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
        <Link
          href="/dashboard"
          className={`nav-item py-3 px-3 rounded-xl hover:bg-white/[0.03] ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Admin Panel' : undefined}
        >
          <ShieldCheck size={18} className="flex-shrink-0 text-amber-400" />
          {!collapsed && <span className="text-amber-400 font-medium">Admin Panel</span>}
        </Link>
        <button
          onClick={onLogout}
          className={`nav-item py-3 px-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors w-full ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );
}
