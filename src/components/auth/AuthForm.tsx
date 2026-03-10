import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, Chrome } from 'lucide-react';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (resetMode) {
        await sendPasswordResetEmail(auth, email);
        toast.success('Password reset email sent');
        setResetMode(false);
      } else if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Signed in successfully');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Authentication failed'));
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed in with Google');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Google sign-in failed'));
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {resetMode ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {resetMode ? 'Enter your email to receive a reset link' : isSignUp ? 'Sign up to save and manage QR codes' : 'Sign in to your QR Studio account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" placeholder="you@example.com" required />
          </div>
        </div>
        {!resetMode && (
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" placeholder="••••••••" required minLength={6} />
            </div>
          </div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Loading...' : resetMode ? 'Send Reset Email' : isSignUp ? 'Create Account' : 'Sign In'}
        </Button>
      </form>

      {!resetMode && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={handleGoogle}>
            <Chrome className="h-4 w-4" /> Continue with Google
          </Button>
        </>
      )}

      <div className="text-center text-sm text-muted-foreground space-y-1">
        {!resetMode && (
          <button onClick={() => setResetMode(true)} className="text-primary hover:underline block mx-auto">Forgot password?</button>
        )}
        <button onClick={() => { setIsSignUp(!isSignUp); setResetMode(false); }} className="text-primary hover:underline">
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
        {resetMode && (
          <button onClick={() => setResetMode(false)} className="text-primary hover:underline block mx-auto">Back to sign in</button>
        )}
      </div>
    </div>
  );
}
