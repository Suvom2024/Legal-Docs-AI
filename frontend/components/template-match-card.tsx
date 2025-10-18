"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, FileText, ChevronDown } from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface TemplateMatchCardProps {
  templateId: string
  title: string
  confidence: number
  justification: string
  alternatives?: Array<{ template_id: string; title: string; doc_type: string }>
  onConfirm: () => void
  onSelectAlternative?: (templateId: string) => void
}

export function TemplateMatchCard({
  templateId,
  title,
  confidence,
  justification,
  alternatives = [],
  onConfirm,
  onSelectAlternative,
}: TemplateMatchCardProps) {
  const [showAlternatives, setShowAlternatives] = useState(false)

  return (
    <Card className="p-8 border-2 border-[var(--success)]/20 bg-[var(--success)]/5 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0 h-16 w-16 rounded-xl bg-gradient-to-br from-[var(--success)]/20 to-[var(--success)]/10 flex items-center justify-center ring-2 ring-[var(--success)]/20">
          <FileText className="h-8 w-8 text-[var(--success)]" />
        </div>
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-3 px-4 py-2 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg inline-flex">
              <CheckCircle2 className="h-6 w-6 text-[var(--success)]" />
              <span className="font-bold text-lg text-[var(--success)]">Template Matched</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 mt-4">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4 font-mono bg-muted/50 inline-block px-3 py-1.5 rounded border border-border">
              ID: {templateId}
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">Confidence Score</span>
                <span className="text-lg font-bold text-primary">{(confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden border border-border">
                  <div 
                    className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500 ease-out shadow-sm" 
                    style={{ width: `${confidence * 100}%` }} 
                  />
                </div>
              </div>
            </div>
            <p className="text-base leading-relaxed bg-card/50 p-4 rounded-lg border border-border">{justification}</p>
          </div>

          {alternatives.length > 0 && (
            <div className="pt-6 border-t-2 border-border">
              <div className="flex items-center justify-between mb-4">
                <p className="text-base font-bold">Alternative Templates</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAlternatives(!showAlternatives)}
                  className="hover:bg-muted/50"
                >
                  <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${showAlternatives ? "rotate-180" : ""}`} />
                </Button>
              </div>
              {showAlternatives && (
                <div className="space-y-3">
                  {alternatives.map((alt) => (
                    <div
                      key={alt.template_id}
                      className="flex items-center justify-between p-4 rounded-lg border-2 border-border hover:border-primary/50 bg-card cursor-pointer transition-all hover:shadow-md"
                      onClick={() => onSelectAlternative?.(alt.template_id)}
                    >
                      <div>
                        <div className="font-semibold mb-1">{alt.title}</div>
                        <div className="text-sm text-muted-foreground">{alt.doc_type}</div>
                      </div>
                      <Button variant="outline" size="sm">
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={onConfirm} size="lg" className="flex-1 shadow-md hover:shadow-lg transition-shadow">
              Use This Template
            </Button>
            {alternatives.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="lg" className="sm:min-w-[200px]">
                    See Alternatives
                    <ChevronDown className="ml-2 h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-2">
                  {alternatives.map((alt) => (
                    <DropdownMenuItem 
                      key={alt.template_id} 
                      onClick={() => onSelectAlternative?.(alt.template_id)}
                      className="p-4 cursor-pointer"
                    >
                      <div className="flex flex-col w-full">
                        <span className="font-semibold mb-1">{alt.title}</span>
                        <span className="text-sm text-muted-foreground">{alt.doc_type}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
