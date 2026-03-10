import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, orderBy, limit, updateDoc, increment } from 'firebase/firestore';
import { QRScan } from '@/lib/types';

const SCANS_COLLECTION = 'qr_scans';
const QR_COLLECTION = 'qr_codes';

export async function logScan(qrCodeId: string, scanData: Partial<QRScan>): Promise<void> {
  const ref = doc(collection(db, SCANS_COLLECTION));
  const timestamp = new Date().toISOString();
  await setDoc(ref, {
    id: ref.id,
    qrCodeId,
    timestamp,
    ...scanData,
  });

  if (!qrCodeId) return;

  try {
    await updateDoc(doc(db, QR_COLLECTION, qrCodeId), {
      totalScans: increment(1),
      updatedAt: timestamp,
    });
  } catch {
    // Keep scan logging best-effort even if the parent QR record is missing.
  }
}

export async function getScansForQR(qrCodeId: string): Promise<QRScan[]> {
  const q = query(
    collection(db, SCANS_COLLECTION),
    where('qrCodeId', '==', qrCodeId),
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as QRScan);
}

export async function getRecentScans(max: number = 50): Promise<QRScan[]> {
  const q = query(
    collection(db, SCANS_COLLECTION),
    orderBy('timestamp', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as QRScan);
}

export function detectDeviceInfo() {
  const ua = navigator.userAgent;
  const device = /Mobile|Android|iPhone/.test(ua) ? 'Mobile' : /Tablet|iPad/.test(ua) ? 'Tablet' : 'Desktop';
  const os = /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : 'Unknown';
  const browser = /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : /Edge/.test(ua) ? 'Edge' : 'Unknown';
  return { device, os, browser };
}

export async function getLocationInfo(): Promise<{ country: string; city: string }> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return { country: data.country_name || 'Unknown', city: data.city || 'Unknown' };
  } catch {
    return { country: 'Unknown', city: 'Unknown' };
  }
}
