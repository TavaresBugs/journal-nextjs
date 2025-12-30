import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ToastProvider } from "@/providers/ToastProvider";
import { ClientProviders } from "@/components/layout/ClientProviders";
import { SkipLinks } from "@/components/accessibility";
import { LazyAnalytics } from "@/components/analytics/LazyAnalytics";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Trading Journal Pro",
  description: "Gerenciador profissional de trades multi-contas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Preconnect to third-party origins for faster resource loading */}
        <link rel="preconnect" href="https://va.vercel-scripts.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://va.vercel-scripts.com" />
        <link rel="preconnect" href="https://vercel.live" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://vercel.live" />
        {/* Preconnect to Supabase if using authentication */}
        <link rel="preconnect" href="https://supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://supabase.co" />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <SkipLinks />
        {/* <AxeAccessibility /> - Removed for performance (1.2s blocking task) */}
        <ToastProvider>
          <main id="main-content" tabIndex={-1} className="outline-none">
            <ClientProviders>{children}</ClientProviders>
          </main>
        </ToastProvider>
        {/* Analytics lazy-loaded after hydration to avoid blocking LCP */}
        <LazyAnalytics />
      </body>
    </html>
  );
}
