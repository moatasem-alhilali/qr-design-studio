import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

import { Sheet } from "@/components/workshop/Sheet";
import { useI18n } from "@/shared/i18n/i18n";

const NotFound = () => {
  const location = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    console.error(t.notFound.consolePrefix, location.pathname);
  }, [location.pathname, t.notFound.consolePrefix]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      {/* A spoiled sheet pulled off the press and set aside. */}
      <Sheet marks askew={1} className="max-w-md overflow-hidden">
        <div className="px-8 py-10 text-center">
          <p className="spec">{t.notFound.consolePrefix}</p>
          <p className="plate-title letterpress mt-3 text-[5.5rem] leading-none text-press-red">404</p>
          <p className="mt-4 font-mono text-[11px] text-ink-faint" dir="ltr">
            {location.pathname}
          </p>
          <hr className="perf my-6" />
          <p className="text-sm text-ink-mid">{t.notFound.message}</p>
          {/* The stamp look on an anchor — a button inside a link is invalid. */}
          <Link to="/" className="stamp stamp-ink mt-6">
            {t.notFound.returnHome}
          </Link>
        </div>
      </Sheet>
    </div>
  );
};

export default NotFound;
