import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "EduNova | Centralized Education Management System",
  description: "Futuristic AI-powered centralized education operating system for Adani Foundation - Monitor timetables, attendance, and performance across 40+ schools.",
  keywords: ["education", "school management", "timetable", "attendance", "Adani Foundation", "EduNova"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
