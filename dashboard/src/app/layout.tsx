import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'School Closure Deliberation · Interactive Twin',
  description: 'Minimalistic interactive dashboard and digital twin for multi-agent deliberation simulation experiments',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased font-sans selection:bg-neutral-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}

