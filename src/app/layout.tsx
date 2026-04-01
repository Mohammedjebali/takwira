import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Takwira ⚽",
  description: "Football match predictions",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Header */}
        <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40 bg-gray-950 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚽</span>
            <span className="text-lg font-bold text-white">Takwira</span>
          </div>
          <nav className="flex gap-1">
            <a href="/" className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              Today
            </a>
            <a href="/predict" className="px-3 py-1.5 rounded-lg text-sm text-blue-400 hover:bg-gray-800 transition-colors font-medium">
              🔮 Predict
            </a>
            <a href="/standings" className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              Table
            </a>
          </nav>
        </header>

        <main className="max-w-2xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
          {children}
        </main>

        <footer className="text-center text-gray-700 text-xs py-6">
          Takwira · predictions for entertainment only
        </footer>
      </body>
    </html>
  );
}
