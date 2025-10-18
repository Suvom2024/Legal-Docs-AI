"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"

interface Question {
  variable_key: string
  question: string
  format_hint?: string
}

interface QuestionFormProps {
  questions: Question[]
  preFilled?: Record<string, any>
  onSubmit: (answers: Record<string, string>, strictReplace?: boolean) => void
  isSubmitting: boolean
}

export function QuestionForm({ questions, preFilled = {}, onSubmit, isSubmitting }: QuestionFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(preFilled)
  const [strictReplace, setStrictReplace] = useState(true)

  useEffect(() => {
    setAnswers(preFilled)
  }, [preFilled])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(answers, strictReplace)
  }

  const handleChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Card className="p-8 border-2 border-border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">?</span>
            </div>
            Answer These Questions
          </h3>
          <div className="space-y-6">
            {questions.map((q, index) => (
              <div key={q.variable_key} className="space-y-3 p-5 rounded-lg bg-muted/30 border border-border">
                <Label htmlFor={q.variable_key} className="text-base font-semibold flex items-start gap-2">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="flex-1">{q.question}</span>
                </Label>
                {q.format_hint && (
                  <p className="text-sm text-muted-foreground ml-8 bg-card/50 px-3 py-2 rounded border border-border">
                    💡 {q.format_hint}
                  </p>
                )}
                <Input
                  id={q.variable_key}
                  value={answers[q.variable_key] || ""}
                  onChange={(e) => handleChange(q.variable_key, e.target.value)}
                  placeholder="Your answer..."
                  required
                  className="ml-8 h-11 text-base border-2 max-w-full"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t-2 border-border pt-6">
          <div className="flex items-start space-x-3 p-5 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20">
            <Checkbox
              id="strict-replace"
              checked={strictReplace}
              onCheckedChange={(checked) => setStrictReplace(checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="strict-replace" className="text-sm cursor-pointer leading-relaxed">
              <span className="font-bold text-base block mb-1">Strict Replace Mode</span>
              <span className="text-muted-foreground">
                Replace variables exactly without AI rewriting. Recommended for legal documents to maintain precise language and formatting.
              </span>
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            size="lg"
            className="min-w-[200px] shadow-md hover:shadow-lg transition-shadow"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Draft...
              </>
            ) : (
              "Generate Draft"
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}
