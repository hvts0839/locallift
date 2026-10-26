import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist } from "next/font/google";
import { Sidebar, MobileBar } from "@/components/sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LocalLift AI",
  description:
    "Turn a local offer into a campaign in 60 seconds. Affordable AI marketing for local businesses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <div className="flex min-h-full flex-col md:flex-row">
          <Suspense fallback={<div className="hidden w-60 shrink-0 md:block" />}>
            <Sidebar />
          </Suspense>
          <Suspense fallback={<div className="sticky top-0 h-12 bg-surface/75 md:hidden" />}>
            <MobileBar />
          </Suspense>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
