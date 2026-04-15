import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NSE-BSE Trading Bot — AI-Powered Stock Signals',
  description: 'Real-time BUY/SELL signals for NSE & BSE stocks. Built for Indian traders. Momentum, breakout & mean reversion strategies powered by AI.',
  keywords: 'NSE trading bot, BSE signals, Indian stock market, algo trading, trading signals',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📈</text></svg>" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
