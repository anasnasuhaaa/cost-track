import type { Metadata } from "next";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cost Track",
    template: "%s · Cost Track",
  },
  description: "Asisten keuangan pribadi yang cepat, aman, dan nyaman di ponsel.",
  icons: [{ rel: "icon", url: "/icon.svg", type: "image/svg+xml" }],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <a className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:translate-y-0" href="#main-content">Lewati ke konten utama</a>
        <ThemeProvider>
          {children}
          <Toaster richColors closeButton position="top-right" duration={2000} />
        </ThemeProvider>
      </body>
    </html>
  );
}
