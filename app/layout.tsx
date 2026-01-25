import type { Metadata } from "next";
import { GeistSans, GeistMono } from 'geist/font';
import "./globals.css";
import { BookingModalProvider } from "@/context/BookingModalProvider";
import { BookingModal } from "@/components/booking-modal";
import SidePanel from "@/components/SidePanel";
import { UserPresence } from '@/components/UserPresence';

export const metadata: Metadata = {
  title: "Body Reset | Персональный массаж",
  description: "Персональный массаж для тех, кто ценит тишину, качество и результат.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <BookingModalProvider>
          <UserPresence />
          <SidePanel />
          <div className="">
            {children}
          </div>
          <BookingModal />
        </BookingModalProvider>
      </body>
    </html>
  );
}
