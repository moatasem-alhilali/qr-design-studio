import { QRTemplate } from './types';

export const qrTemplates: QRTemplate[] = [
  {
    id: 'website', name: 'Website URL', description: 'Link to any website',
    category: 'Business', icon: 'Globe', dataType: 'url', placeholder: 'https://yoursite.com',
    suggestedFrame: 'Open Website',
    config: { moduleStyle: 'rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#2563EB' },
  },
  {
    id: 'wifi', name: 'WiFi Access', description: 'Share WiFi credentials',
    category: 'Utility', icon: 'Wifi', dataType: 'wifi', placeholder: 'Network name',
    suggestedFrame: 'Connect to WiFi',
    config: { moduleStyle: 'dots', cornerStyle: 'circle', colorMode: 'gradient', color1: '#06B6D4', color2: '#10B981' },
  },
  {
    id: 'email', name: 'Email', description: 'Open email compose',
    category: 'Communication', icon: 'Mail', dataType: 'email', placeholder: 'hello@company.com',
    suggestedFrame: 'Email Us',
    config: { moduleStyle: 'rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#DC2626' },
  },
  {
    id: 'phone', name: 'Phone Call', description: 'Quick dial phone number',
    category: 'Communication', icon: 'Phone', dataType: 'phone', placeholder: '+1234567890',
    suggestedFrame: 'Call Us',
    config: { moduleStyle: 'square', cornerStyle: 'thick', colorMode: 'single', color1: '#16A34A' },
  },
  {
    id: 'whatsapp', name: 'WhatsApp', description: 'Open WhatsApp chat',
    category: 'Social', icon: 'MessageSquare', dataType: 'whatsapp', placeholder: '+1234567890',
    suggestedFrame: 'Chat with Us',
    config: { moduleStyle: 'rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#25D366' },
  },
  {
    id: 'vcard', name: 'Business Card', description: 'Share contact info',
    category: 'Business', icon: 'User', dataType: 'vcard', placeholder: 'Full Name',
    suggestedFrame: 'Save Contact',
    config: { moduleStyle: 'extra-rounded', cornerStyle: 'decorative', colorMode: 'gradient', color1: '#6C3AED', color2: '#8B5CF6' },
  },
  {
    id: 'social', name: 'Social Profile', description: 'Link to social media',
    category: 'Social', icon: 'Globe', dataType: 'url', placeholder: 'https://instagram.com/...',
    suggestedFrame: 'Follow Us',
    config: { moduleStyle: 'dots', cornerStyle: 'circle', colorMode: 'gradient', color1: '#E1306C', color2: '#F77737' },
  },
  {
    id: 'review', name: 'Google Review', description: 'Get customer reviews',
    category: 'Business', icon: 'Star', dataType: 'url', placeholder: 'https://g.page/...',
    suggestedFrame: 'Leave a Review',
    config: { moduleStyle: 'rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#4285F4' },
  },
  {
    id: 'menu', name: 'Restaurant Menu', description: 'Digital menu access',
    category: 'Hospitality', icon: 'Coffee', dataType: 'url', placeholder: 'https://menu.example.com',
    suggestedFrame: 'View Menu',
    config: { moduleStyle: 'rounded', cornerStyle: 'decorative', colorMode: 'gradient', color1: '#EA580C', color2: '#DC2626' },
  },
  {
    id: 'event', name: 'Event Registration', description: 'Event signup page',
    category: 'Events', icon: 'Calendar', dataType: 'url', placeholder: 'https://event.example.com',
    suggestedFrame: 'Register Now',
    config: { moduleStyle: 'extra-rounded', cornerStyle: 'circle', colorMode: 'gradient', color1: '#7C3AED', color2: '#2563EB' },
  },
  {
    id: 'app', name: 'App Download', description: 'Link to app store',
    category: 'Technology', icon: 'Download', dataType: 'url', placeholder: 'https://apps.apple.com/...',
    suggestedFrame: 'Download App',
    config: { moduleStyle: 'rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#000000' },
  },
  {
    id: 'payment', name: 'Payment / Donation', description: 'Payment or donation link',
    category: 'Finance', icon: 'CreditCard', dataType: 'url', placeholder: 'https://pay.example.com',
    suggestedFrame: 'Pay Now',
    config: { moduleStyle: 'square', cornerStyle: 'thick', colorMode: 'gradient', color1: '#059669', color2: '#065F46' },
  },
  {
    id: 'location', name: 'Location / Map', description: 'Share a map location',
    category: 'Utility', icon: 'MapPin', dataType: 'url', placeholder: 'https://maps.google.com/...',
    suggestedFrame: 'Find Us',
    config: { moduleStyle: 'dots', cornerStyle: 'rounded', colorMode: 'single', color1: '#DC2626' },
  },
  {
    id: 'text', name: 'Plain Text', description: 'Any text content',
    category: 'General', icon: 'Type', dataType: 'text', placeholder: 'Enter any text...',
    suggestedFrame: 'Scan Me',
    config: { moduleStyle: 'rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#18181B' },
  },
];
