"use client"

import { useState } from "react"
import { UploadZone } from "@/components/upload-zone"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, CheckCircle2, FileText } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function UploadPage() {
  const [uploadedDoc, setUploadedDoc] = useState<any>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionResult, setExtractionResult] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const { toast } = useToast()

  const handleUploadSuccess = (data: any) => {
    setUploadedDoc(data)
    setTitle("")
    setDescription("")
    setExtractionResult(null)
  }

  const handleExtract = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the template",
        variant: "destructive",
      })
      return
    }

    setIsExtracting(true)
    try {
      const result = await apiClient.extractTemplate(uploadedDoc.document_id, title, description)
      setExtractionResult(result)
      toast({
        title: "Extraction complete",
        description: result.message,
      })
    } catch (error) {
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!extractionResult) return

    setIsSaving(true)
    try {
      await apiClient.saveTemplate({
        template_id: extractionResult.template_id,
        title: extractionResult.title,
        file_description: description,
        doc_type: extractionResult.doc_type,
        jurisdiction: extractionResult.jurisdiction,
        similarity_tags: extractionResult.similarity_tags,
        body_md: extractionResult.template_markdown,
        variables: extractionResult.variables,
      })

      const tags = extractionResult.similarity_tags?.join(", ") || "No tags"
      
      toast({
        title: "✅ Template saved successfully!",
        description: `Template ID: ${extractionResult.template_id}\nTags: ${tags}`,
      })

      // Set saved template ID to show success state
      setSavedTemplateId(extractionResult.template_id)
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Upload Document</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Upload a legal document to extract variables and create a reusable template
            </p>
          </div>

          {!uploadedDoc && <UploadZone onUploadSuccess={handleUploadSuccess} />}

          {uploadedDoc && !extractionResult && (
            <Card className="p-8 space-y-6 border-2 border-border shadow-lg">
              <div className="flex items-center gap-3 px-4 py-3 bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 rounded-lg">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-semibold text-lg">Document uploaded successfully</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Template Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Notice to Insurer - Motor Accident"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of this template..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="bg-muted/50 border border-border p-6 rounded-lg">
                <h3 className="text-base font-semibold mb-3 text-foreground">Extracted Text Preview</h3>
                <div className="bg-card p-4 rounded-md border border-border max-h-48 overflow-y-auto">
                  <p className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-muted-foreground">{uploadedDoc.extracted_text}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setUploadedDoc(null)} size="lg">
                  Cancel
                </Button>
                <Button onClick={handleExtract} disabled={isExtracting} size="lg" className="min-w-[180px]">
                  {isExtracting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Extracting Variables...
                    </>
                  ) : (
                    "Extract Variables"
                  )}
                </Button>
              </div>
            </Card>
          )}

          {savedTemplateId && (
            <Card className="p-8 border-2 border-primary bg-primary/5 shadow-lg animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col items-center justify-center space-y-6 text-center py-8">
                <CheckCircle2 className="h-20 w-20 text-primary" />
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-primary">Template Saved Successfully!</h2>
                  <p className="text-lg text-muted-foreground">Your template has been added to the library.</p>
                  <p className="text-sm text-muted-foreground font-mono">Template ID: {savedTemplateId}</p>
                </div>
                <div className="flex gap-4 pt-4">
                  <Link href="/templates" passHref>
                    <Button size="lg" className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      View in Templates
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setSavedTemplateId(null)
                      setUploadedDoc(null)
                      setExtractionResult(null)
                      setTitle("")
                      setDescription("")
                    }}
                  >
                    Upload Another
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {extractionResult && !savedTemplateId && (
            <Card className="p-8 space-y-6 border-2 border-border shadow-lg">
              <div className="flex items-center gap-3 px-4 py-3 bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 rounded-lg">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-semibold text-lg">Variables extracted successfully</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-muted/50 border-2 border-border p-8 rounded-xl space-y-4 min-h-[380px] flex flex-col">
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      Template Information
                    </h3>
                    <div className="space-y-4 flex-grow">
                      <div className="bg-card p-4 rounded-lg border border-border min-h-[60px] flex flex-col justify-center">
                        <span className="text-xs text-muted-foreground font-medium block mb-2">Template ID</span>
                        <p className="font-mono text-sm font-semibold">{extractionResult.template_id}</p>
                      </div>
                      <div className="bg-card p-4 rounded-lg border border-border min-h-[60px] flex flex-col justify-center">
                        <span className="text-xs text-muted-foreground font-medium block mb-2">Document Type</span>
                        <p className="font-semibold text-base">{extractionResult.doc_type || "Unknown"}</p>
                      </div>
                      <div className="bg-card p-4 rounded-lg border border-border min-h-[60px] flex flex-col justify-center">
                        <span className="text-xs text-muted-foreground font-medium block mb-2">Jurisdiction</span>
                        <p className="font-semibold text-base">{extractionResult.jurisdiction || "Unknown"}</p>
                      </div>
                      <div className="bg-card p-4 rounded-lg border border-border min-h-[60px] flex flex-col justify-center">
                        <span className="text-xs text-muted-foreground font-medium block mb-2">Variables Found</span>
                        <p className="text-3xl font-bold text-primary">{extractionResult.variables.length}</p>
                      </div>
                    </div>
                  </div>

                  {extractionResult.similarity_tags.length > 0 && (
                    <div className="bg-muted/50 border-2 border-border p-8 rounded-xl">
                      <h3 className="text-base font-bold mb-4">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {extractionResult.similarity_tags.map((tag: string) => (
                          <span key={tag} className="px-4 py-2 bg-primary/10 text-primary text-sm rounded-lg border border-primary/20 font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-muted/50 border-2 border-border p-8 rounded-xl min-h-[380px] flex flex-col">
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    Extracted Variables
                  </h3>
                  <div className="border-2 border-border rounded-xl overflow-hidden bg-card flex-grow">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0 border-b-2 border-border">
                          <tr>
                            <th className="text-left p-4 font-bold">Key</th>
                            <th className="text-left p-4 font-bold">Label</th>
                            <th className="text-left p-4 font-bold">Required</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {extractionResult.variables.map((variable: any, index: number) => (
                            <tr key={index} className="hover:bg-muted/30 transition-colors">
                              <td className="p-4 font-mono text-xs font-medium">{variable.key}</td>
                              <td className="p-4 font-medium">{variable.label}</td>
                              <td className="p-4">
                                <span className={`px-3 py-1.5 rounded-md text-xs font-bold ${
                                  variable.required 
                                    ? 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20' 
                                    : 'bg-muted text-muted-foreground border border-border'
                                }`}>
                                  {variable.required ? "Required" : "Optional"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setExtractionResult(null)} size="lg">
                  Back
                </Button>
                <Button onClick={handleSaveTemplate} disabled={isSaving} size="lg" className="min-w-[180px]">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving Template...
                    </>
                  ) : (
                    "Save Template"
                  )}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
