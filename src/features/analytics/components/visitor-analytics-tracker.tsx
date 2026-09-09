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
  /** Milliseconds the page has been visible, excluding hidden stretches. */
  engagedMs: number;
  /** When the current visible stretch began, or null while hidden. */
  visibleSinceMs: number | null;
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

  /** Folds the open visible stretch into the running engaged total. */
  const settleEngagement = useCallback((page: ActivePage, now: number): number => {
    if (page.visibleSinceMs !== null) {
      page.engagedMs += now - page.visibleSinceMs;
      page.visibleSinceMs = null;
    }
    return page.engagedMs;
  }, []);

  const leaveActivePage = useCallback((): void => {
    const page = activePage.current;
    if (!page) return;

    const now = Date.now();
    const durationSeconds = Math.max(0, Math.round((now - page.startedAtMs) / 1000));
    const engagedSeconds = Math.max(0, Math.round(settleEngagement(page, now) / 1000));
    activePage.current = null;

    trackAnalyticsEvent({
      type: "page_leave",
      path: page.path,
      url: page.url,
      title: page.title,
      durationSeconds,
      engagedSeconds,
      scrollDepth: maxScrollDepth.current,
      metadata: safeAnalyticsMetadata(),
    });
  }, [settleEngagement]);

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
    const openedAt = Date.now();
    activePage.current = {
      key: pageKey,
      path: location.pathname,
      url: currentUrl,
      title: document.title,
      startedAtMs: openedAt,
      engagedMs: 0,
      // A page opened in a background tab is not being read yet.
      visibleSinceMs: document.visibilityState === "visible" ? openedAt : null,
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

  /*
    Engaged time. Wall-clock duration counts a tab left open behind a closed
    laptop lid as an hour of rapt attention, so the clock only runs while the
    page is actually visible.
  */
  useEffect(() => {
    if (!consented) return;

    const onVisibilityChange = () => {
      const page = activePage.current;
      if (!page) return;

      if (document.visibilityState === "visible") {
        page.visibleSinceMs = Date.now();
      } else {
        settleEngagement(page, Date.now());
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [consented, settleEngagement]);

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
