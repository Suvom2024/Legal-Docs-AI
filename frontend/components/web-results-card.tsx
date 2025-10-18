"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Globe, Loader2 } from "lucide-react"
import { useState } from "react"

interface WebResult {
  id: string
  title: string
  url: string
  snippet: string
}

interface WebResultsCardProps {
  results: WebResult[]
  onBootstrap: (documentId: string, url: string, title: string) => void
}

export function WebResultsCard({ results, onBootstrap }: WebResultsCardProps) {
  const [bootstrapping, setBootstrapping] = useState<string | null>(null)

  const handleBootstrap = async (result: WebResult) => {
    setBootstrapping(result.id)
    try {
      await onBootstrap(result.id, result.url, result.title)
    } finally {
      setBootstrapping(null)
    }
  }

  return (
    <Card className="p-6 border-2 border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary border border-primary/20 rounded-lg">
          <Globe className="h-6 w-6" />
          <span className="font-bold text-lg">Found {results.length} Similar Documents Online</span>
        </div>

        <p className="text-muted-foreground">
          No local template found, but I found similar documents on the web. Click "Create Template" to automatically
          import and continue drafting.
        </p>

        <div className="space-y-3">
          {results.map((result) => (
            <div
              key={result.id}
              className="p-5 rounded-lg border-2 border-border hover:border-primary/50 bg-card transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{result.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{result.snippet}</p>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline break-all"
                  >
                    {result.url}
                  </a>
                </div>
                <Button
                  onClick={() => handleBootstrap(result)}
                  disabled={bootstrapping !== null}
                  size="lg"
                  className="flex-shrink-0"
                >
                  {bootstrapping === result.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Template"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> The system will fetch the document, extract variables using AI, and create a
            template automatically. This may take 30-60 seconds.
          </p>
        </div>
      </div>
    </Card>
  )
}

