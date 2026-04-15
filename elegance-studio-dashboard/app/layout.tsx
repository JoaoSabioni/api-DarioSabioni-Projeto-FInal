import type { Metadata } from 'next'
import React from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dashboard | Elegance Studio',
  description: 'Gestão de marcações — Elegance Studio Barbearia',
  icons: { icon: '/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="antialiased bg-black">{children}</body>
    </html>
  )
}