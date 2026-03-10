import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const LINKS_COLLECTION = 'short_links';

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

export async function resolveShortLink(shortCode: string): Promise<{
  destinationUrl: string;
  qrCodeId: string;
  isActive: boolean;
  expiresAt?: string;
  scanLimit?: number;
  password?: string;
} | null> {
  const snap = await getDoc(doc(db, LINKS_COLLECTION, shortCode));
  if (!snap.exists()) return null;
  return snap.data() as any;
}

export async function updateShortLink(shortCode: string, updates: Record<string, any>): Promise<void> {
  await updateDoc(doc(db, LINKS_COLLECTION, shortCode), updates);
}

export function getRedirectUrl(shortCode: string): string {
  return `${window.location.origin}/r/${shortCode}`;
}
