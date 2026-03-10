import { FrameConfig } from './types';

export interface FramePreset {
  name: string;
  type: FrameConfig['type'];
  description: string;
  config: Partial<FrameConfig>;
}

export const framePresets: FramePreset[] = [
  { name: 'None', type: 'none', description: 'No frame', config: { type: 'none' } },
  { name: 'Simple', type: 'simple', description: 'Clean border frame', config: { type: 'simple', borderColor: '#000000', bgColor: '#FFFFFF', padding: 20 } },
  { name: 'Rounded', type: 'rounded', description: 'Soft rounded corners', config: { type: 'rounded', borderColor: '#6C3AED', bgColor: '#FFFFFF', padding: 24 } },
  { name: 'Bold', type: 'bold', description: 'Bold campaign style', config: { type: 'bold', borderColor: '#000000', bgColor: '#FFD700', textColor: '#000000', padding: 28, fontSize: 20 } },
  { name: 'Minimal', type: 'minimal', description: 'Subtle minimal frame', config: { type: 'minimal', borderColor: '#E5E7EB', bgColor: '#FFFFFF', padding: 16 } },
  { name: 'Social', type: 'social', description: 'Social media style', config: { type: 'social', borderColor: '#1DA1F2', bgColor: '#FFFFFF', textColor: '#1DA1F2', padding: 24 } },
  { name: 'Premium', type: 'premium', description: 'Premium dark frame', config: { type: 'premium', borderColor: '#C9A961', bgColor: '#1A1A1A', textColor: '#C9A961', padding: 28, fontSize: 18 } },
];

export const frameSuggestions = [
  'Scan Me', 'Open Website', 'View Menu', 'Follow Us', 'Connect to WiFi',
  'Download App', 'Learn More', 'Get Offer', 'Join Us', 'Visit Us',
];
