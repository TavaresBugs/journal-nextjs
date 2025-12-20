import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Journal Pro",
  description: "Gerenciador profissional de trades multi-contas",
};

import { ToastProvider } from "@/providers/ToastProvider";
import { ClientProviders } from "@/components/layout/ClientProviders";
import { AxeAccessibility, SkipLinks } from "@/components/accessibility";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <SkipLinks />
        <AxeAccessibility />
        <ToastProvider>
          <ClientProviders>{children}</ClientProviders>
        </ToastProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
