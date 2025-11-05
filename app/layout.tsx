import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: '2-Week Swing Screener',
  description: 'Educational stock screener using technicals for short swing windows.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white">
          <div className="container py-4">
            <h1 className="text-xl font-semibold">2-Week Swing Screener</h1>
          </div>
        </header>
        <main className="container py-8">
          {children}
        </main>
        <footer className="border-t bg-white">
          <div className="container py-4 text-sm text-slate-600">
            <p>For educational purposes only. Not financial advice.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
