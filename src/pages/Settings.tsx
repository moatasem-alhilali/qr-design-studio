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
          <h2 className="font-semibold text-foreground">Firebase Connection</h2>
          <div className="flex items-center gap-2">
            {configured ? (
              <><CheckCircle className="h-4 w-4 text-success" /><span className="text-sm text-foreground">Firebase is connected</span></>
            ) : (
              <><XCircle className="h-4 w-4 text-destructive" /><span className="text-sm text-foreground">Firebase is not configured</span></>
            )}
          </div>
          {!configured && (
            <div className="text-xs text-muted-foreground space-y-2">
              <p>To enable all features, add these environment variables to your project:</p>
              <code className="block bg-muted p-3 rounded text-[11px] font-mono leading-relaxed">
                VITE_FIREBASE_API_KEY=your-api-key<br />
                VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com<br />
                VITE_FIREBASE_PROJECT_ID=your-project-id<br />
                VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com<br />
                VITE_FIREBASE_MESSAGING_SENDER_ID=123456789<br />
                VITE_FIREBASE_APP_ID=1:123:web:abc
              </code>
            </div>
          )}
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
