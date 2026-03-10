import { QRConfig } from './qr-engine';

export interface FrameConfig {
  type: 'none' | 'simple' | 'rounded' | 'bold' | 'minimal' | 'social' | 'premium' | 'glass' | 'spotlight';
  textTop: string;
  textBottom: string;
  badgeText: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  badgeColor: string;
  badgeTextColor: string;
  qrBackgroundColor: string;
  padding: number;
  fontSize: number;
  borderWidth: number;
  cornerRadius: number;
  shadow: number;
}

export const defaultFrameConfig: FrameConfig = {
  type: 'none',
  textTop: '',
  textBottom: 'Scan Me',
  badgeText: '',
  bgColor: '#FFFFFF',
  borderColor: '#000000',
  textColor: '#000000',
  accentColor: '#6C3AED',
  badgeColor: '#6C3AED',
  badgeTextColor: '#FFFFFF',
  qrBackgroundColor: '#FFFFFF',
  padding: 20,
  fontSize: 16,
  borderWidth: 2,
  cornerRadius: 22,
  shadow: 18,
};

export interface SavedQRCode {
  id: string;
  userId: string;
  name: string;
  type: 'static' | 'dynamic';
  config: QRConfig;
  frameConfig: FrameConfig;
  shortCode?: string;
  destinationUrl?: string;
  isActive: boolean;
  expiresAt?: string;
  scanLimit?: number;
  password?: string;
  totalScans: number;
  favorite: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QRScan {
  id: string;
  qrCodeId: string;
  timestamp: string;
  country: string;
  city: string;
  device: string;
  os: string;
  browser: string;
  referrer: string;
}

export interface BatchItem {
  id: string;
  data: string;
  label: string;
  status: 'pending' | 'completed' | 'error';
  error?: string;
}

export interface ScanReliabilityResult {
  score: number;
  grade: 'Excellent' | 'Good' | 'Warning' | 'Risky';
  issues: ScanIssue[];
}

export interface ScanIssue {
  type: 'contrast' | 'logo' | 'density' | 'color' | 'spacing' | 'style';
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion: string;
}

export interface QRTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  dataType: QRConfig['dataType'];
  placeholder: string;
  suggestedFrame: string;
  config: Partial<QRConfig>;
}
