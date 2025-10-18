"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, Upload, MessageSquare } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const data = await apiClient.listTemplates()
      setTemplates(data)
    } catch (error) {
      toast({
        title: "Failed to load templates",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-10 max-w-[1600px]">
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">Templates Library</h1>
            <p className="text-base text-muted-foreground">
              Browse and manage your saved legal document templates
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
              <p className="text-lg text-muted-foreground font-semibold">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <Card className="p-20 text-center border-2 border-dashed border-border shadow-lg">
              <div className="max-w-lg mx-auto space-y-8">
                <div className="h-28 w-28 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-14 w-14 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold">No templates yet</h3>
                  <p className="text-lg text-muted-foreground">
                    Get started by uploading your first legal document to create a reusable template
                  </p>
                </div>
                <Link href="/upload">
                  <Button size="lg" className="mt-6 h-14 px-10 text-lg font-semibold">
                    <Upload className="mr-2 h-6 w-6" />
                    Upload Your First Document
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="group relative overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl transition-all group-hover:bg-primary/10" />
                  <div className="relative p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                      <div className="flex-1 space-y-6">
                        <div className="flex items-start gap-6">
                          <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/20 shadow-sm flex-shrink-0">
                            <FileText className="h-10 w-10 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-3xl font-bold mb-3 group-hover:text-primary transition-colors">{template.title}</h3>
                            {template.file_description && (
                              <p className="text-muted-foreground text-lg leading-relaxed">{template.file_description}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-muted/50 p-5 rounded-lg border-2 border-border">
                            <span className="text-sm text-muted-foreground font-bold block mb-2">Template ID</span>
                            <p className="font-mono text-sm font-semibold truncate">{template.template_id}</p>
                          </div>
                          <div className="bg-muted/50 p-5 rounded-lg border-2 border-border">
                            <span className="text-sm text-muted-foreground font-bold block mb-2">Document Type</span>
                            <p className="font-bold text-base">{template.doc_type || "Unknown"}</p>
                          </div>
                          <div className="bg-muted/50 p-5 rounded-lg border-2 border-border">
                            <span className="text-sm text-muted-foreground font-bold block mb-2">Jurisdiction</span>
                            <p className="font-bold text-base">{template.jurisdiction || "Unknown"}</p>
                          </div>
                          <div className="bg-muted/50 p-5 rounded-lg border-2 border-border">
                            <span className="text-sm text-muted-foreground font-bold block mb-2">Created</span>
                            <p className="font-bold text-base">{new Date(template.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {template.similarity_tags && template.similarity_tags.length > 0 && (
                          <div className="flex flex-wrap gap-3">
                            {template.similarity_tags.map((tag: string) => (
                              <span key={tag} className="px-5 py-2.5 bg-primary/10 text-primary text-base rounded-lg border-2 border-primary/20 font-bold">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex lg:flex-col gap-4 lg:min-w-[220px]">
                        <Link href={`/templates/${template.template_id}`} className="flex-1 lg:flex-none">
                          <Button variant="outline" size="lg" className="w-full h-14 whitespace-nowrap group-hover:border-primary/50 transition-colors text-lg font-semibold">
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/chat?template_id=${template.template_id}`} className="flex-1 lg:flex-none">
                          <Button size="lg" className="w-full h-14 whitespace-nowrap text-lg font-semibold shadow-md hover:shadow-lg transition-shadow">
                            <MessageSquare className="mr-2 h-6 w-6" />
                            Use Template
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
