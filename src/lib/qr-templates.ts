import { QRTemplate } from './types';

export const qrTemplates: QRTemplate[] = [
  {
    id: 'website', name: 'Website URL', description: 'Link to any website',
    category: 'Business', icon: 'Globe', dataType: 'url', placeholder: 'https://yoursite.com',
    suggestedFrame: 'Open Website',
    config: { moduleStyle: 'rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#1D4ED8' },
  },
  {
    id: 'wifi', name: 'WiFi Access', description: 'Share WiFi credentials',
    category: 'Utility', icon: 'Wifi', dataType: 'wifi', placeholder: 'Network name',
    suggestedFrame: 'Connect to WiFi',
    config: { moduleStyle: 'rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#0F766E' },
  },
  {
    id: 'email', name: 'Email', description: 'Open email compose',
    category: 'Communication', icon: 'Mail', dataType: 'email', placeholder: 'hello@company.com',
    suggestedFrame: 'Email Us',
    config: { moduleStyle: 'rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#B91C1C' },
  },
  {
    id: 'phone', name: 'Phone Call', description: 'Quick dial phone number',
    category: 'Communication', icon: 'Phone', dataType: 'phone', placeholder: '+1234567890',
    suggestedFrame: 'Call Us',
    config: { moduleStyle: 'square', cornerStyle: 'thick', colorMode: 'single', color1: '#166534' },
  },
  {
    id: 'whatsapp', name: 'WhatsApp', description: 'Open WhatsApp chat',
    category: 'Social', icon: 'MessageSquare', dataType: 'whatsapp', placeholder: '+1234567890',
    suggestedFrame: 'Chat with Us',
    config: { moduleStyle: 'rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#15803D' },
  },
  {
    id: 'vcard', name: 'Business Card', description: 'Share contact info',
    category: 'Business', icon: 'User', dataType: 'vcard', placeholder: 'Full Name',
    suggestedFrame: 'Save Contact',
    config: { moduleStyle: 'extra-rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#4338CA' },
  },
  {
    id: 'social', name: 'Social Profile', description: 'Link to social media',
    category: 'Social', icon: 'Globe', dataType: 'url', placeholder: 'https://instagram.com/...',
    suggestedFrame: 'Follow Us',
    config: { moduleStyle: 'rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#7C3AED' },
  },
  {
    id: 'review', name: 'Google Review', description: 'Get customer reviews',
    category: 'Business', icon: 'Star', dataType: 'url', placeholder: 'https://g.page/...',
    suggestedFrame: 'Leave a Review',
    config: { moduleStyle: 'rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#2563EB' },
  },
  {
    id: 'menu', name: 'Restaurant Menu', description: 'Digital menu access',
    category: 'Hospitality', icon: 'Coffee', dataType: 'url', placeholder: 'https://menu.example.com',
    suggestedFrame: 'View Menu',
    config: { moduleStyle: 'rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#9A3412' },
  },
  {
    id: 'event', name: 'Event Registration', description: 'Event signup page',
    category: 'Events', icon: 'Calendar', dataType: 'url', placeholder: 'https://event.example.com',
    suggestedFrame: 'Register Now',
    config: { moduleStyle: 'extra-rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#4338CA' },
  },
  {
    id: 'app', name: 'App Download', description: 'Link to app store',
    category: 'Technology', icon: 'Download', dataType: 'url', placeholder: 'https://apps.apple.com/...',
    suggestedFrame: 'Download App',
    config: { moduleStyle: 'rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#111827' },
  },
  {
    id: 'payment', name: 'Payment / Donation', description: 'Payment or donation link',
    category: 'Finance', icon: 'CreditCard', dataType: 'url', placeholder: 'https://pay.example.com',
    suggestedFrame: 'Pay Now',
    config: { moduleStyle: 'square', cornerStyle: 'thick', colorMode: 'single', color1: '#0F766E' },
  },
  {
    id: 'location', name: 'Location / Map', description: 'Share a map location',
    category: 'Utility', icon: 'MapPin', dataType: 'url', placeholder: 'https://maps.google.com/...',
    suggestedFrame: 'Find Us',
    config: { moduleStyle: 'rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#B91C1C' },
  },
  {
    id: 'text', name: 'Plain Text', description: 'Any text content',
    category: 'General', icon: 'Type', dataType: 'text', placeholder: 'Enter any text...',
    suggestedFrame: 'Scan Me',
    config: { moduleStyle: 'rounded', cornerStyle: 'rounded', colorMode: 'single', color1: '#18181B' },
  },
];
