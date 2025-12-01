import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { InstantDBProvider } from "@/lib/instantdb-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Meme Generator | Create Memes Instantly",
  description: "Create and share memes with the community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <InstantDBProvider>{children}</InstantDBProvider>
      </body>
    </html>
  );
}



