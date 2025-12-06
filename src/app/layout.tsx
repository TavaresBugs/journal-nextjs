import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Journal Pro",
  description: "Gerenciador profissional de trades multi-contas",
};

import { ToastProvider } from "@/contexts/ToastContext";
import { ClientProviders } from "@/components/layout/ClientProviders";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ToastProvider>
          <ClientProviders>
            {children}
          </ClientProviders>
        </ToastProvider>
      </body>
    </html>
  );
}

