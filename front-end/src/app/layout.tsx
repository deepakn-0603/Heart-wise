import type { Metadata } from "next";
import { Inter } from "next/font/google";
// @ts-expect-error Next.js handles this stylesheet import at build time.
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "HeartWise - Heart Disease Prediction",
  description: "Input your medical data to predict your risk of heart disease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
