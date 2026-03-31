import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Takwira ⚽ — Football Predictor",
  description: "AI-powered football match predictions using Poisson distribution and team analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <span className="text-xl font-bold text-white">Takwira</span>
            <span className="text-xs text-gray-500 ml-1">by zerba</span>
          </div>
          <nav className="flex gap-4 text-sm text-gray-400">
            <a href="/" className="hover:text-white transition-colors">Today</a>
            <a href="/standings" className="hover:text-white transition-colors">Standings</a>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="text-center text-gray-600 text-xs py-6">
          Takwira — predictions for entertainment only. Not financial advice.
        </footer>
      </body>
    </html>
  );
}
