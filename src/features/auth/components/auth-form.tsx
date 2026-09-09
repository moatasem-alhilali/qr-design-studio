import { useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { AuthApiError, type FieldErrors } from "@/features/auth/api/auth-api";
import { cn } from "@/lib/utils";
import { useI18n } from "@/shared/i18n/i18n";

export interface AuthFormField {
  name: "name" | "email" | "password";
  label: string;
  placeholder: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  hint?: string;
}

interface AuthFormProps {
  title: string;
  subtitle: string;
  fields: AuthFormField[];
  submitLabel: string;
  footer: ReactNode;
  onSubmit: (values: Record<string, string>) => Promise<unknown>;
}

/**
 * The sign-in and sign-up sheets are the same press form with different plates,
 * so the layout, the error handling and the busy state live here once.
 *
 * Errors arrive from Laravel already worded in the user's language, so a
 * message from the API is shown as-is; only the cases the API cannot describe
 * — an unreachable server, an unlabelled failure — fall back to local copy.
 */
export function AuthForm({ title, subtitle, fields, submitLabel, footer, onSubmit }: AuthFormProps) {
  const { t } = useI18n();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.name, ""])),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setFieldErrors({});
    setFormError(null);

    try {
      await onSubmit(values);
    } catch (error: unknown) {
      if (error instanceof AuthApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(describe(error));
      } else {
        setFormError(t.auth.errorGeneric);
      }
      setBusy(false);
    }
  }

  function describe(error: AuthApiError): string | null {
    if (error.isOffline) return t.auth.errorOffline;
    if (error.status === 429) return t.auth.errorTooMany;
    // A 422 is already spelled out under each field; repeating it above the
    // form just says the same thing twice.
    if (error.status === 422) return Object.keys(error.fieldErrors).length > 0 ? null : error.message;
    if (error.code === "INVALID_CREDENTIALS") return t.auth.errorInvalidCredentials;
    return error.message && error.message !== "request_failed" ? error.message : t.auth.errorGeneric;
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <div className="sheet tex-grain p-6 sm:p-8">
        <h1 className="plate-title letterpress text-[1.6rem] leading-none">{title}</h1>
        <p className="mt-2 text-sm leading-snug text-ink-mid">{subtitle}</p>

        <hr className="perf my-5" />

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {fields.map((field) => {
            const errors = fieldErrors[field.name] ?? [];
            const isPassword = field.type === "password";
            const inputId = `auth-${field.name}`;

            return (
              <div key={field.name} className="space-y-1.5">
                <label htmlFor={inputId} className="spec block">
                  {field.label}
                </label>

                <div className="relative">
                  <input
                    id={inputId}
                    className="field"
                    type={isPassword && revealed ? "text" : field.type}
                    value={values[field.name] ?? ""}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    aria-invalid={errors.length > 0}
                    aria-describedby={errors.length > 0 ? `${inputId}-error` : undefined}
                    disabled={busy}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [field.name]: event.target.value }))
                    }
                  />
                  {isPassword && (
                    <button
                      type="button"
                      onClick={() => setRevealed((shown) => !shown)}
                      aria-label={revealed ? t.auth.hidePassword : t.auth.showPassword}
                      className="absolute inset-y-0 end-2 my-auto flex h-7 w-7 items-center justify-center text-ink-faint transition-colors hover:text-ink"
                    >
                      {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>

                {errors.length > 0 ? (
                  <p id={`${inputId}-error`} className="text-[11px] leading-snug text-destructive">
                    {errors[0]}
                  </p>
                ) : (
                  field.hint && <p className="text-[11px] leading-snug text-ink-faint">{field.hint}</p>
                )}
              </div>
            );
          })}

          {formError && (
            <p
              role="alert"
              className="rounded-[3px] p-2.5 text-[0.8rem] leading-snug"
              style={{
                color: "hsl(var(--destructive))",
                background: "color-mix(in srgb, hsl(var(--destructive)) 12%, transparent)",
              }}
            >
              {formError}
            </p>
          )}

          {/*
            The Stamp primitive pins itself to type="button" so a stray stamp can
            never submit a form. This one has to submit, so it wears the same
            rubber through the class contract instead.
          */}
          <button type="submit" disabled={busy} className={cn("stamp stamp-ink w-full disabled:opacity-60")}>
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.auth.working}
              </span>
            ) : (
              submitLabel
            )}
          </button>
        </form>

        <hr className="perf my-5" />

        <div className="flex flex-wrap items-center justify-between gap-2 text-[0.8rem] text-ink-mid">
          {footer}
          <Link to="/" className="text-ink-faint underline-offset-4 hover:text-ink hover:underline">
            {t.auth.backToStudio}
          </Link>
        </div>
      </div>
    </div>
  );
}
