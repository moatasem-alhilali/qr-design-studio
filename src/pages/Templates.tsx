import { useApplyTemplate } from '@/features/templates/hooks/useApplyTemplate';
import {
  getTemplateCategories,
  getTemplateIcon,
  getTemplatesByCategory,
} from '@/features/templates/services/template-catalog';
import { ColourBar } from '@/components/workshop/InkWell';
import { translateTemplate, translateTemplateCategory, useI18n } from '@/shared/i18n/i18n';

const categories = getTemplateCategories();

export default function Templates() {
  const applyTemplate = useApplyTemplate();
  const { locale, t } = useI18n();

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8">
      {/* Masthead set like the cover of a type specimen book. */}
      <header className="mb-9 max-w-2xl">
        <p className="spec mb-2">{t.templates.suggestedFrame}</p>
        <h1 className="plate-title letterpress text-[2.6rem] sm:text-[3.4rem]">{t.templates.title}</h1>
        <ColourBar className="my-4 max-w-[220px] opacity-80" />
        <p className="text-sm leading-relaxed text-ink-mid">{t.templates.description}</p>
      </header>

      {categories.map((category, categoryIndex) => (
        <section key={category} className="mb-10">
          <div className="mb-4 flex items-baseline gap-3">
            <span className="font-mono text-[11px] text-ink-faint">
              {String(categoryIndex + 1).padStart(2, '0')}
            </span>
            <h2 className="plate-title text-lg text-ink">{translateTemplateCategory(locale, category)}</h2>
            <hr className="perf mt-2 flex-1" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {getTemplatesByCategory(category).map(template => {
              const Icon = getTemplateIcon(template.icon);
              const translated = translateTemplate(locale, template);
              const ink = template.config.color1 ?? '#000000';

              return (
                /*
                  A job ticket pinned to the board: ink stripe down the spine,
                  the job number in the corner, the suggested slug at the foot.
                */
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="sheet group relative flex overflow-hidden text-start transition-transform duration-150 hover:-translate-y-1 focus-visible:-translate-y-1"
                >
                  <span className="w-1.5 shrink-0" style={{ background: ink }} aria-hidden />

                  <span className="min-w-0 flex-1 p-3.5">
                    <span className="flex items-start gap-3">
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-[2px]"
                        style={{ background: `${ink}14`, boxShadow: `inset 0 0 0 1px ${ink}33` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: ink }} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[0.92rem] font-semibold text-ink">{translated.name}</span>
                          <span className="spec shrink-0">
                            {translateTemplateCategory(locale, template.category)}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs leading-snug text-ink-mid">{translated.description}</span>
                      </span>
                    </span>

                    <hr className="perf my-3" />

                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                        {t.values.moduleStyles[template.config.moduleStyle ?? 'rounded']}
                      </span>
                      <span
                        className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-mid transition-colors group-hover:text-press-red"
                        style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}
                      >
                        “{translated.suggestedFrame}”
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
