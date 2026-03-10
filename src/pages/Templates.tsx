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
                  className="panel-section text-left hover:border-primary transition-all group p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: tmpl.config.colorMode === 'gradient'
                          ? `linear-gradient(135deg, ${tmpl.config.color1}, ${tmpl.config.color2})`
                          : tmpl.config.color1,
                      }}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{tmpl.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{tmpl.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Suggested frame: "{tmpl.suggestedFrame}"</p>
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
