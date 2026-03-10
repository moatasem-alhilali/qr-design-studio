import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { isFirebaseConfigured } from '@/lib/firebase';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Settings() {
  const { user, signOut } = useAuth();
  const configured = isFirebaseConfigured();

  return (
    <div className="container px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      <div className="space-y-6">
        <div className="panel-section space-y-3">
          <h2 className="font-semibold text-foreground">Cloud Features</h2>
          <div className="flex items-center gap-2">
            {configured ? (
              <><CheckCircle className="h-4 w-4 text-success" /><span className="text-sm text-foreground">Cloud sync is active</span></>
            ) : (
              <><XCircle className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-foreground">Cloud sync is unavailable in this deployment</span></>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {configured
              ? 'Your account, saved QR codes, and analytics are available.'
              : 'Saved QR codes, account sync, and analytics are hidden until cloud services are enabled.'}
          </p>
        </div>

        {user && (
          <div className="panel-section space-y-3">
            <h2 className="font-semibold text-foreground">Account</h2>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="text-sm text-foreground">{user.email}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">User ID</Label>
              <p className="text-xs text-muted-foreground font-mono">{user.uid}</p>
            </div>
            <Button variant="outline" onClick={signOut} className="mt-2">Sign Out</Button>
          </div>
        )}

        <div className="panel-section space-y-3">
          <h2 className="font-semibold text-foreground">About QR Design Studio</h2>
          <p className="text-sm text-muted-foreground">
            A professional QR code designer and management platform. Generate beautiful, customizable QR codes with analytics, templates, and batch generation.
          </p>
          <p className="text-xs text-muted-foreground font-mono">Version 2.0</p>
        </div>
      </div>
    </div>
  );
}
