import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { BarcodeFormat } from "@/lib/barcode-engine";
import type { FrameConfig, QRTemplate } from "@/lib/types";

export type Locale = "en" | "ar";
export type Direction = "ltr" | "rtl";

const LOCALE_STORAGE_KEY = "qr_design_studio_locale:v1";

const qrPresetCopy: Record<Locale, Record<string, { name: string; description: string }>> = {
  en: {},
  ar: {
    "Studio Clean": {
      name: "استوديو هادئ",
      description: "أسلوب ناعم بحواف مستديرة ولمسة نيلي أنيقة",
    },
    "Business Classic": {
      name: "كلاسيكي للأعمال",
      description: "تكوين مربع ومنظم للاستخدامات المهنية",
    },
    "Slate Modern": {
      name: "حديث داكن",
      description: "ألوان محايدة داكنة مع تباين هادئ",
    },
    "Aqua Soft": {
      name: "تركواز ناعم",
      description: "أسلوب تركوازي متوازن مع قراءة واضحة",
    },
    "Warm Editorial": {
      name: "تحريري دافئ",
      description: "لمسة دافئة مناسبة للقوائم والحملات",
    },
    "Mono Minimal": {
      name: "أحادي بسيط",
      description: "مظهر أحادي خفيف بإيقاع بصري مضغوط",
    },
    "Forest Calm": {
      name: "أخضر هادئ",
      description: "لوحة خضراء مستقرة بتباين لطيف",
    },
    "Signal Red": {
      name: "أحمر تنبيهي",
      description: "لون بارز للإشعارات والإجراءات المباشرة",
    },
  },
};

const barcodePresetCopy: Record<Locale, Record<string, { name: string; description: string }>> = {
  en: {},
  ar: {
    "Retail Standard": {
      name: "تجزئة قياسي",
      description: "نمط بطاقة منتج متوازن مع أرقام واضحة",
    },
    "Warehouse Bold": {
      name: "مستودع قوي",
      description: "أشرطة أعرض وتباين أعلى للطباعة الصناعية",
    },
    "Soft Rounded": {
      name: "ناعم مستدير",
      description: "أشرطة مستديرة بمظهر علامة تجارية نظيف",
    },
    "Gradient Premium": {
      name: "تدرج فاخر",
      description: "مظهر متدرج مناسب للتغليف وبطاقات المنتجات",
    },
    "Shipping Carton": {
      name: "كرتون شحن",
      description: "إعداد ITF-14 مناسب لملصقات الشحن والصناديق",
    },
    "Shelf Compact": {
      name: "رف مضغوط",
      description: "باركود أصغر للملصقات الضيقة والبطاقات الصغيرة",
    },
  },
};

const templateCopy: Record<Locale, Record<string, { name: string; description: string; suggestedFrame: string }>> = {
  en: {},
  ar: {
    website: {
      name: "رابط موقع",
      description: "رابط لأي موقع إلكتروني",
      suggestedFrame: "افتح الموقع",
    },
    wifi: {
      name: "وصول واي فاي",
      description: "مشاركة بيانات شبكة WiFi",
      suggestedFrame: "اتصل بالشبكة",
    },
    email: {
      name: "البريد الإلكتروني",
      description: "فتح رسالة بريد جديدة",
      suggestedFrame: "راسلنا",
    },
    phone: {
      name: "اتصال هاتفي",
      description: "اتصال سريع برقم الهاتف",
      suggestedFrame: "اتصل بنا",
    },
    whatsapp: {
      name: "واتساب",
      description: "فتح محادثة واتساب",
      suggestedFrame: "تحدث معنا",
    },
    vcard: {
      name: "بطاقة أعمال",
      description: "مشاركة معلومات التواصل",
      suggestedFrame: "احفظ جهة الاتصال",
    },
    social: {
      name: "حساب اجتماعي",
      description: "رابط إلى حسابات التواصل",
      suggestedFrame: "تابعنا",
    },
    review: {
      name: "تقييم Google",
      description: "جمع تقييمات العملاء",
      suggestedFrame: "اترك تقييمك",
    },
    menu: {
      name: "قائمة مطعم",
      description: "وصول سريع للقائمة الرقمية",
      suggestedFrame: "اعرض القائمة",
    },
    event: {
      name: "تسجيل فعالية",
      description: "صفحة تسجيل للفعالية",
      suggestedFrame: "سجل الآن",
    },
    app: {
      name: "تحميل تطبيق",
      description: "رابط لمتجر التطبيقات",
      suggestedFrame: "حمّل التطبيق",
    },
    payment: {
      name: "دفع أو تبرع",
      description: "رابط دفع أو تبرع",
      suggestedFrame: "ادفع الآن",
    },
    location: {
      name: "موقع على الخريطة",
      description: "مشاركة موقع جغرافي",
      suggestedFrame: "اعثر علينا",
    },
    text: {
      name: "نص عادي",
      description: "أي محتوى نصي",
      suggestedFrame: "امسح الرمز",
    },
  },
};

const framePresetCopy: Record<Locale, Record<string, { name: string; description: string }>> = {
  en: {},
  ar: {
    none: { name: "بدون", description: "بدون إطار" },
    simple: { name: "بسيط", description: "بطاقة منتج نظيفة" },
    rounded: { name: "مستدير", description: "بطاقة ناعمة للعلامة" },
    bold: { name: "قوي", description: "حضور مناسب للحملات" },
    minimal: { name: "هادئ", description: "أنيق وغير متكلف" },
    social: { name: "اجتماعي", description: "دعوة مناسبة للمبدعين والحسابات" },
    premium: { name: "فاخر", description: "عرض داكن بطابع راق" },
    glass: { name: "زجاجي", description: "بطاقة ناعمة بطبقات خفيفة" },
    spotlight: { name: "إضاءة", description: "بطاقة داكنة بتباين واضح" },
    scanner: { name: "ماسح", description: "إطار بزوايا مفتوحة وإرشاد بصري" },
    ticket: { name: "تذكرة", description: "عرض مستوحى من القسائم الترويجية" },
    clipboard: { name: "حافظة", description: "بطاقة عملية بطابع إداري" },
    phone: { name: "هاتف", description: "معاينة بإطار يشبه الجهاز" },
    ribbon: { name: "شريط", description: "بطاقة ترويجية بدعوة قوية" },
  },
};

const frameSuggestionCopy: Record<Locale, Record<string, string>> = {
  en: {},
  ar: {
    "Scan Me": "امسح الرمز",
    "Open Website": "افتح الموقع",
    "View Menu": "اعرض القائمة",
    "Follow Us": "تابعنا",
    "Connect to WiFi": "اتصل بالشبكة",
    "Download App": "حمّل التطبيق",
    "Learn More": "اعرف المزيد",
    "Get Offer": "احصل على العرض",
    "Join Us": "انضم إلينا",
    "Visit Us": "زرنا",
    "Instant Access": "وصول فوري",
    "Exclusive Link": "رابط خاص",
    "Official QR": "رمز رسمي",
    "Scan to Continue": "امسح للمتابعة",
    "Smart Shortcut": "اختصار ذكي",
    "Fast Entry": "دخول سريع",
    New: "جديد",
    Featured: "مميز",
    "Quick Access": "وصول سريع",
    "Special Offer": "عرض خاص",
    "VIP Access": "وصول VIP",
    Official: "رسمي",
    "Scan & Explore": "امسح واستكشف",
    "Limited Offer": "عرض محدود",
    "Smart Link": "رابط ذكي",
    "Tap to Open": "اضغط للفتح",
    "SCAN ME": "امسحني",
    "Quick Scan": "مسح سريع",
    "Open Link": "افتح الرابط",
  },
};

const reliabilityIssueCopy: Record<Locale, Record<string, string>> = {
  en: {},
  ar: {
    "Very low contrast between QR and background": "التباين بين الرمز والخلفية منخفض جدًا",
    "Use a much darker foreground or lighter background": "استخدم لونًا أماميًا أغمق أو خلفية أفتح",
    "Low contrast may cause scan issues": "التباين المنخفض قد يسبب صعوبة في المسح",
    "Increase contrast between foreground and background colors": "ارفع التباين بين اللون الأمامي والخلفية",
    "Logo is large and may obstruct QR data": "الشعار كبير وقد يحجب بيانات الرمز",
    "Reduce logo scale to under 25%": "قلل حجم الشعار إلى أقل من 25%",
    "Logo size is near the safe limit": "حجم الشعار قريب من الحد الآمن",
    "Consider reducing logo scale slightly": "يفضل تقليل حجم الشعار قليلًا",
    "Logo requires high error correction": "استخدام الشعار يحتاج تصحيح أخطاء مرتفع",
    "Set error correction to H when using a logo": "اجعل تصحيح الأخطاء H عند استخدام شعار",
    "Diamond modules may reduce scanner compatibility": "شكل المعين قد يقلل التوافق مع بعض الماسحات",
    "Use rounded or dots for better compatibility": "استخدم الحواف المستديرة أو النقاط لتوافق أفضل",
    "Long data increases QR density": "البيانات الطويلة تزيد كثافة الرمز",
    "Use a shorter URL or reduce the encoded content length": "استخدم رابطًا أقصر أو قلل طول المحتوى",
    "Foreground color is too light": "اللون الأمامي فاتح جدًا",
    "Use a darker foreground color for better scanning": "استخدم لونًا أغمق لتحسين المسح",
    "QR code is very small": "حجم رمز QR صغير جدًا",
    "Increase size to at least 300px for reliable printing": "اجعل الحجم 300px على الأقل للطباعة بثبات",
    "Barcode contrast is too low": "تباين الباركود منخفض جدًا",
    "Use darker bars and a lighter background for scanner reliability": "استخدم أشرطة أغمق وخلفية أفتح لتحسين القراءة",
    "Contrast is moderate and may fail on low-end scanners": "التباين متوسط وقد يفشل مع بعض الماسحات الضعيفة",
    "Increase contrast between the bars and the background": "ارفع التباين بين الأشرطة والخلفية",
    "Gradients can reduce consistency across the barcode width": "التدرجات قد تقلل ثبات قراءة الباركود",
    "Prefer a single solid color for critical packaging or retail use": "استخدم لونًا واحدًا للعبوات أو الاستخدامات المهمة",
    "Very thin bars are harder to print and scan": "الأشرطة الرفيعة جدًا أصعب في الطباعة والمسح",
    "Use bar width 2px or larger for production labels": "استخدم عرض أشرطة 2px أو أكثر لملصقات الإنتاج",
    "Quiet zone is tight around the barcode": "المساحة الهادئة حول الباركود ضيقة",
    "Increase margin to give scanners enough empty space around the symbol": "زد الهامش لمنح الماسحات مساحة فارغة كافية",
    "Short bar height reduces read reliability": "ارتفاع الأشرطة القصير يقلل موثوقية القراءة",
    "Increase barcode height for handheld and distance scanning": "زد ارتفاع الباركود للمسح اليدوي أو عن بعد",
    "Human-readable text is quite small": "النص المقروء صغير نوعًا ما",
    "Increase font size if this barcode will be printed on physical labels": "زد حجم الخط إذا كان الباركود سيطبع على ملصقات",
    "Selected format expects digits only": "التنسيق المحدد يقبل أرقامًا فقط",
    "Remove letters and symbols or switch to Code 128 / Code 93": "احذف الحروف والرموز أو اختر Code 128 / Code 93",
    "ITF requires an even number of digits": "تنسيق ITF يحتاج عددًا زوجيًا من الأرقام",
    "Use an even digit count or choose a different format": "استخدم عدد أرقام زوجي أو اختر تنسيقًا آخر",
    "Pill bars are more decorative than standard bars": "الأشرطة الكبسولية زخرفية أكثر من القياسية",
    "Use square or lightly rounded bars for mission-critical scanning": "استخدم أشرطة مربعة أو مستديرة قليلًا للمسح الحساس",
  },
};

const translations = {
  en: {
    languageName: "English",
    languageToggle: "العربية",
    appName: "QR Design Studio",
    layout: {
      nav: {
        create: "Create QR",
        templates: "Templates",
        batch: "Batch Generator",
        settings: "Settings",
      },
      builtBy: "Built by Moatasem Alhilali",
      githubProfile: "GitHub Profile",
      switchLanguage: "Switch language",
    },
    home: {
      generator: "Generator",
      qrCode: "QR Code",
      barcode: "Barcode",
      mode: "Mode",
      staticQr: "Static QR",
      staticBarcode: "Static Barcode",
      qrDescription: "Generate static QR codes with custom styling, frames, and exports.",
      barcodeDescription: "Generate printable barcodes with multiple symbologies, styling, labels, and exports.",
      data: "Data",
      style: "Style",
      presets: "Presets",
      frame: "Frame",
      quality: "Quality",
    },
    qrControls: {
      dataType: "Data Type",
      content: "Content",
      moduleShape: "Module Shape",
      cornerStyle: "Corner Style",
      colorMode: "Color Mode",
      color1: "Color 1",
      color2: "Color 2",
      background: "Background",
      transparent: "Transparent",
      gradientAngle: "Gradient Angle",
      size: "Size",
      errorCorrection: "Error Correction",
      stylePresets: "Style Presets",
      centerLogo: "Center Logo",
      logoAlt: "Logo",
      logoUploaded: "Logo uploaded",
      scale: "Scale",
      uploadLogo: "Upload logo image",
      logoScale: "Logo Scale",
      errorCorrectionShort: "Error correction",
      noIssues: "No issues found. Your QR code should scan reliably.",
      reliabilityScore: "Reliability score",
    },
    barcodeControls: {
      contentType: "Content Type",
      barcodeFormat: "Barcode Format",
      encodedValue: "Encoded Value",
      displayText: "Display Text",
      displayTextPlaceholder: "Optional label under the barcode",
      barShape: "Bar Shape",
      colorMode: "Color Mode",
      barColor: "Bar Color",
      accentColor: "Accent Color",
      background: "Background",
      transparent: "Transparent",
      gradientAngle: "Gradient Angle",
      barWidth: "Bar Width",
      height: "Height",
      quietZone: "Quiet Zone",
      humanReadableText: "Human Readable Text",
      visible: "Visible",
      hidden: "Hidden",
      flatGuards: "Flat Guards",
      fontSize: "Font Size",
      textGap: "Text Gap",
      textStyle: "Text Style",
      bold: "Bold",
      italic: "Italic",
      current: "Current",
      barcodePresets: "Barcode Presets",
      bars: "bars",
      noIssues: "No issues found. This barcode should print and scan reliably.",
      reliabilityScore: "Reliability score",
    },
    frameEditor: {
      frameStyle: "Frame Style",
      messaging: "Messaging",
      messagingDescription: "Add a badge, headline, and CTA to make the frame feel like a real campaign card.",
      badgeLabel: "Badge Label",
      badgePlaceholder: "Quick Access",
      textAbove: "Text Above",
      textAbovePlaceholder: "Optional top text",
      textBelow: "Text Below",
      textBelowPlaceholder: "Scan Me",
      colorSystem: "Color System",
      colorSystemDescription: "Build a more premium card using accent color, badge styling, and a dedicated QR panel background.",
      frameBackground: "Frame Background",
      frameBorder: "Frame Border",
      textColor: "Text Color",
      accentColor: "Accent Color",
      badgeBackground: "Badge Background",
      badgeText: "Badge Text",
      qrPanelBackground: "QR Panel Background",
      shapeDepth: "Shape and Depth",
      shapeDepthDescription: "Tune spacing, radius, border, and shadow to make the frame feel softer, sharper, or more premium.",
      outerPadding: "Outer Padding",
      fontSize: "Font Size",
      borderWidth: "Border Width",
      cornerRadius: "Corner Radius",
      shadowDepth: "Shadow Depth",
    },
    templates: {
      title: "Templates",
      description: "Choose a template to quickly create the perfect QR code for your use case.",
      suggestedFrame: "Suggested frame",
      categories: {
        Business: "Business",
        Utility: "Utility",
        Communication: "Communication",
        Social: "Social",
        Hospitality: "Hospitality",
        Events: "Events",
        Technology: "Technology",
        Finance: "Finance",
        General: "General",
      },
    },
    batch: {
      title: "Batch Generator",
      description: "Generate multiple QR codes at once. Upload a CSV or add rows manually.",
      importCsv: "Import CSV",
      addRow: "Add Row",
      csvFormat: "CSV format: data,label (one per line)",
      quickPaste: "Quick Paste (one URL per line)",
      pastePlaceholder: "Paste multiple URLs here, one per line...",
      items: "items",
      valid: "valid",
      dataPlaceholder: "URL or data",
      labelPlaceholder: "Label",
      generating: "Generating...",
      generate: "Generate",
      qrCodes: "QR Codes",
      clearAll: "Clear All",
      addSomeData: "Add some data first",
      importFailed: "Could not import file",
      batchFailed: "Batch generation failed",
      batchSuccess: "Batch generated and downloaded!",
      importedRows: "Imported",
      rows: "rows",
    },
    settings: {
      title: "Settings",
      generationMode: "Generation Mode",
      staticGeneration: "Static QR and Barcode generation",
      generationDescription:
        "This build focuses on local QR and barcode generation without Firebase, authentication, cloud sync, or dynamic redirects. Anonymous visit analytics run only after consent.",
      about: "About QR Design Studio",
      aboutDescription:
        "A professional code design studio for beautiful, customizable static QR codes and barcodes with templates and batch generation.",
      language: "Language",
      languageDescription: "Choose the interface language. Your choice is saved in this browser.",
      version: "Version 2.0",
    },
    notFound: {
      message: "Oops! Page not found",
      returnHome: "Return to Home",
      consolePrefix: "404 Error: User attempted to access non-existent route:",
    },
    analyticsConsent: {
      title: "Privacy-friendly analytics",
      description:
        "Help improve QR Design Studio with anonymous visit analytics. QR content, logos, exports, and private design data are never stored.",
      allow: "Allow",
      notNow: "Not now",
    },
    values: {
      dataTypes: {
        url: "URL",
        wifi: "WiFi",
        email: "Email",
        phone: "Phone",
        whatsapp: "WhatsApp",
        vcard: "Contact",
        text: "Text",
      },
      barcodeDataTypes: {
        product: "Product",
        text: "Text",
        url: "URL",
        email: "Email",
        phone: "Phone",
      },
      moduleStyles: {
        square: "Square",
        rounded: "Rounded",
        dots: "Dots",
        diamond: "Diamond",
        "extra-rounded": "Pill",
        "tiny-squares": "Pixel",
        heart: "Heart",
        star: "Star",
        triangle: "Triangle",
        bubble: "Bubble",
      },
      cornerStyles: {
        square: "Square",
        rounded: "Rounded",
        circle: "Circle",
        thick: "Thick",
        minimal: "Minimal",
        decorative: "Decorative",
        ring: "Ring",
        leaf: "Leaf",
        "frame-dots": "Dotted",
      },
      shapes: {
        square: "Square",
        rounded: "Rounded",
        pill: "Pill",
      },
      colorModes: {
        single: "single",
        gradient: "gradient",
      },
      textPositions: {
        top: "top",
        bottom: "bottom",
      },
      fontStyles: {
        "bold-italic": "bold-italic",
        bold: "bold",
        italic: "italic",
        regular: "regular",
      },
      grades: {
        Excellent: "Excellent",
        Good: "Good",
        Warning: "Warning",
        Risky: "Risky",
      },
    },
    barcodeFormatHints: {
      CODE128: "Flexible. Works with most text, URLs, tracking IDs, and mixed content.",
      CODE39: "Uppercase letters, numbers, spaces, and a few symbols. Common for labels.",
      CODE93: "Compact alphanumeric barcode with broader ASCII support than Code 39.",
      EAN13: "Retail format for 12 or 13 digits.",
      EAN8: "Compact retail format for 7 or 8 digits.",
      UPC: "Retail format for 11 or 12 digits.",
      ITF14: "Shipping carton format for 13 or 14 digits.",
      ITF: "Numeric only, must contain an even number of digits.",
      codabar: "Digits with start/stop markers A-D. Useful for legacy inventory systems.",
    },
  },
  ar: {
    languageName: "العربية",
    languageToggle: "English",
    appName: "استوديو تصميم QR",
    layout: {
      nav: {
        create: "إنشاء QR",
        templates: "القوالب",
        batch: "إنشاء دفعة",
        settings: "الإعدادات",
      },
      builtBy: "صنعه معتصم الهلالي",
      githubProfile: "حساب GitHub",
      switchLanguage: "تغيير اللغة",
    },
    home: {
      generator: "المولّد",
      qrCode: "رمز QR",
      barcode: "باركود",
      mode: "الوضع",
      staticQr: "QR ثابت",
      staticBarcode: "باركود ثابت",
      qrDescription: "أنشئ رموز QR ثابتة مع تخصيص الشكل، الإطارات، والتصدير.",
      barcodeDescription: "أنشئ باركود قابل للطباعة بتنسيقات متعددة وتسميات وتصدير.",
      data: "البيانات",
      style: "التصميم",
      presets: "الأنماط",
      frame: "الإطار",
      quality: "الجودة",
    },
    qrControls: {
      dataType: "نوع البيانات",
      content: "المحتوى",
      moduleShape: "شكل الوحدات",
      cornerStyle: "شكل الزوايا",
      colorMode: "نمط الألوان",
      color1: "اللون 1",
      color2: "اللون 2",
      background: "الخلفية",
      transparent: "شفاف",
      gradientAngle: "زاوية التدرج",
      size: "الحجم",
      errorCorrection: "تصحيح الأخطاء",
      stylePresets: "أنماط جاهزة",
      centerLogo: "الشعار في الوسط",
      logoAlt: "الشعار",
      logoUploaded: "تم رفع الشعار",
      scale: "الحجم",
      uploadLogo: "ارفع صورة الشعار",
      logoScale: "حجم الشعار",
      errorCorrectionShort: "تصحيح الأخطاء",
      noIssues: "لا توجد ملاحظات. يفترض أن يتم مسح رمز QR بثبات.",
      reliabilityScore: "درجة الموثوقية",
    },
    barcodeControls: {
      contentType: "نوع المحتوى",
      barcodeFormat: "تنسيق الباركود",
      encodedValue: "القيمة المشفرة",
      displayText: "النص المعروض",
      displayTextPlaceholder: "تسمية اختيارية تحت الباركود",
      barShape: "شكل الأشرطة",
      colorMode: "نمط الألوان",
      barColor: "لون الأشرطة",
      accentColor: "لون إضافي",
      background: "الخلفية",
      transparent: "شفاف",
      gradientAngle: "زاوية التدرج",
      barWidth: "عرض الأشرطة",
      height: "الارتفاع",
      quietZone: "المساحة الهادئة",
      humanReadableText: "النص المقروء",
      visible: "ظاهر",
      hidden: "مخفي",
      flatGuards: "حواف مسطحة",
      fontSize: "حجم الخط",
      textGap: "مسافة النص",
      textStyle: "نمط النص",
      bold: "عريض",
      italic: "مائل",
      current: "الحالي",
      barcodePresets: "أنماط الباركود",
      bars: "أشرطة",
      noIssues: "لا توجد ملاحظات. يفترض أن يطبع هذا الباركود ويمسح بثبات.",
      reliabilityScore: "درجة الموثوقية",
    },
    frameEditor: {
      frameStyle: "نمط الإطار",
      messaging: "النصوص",
      messagingDescription: "أضف شارة وعنوانًا ودعوة واضحة ليبدو الإطار كبطاقة حملة حقيقية.",
      badgeLabel: "نص الشارة",
      badgePlaceholder: "وصول سريع",
      textAbove: "النص العلوي",
      textAbovePlaceholder: "نص علوي اختياري",
      textBelow: "النص السفلي",
      textBelowPlaceholder: "امسح الرمز",
      colorSystem: "نظام الألوان",
      colorSystemDescription: "ابن بطاقة أكثر فخامة باستخدام لون بارز وشارة وخلفية مخصصة للرمز.",
      frameBackground: "خلفية الإطار",
      frameBorder: "حد الإطار",
      textColor: "لون النص",
      accentColor: "اللون البارز",
      badgeBackground: "خلفية الشارة",
      badgeText: "نص الشارة",
      qrPanelBackground: "خلفية لوحة QR",
      shapeDepth: "الشكل والعمق",
      shapeDepthDescription: "اضبط المسافات والحواف والحدود والظل ليصبح الإطار أنعم أو أوضح أو أفخم.",
      outerPadding: "المسافة الخارجية",
      fontSize: "حجم الخط",
      borderWidth: "عرض الحد",
      cornerRadius: "استدارة الزوايا",
      shadowDepth: "عمق الظل",
    },
    templates: {
      title: "القوالب",
      description: "اختر قالبًا جاهزًا لإنشاء رمز QR مناسب لاستخدامك بسرعة.",
      suggestedFrame: "الإطار المقترح",
      categories: {
        Business: "الأعمال",
        Utility: "أدوات",
        Communication: "التواصل",
        Social: "اجتماعي",
        Hospitality: "الضيافة",
        Events: "الفعاليات",
        Technology: "التقنية",
        Finance: "المال",
        General: "عام",
      },
    },
    batch: {
      title: "إنشاء دفعة",
      description: "أنشئ عدة رموز QR دفعة واحدة. ارفع ملف CSV أو أضف الصفوف يدويًا.",
      importCsv: "استيراد CSV",
      addRow: "إضافة صف",
      csvFormat: "صيغة CSV: البيانات,التسمية (سطر لكل عنصر)",
      quickPaste: "لصق سريع (رابط واحد في كل سطر)",
      pastePlaceholder: "الصق عدة روابط هنا، كل رابط في سطر...",
      items: "عنصر",
      valid: "صالح",
      dataPlaceholder: "رابط أو بيانات",
      labelPlaceholder: "تسمية",
      generating: "جاري الإنشاء...",
      generate: "إنشاء",
      qrCodes: "رموز QR",
      clearAll: "مسح الكل",
      addSomeData: "أضف بعض البيانات أولًا",
      importFailed: "تعذر استيراد الملف",
      batchFailed: "تعذر إنشاء الدفعة",
      batchSuccess: "تم إنشاء الدفعة وتنزيلها",
      importedRows: "تم استيراد",
      rows: "صفوف",
    },
    settings: {
      title: "الإعدادات",
      generationMode: "وضع الإنشاء",
      staticGeneration: "إنشاء QR وباركود ثابت",
      generationDescription:
        "هذا الإصدار يركز على إنشاء QR وباركود محليًا بدون Firebase أو تسجيل دخول أو مزامنة سحابية أو تحويلات ديناميكية. تعمل تحليلات الزيارات المجهولة بعد الموافقة فقط.",
      about: "حول استوديو تصميم QR",
      aboutDescription:
        "استوديو احترافي لتصميم رموز QR وباركود ثابتة وجميلة وقابلة للتخصيص مع قوالب وإنشاء دفعات.",
      language: "اللغة",
      languageDescription: "اختر لغة الواجهة. سيتم حفظ اختيارك في هذا المتصفح.",
      version: "الإصدار 2.0",
    },
    notFound: {
      message: "الصفحة غير موجودة",
      returnHome: "العودة للرئيسية",
      consolePrefix: "خطأ 404: حاول المستخدم فتح مسار غير موجود:",
    },
    analyticsConsent: {
      title: "تحليلات تراعي الخصوصية",
      description:
        "ساعدنا في تحسين استوديو تصميم QR عبر تحليلات زيارات مجهولة. لا يتم حفظ محتوى QR أو الشعارات أو الملفات المصدرة أو بيانات التصميم الخاصة.",
      allow: "السماح",
      notNow: "ليس الآن",
    },
    values: {
      dataTypes: {
        url: "رابط",
        wifi: "واي فاي",
        email: "بريد",
        phone: "هاتف",
        whatsapp: "واتساب",
        vcard: "جهة اتصال",
        text: "نص",
      },
      barcodeDataTypes: {
        product: "منتج",
        text: "نص",
        url: "رابط",
        email: "بريد",
        phone: "هاتف",
      },
      moduleStyles: {
        square: "مربع",
        rounded: "ناعم",
        dots: "نقاط",
        diamond: "معين",
        "extra-rounded": "كبسولة",
        "tiny-squares": "بكسل",
        heart: "قلوب",
        star: "نجوم",
        triangle: "مثلثات",
        bubble: "فقاعات",
      },
      cornerStyles: {
        square: "مربع",
        rounded: "مستدير",
        circle: "دائرة",
        thick: "سميك",
        minimal: "بسيط",
        decorative: "زخرفي",
        ring: "حلقة",
        leaf: "ورقة",
        "frame-dots": "منقط",
      },
      shapes: {
        square: "مربع",
        rounded: "مستدير",
        pill: "كبسولة",
      },
      colorModes: {
        single: "لون واحد",
        gradient: "تدرج",
      },
      textPositions: {
        top: "أعلى",
        bottom: "أسفل",
      },
      fontStyles: {
        "bold-italic": "عريض ومائل",
        bold: "عريض",
        italic: "مائل",
        regular: "عادي",
      },
      grades: {
        Excellent: "ممتاز",
        Good: "جيد",
        Warning: "بحاجة لتحسين",
        Risky: "عالي المخاطر",
      },
    },
    barcodeFormatHints: {
      CODE128: "مرن. يعمل مع أغلب النصوص والروابط ومعرفات التتبع والمحتوى المختلط.",
      CODE39: "يدعم الحروف الكبيرة والأرقام والمسافات وبعض الرموز. شائع للملصقات.",
      CODE93: "باركود أبجدي رقمي مضغوط ويدعم ASCII أكثر من Code 39.",
      EAN13: "تنسيق تجزئة يتكون من 12 أو 13 رقمًا.",
      EAN8: "تنسيق تجزئة مضغوط يتكون من 7 أو 8 أرقام.",
      UPC: "تنسيق تجزئة يتكون من 11 أو 12 رقمًا.",
      ITF14: "تنسيق كراتين الشحن ويتكون من 13 أو 14 رقمًا.",
      ITF: "أرقام فقط ويحتاج عددًا زوجيًا من الأرقام.",
      codabar: "أرقام مع علامات بداية ونهاية A-D. مناسب لأنظمة المخزون القديمة.",
    },
  },
} as const;

export type AppTranslations = typeof translations.en;

interface I18nContextValue {
  locale: Locale;
  direction: Direction;
  t: AppTranslations;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getDirection(locale: Locale): Direction {
  return locale === "ar" ? "rtl" : "ltr";
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "en" || stored === "ar") return stored;
  } catch {
    // Keep language selection resilient when storage is unavailable.
  }

  return navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en";
}

function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Private browsing or disabled storage should not block language changes.
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());
  const direction = getDirection(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [direction, locale]);

  const value = useMemo<I18nContextValue>(() => {
    const setLocale = (nextLocale: Locale) => {
      persistLocale(nextLocale);
      setLocaleState(nextLocale);
    };

    return {
      locale,
      direction,
      t: translations[locale],
      setLocale,
      toggleLocale: () => setLocale(locale === "ar" ? "en" : "ar"),
    };
  }, [direction, locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}

export function translateQRPreset(locale: Locale, name: string, description: string) {
  return qrPresetCopy[locale][name] ?? { name, description };
}

export function translateBarcodePreset(locale: Locale, name: string, description: string) {
  return barcodePresetCopy[locale][name] ?? { name, description };
}

export function translateTemplate(locale: Locale, template: QRTemplate) {
  return templateCopy[locale][template.id] ?? {
    name: template.name,
    description: template.description,
    suggestedFrame: template.suggestedFrame,
  };
}

export function translateFramePreset(
  locale: Locale,
  type: FrameConfig["type"],
  name: string,
  description: string,
) {
  return framePresetCopy[locale][type] ?? { name, description };
}

export function translateFrameSuggestion(locale: Locale, value: string): string {
  return frameSuggestionCopy[locale][value] ?? value;
}

export function localizeFrameConfig<T extends Partial<FrameConfig>>(locale: Locale, config: T): T {
  if (locale === "en") return config;

  return {
    ...config,
    badgeText: config.badgeText ? translateFrameSuggestion(locale, config.badgeText) : config.badgeText,
    textTop: config.textTop ? translateFrameSuggestion(locale, config.textTop) : config.textTop,
    textBottom: config.textBottom ? translateFrameSuggestion(locale, config.textBottom) : config.textBottom,
  };
}

export function translateReliabilityGrade(locale: Locale, grade: string): string {
  return translations[locale].values.grades[grade as keyof AppTranslations["values"]["grades"]] ?? grade;
}

export function translateReliabilityText(locale: Locale, value: string): string {
  const invalidLengthMatch = value.match(/^(EAN13|EAN8|UPC|ITF14) value length is invalid$/);
  if (locale === "ar" && invalidLengthMatch) {
    return `طول قيمة ${invalidLengthMatch[1]} غير صالح`;
  }

  const digitSuggestionMatch = value.match(/^Use ([\d\sor]+) digits for (EAN13|EAN8|UPC|ITF14)$/);
  if (locale === "ar" && digitSuggestionMatch) {
    return `استخدم ${digitSuggestionMatch[1].replace(" or ", " أو ")} رقمًا لتنسيق ${digitSuggestionMatch[2]}`;
  }

  return reliabilityIssueCopy[locale][value] ?? value;
}

export function translateTemplateCategory(locale: Locale, category: string): string {
  return translations[locale].templates.categories[
    category as keyof AppTranslations["templates"]["categories"]
  ] ?? category;
}

export function getBarcodeFormatHint(locale: Locale, format: BarcodeFormat): string {
  return translations[locale].barcodeFormatHints[format];
}
