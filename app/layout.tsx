import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { BackgroundBlobs } from "@/components/ui/BackgroundBlobs";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "BINGO — Multiplayer Game",
  description: "Real-time multiplayer Bingo with friends",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-poppins antialiased relative min-h-screen`}>
        <BackgroundBlobs />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
