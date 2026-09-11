import type { Metadata } from "next";

import { ThemeProvider } from "@/components/providers/theme-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cost Track",
    template: "%s · Cost Track",
  },
  description: "Asisten keuangan pribadi yang cepat, aman, dan nyaman di ponsel.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
