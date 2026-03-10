import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const LINKS_COLLECTION = 'short_links';

export interface ResolvedShortLink {
  destinationUrl: string;
  qrCodeId: string;
  isActive: boolean;
  expiresAt?: string;
  scanLimit?: number;
  password?: string;
}

interface ShortLinkDocument extends ResolvedShortLink {
  shortCode: string;
  createdAt: string;
}

function generateShortCode(): string {
  return Math.random().toString(36).substring(2, 8);
}

export async function createShortLink(destinationUrl: string, qrCodeId: string): Promise<string> {
  let shortCode = generateShortCode();
  let exists = await getDoc(doc(db, LINKS_COLLECTION, shortCode));
  while (exists.exists()) {
    shortCode = generateShortCode();
    exists = await getDoc(doc(db, LINKS_COLLECTION, shortCode));
  }
  await setDoc(doc(db, LINKS_COLLECTION, shortCode), {
    shortCode,
    destinationUrl,
    qrCodeId,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
  return shortCode;
}

export async function resolveShortLink(shortCode: string): Promise<ResolvedShortLink | null> {
  const snap = await getDoc(doc(db, LINKS_COLLECTION, shortCode));
  if (!snap.exists()) return null;
  return snap.data() as ResolvedShortLink;
}

export async function updateShortLink(shortCode: string, updates: Partial<ShortLinkDocument>): Promise<void> {
  await updateDoc(doc(db, LINKS_COLLECTION, shortCode), updates);
}

export function getRedirectUrl(shortCode: string): string {
  return `${window.location.origin}/r/${shortCode}`;
}
