const siteUrl = "https://qr-design-dun.vercel.app";
const defaultImage = `${siteUrl}/screenshots/banner.png`;
type Locale = "en" | "ar";

interface PageMeta {
  title: string;
  description: string;
}

function setMetaTag(selector: string, content: string) {
  const element = document.querySelector<HTMLMetaElement>(selector);
  if (element) {
    element.setAttribute("content", content);
  }
}

function setCanonicalUrl(href: string) {
  const element = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (element) {
    element.href = href;
  }
}

const pageMeta: Record<Locale, Record<"home" | "templates" | "batch" | "settings", PageMeta>> = {
  en: {
    home: {
      title: "QR Design Studio | QR Code And Barcode Generator",
      description:
        "Create branded QR codes and barcodes with frames, templates, and PNG or SVG export.",
    },
    templates: {
      title: "QR Templates | QR Design Studio",
      description:
        "Browse ready-made QR templates for business, events, menus, WiFi, social profiles, and more.",
    },
    batch: {
      title: "Batch QR Generator | QR Design Studio",
      description:
        "Generate multiple QR codes from pasted data or CSV files and download them as a ZIP archive.",
    },
    settings: {
      title: "Settings | QR Design Studio",
      description:
        "Review local generation mode, export behavior, and app information for QR Design Studio.",
    },
  },
  ar: {
    home: {
      title: "استوديو تصميم QR | مولد QR وباركود",
      description:
        "أنشئ رموز QR وباركود بتصاميم مخصصة وإطارات وقوالب وتصدير PNG أو SVG.",
    },
    templates: {
      title: "قوالب QR | استوديو تصميم QR",
      description:
        "تصفح قوالب QR جاهزة للأعمال والفعاليات والقوائم وWiFi والحسابات الاجتماعية والمزيد.",
    },
    batch: {
      title: "إنشاء QR دفعة واحدة | استوديو تصميم QR",
      description:
        "أنشئ عدة رموز QR من بيانات ملصقة أو ملفات CSV ونزلها كملف ZIP.",
    },
    settings: {
      title: "الإعدادات | استوديو تصميم QR",
      description:
        "راجع وضع الإنشاء المحلي وسلوك التصدير ومعلومات التطبيق في استوديو تصميم QR.",
    },
  },
};

export function getPageMeta(pathname: string, locale: Locale = "en"): PageMeta {
  if (pathname.startsWith("/templates")) {
    return pageMeta[locale].templates;
  }

  if (pathname.startsWith("/batch")) {
    return pageMeta[locale].batch;
  }

  if (pathname.startsWith("/settings")) {
    return pageMeta[locale].settings;
  }

  return pageMeta[locale].home;
}

export function applyPageMeta(pathname: string, locale: Locale = "en") {
  const meta = getPageMeta(pathname, locale);
  const pageUrl = `${siteUrl}${pathname}`;

  document.title = meta.title;
  setMetaTag('meta[name="description"]', meta.description);
  setMetaTag('meta[property="og:title"]', meta.title);
  setMetaTag('meta[property="og:description"]', meta.description);
  setMetaTag('meta[property="og:url"]', pageUrl);
  setMetaTag('meta[property="og:image"]', defaultImage);
  setMetaTag('meta[name="twitter:title"]', meta.title);
  setMetaTag('meta[name="twitter:description"]', meta.description);
  setMetaTag('meta[name="twitter:image"]', defaultImage);
  setCanonicalUrl(pageUrl);
}
