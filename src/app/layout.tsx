import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { GeistSans, GeistMono } from 'geist/font';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sonora — AI Music Studio',
  description: 'Create, transform and finish music with Sonora.',
  applicationName: 'Sonora',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0A0C0D',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
