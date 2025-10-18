"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Download, FileText, CheckCircle2, Edit, RefreshCw } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import { useState } from "react"

interface DraftCardProps {
  instanceId: string
  draftMarkdown: string
  draftNumber: number
  onEdit?: () => void
  onRegenerate?: (newDraft: string) => void
}

export function DraftCard({ instanceId, draftMarkdown, draftNumber, onEdit, onRegenerate }: DraftCardProps) {
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(draftMarkdown)
    toast({
      title: "Copied to clipboard",
      description: "Draft has been copied to your clipboard",
    })
  }

  const handleDownloadMd = () => {
    const blob = new Blob([draftMarkdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `draft_${draftNumber}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({
      title: "Downloaded",
      description: "Draft saved as Markdown file",
    })
  }

  const handleDownloadDocx = async () => {
    try {
      setIsDownloading(true)
      const blob = await apiClient.downloadDraftDocx(instanceId)

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `draft_${draftNumber}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Downloaded",
        description: "Draft saved as DOCX file",
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download DOCX",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true)
      const result = await apiClient.regenerateDraft(instanceId)

      toast({
        title: "Draft regenerated",
        description: result.message,
      })

      if (onRegenerate) {
        onRegenerate(result.draft_md)
      }
    } catch (error) {
      toast({
        title: "Regeneration failed",
        description: error instanceof Error ? error.message : "Failed to regenerate draft",
        variant: "destructive",
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <Card className="p-8 border-2 border-[var(--success)]/20 bg-[var(--success)]/5 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-4 py-3 bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 rounded-lg">
          <CheckCircle2 className="h-6 w-6" />
          <span className="font-bold text-lg">Draft Generated Successfully</span>
        </div>

        <div className="bg-card border-2 border-border rounded-xl p-8 max-h-[500px] overflow-y-auto shadow-inner">
          <div className="prose prose-base dark:prose-invert max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-ul:my-4 prose-ol:my-4">
            <ReactMarkdown>{draftMarkdown}</ReactMarkdown>
          </div>
        </div>

        <div className="border-t-2 border-border pt-6">
          <p className="text-sm text-muted-foreground mb-4 font-medium">Download or modify your draft:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Button onClick={handleCopy} variant="outline" size="lg" className="w-full">
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button onClick={handleDownloadMd} variant="outline" size="lg" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Markdown
            </Button>
            <Button onClick={handleDownloadDocx} variant="outline" size="lg" disabled={isDownloading} className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              {isDownloading ? "Loading..." : "DOCX"}
            </Button>
            {onEdit && (
              <Button onClick={onEdit} variant="outline" size="lg" className="w-full">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            <Button onClick={handleRegenerate} variant="outline" size="lg" disabled={isRegenerating} className="w-full">
              <RefreshCw className={`mr-2 h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
              {isRegenerating ? "Loading..." : "Regenerate"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
