import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { SavedQRCode } from '@/lib/types';

const QR_COLLECTION = 'qr_codes';

export async function saveQRCode(qr: Omit<SavedQRCode, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = doc(collection(db, QR_COLLECTION));
  const now = new Date().toISOString();
  await setDoc(ref, { ...qr, id: ref.id, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateQRCode(id: string, updates: Partial<SavedQRCode>): Promise<void> {
  await updateDoc(doc(db, QR_COLLECTION, id), { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteQRCode(id: string): Promise<void> {
  await deleteDoc(doc(db, QR_COLLECTION, id));
}

export async function getUserQRCodes(userId: string): Promise<SavedQRCode[]> {
  const q = query(
    collection(db, QR_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as SavedQRCode);
}

export async function getQRCode(id: string): Promise<SavedQRCode | null> {
  const snap = await getDoc(doc(db, QR_COLLECTION, id));
  return snap.exists() ? (snap.data() as SavedQRCode) : null;
}
