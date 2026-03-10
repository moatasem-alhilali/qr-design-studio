import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { QrCode } from 'lucide-react';

export default function Auth() {
  const { user, isConfigured } = useAuth();
  if (!isConfigured) return <Navigate to="/" replace />;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="panel-section p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <QrCode className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
