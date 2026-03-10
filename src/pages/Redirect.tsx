import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { resolveShortLink, type ResolvedShortLink } from '@/lib/services/dynamic-qr-service';
import { logScan, detectDeviceInfo, getLocationInfo } from '@/lib/services/analytics-service';
import { isFirebaseConfigured } from '@/lib/firebase';
import { QrCode, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Redirect() {
  const { code } = useParams<{ code: string }>();
  const [status, setStatus] = useState<'loading' | 'password' | 'error' | 'expired' | 'disabled'>('loading');
  const [password, setPassword] = useState('');
  const [linkData, setLinkData] = useState<ResolvedShortLink | null>(null);

  useEffect(() => {
    if (!code || !isFirebaseConfigured()) {
      setStatus('error');
      return;
    }
    (async () => {
      try {
        const data = await resolveShortLink(code);
        if (!data) { setStatus('error'); return; }
        if (!data.isActive) { setStatus('disabled'); return; }
        if (data.expiresAt && new Date(data.expiresAt) < new Date()) { setStatus('expired'); return; }
        if (data.password) { setLinkData(data); setStatus('password'); return; }
        await trackAndRedirect(data.destinationUrl, data.qrCodeId);
      } catch { setStatus('error'); }
    })();
  }, [code]);

  const trackAndRedirect = async (url: string, qrCodeId: string) => {
    try {
      const device = detectDeviceInfo();
      const location = await getLocationInfo();
      await logScan(qrCodeId, { ...device, ...location, referrer: document.referrer });
    } catch { /* best effort */ }
    window.location.href = url;
  };

  const handlePasswordSubmit = async () => {
    if (password === linkData?.password) {
      await trackAndRedirect(linkData.destinationUrl, linkData.qrCodeId);
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="panel-section p-8 max-w-sm w-full text-center space-y-4">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
          <QrCode className="h-6 w-6 text-primary-foreground" />
        </div>
        {status === 'loading' && (
          <><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /><p className="text-sm text-muted-foreground">Redirecting...</p></>
        )}
        {status === 'password' && (
          <>
            <h2 className="font-semibold text-foreground">Password Required</h2>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
            <Button onClick={handlePasswordSubmit} className="w-full">Continue</Button>
          </>
        )}
        {status === 'error' && (
          <><AlertCircle className="h-8 w-8 text-destructive mx-auto" /><p className="text-sm text-foreground">QR code not found</p></>
        )}
        {status === 'expired' && (
          <><AlertCircle className="h-8 w-8 text-warning mx-auto" /><p className="text-sm text-foreground">This QR code has expired</p></>
        )}
        {status === 'disabled' && (
          <><AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" /><p className="text-sm text-foreground">This QR code is currently disabled</p></>
        )}
      </div>
    </div>
  );
}
