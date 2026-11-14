import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '@/components/providers';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'OjaBook: sales, stock and debts for Nigerian businesses', template: '%s | OjaBook' },
  description:
    'Record sales, manage stock, track customer debts and see your profit. OjaBook works on your phone, even without network.',
  applicationName: 'OjaBook',
  manifest: '/manifest.webmanifest',
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }], apple: '/icons/apple-touch-icon.png' },
  openGraph: {
    type: 'website',
    siteName: 'OjaBook',
    title: 'OjaBook: know your sales, track your stock, understand your money',
    description: 'Business management and bookkeeping for Nigerian traders, retailers and wholesalers.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'OjaBook dashboard preview with demonstration data' }],
  },
  twitter: { card: 'summary_large_image', title: 'OjaBook', description: 'Know your sales. Track your stock. Understand your money.', images: ['/og.png'] },
};

export const viewport: Viewport = {
  themeColor: '#21232e',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-NG">
      <body>
        <a
          href="#main"
          className="button-sm fixed left-3 top-3 z-[100] -translate-y-16 rounded-lg bg-royal px-3 py-2 text-white transition-oja focus:translate-y-0"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
