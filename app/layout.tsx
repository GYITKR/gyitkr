import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LIM GAYEON — Design Portfolio",
  description: "상세페이지 · 커머스 비주얼 디자인",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
