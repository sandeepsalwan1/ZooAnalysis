import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'AnimalCare',
  description: 'AI-driven animal behavior and health narratives',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-100 antialiased">{children}</body>
    </html>
  )
}

