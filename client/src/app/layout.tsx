import React from 'react';
import Sidebar from '@/components/layout/sidebar'
import MobileNav from '@/components/layout/mobile-nav'
import Footer from '@/components/footer'
import Header from '@/components/header'
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talenvo - Affordable Healthcare",
  description: "Easily locate providers, view services, and schedule your next visit with confidence",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <Header />
        <div className="flex min-h-screen pt-0">
          <Sidebar />
          <div className="flex-1 flex flex-col pb-16 lg:pb-0">
            {children}
            <Footer />
          </div>
        </div>
        <MobileNav />
      </body>
    </html>
  )
}