import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Provenance — Insurance Document Intelligence & Ground Truth Lab',
  description: 'High-precision document extraction, evidence spatial localization, cost-per-correct-field telemetry, and ground-truth benchmark workbench.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080B11] text-slate-100 min-h-screen selection:bg-sky-500/30 selection:text-sky-200">
        <Sidebar />
        <main className="pl-64 min-h-screen relative overflow-x-hidden">
          <div className="relative z-10 max-w-7xl mx-auto p-8 space-y-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
