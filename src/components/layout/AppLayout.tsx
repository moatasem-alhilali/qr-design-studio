import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { QrCode, LayoutDashboard, Sparkles, BarChart3, Layers, Settings, LogOut, PlusCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/', label: 'Create QR', icon: PlusCircle },
  { path: '/templates', label: 'Templates', icon: Sparkles },
  { path: '/dashboard', label: 'My QR Codes', icon: LayoutDashboard, auth: true },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, auth: true },
  { path: '/batch', label: 'Batch Generator', icon: Layers },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, signOut, isConfigured } = useAuth();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 border-r border-border bg-card/50 flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <QrCode className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">QR Studio</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.filter(n => !n.auth || user).map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          {user ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground truncate px-3">{user.email}</p>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={signOut}>
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </div>
          ) : isConfigured ? (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <LogIn className="h-4 w-4" /> Sign In
              </Button>
            </Link>
          ) : (
            <p className="text-[10px] text-muted-foreground px-3">Configure Firebase to enable accounts</p>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center justify-between h-14 px-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <QrCode className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">QR Studio</span>
            </Link>
            <div className="flex items-center gap-1">
              {navItems.slice(0, 4).filter(n => !n.auth || user).map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    location.pathname === item.path ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </Link>
              ))}
              {user ? (
                <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8"><LogOut className="h-4 w-4" /></Button>
              ) : isConfigured ? (
                <Link to="/auth"><Button variant="ghost" size="icon" className="h-8 w-8"><LogIn className="h-4 w-4" /></Button></Link>
              ) : null}
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
