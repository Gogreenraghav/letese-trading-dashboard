import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LETESE — Advocate Suite | AI-Powered Legal Management for Indian Advocates',
  description: 'LETESE is India\'s #1 AI legal tech platform. Manage cases, draft legal documents with AI, track court judgments 24/7, and automate client communication. Built for advocates by advocates.',
  keywords: 'legal tech, case management, AI legal drafting, Indian courts, advocates, high court, supreme court, legal software',
  openGraph: {
    title: 'LETESE — Advocate Suite',
    description: 'AI-powered legal management for Indian advocates. Win more cases with intelligent automation.',
    type: 'website',
    locale: 'en_IN',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%235070E0' rx='20' width='100' height='100'/><text y='.9em' font-size='70' x='15' fill='white'>⚖</text></svg>"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  )
}
