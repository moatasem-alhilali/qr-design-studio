import { Info, Moon, Sun } from 'lucide-react';

import { Sheet } from '@/components/workshop/Sheet';
import { Tool } from '@/components/workshop/Tool';
import { ColourBar } from '@/components/workshop/InkWell';
import { useI18n } from '@/shared/i18n/i18n';
import { useShift } from '@/shared/theme/use-shift';

export default function Settings() {
  const { locale, setLocale, t } = useI18n();
  const { shift, setShift } = useShift();

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-8">
      <header className="mb-7">
        <p className="spec mb-2">{t.settings.about}</p>
        <h1 className="plate-title letterpress text-[2.4rem] sm:text-[3rem]">{t.settings.title}</h1>
        <ColourBar className="my-4 max-w-[220px] opacity-80" />
      </header>

      {/* The shop card: how this press is set up. */}
      <Sheet marks label={t.settings.title} className="overflow-hidden">
        <div className="space-y-6 p-5 pt-9 sm:p-7 sm:pt-10">
          <section className="space-y-2">
            <h2 className="plate-title text-base text-ink">{t.settings.generationMode}</h2>
            <p className="flex items-center gap-2 font-mono text-[0.8rem] text-ink">
              <Info className="h-4 w-4 shrink-0 text-press-red" />
              {t.settings.staticGeneration}
            </p>
            <p className="text-sm leading-relaxed text-ink-mid">{t.settings.generationDescription}</p>
          </section>

          <hr className="perf" />

          <section className="space-y-3">
            <h2 className="plate-title text-base text-ink">{t.settings.language}</h2>
            <p className="text-sm leading-relaxed text-ink-mid">{t.settings.languageDescription}</p>
            <div className="grid max-w-xs grid-cols-2 gap-2">
              <Tool wide on={locale === 'en'} onClick={() => setLocale('en')}>English</Tool>
              <Tool wide on={locale === 'ar'} onClick={() => setLocale('ar')}>العربية</Tool>
            </div>
          </section>

          <hr className="perf" />

          <section className="space-y-3">
            <h2 className="plate-title text-base text-ink">{t.layout.switchShift}</h2>
            <div className="grid max-w-xs grid-cols-2 gap-2">
              <Tool wide on={shift === 'day'} onClick={() => setShift('day')}>
                <Sun className="h-4 w-4" />
                {t.layout.dayShift}
              </Tool>
              <Tool wide on={shift === 'night'} onClick={() => setShift('night')}>
                <Moon className="h-4 w-4" />
                {t.layout.nightShift}
              </Tool>
            </div>
          </section>

          <hr className="perf" />

          <section className="space-y-2">
            <h2 className="plate-title text-base text-ink">{t.settings.about}</h2>
            <p className="text-sm leading-relaxed text-ink-mid">{t.settings.aboutDescription}</p>
            <p className="font-mono text-[11px] text-ink-faint">{t.settings.version}</p>
          </section>
        </div>

        <ColourBar />
      </Sheet>
    </div>
  );
}
