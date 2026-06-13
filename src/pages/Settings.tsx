import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/shared/i18n/i18n';

export default function Settings() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="container px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">{t.settings.title}</h1>

      <div className="space-y-6">
        <div className="panel-section space-y-3">
          <h2 className="font-semibold text-foreground">{t.settings.generationMode}</h2>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground">{t.settings.staticGeneration}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t.settings.generationDescription}
          </p>
        </div>

        <div className="panel-section space-y-3">
          <h2 className="font-semibold text-foreground">{t.settings.language}</h2>
          <p className="text-sm text-muted-foreground">{t.settings.languageDescription}</p>
          <div className="flex gap-2">
            <Button variant={locale === 'en' ? 'default' : 'outline'} onClick={() => setLocale('en')}>English</Button>
            <Button variant={locale === 'ar' ? 'default' : 'outline'} onClick={() => setLocale('ar')}>العربية</Button>
          </div>
        </div>

        <div className="panel-section space-y-3">
          <h2 className="font-semibold text-foreground">{t.settings.about}</h2>
          <p className="text-sm text-muted-foreground">
            {t.settings.aboutDescription}
          </p>
          <p className="text-xs text-muted-foreground font-mono">{t.settings.version}</p>
        </div>
      </div>
    </div>
  );
}
