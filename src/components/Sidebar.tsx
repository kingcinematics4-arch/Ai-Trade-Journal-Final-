'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileSummary from '@/components/UserProfileSummary';
import UserAvatar from '@/components/ui/UserAvatar';
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
  { id: 'nav-analytics', label: 'Analytics', href: '/dashboard', icon: <BarChart3 size={18} /> },
  {
    id: 'nav-ai-coach',
    label: 'AI Coach',
    href: '/dashboard',
    icon: <BrainCircuit size={18} />,
  },
];

const secondaryNavItems: NavItem[] = [
  { id: 'nav-goals', label: 'Goals', href: '/dashboard', icon: <Target size={18} /> },
  {
    id: 'nav-notifications',
    label: 'Notifications',
    href: '/dashboard',
    icon: <Bell size={18} />,
  },
  { id: 'nav-profile', label: 'Profile', href: '/dashboard', icon: <User size={18} /> },
  { id: 'nav-settings', label: 'Settings', href: '/dashboard', icon: <Settings size={18} /> },
];

export default function Sidebar({ activePath }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const { profile, displayName, isLoading, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } sidebar-transition flex-shrink-0 bg-card border-r border-border flex flex-col h-full relative`}
    >
      {/* Logo */}
      <div
        className={`flex items-center h-16 px-3 border-b border-border ${collapsed ? 'justify-center' : 'gap-2'}`}
      >
        <AppLogo size={32} />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-sm text-foreground leading-tight">AITrade</span>
            <span className="text-xs text-muted-foreground leading-tight">Journal</span>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[4.5rem] z-10 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-muted transition-colors duration-150"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Account Info */}
      {collapsed ? (
        (profile || isLoading) && (
          <div className="flex justify-center mt-4 mb-2 px-2" title={displayName}>
            <UserAvatar size="sm" />
          </div>
        )
      ) : (
        <div className="mx-3 mt-4 mb-2 p-2.5 bg-muted/50 rounded-lg border border-border">
          <UserProfileSummary size="xs" layout="horizontal" compact />
        </div>
      )}

      {/* Primary Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {!collapsed && (
          <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Trading
          </p>
        )}
        {primaryNavItems.map((item) => {
          const isActive =
            activePath === item.href || (item.href === '/dashboard' && activePath === '/');
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

        <div className="my-3 border-t border-border" />

        {!collapsed && (
          <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Account
          </p>
        )}
        {secondaryNavItems.map((item) => {
          const isActive = activePath === item.href;
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

      {/* Bottom: Admin + Logout */}
      <div className="px-2 py-3 border-t border-border space-y-0.5">
        <Link
          href="/dashboard"
          className={`nav-item ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Admin Panel' : undefined}
        >
          <ShieldCheck size={18} className="flex-shrink-0 text-amber-400" />
          {!collapsed && <span className="text-amber-400">Admin Panel</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={`nav-item ${collapsed ? 'justify-center px-2' : ''} hover:text-red-400 w-full`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
