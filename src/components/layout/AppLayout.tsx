import { ReactNode, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { QrCode, Sparkles, Layers, Settings, PlusCircle, Github } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Create QR', icon: PlusCircle },
  { path: '/templates', label: 'Templates', icon: Sparkles },
  { path: '/batch', label: 'Batch Generator', icon: Layers },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const siteUrl = 'https://qr-design-dun.vercel.app';
const defaultImage = `${siteUrl}/screenshots/banner.png`;

function setMetaTag(selector: string, content: string) {
  const element = document.querySelector<HTMLMetaElement>(selector);
  if (element) {
    element.setAttribute('content', content);
  }
}

function setCanonicalUrl(href: string) {
  const element = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (element) {
    element.href = href;
  }
}

function getPageMeta(pathname: string) {
  if (pathname.startsWith('/templates')) {
    return {
      title: 'QR Templates | QR Design Studio',
      description: 'Browse ready-made QR templates for business, events, payments, WiFi, social profiles, and more.',
    };
  }

  if (pathname.startsWith('/batch')) {
    return {
      title: 'Batch QR Generator | QR Design Studio',
      description: 'Generate multiple QR codes from pasted data or CSV files and download them as a ZIP archive.',
    };
  }

  if (pathname.startsWith('/settings')) {
    return {
      title: 'Settings | QR Design Studio',
      description: 'Manage account access and app preferences in QR Design Studio.',
    };
  }

  return {
    title: 'QR Design Studio | QR Code And Barcode Generator',
    description: 'Create branded QR codes and barcodes with frames, templates, and PNG or SVG export.',
  };
}

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    const meta = getPageMeta(location.pathname);
    const pageUrl = `${siteUrl}${location.pathname}`;

    document.title = meta.title;
    setMetaTag('meta[name="description"]', meta.description);
    setMetaTag('meta[property="og:title"]', meta.title);
    setMetaTag('meta[property="og:description"]', meta.description);
    setMetaTag('meta[property="og:url"]', pageUrl);
    setMetaTag('meta[property="og:image"]', defaultImage);
    setMetaTag('meta[name="twitter:title"]', meta.title);
    setMetaTag('meta[name="twitter:description"]', meta.description);
    setMetaTag('meta[name="twitter:image"]', defaultImage);
    setCanonicalUrl(pageUrl);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 border-r border-border bg-card/50 flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <QrCode className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">QR Design Studio</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
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
              <span className="text-base font-semibold text-foreground">QR Design Studio</span>
            </Link>
            <div className="flex items-center gap-1">
              {navItems.map(item => (
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
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border bg-card/40 px-4 py-4">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center text-sm text-muted-foreground md:flex-row md:text-left">
            <p>Built by Moatasem Alhilali</p>
            <a
              href="https://github.com/moatasem-alhilali"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              GitHub Profile
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
