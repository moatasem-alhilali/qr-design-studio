import { qrTemplates } from '@/lib/qr-templates';
import { useNavigate } from 'react-router-dom';
import {
  Globe, Wifi, Mail, Phone, MessageSquare, User, Star, Coffee,
  Calendar, Download, CreditCard, MapPin, Type,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Globe, Wifi, Mail, Phone, MessageSquare, User, Star, Coffee,
  Calendar, Download, CreditCard, MapPin, Type,
};

const categories = [...new Set(qrTemplates.map(t => t.category))];

export default function Templates() {
  const navigate = useNavigate();

  const applyTemplate = (template: typeof qrTemplates[0]) => {
    const params = new URLSearchParams({ template: template.id });
    navigate(`/?${params.toString()}`);
  };

  return (
    <div className="container px-4 py-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Templates</h1>
        <p className="text-muted-foreground">Choose a template to quickly create the perfect QR code for your use case.</p>
      </div>

      {categories.map(cat => (
        <div key={cat} className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{cat}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {qrTemplates.filter(t => t.category === cat).map(tmpl => {
              const Icon = iconMap[tmpl.icon] || Globe;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => applyTemplate(tmpl)}
                  className="group rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/25 hover:bg-muted/40"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                      style={{
                        backgroundColor: `${tmpl.config.color1}12`,
                        borderColor: `${tmpl.config.color1}2A`,
                      }}
                    >
                      <Icon className="h-5 w-5" style={{ color: tmpl.config.color1 }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">{tmpl.name}</h3>
                        <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          {tmpl.category}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{tmpl.description}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tmpl.config.color1 }} />
                        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                          {tmpl.config.moduleStyle}
                        </span>
                      </div>
                      <p className="mt-2 text-[10px] text-muted-foreground">Suggested frame: "{tmpl.suggestedFrame}"</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
