import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

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

import { ToastProvider } from "@/providers/ToastProvider";
import { ClientProviders } from "@/components/layout/ClientProviders";
import { SkipLinks } from "@/components/accessibility";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning={true}>
        <SkipLinks />
        {/* <AxeAccessibility /> - Removed for performance (1.2s blocking task) */}
        <ToastProvider>
          <main id="main-content" tabIndex={-1} className="outline-none">
            <ClientProviders>{children}</ClientProviders>
          </main>
        </ToastProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
