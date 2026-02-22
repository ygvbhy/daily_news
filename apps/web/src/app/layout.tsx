import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily News Crawler",
  description: "키워드 기반 뉴스 수집 관리"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
