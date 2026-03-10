import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export type AnimationStyle = 'none' | 'pulse' | 'glow' | 'gradient' | 'float' | 'reveal';

const animations: { value: AnimationStyle; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'glow', label: 'Glow' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'float', label: 'Float' },
  { value: 'reveal', label: 'Reveal' },
];

const animationClasses: Record<AnimationStyle, string> = {
  none: '',
  pulse: 'animate-qr-pulse',
  glow: 'animate-qr-glow',
  gradient: 'animate-qr-gradient',
  float: 'animate-qr-float',
  reveal: 'animate-qr-reveal',
};

interface AnimatedQRProps {
  children: ReactNode;
  animation: AnimationStyle;
  onAnimationChange: (a: AnimationStyle) => void;
}

export function AnimatedQR({ children, animation, onAnimationChange }: AnimatedQRProps) {
  return (
    <div className="space-y-4">
      <div className={cn("transition-all", animationClasses[animation])}>
        {children}
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Animation</Label>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {animations.map(a => (
            <button
              key={a.value}
              onClick={() => onAnimationChange(a.value)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
                animation === a.value
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
        {animation !== 'none' && (
          <p className="text-[10px] text-muted-foreground text-center">⚡ Animations are for digital display only. Exports will be static.</p>
        )}
      </div>
    </div>
  );
}
