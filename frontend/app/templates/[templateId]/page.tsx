"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function TemplateDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [template, setTemplate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTemplate()
  }, [params.templateId])

  const loadTemplate = async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.getTemplate(params.templateId as string)
      setTemplate(data)
    } catch (error) {
      toast({
        title: "Error loading template",
        description: error instanceof Error ? error.message : "Failed to load template",
        variant: "destructive",
      })
      router.push("/templates")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Link href="/templates">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Templates
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">{template.title}</h1>
                <p className="text-muted-foreground mt-1">Template ID: {template.template_id}</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Template Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-muted-foreground">Document Type</dt>
                  <dd className="text-base font-semibold">{template.doc_type || "Unknown"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Jurisdiction</dt>
                  <dd className="text-base font-semibold">{template.jurisdiction || "Unknown"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Created</dt>
                  <dd className="text-base font-semibold">
                    {new Date(template.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Variables</dt>
                  <dd className="text-base font-semibold">{template.variables?.length || 0}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Similarity Tags</h2>
              <div className="flex flex-wrap gap-2">
                {template.similarity_tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              {template.file_description && (
                <div className="mt-4">
                  <dt className="text-sm text-muted-foreground mb-2">Description</dt>
                  <dd className="text-sm">{template.file_description}</dd>
                </div>
              )}
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Variables ({template.variables?.length || 0})</h2>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-bold">Key</th>
                    <th className="text-left p-4 font-bold">Label</th>
                    <th className="text-left p-4 font-bold">Type</th>
                    <th className="text-left p-4 font-bold">Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {template.variables?.map((variable: any, index: number) => (
                    <tr key={index} className="hover:bg-muted/30">
                      <td className="p-4 font-mono text-xs">{variable.key}</td>
                      <td className="p-4">{variable.label}</td>
                      <td className="p-4">
                        <Badge variant="outline">{variable.dtype || "string"}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={variable.required ? "default" : "secondary"}>
                          {variable.required ? "Required" : "Optional"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Template Content Preview</h2>
            <div className="bg-muted/30 p-6 rounded-lg border max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">{template.body_md}</pre>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href={`/chat?template=${template.template_id}`}>
              <Button size="lg">
                <FileText className="mr-2 h-4 w-4" />
                Use This Template
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

