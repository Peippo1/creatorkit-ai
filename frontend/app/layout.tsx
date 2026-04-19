import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google"

import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "CreatorKit AI",
  description: "Score creator drafts before publishing with fast critique and suggestions.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
        {children}
        <footer className="site-footer" aria-label="Site footer">
          <div className="site-footer__inner">
            <p className="site-footer__copy">CreatorKit AI helps creators improve drafts before publishing.</p>
            <nav className="site-footer__nav" aria-label="Legal">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
            </nav>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
