import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import {
  currentAnalyticsUrl,
  getUtmParams,
  referrerAnalyticsUrl,
  safeAnalyticsMetadata,
  trackAnalyticsEvent,
} from "@/features/analytics/api/track-analytics";
import {
  getSessionFlag,
  hasAnalyticsConsent,
  setSessionFlag,
} from "@/features/analytics/services/analytics-identifiers";

interface ActivePage {
  key: string;
  path: string;
  url: string | null;
  title: string;
  startedAtMs: number;
}

const SESSION_STARTED_KEY = "qr_design_studio_analytics_session_started:v1";

export default function VisitorAnalyticsTracker() {
  const location = useLocation();
  const [consented, setConsented] = useState(() => hasAnalyticsConsent());
  const activePage = useRef<ActivePage | null>(null);
  const maxScrollDepth = useRef(0);

  const pageKey = useMemo(
    () => `${location.pathname}${location.search}${location.hash}`,
    [location.hash, location.pathname, location.search],
  );

  const leaveActivePage = useCallback((): void => {
    const page = activePage.current;
    if (!page) return;

    const durationSeconds = Math.max(0, Math.round((Date.now() - page.startedAtMs) / 1000));
    activePage.current = null;

    trackAnalyticsEvent({
      type: "page_leave",
      path: page.path,
      url: page.url,
      title: page.title,
      durationSeconds,
      scrollDepth: maxScrollDepth.current,
      metadata: safeAnalyticsMetadata(),
    });
  }, []);

  useEffect(() => {
    const onAccepted = () => setConsented(true);

    window.addEventListener("analytics-consent-accepted", onAccepted);

    return () => window.removeEventListener("analytics-consent-accepted", onAccepted);
  }, []);

  useEffect(() => {
    if (!consented) return;

    const updateScrollDepth = () => {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const current = Math.round((window.scrollY / scrollable) * 100);
      maxScrollDepth.current = Math.max(maxScrollDepth.current, Math.min(100, current));
    };

    updateScrollDepth();
    window.addEventListener("scroll", updateScrollDepth, { passive: true });
    window.addEventListener("resize", updateScrollDepth, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScrollDepth);
      window.removeEventListener("resize", updateScrollDepth);
    };
  }, [consented]);

  useEffect(() => {
    if (!consented) return;

    const currentUrl = currentAnalyticsUrl();
    const referrer = referrerAnalyticsUrl();
    const params = getUtmParams(new URLSearchParams(location.search));
    const locale = navigator.language;

    if (!getSessionFlag(SESSION_STARTED_KEY)) {
      setSessionFlag(SESSION_STARTED_KEY, "1");
      trackAnalyticsEvent({
        type: "session_start",
        path: location.pathname,
        url: currentUrl,
        title: document.title,
        referrer,
        locale,
        startedAt: new Date().toISOString(),
        ...params,
        metadata: safeAnalyticsMetadata(),
      });
    }

    if (activePage.current?.key === pageKey) return;

    leaveActivePage();
    maxScrollDepth.current = 0;

    const enteredAt = new Date().toISOString();
    activePage.current = {
      key: pageKey,
      path: location.pathname,
      url: currentUrl,
      title: document.title,
      startedAtMs: Date.now(),
    };

    trackAnalyticsEvent({
      type: "page_view",
      path: location.pathname,
      url: currentUrl,
      title: document.title,
      referrer,
      locale,
      enteredAt,
      ...params,
      metadata: safeAnalyticsMetadata(),
    });
  }, [consented, leaveActivePage, location.pathname, location.search, pageKey]);

  useEffect(() => {
    if (!consented) return;

    const onPageHide = () => leaveActivePage();
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      leaveActivePage();
    };
  }, [consented, leaveActivePage]);

  return null;
}
