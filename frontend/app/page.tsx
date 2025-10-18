"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, MessageSquare, FileText, Sparkles } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-accent/5 border-b border-border/40">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))] dark:bg-grid-slate-700/25" />
        <div className="container relative mx-auto px-6 sm:px-8 lg:px-12 py-24 md:py-36">
          <div className="max-w-5xl mx-auto text-center space-y-10">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary border-2 border-primary/20 text-base font-semibold mb-6">
              <Sparkles className="h-5 w-5" />
              <span>AI-Powered Legal Document Management</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              Professional Legal
              <span className="block text-primary mt-3">Document Templating</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
              Transform your legal workflows with intelligent document templating. 
              Upload, extract, and generate professional legal documents with AI-powered precision.
            </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center pt-8">
            <Link href="/upload">
              <Button size="lg" className="text-lg px-10 h-14 shadow-lg hover:shadow-xl transition-all font-semibold">
                <Upload className="mr-2 h-6 w-6" />
                Get Started
              </Button>
            </Link>
            <Link href="/templates">
              <Button size="lg" variant="outline" className="text-lg px-10 h-14 font-semibold">
                <FileText className="mr-2 h-6 w-6" />
                Browse Templates
              </Button>
            </Link>
          </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything You Need</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium">
                A complete solution for professional legal document management
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="group relative overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl transition-all group-hover:bg-primary/10" />
                <div className="relative p-8 flex flex-col h-full">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/20 shadow-sm">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mt-6 mb-4">Upload Documents</h3>
                  <p className="text-muted-foreground leading-relaxed text-base mb-6 flex-grow font-medium">
                    Upload DOCX or PDF legal documents. Our AI automatically extracts variables and creates reusable templates with precision.
                  </p>
                  <Link href="/upload" className="mt-auto">
                    <Button className="w-full h-12 text-base font-semibold group-hover:shadow-md transition-shadow">
                      <Upload className="mr-2 h-5 w-5" />
                      Upload Document
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card className="group relative overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl transition-all group-hover:bg-primary/10" />
                <div className="relative p-8 flex flex-col h-full">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/20 shadow-sm">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mt-6 mb-4">Draft Documents</h3>
                  <p className="text-muted-foreground leading-relaxed text-base mb-6 flex-grow font-medium">
                    Use our AI-powered chat interface to match templates and generate new legal drafts through intelligent Q&A.
                  </p>
                  <Link href="/chat" className="mt-auto">
                    <Button variant="outline" className="w-full h-12 text-base font-semibold group-hover:shadow-md transition-shadow hover:bg-accent">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Start Drafting
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card className="group relative overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl transition-all group-hover:bg-primary/10" />
                <div className="relative p-8 flex flex-col h-full">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/20 shadow-sm">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mt-6 mb-4">Manage Templates</h3>
                  <p className="text-muted-foreground leading-relaxed text-base mb-6 flex-grow font-medium">
                    Browse, search, and manage your saved templates. Access all extracted variables and metadata instantly.
                  </p>
                  <Link href="/templates" className="mt-auto">
                    <Button variant="outline" className="w-full h-12 text-base font-semibold group-hover:shadow-md transition-shadow hover:bg-accent">
                      <FileText className="mr-2 h-5 w-5" />
                      View Templates
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
