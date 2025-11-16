import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crypto Evaluation Studio",
  description:
    "Immersive intelligence dashboard for diligence-ready token listings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[color:var(--color-bg-base)]">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[color:var(--color-bg-base)] text-[color:var(--color-text-primary)]`}
      >
        {children}
      </body>
    </html>
  );
}
