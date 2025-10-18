"use client"

import { useState } from "react"
import { UploadZone } from "@/components/upload-zone"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CheckCircle2, FileText, Upload, ArrowRight } from "lucide-react"
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
      const result: any = await apiClient.extractTemplate(uploadedDoc.document_id, title, description)
      setExtractionResult(result)
      toast({
        title: "Extraction complete",
        description: result.message || "Variables extracted successfully",
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

  const handleReset = () => {
    setSavedTemplateId(null)
    setUploadedDoc(null)
    setExtractionResult(null)
    setTitle("")
    setDescription("")
  }

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-10 max-w-[1600px]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Upload Document</h1>
          <p className="text-base text-muted-foreground mt-2">
            Upload a legal document to extract variables and create a reusable template
          </p>
        </div>

        {/* Success State - Template Saved */}
        {savedTemplateId && (
          <Card className="p-12 border-2 border-primary bg-primary/5 shadow-lg animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col items-center justify-center space-y-6 text-center py-8">
              <CheckCircle2 className="h-20 w-20 text-primary" />
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-primary">Template Saved Successfully!</h2>
                <p className="text-base text-muted-foreground">Your template has been added to the library.</p>
                <p className="text-sm text-muted-foreground font-mono mt-3 bg-background/50 px-4 py-2 rounded-lg inline-block">
                  Template ID: {savedTemplateId}
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <Link href="/templates" passHref>
                  <Button size="lg" className="flex items-center gap-2 h-12 px-8 text-base">
                    <FileText className="h-5 w-5" />
                    View in Templates
                  </Button>
                </Link>
                <Button variant="outline" size="lg" onClick={handleReset} className="h-12 px-8 text-base">
                  Upload Another
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Initial Upload State */}
        {!uploadedDoc && !savedTemplateId && (
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="w-full max-w-4xl">
              <UploadZone onUploadSuccess={handleUploadSuccess} />
            </div>
          </div>
        )}

            {/* Two Column Layout - After Upload - 50/50 Split */}
            {uploadedDoc && !savedTemplateId && (
              <div className="grid lg:grid-cols-2 gap-6 animate-in fade-in duration-500 h-[calc(100vh-16rem)]">
                {/* Left Column - Content Preview / Extracted Variables (50%) */}
                <Card className="border-2 border-border shadow-sm flex flex-col overflow-hidden">
                  <div className="p-8 flex flex-col h-full">
                  {!extractionResult && (
                    <div className="space-y-6 flex flex-col h-full">
                      <div className="flex items-center gap-3 pb-5 border-b-2 border-border">
                        <CheckCircle2 className="h-7 w-7 text-[var(--success)]" />
                        <h3 className="font-bold text-2xl">Document Uploaded</h3>
                      </div>
                      <div className="flex-1 flex flex-col min-h-0">
                        <h4 className="text-lg font-bold mb-4 text-foreground">Extracted Text Preview</h4>
                        <div className="bg-muted/50 border-2 border-border p-6 rounded-lg flex-1 overflow-y-auto">
                          <p className="text-base font-mono whitespace-pre-wrap leading-relaxed text-foreground/90">
                            {uploadedDoc.extracted_text}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {extractionResult && (
                    <div className="space-y-6 flex flex-col h-full animate-in slide-in-from-left duration-500">
                      <div className="flex items-center gap-3 pb-5 border-b-2 border-border">
                        <CheckCircle2 className="h-7 w-7 text-[var(--success)]" />
                        <h3 className="font-bold text-2xl">Extracted Variables</h3>
                      </div>

                      <div className="border-2 border-border rounded-lg overflow-hidden bg-card flex-1 flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                          <table className="w-full">
                            <thead className="bg-muted sticky top-0 border-b-2 border-border z-10">
                              <tr>
                                <th className="text-left p-5 font-bold text-base">Key</th>
                                <th className="text-left p-5 font-bold text-base">Label</th>
                                <th className="text-left p-5 font-bold text-base">Required</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {extractionResult.variables.map((variable: any, index: number) => (
                                <tr key={index} className="hover:bg-muted/30 transition-colors">
                                  <td className="p-5 font-mono text-sm font-semibold text-foreground/90">{variable.key}</td>
                                  <td className="p-5 text-base font-medium text-foreground">{variable.label}</td>
                                  <td className="p-5">
                                    <span className={`px-4 py-2 rounded-md text-sm font-bold ${
                                      variable.required
                                        ? 'bg-[var(--warning)]/10 text-[var(--warning)] border-2 border-[var(--warning)]/20'
                                        : 'bg-muted text-muted-foreground border-2 border-border'
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
                  )}
                  </div>
                </Card>

                {/* Right Column - Form & Actions (50%) */}
                <Card className="border-2 border-border shadow-sm flex flex-col overflow-hidden">
                  <div className="p-8 flex flex-col h-full">
                  {!extractionResult && (
                    <div className="space-y-6 flex flex-col h-full">
                      <div className="pb-5 border-b-2 border-border">
                        <h3 className="font-bold text-2xl">Template Details</h3>
                      </div>

                      <div className="space-y-6 flex-1">
                        <div className="space-y-3">
                          <Label htmlFor="title" className="text-lg font-bold">Template Title *</Label>
                          <Input
                            id="title"
                            placeholder="e.g., Notice to Insurer - Motor Accident"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-12 text-base"
                          />
                        </div>

                        <div className="space-y-3 flex-1 flex flex-col">
                          <Label htmlFor="description" className="text-lg font-bold">Description (Optional)</Label>
                          <Textarea
                            id="description"
                            placeholder="Brief description of this template..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="resize-none text-base flex-1"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 pt-6 border-t-2 border-border mt-auto">
                        <Button variant="outline" onClick={() => setUploadedDoc(null)} className="flex-1 h-14 text-lg font-semibold">
                          Cancel
                        </Button>
                        <Button onClick={handleExtract} disabled={isExtracting} className="flex-1 h-14 text-lg font-semibold">
                          {isExtracting ? (
                            <>
                              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                              Extracting...
                            </>
                          ) : (
                            <>
                              Extract Variables
                              <ArrowRight className="ml-2 h-6 w-6" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {extractionResult && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-500 flex flex-col h-full">
                      <div className="space-y-6 flex flex-col flex-1 min-h-0">
                        <div className="pb-5 border-b-2 border-border">
                          <h3 className="font-bold text-2xl flex items-center gap-3">
                            <FileText className="h-7 w-7 text-primary" />
                            Template Information
                          </h3>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto min-h-0">
                          <div className="bg-muted/50 p-5 rounded-lg border-2 border-border">
                            <span className="text-sm text-muted-foreground font-bold block mb-2">Template ID</span>
                            <p className="font-mono text-base font-bold">{extractionResult.template_id}</p>
                          </div>
                          <div className="bg-muted/50 p-5 rounded-lg border-2 border-border">
                            <span className="text-sm text-muted-foreground font-bold block mb-2">Document Type</span>
                            <p className="font-bold text-lg">{extractionResult.doc_type || "Unknown"}</p>
                          </div>
                          <div className="bg-muted/50 p-5 rounded-lg border-2 border-border">
                            <span className="text-sm text-muted-foreground font-bold block mb-2">Jurisdiction</span>
                            <p className="font-bold text-lg">{extractionResult.jurisdiction || "Unknown"}</p>
                          </div>
                          <div className="bg-muted/50 p-5 rounded-lg border-2 border-border">
                            <span className="text-sm text-muted-foreground font-bold block mb-2">Variables Found</span>
                            <p className="text-4xl font-bold text-primary">{extractionResult.variables.length}</p>
                          </div>

                          {extractionResult.similarity_tags.length > 0 && (
                            <div className="bg-muted/50 p-5 rounded-lg border-2 border-border">
                              <h4 className="text-sm text-muted-foreground font-bold block mb-3">Tags</h4>
                              <div className="flex flex-wrap gap-3">
                                {extractionResult.similarity_tags.map((tag: string) => (
                                  <span key={tag} className="px-5 py-2.5 bg-primary/10 text-primary text-base rounded-lg border-2 border-primary/20 font-bold">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4 pt-6 border-t-2 border-border">
                        <Button variant="outline" onClick={() => setExtractionResult(null)} className="flex-1 h-14 text-lg font-semibold">
                          Back
                        </Button>
                        <Button onClick={handleSaveTemplate} disabled={isSaving} className="flex-1 h-14 text-lg font-semibold">
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Template"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  </div>
                </Card>
          </div>
        )}
      </div>
    </div>
  )
}
