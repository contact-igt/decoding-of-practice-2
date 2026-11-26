import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import './globals.css';

const inter = localFont({
  src: '../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--inter',
});

export const metadata: Metadata = { icons: { icon: '/vls/logo.png' } };

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en-IN" className={inter.variable}><body>{children}</body></html>;
}
