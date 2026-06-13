const siteUrl = "https://qr-design-dun.vercel.app";
const defaultImage = `${siteUrl}/screenshots/banner.png`;

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

export function getPageMeta(pathname: string): PageMeta {
  if (pathname.startsWith("/templates")) {
    return {
      title: "QR Templates | QR Design Studio",
      description:
        "Browse ready-made QR templates for business, events, payments, WiFi, social profiles, and more.",
    };
  }

  if (pathname.startsWith("/batch")) {
    return {
      title: "Batch QR Generator | QR Design Studio",
      description:
        "Generate multiple QR codes from pasted data or CSV files and download them as a ZIP archive.",
    };
  }

  if (pathname.startsWith("/settings")) {
    return {
      title: "Settings | QR Design Studio",
      description: "Manage account access and app preferences in QR Design Studio.",
    };
  }

  return {
    title: "QR Design Studio | QR Code And Barcode Generator",
    description:
      "Create branded QR codes and barcodes with frames, templates, and PNG or SVG export.",
  };
}

export function applyPageMeta(pathname: string) {
  const meta = getPageMeta(pathname);
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
