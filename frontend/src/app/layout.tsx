import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Insurance Document Intelligence Lab',
  description: 'Extract less blindly. Verify more intelligently. Spatial high-precision document extraction & evaluation workbench.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-canvas text-textPrimary min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
        <Sidebar />
        <main className="pl-64 min-h-screen relative overflow-x-hidden">
          {/* Subtle atmospheric ambient glow */}
          <div className="fixed top-0 left-64 right-0 h-72 bg-gradient-to-b from-cyan-950/20 via-transparent to-transparent pointer-events-none z-0"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto p-8 space-y-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
