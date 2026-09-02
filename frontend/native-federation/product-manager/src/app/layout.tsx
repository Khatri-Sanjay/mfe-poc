import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Product Manager',
  description: 'Admin product management application',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
