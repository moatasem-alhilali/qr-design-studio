import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getScansForQR } from '@/lib/services/analytics-service';
import { getUserQRCodes } from '@/lib/services/qr-service';
import { QRScan, SavedQRCode } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Eye, Users, Globe, Smartphone, Monitor, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const COLORS = ['hsl(250,60%,52%)', 'hsl(152,60%,42%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(200,80%,50%)', 'hsl(280,60%,50%)'];

export default function AnalyticsPage() {
  const { id } = useParams();
  const { user, isConfigured } = useAuth();
  const [scans, setScans] = useState<QRScan[]>([]);
  const [qrCodes, setQrCodes] = useState<SavedQRCode[]>([]);
  const [selectedQR, setSelectedQR] = useState(id || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getUserQRCodes(user.uid).then(codes => {
      const dynamic = codes.filter(c => c.type === 'dynamic');
      setQrCodes(dynamic);
      if (!selectedQR && dynamic.length > 0) setSelectedQR(dynamic[0].id);
    }).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!selectedQR) return;
    getScansForQR(selectedQR).then(setScans);
  }, [selectedQR]);

  const totalScans = scans.length;
  const uniqueScans = new Set(scans.map(s => `${s.country}-${s.device}-${s.browser}`)).size;
  const firstScan = scans.length > 0 ? scans[scans.length - 1]?.timestamp : null;
  const lastScan = scans.length > 0 ? scans[0]?.timestamp : null;

  const byDate = scans.reduce<Record<string, number>>((acc, s) => {
    const d = s.timestamp?.split('T')[0] || 'Unknown';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const dateData = Object.entries(byDate).sort().slice(-30).map(([date, count]) => ({ date, count }));

  const byCountry = scans.reduce<Record<string, number>>((acc, s) => {
    acc[s.country || 'Unknown'] = (acc[s.country || 'Unknown'] || 0) + 1;
    return acc;
  }, {});
  const countryData = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));

  const byDevice = scans.reduce<Record<string, number>>((acc, s) => {
    acc[s.device || 'Unknown'] = (acc[s.device || 'Unknown'] || 0) + 1;
    return acc;
  }, {});
  const deviceData = Object.entries(byDevice).map(([name, value]) => ({ name, value }));

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <BarChart3 className="h-12 w-12 text-muted-foreground" />
        <p className="text-center text-muted-foreground">Analytics are unavailable in this deployment.</p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        {qrCodes.length > 0 && (
          <Select value={selectedQR} onValueChange={setSelectedQR}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select QR code" /></SelectTrigger>
            <SelectContent>
              {qrCodes.map(qr => <SelectItem key={qr.id} value={qr.id}>{qr.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {qrCodes.length === 0 && !loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <QrCode className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No dynamic QR codes found. Create a dynamic QR to track scans.</p>
          <Link to="/"><Button className="mt-4">Create Dynamic QR</Button></Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Scans', value: totalScans, icon: Eye },
              { label: 'Unique Scans', value: uniqueScans, icon: Users },
              { label: 'First Scan', value: firstScan ? new Date(firstScan).toLocaleDateString() : '-', icon: BarChart3 },
              { label: 'Last Scan', value: lastScan ? new Date(lastScan).toLocaleDateString() : '-', icon: Globe },
            ].map(card => (
              <div key={card.label} className="panel-section">
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              </div>
            ))}
          </div>

          {dateData.length > 0 && (
            <div className="panel-section">
              <h3 className="text-sm font-semibold mb-4 text-foreground">Scans Over Time</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {countryData.length > 0 && (
              <div className="panel-section">
                <h3 className="text-sm font-semibold mb-4 text-foreground">By Country</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={countryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {deviceData.length > 0 && (
              <div className="panel-section">
                <h3 className="text-sm font-semibold mb-4 text-foreground">By Device</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {scans.length > 0 && (
            <div className="panel-section">
              <h3 className="text-sm font-semibold mb-4 text-foreground">Recent Scans</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {scans.slice(0, 20).map((scan, i) => (
                  <div key={i} className="flex items-center justify-between text-xs border-b border-border pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      {scan.device === 'Mobile' ? <Smartphone className="h-3 w-3 text-muted-foreground" /> : <Monitor className="h-3 w-3 text-muted-foreground" />}
                      <span className="text-foreground">{scan.country}{scan.city ? `, ${scan.city}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{scan.browser} · {scan.os}</span>
                      <span>{new Date(scan.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
