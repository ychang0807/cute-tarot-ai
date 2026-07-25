import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "可愛塔羅AI｜免費線上塔羅占卜",
  description: "免費從完整 78 張塔羅牌中親手選出過去、現在與未來，獲得 AI 個人化塔羅解讀。",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "可愛塔羅AI｜免費線上塔羅占卜",
    description: "讓 AI 與塔羅牌回應你的心",
    images: [{ url: "/og-tarot-ai.png", width: 1672, height: 941, alt: "可愛塔羅AI，小巫師與水晶球" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "可愛塔羅AI｜免費線上塔羅占卜",
    description: "讓 AI 與塔羅牌回應你的心",
    images: ["/og-tarot-ai.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
