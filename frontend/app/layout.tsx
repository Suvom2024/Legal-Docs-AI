"use client"

import type React from "react"
import { useState } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { Scale, Upload, MessageSquare, FileText } from "lucide-react"
import "./globals.css"

const geistSans = Geist({ 
  subsets: ["latin"],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono',
})

function Navigation({ onUserGuideClick }: { onUserGuideClick: () => void }) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b-2 border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex h-18 items-center justify-between">
          <Link href="/" className="flex items-center space-x-4 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 transition-all group-hover:scale-105 group-hover:shadow-lg shadow-md ring-2 ring-primary/20">
              <Scale className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-foreground">LegalDocs AI</span>
              <span className="text-xs text-muted-foreground font-semibold">Professional Document Management</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-2">
            <Link
              href="/upload"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg text-base font-semibold text-foreground/80 hover:text-foreground hover:bg-accent transition-all"
            >
              <Upload className="h-5 w-5" />
              <span>Upload</span>
            </Link>
            <Link
              href="/chat"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg text-base font-semibold text-foreground/80 hover:text-foreground hover:bg-accent transition-all"
            >
              <MessageSquare className="h-5 w-5" />
              <span>Draft</span>
            </Link>
            <Link
              href="/templates"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg text-base font-semibold text-foreground/80 hover:text-foreground hover:bg-accent transition-all"
            >
              <FileText className="h-5 w-5" />
              <span>Templates</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [showUserGuide, setShowUserGuide] = useState(false)

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <title>LegalDocs AI | Professional Legal Document Management</title>
        <meta name="description" content="AI-powered legal document templating and drafting platform for professionals" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen`}>
            <Navigation onUserGuideClick={() => setShowUserGuide(true)} />
            <main className="min-h-[calc(100vh-4.5rem)]">
              {children}
            </main>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
