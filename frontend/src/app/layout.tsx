import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CacheProvider } from "@/lib/cache-provider";

// Primary font - Inter (modern, highly legible)
// Used for body text, UI elements
const fontSans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap', // Fallback to system font while loading
  preload: true,
  weight: ['400', '500', '600', '700', '800'],
})

// Mono font - Geist Mono (clean, for code blocks)
// Used for code and technical content
const fontMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: "Scarf Store - Premium Scarves & Accessories",
  description: "Discover our collection of premium scarves and accessories",
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="pt-BR" 
      className={`${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Font preload for better performance */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#b45309" />
      </head>
      <body className="bg-amber-100 text-gray-900 font-sans">
        <ErrorBoundary>
          <CacheProvider>
            {children}
          </CacheProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
