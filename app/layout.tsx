import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "毒親ライブラリ｜行動パターンを、ここで止める",
  description: "家庭内・親子関係で起こる有害な行動パターンを、背景・影響・境界線・代替行動とともに整理するライブラリです。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
