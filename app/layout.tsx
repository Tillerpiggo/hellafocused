import type React from "react"
import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"
import "./styles/themes/base.css"
import "./styles/themes/pink-zen.css"
import "./styles/themes/ocean-blue.css"
import "./styles/themes/rose-quartz.css"
import "./styles/themes/sunset-ember.css"
import "./styles/themes/electric-violet.css"
import "./styles/themes/emerald-forest.css"
import "./styles/themes/golden-hour.css"
import "./styles/themes/cyber-teal.css"
import "./styles/themes/coral-reef.css"
// import "react-day-picker/style.css" // Will add due dates later
import { cn } from "@/lib/utils"
import { ThemeProvider } from "next-themes"

const fontSans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "hellafocused.com",
  description: "A to-do app that tells you what to do.",
  icons: {
    icon: "/hellafocused_favicon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="pink-zen">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('color-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
