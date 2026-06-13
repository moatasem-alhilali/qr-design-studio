import {
  Calendar,
  Coffee,
  CreditCard,
  Download,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Star,
  Type,
  User,
  Wifi,
} from "lucide-react";
import type { ElementType } from "react";

import { qrTemplates } from "@/lib/qr-templates";

export const templateIconMap: Record<string, ElementType> = {
  Globe,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  User,
  Star,
  Coffee,
  Calendar,
  Download,
  CreditCard,
  MapPin,
  Type,
};

export function getTemplateCategories(): string[] {
  return [...new Set(qrTemplates.map((template) => template.category))];
}

export function getTemplatesByCategory(category: string) {
  return qrTemplates.filter((template) => template.category === category);
}

export function getTemplateIcon(icon: string) {
  return templateIconMap[icon] || Globe;
}
