import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LETESE● — Legal Practice Management, Reimagined',
  description: 'Track cases. Automate reminders. Draft faster. Win more. The AI-powered legal practice management SaaS for Indian law firms.',
  keywords: 'legal practice management, court case tracker, AI legal drafting, law firm software, India legal tech',
  openGraph: {
    title: 'LETESE● — Legal Practice Management, Reimagined',
    description: 'Track cases. Automate reminders. Draft faster. Win more.',
    url: 'https://letese.xyz',
    siteName: 'LETESE',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.className} bg-bg-dark text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
