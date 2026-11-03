import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Insurance Document Intelligence Lab',
  description: 'Extract less blindly. Verify more intelligently.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-graphite min-h-screen">
        <Sidebar />
        <main className="pl-64 min-h-screen">
          <div className="max-w-7xl mx-auto p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

