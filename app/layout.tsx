import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maths Quest",
  description: "A maths game for kids aged 5 to 11, with player profiles and a leaderboard saved in your browser.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6FAFF" },
    { media: "(prefers-color-scheme: dark)", color: "#121a2e" },
  ],
};

// Runs before first paint so a saved light/dark choice doesn't flash the wrong theme.
// Uses the last player's settings (see lib/storage.ts `scoped`), or the guest's.
const themeScript = `try{var c=JSON.parse(localStorage.getItem("mq_current")||"null"),t=JSON.parse(localStorage.getItem(c?"mq_p_"+c+"_settings":"mq_settings")||"{}").theme;if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@500;700;800&display=swap"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
