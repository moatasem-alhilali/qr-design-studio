import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserQRCodes, deleteQRCode, updateQRCode } from '@/lib/services/qr-service';
import { SavedQRCode } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Plus, Search, Star, Archive, Trash2, ExternalLink, BarChart3, QrCode } from 'lucide-react';

export default function Dashboard() {
  const { user, isConfigured } = useAuth();
  const [qrCodes, setQrCodes] = useState<SavedQRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getUserQRCodes(user.uid)
      .then(setQrCodes)
      .catch(() => toast.error('Failed to load QR codes'))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = (filter: string) => {
    let items = qrCodes.filter(q =>
      q.name?.toLowerCase().includes(search.toLowerCase()) ||
      q.config?.data?.toLowerCase().includes(search.toLowerCase())
    );
    switch (filter) {
      case 'favorites': return items.filter(q => q.favorite);
      case 'archived': return items.filter(q => q.archived);
      case 'static': return items.filter(q => q.type === 'static' && !q.archived);
      case 'dynamic': return items.filter(q => q.type === 'dynamic' && !q.archived);
      default: return items.filter(q => !q.archived);
    }
  };

  const toggleFavorite = async (qr: SavedQRCode) => {
    await updateQRCode(qr.id, { favorite: !qr.favorite });
    setQrCodes(prev => prev.map(q => q.id === qr.id ? { ...q, favorite: !q.favorite } : q));
  };

  const handleArchive = async (qr: SavedQRCode) => {
    await updateQRCode(qr.id, { archived: !qr.archived });
    setQrCodes(prev => prev.map(q => q.id === qr.id ? { ...q, archived: !q.archived } : q));
    toast.success(qr.archived ? 'Restored' : 'Archived');
  };

  const handleDelete = async (id: string) => {
    await deleteQRCode(id);
    setQrCodes(prev => prev.filter(q => q.id !== id));
    toast.success('Deleted');
  };

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <QrCode className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Configure Firebase to save and manage QR codes</p>
        <Link to="/"><Button>Create QR Code</Button></Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <QrCode className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Sign in to view your saved QR codes</p>
        <Link to="/auth"><Button>Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">My QR Codes</h1>
        <Link to="/"><Button className="gap-2"><Plus className="h-4 w-4" /> Create New</Button></Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search QR codes..." className="pl-10" />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All ({filtered('all').length})</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="static">Static</TabsTrigger>
          <TabsTrigger value="dynamic">Dynamic</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        {['all', 'favorites', 'static', 'dynamic', 'archived'].map(tab => (
          <TabsContent key={tab} value={tab}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="panel-section h-48 animate-pulse" />)}
              </div>
            ) : filtered(tab).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <QrCode className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No QR codes found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered(tab).map(qr => (
                  <div key={qr.id} className="panel-section space-y-3 group">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate">{qr.name}</h3>
                        <p className="text-xs text-muted-foreground">{qr.type} · {new Date(qr.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => toggleFavorite(qr)} className="text-muted-foreground hover:text-warning shrink-0">
                        <Star className={cn("h-4 w-4", qr.favorite && "fill-warning text-warning")} />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">{qr.config?.data || 'No data'}</p>
                    {qr.type === 'dynamic' && <p className="text-xs text-muted-foreground">Scans: {qr.totalScans}</p>}
                    <div className="flex gap-1 pt-2 border-t border-border flex-wrap">
                      <Link to={`/?edit=${qr.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7"><ExternalLink className="h-3 w-3" />Edit</Button>
                      </Link>
                      {qr.type === 'dynamic' && (
                        <Link to={`/analytics/${qr.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs gap-1 h-7"><BarChart3 className="h-3 w-3" />Stats</Button>
                        </Link>
                      )}
                      <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => handleArchive(qr)}>
                        <Archive className="h-3 w-3" />{qr.archived ? 'Restore' : 'Archive'}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 text-destructive" onClick={() => handleDelete(qr.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
