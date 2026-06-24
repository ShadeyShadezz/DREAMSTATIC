import './globals.css'
import type { Metadata } from 'next'
import { Inter, IBM_Plex_Mono } from 'next/font/google'
import ClientLayout from './_components/ClientLayout'
import AppHeader from './_components/AppHeader'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-family-body',
})

const ibmMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Dreamstatic404 - Vibe Room Builder',
  description: 'Create dream rooms by combining color palettes, music snippets, and mood images',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const themeBootstrap = `
    (function () {
      try {
        var raw = localStorage.getItem('app.preferences');
        var parsed = raw ? JSON.parse(raw) : null;
        var stored = parsed && parsed.theme ? parsed.theme : localStorage.getItem('theme');
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
        var root = document.documentElement;
        root.setAttribute('data-theme', theme);
        root.classList.toggle('dark', theme === 'dark');
        root.style.colorScheme = theme;
        var reduceMotion = !!(parsed && parsed.reduceMotion);
        root.setAttribute('data-motion', reduceMotion ? 'reduce' : 'full');
      } catch (e) {}
    })();
  `

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className={`${inter.variable} ${ibmMono.variable}`}>
        <div className="scanlines"></div>
        <AppHeader />

        <main>
          <ClientLayout>
            {children}
          </ClientLayout>
        </main>
      </body>
    </html>
  )
}

