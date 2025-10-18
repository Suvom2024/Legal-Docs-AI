"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, Sparkles, MessageSquare, FileText, CheckCircle2, ArrowRight, X } from "lucide-react"
import { Card } from "@/components/ui/card"

interface UserGuideProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserGuide({ open, onOpenChange }: UserGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      icon: Upload,
      title: "Upload Your Document",
      description: "Start by uploading a legal document in DOCX or PDF format. Our AI will instantly process and extract the text content.",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: Sparkles,
      title: "Extract Variables",
      description: "AI automatically identifies and extracts variables like names, dates, policy numbers, and other reusable fields from your document.",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: FileText,
      title: "Save as Template",
      description: "Review the extracted variables and save the document as a reusable template. Add metadata like document type and jurisdiction.",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      iconColor: "text-green-600 dark:text-green-400"
    },
    {
      icon: MessageSquare,
      title: "Draft New Documents",
      description: "Use the chat interface to request new documents. AI matches templates, asks smart questions, and generates professional drafts.",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      iconColor: "text-orange-600 dark:text-orange-400"
    },
    {
      icon: CheckCircle2,
      title: "Download & Use",
      description: "Get your completed document in Markdown or DOCX format, ready for immediate use. Edit variables and regenerate as needed.",
      color: "from-teal-500 to-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-950/30",
      iconColor: "text-teal-600 dark:text-teal-400"
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onOpenChange(false)
      setCurrentStep(0)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setCurrentStep(0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden border-2">
        <div className="relative bg-gradient-to-br from-primary/5 via-background to-accent/10">
          <DialogHeader className="px-10 pt-10 pb-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-4xl font-bold mb-3">How It Works</DialogTitle>
                <p className="text-muted-foreground text-lg font-medium">
                  Learn how to use LegalDocs AI in {steps.length} simple steps
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-10 w-10 rounded-full hover:bg-destructive/10">
                <X className="h-6 w-6" />
              </Button>
            </div>
          </DialogHeader>

          <div className="px-10 pb-10">
            {/* Progress Indicators */}
            <div className="flex items-center justify-center gap-3 mb-10">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === currentStep 
                      ? "w-16 bg-primary shadow-lg shadow-primary/30" 
                      : index < currentStep 
                      ? "w-10 bg-primary/60" 
                      : "w-10 bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Step Content */}
            <div className="min-h-[450px] flex items-center justify-center">
              <Card className={`w-full ${steps[currentStep].bgColor} border-2 p-10 transition-all duration-300 shadow-xl`}>
              <div className="flex flex-col items-center text-center space-y-8">
                <div className={`h-28 w-28 rounded-3xl bg-gradient-to-br ${steps[currentStep].color} flex items-center justify-center shadow-2xl ring-4 ring-white/20`}>
                  {(() => {
                    const Icon = steps[currentStep].icon
                    return <Icon className="h-14 w-14 text-white" />
                  })()}
                </div>
                
                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-5xl font-bold text-muted-foreground/30">
                      {String(currentStep + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-4xl font-bold">
                      {steps[currentStep].title}
                    </h3>
                  </div>
                  
                  <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                    {steps[currentStep].description}
                  </p>
                </div>

                {/* Feature Highlights */}
                <div className="grid grid-cols-3 gap-5 w-full max-w-3xl mt-8">
                  {currentStep === 0 && (
                    <>
                      <div className="flex flex-col items-center p-5 bg-background/60 rounded-xl border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow">
                        <span className="text-3xl font-bold text-primary mb-1">PDF</span>
                        <span className="text-sm text-muted-foreground font-medium">Supported</span>
                      </div>
                      <div className="flex flex-col items-center p-5 bg-background/60 rounded-xl border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow">
                        <span className="text-3xl font-bold text-primary mb-1">DOCX</span>
                        <span className="text-sm text-muted-foreground font-medium">Supported</span>
                      </div>
                      <div className="flex flex-col items-center p-5 bg-background/60 rounded-xl border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow">
                        <span className="text-3xl font-bold text-primary mb-1">10MB</span>
                        <span className="text-sm text-muted-foreground font-medium">Max Size</span>
                      </div>
                    </>
                  )}
                  {currentStep === 1 && (
                    <>
                      <div className="flex flex-col items-center p-5 bg-background/60 rounded-xl border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow">
                        <span className="text-3xl font-bold text-primary mb-1">AI</span>
                        <span className="text-sm text-muted-foreground font-medium">Powered</span>
                      </div>
                      <div className="flex flex-col items-center p-5 bg-background/60 rounded-xl border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow">
                        <span className="text-3xl font-bold text-primary mb-1">Auto</span>
                        <span className="text-sm text-muted-foreground font-medium">Detection</span>
                      </div>
                      <div className="flex flex-col items-center p-5 bg-background/60 rounded-xl border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow">
                        <span className="text-3xl font-bold text-primary mb-1">Smart</span>
                        <span className="text-sm text-muted-foreground font-medium">Extraction</span>
                      </div>
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <div className="flex flex-col items-center p-5 bg-background/60 rounded-xl border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow">
                        <span className="text-3xl font-bold text-primary mb-1">Meta</span>
                        <span className="text-sm text-muted-foreground font-medium">Data</span>
                      </div>
                      <div className="flex flex-col items-center p-5 bg-background/60 rounded-xl border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow">
                        <span className="text-3xl font-bold text-primary mb-1">Tags</span>
                        <span className="text-sm text-muted-foreground font-medium">Auto-Tagged</span>
                      </div>
                      <div className="flex flex-col items-center p-5 bg-background/60 rounded-xl border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow">
                        <span className="text-3xl font-bold text-primary mb-1">Store</span>
                        <span className="text-sm text-muted-foreground font-medium">Library</span>
                      </div>
                    </>
                  )}
                  {currentStep === 3 && (
                    <>
                      <div className="flex flex-col items-center p-5 bg-background/60 rounded-xl border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow">
                        <span className="text-3xl font-bold text-primary mb-1">Match</span>
                        <span className="text-sm text-muted-foreground font-medium">Templates</span>
                      </div>
                      <div className="flex flex-col items-center p-5 bg-background/60 rounded-xl border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow">
                        <span className="text-3xl font-bold text-primary mb-1">Q&A</span>
                        <span className="text-sm text-muted-foreground font-medium">Interactive</span>
                      </div>
                      <div className="flex flex-col items-center p-5 bg-background/60 rounded-xl border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow">
                        <span className="text-3xl font-bold text-primary mb-1">Draft</span>
                        <span className="text-sm text-muted-foreground font-medium">Generate</span>
                      </div>
                    </>
                  )}
                  {currentStep === 4 && (
                    <>
                      <div className="flex flex-col items-center p-5 bg-background/60 rounded-xl border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow">
                        <span className="text-3xl font-bold text-primary mb-1">.MD</span>
                        <span className="text-sm text-muted-foreground font-medium">Markdown</span>
                      </div>
                      <div className="flex flex-col items-center p-5 bg-background/60 rounded-xl border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow">
                        <span className="text-3xl font-bold text-primary mb-1">.DOCX</span>
                        <span className="text-sm text-muted-foreground font-medium">Word Doc</span>
                      </div>
                      <div className="flex flex-col items-center p-5 bg-background/60 rounded-xl border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow">
                        <span className="text-3xl font-bold text-primary mb-1">Edit</span>
                        <span className="text-sm text-muted-foreground font-medium">Regenerate</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-10 pt-8 border-t-2 border-border">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="h-12 px-8 text-base font-semibold"
            >
              Previous
            </Button>
            
            <span className="text-base text-muted-foreground font-bold">
              Step {currentStep + 1} of {steps.length}
            </span>

            <Button
              onClick={handleNext}
              className="h-12 px-8 text-base font-semibold shadow-lg"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

