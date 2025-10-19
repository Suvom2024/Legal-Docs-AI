"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Send, Loader2, FileText } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ChatMessage } from "@/components/chat-message"
import { TemplateMatchCard } from "@/components/template-match-card"
import { QuestionForm } from "@/components/question-form"
import { DraftCard } from "@/components/draft-card"
import { WebResultsCard } from "@/components/web-results-card"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type Message = {
  role: "user" | "assistant"
  content: string
}

type DraftState = {
  instanceId: string
  templateId: string
  templateTitle: string
  confidence?: number
  justification?: string
  alternatives?: any[]
  questions: any[]
  preFilled: Record<string, any>
  draftMarkdown?: string
  draftNumber?: number
}

export default function ChatPage() {
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I can help you draft legal documents. Tell me what document you need, for example:\n\n- `/draft` a notice to insurer for a motor accident in India\n- Create a rental agreement for Mumbai\n- Generate an employment contract\n\nYou can also type `/vars` anytime to see your progress.",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [draftState, setDraftState] = useState<DraftState | null>(null)
  const [showQuestions, setShowQuestions] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [webResults, setWebResults] = useState<any[]>([])
  const [lastQuery, setLastQuery] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Load template from URL query parameter on mount
  useEffect(() => {
    const templateId = searchParams.get('template_id')
    console.log("DEBUG: searchParams keys:", Array.from(searchParams.keys()))
    console.log("DEBUG: template_id from searchParams:", templateId)
    console.log("DEBUG: Full search string:", searchParams.toString())
    
    if (templateId) {
      console.log("DEBUG: Loading template directly with ID:", templateId)
      loadTemplateDirectly(templateId)
    } else {
      console.log("DEBUG: No template_id found in URL params")
    }
  }, [searchParams])

  const loadTemplateDirectly = async (templateId: string) => {
    try {
      setIsLoading(true)
      const result = await apiClient.createDraftWithTemplate(templateId)
      
      setDraftState({
        instanceId: result.instance_id,
        templateId: result.template_id,
        templateTitle: result.template_title,
        questions: result.questions,
        preFilled: result.pre_filled_variables || {},
        draftNumber: 1,
        alternatives: result.alternatives,
      })

      setShowQuestions(true)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Perfect! I've loaded the ${result.template_title} template. Please answer the following questions to complete your document:`,
        },
      ])
    } catch (error) {
      toast({
        title: "Failed to load template",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Disable auto-scroll - user can manually scroll if needed
  // useEffect(() => {
  //   if (messages.length > 1) {
  //     scrollToBottom()
  //   }
  // }, [messages, draftState])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    // Declare queryText outside try block so it's accessible in catch
    let queryText = userMessage

    try {
      if (userMessage.toLowerCase() === "/vars") {
        if (draftState) {
          const filledKeys = Object.keys(draftState.preFilled || {}).filter((k) => draftState.preFilled[k] !== null && draftState.preFilled[k] !== undefined)
          const allKeys = draftState.questions.map((q: any) => q.variable_key)
          const missingKeys = allKeys.filter((k) => !filledKeys.includes(k))
          
          const response = `**Variables Status:**\n\n**Filled (${filledKeys.length}):**\n${filledKeys.length > 0 ? filledKeys.map((k) => `- ${k}: ${draftState.preFilled[k]}`).join("\n") : "None"}\n\n**Missing (${missingKeys.length}):**\n${missingKeys.length > 0 ? missingKeys.map((k) => `- ${k}`).join("\n") : "None"}`
          setMessages((prev) => [...prev, { role: "assistant", content: response }])
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "No active draft. Please start by requesting a document." },
          ])
        }
        setIsLoading(false)
        return
      }

      // Parse /draft command
      if (userMessage.toLowerCase().startsWith("/draft")) {
        queryText = userMessage.substring(6).trim()
        if (!queryText) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "Please specify what document you want to draft. Example: `/draft notice to insurer for motor accident in India`",
            },
          ])
          setIsLoading(false)
          return
        }
      }

      // Store query for potential web bootstrap
      setLastQuery(queryText)

      // Create draft
      const result = await apiClient.createDraft(queryText)

      setDraftState({
        instanceId: result.instance_id,
        templateId: result.template_id,
        templateTitle: result.template_title,
        questions: result.questions,
        preFilled: result.pre_filled_variables,
        draftNumber: 1,
        alternatives: result.alternatives,
      })

      // Extract confidence from message if available
      const confidenceMatch = result.message.match(/(\d+)% confidence/)
      const confidence = confidenceMatch ? Number.parseInt(confidenceMatch[1]) / 100 : 0.85

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Great! I found a matching template. ${result.message}`,
        },
      ])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      
      // Check if it's a "no template found" error - trigger web bootstrap
      if (errorMessage.includes("No suitable template found") || errorMessage.includes("confidence < 0.6")) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `🔍 No local template found. Let me search the web for similar documents...`,
          },
        ])
        
        // Trigger web search
        try {
          const searchResults = await apiClient.searchWeb(queryText, 3)
          
          if (searchResults.results && searchResults.results.length > 0) {
            setWebResults(searchResults.results)
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `✅ Found ${searchResults.results.length} similar documents online. Click "Create Template" on any result below to automatically import and continue drafting.`,
              },
            ])
          } else {
            setWebResults([])
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `No similar documents found on the web. Please try:\n- Uploading a template manually\n- Broadening your search terms\n- Being more specific about document type`,
              },
            ])
          }
        } catch (webError) {
          console.error("Web search failed:", webError)
          setWebResults([])
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Sorry, web search is currently unavailable. Please try:\n- Uploading a template first if none exist\n- Being more specific about the document type\n- Including jurisdiction or document details`,
            },
          ])
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Sorry, I couldn't process your request: ${errorMessage}\n\nPlease try:\n- Uploading a template first if none exist\n- Being more specific about the document type\n- Including jurisdiction or document details`,
          },
        ])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmTemplate = () => {
    setShowQuestions(true)
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Perfect! Now I need some information to complete the draft. Please answer the following questions:`,
      },
    ])
  }

  const handleSelectAlternative = async (templateId: string) => {
    try {
      setIsLoading(true)
      toast({
        title: "Switching template",
        description: "Loading alternative template...",
      })

      // Load the alternative template
      const result = await apiClient.createDraftWithTemplate(templateId)

      setDraftState({
        instanceId: result.instance_id,
        templateId: result.template_id,
        templateTitle: result.template_title,
        questions: result.questions,
        preFilled: result.pre_filled_variables,
        draftNumber: 1,
        alternatives: result.alternatives,
      })

      setShowQuestions(false) // Show template match card first
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Perfect! I've switched to the "${result.template_title}" template. ${result.message}`,
        },
      ])

      toast({
        title: "Template switched",
        description: `Now using: ${result.template_title}`,
      })
    } catch (error) {
      toast({
        title: "Failed to switch template",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I couldn't switch to that template. Please try again.`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitAnswers = async (answers: Record<string, string>, strictReplace?: boolean) => {
    if (!draftState) return

    setIsGenerating(true)
    try {
      const result = await apiClient.finalizeDraft(draftState.instanceId, answers, strictReplace)

      setDraftState((prev) =>
        prev ? { ...prev, draftMarkdown: result.draft_md, draftNumber: result.draft_number, preFilled: answers } : null,
      )
      setShowQuestions(false)

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Excellent! Your draft is ready${strictReplace ? " (strict replacement mode)" : ""}. You can copy it, download it, or make changes.`,
        },
      ])

      toast({
        title: "Draft generated",
        description: "Your document has been generated successfully",
      })
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditVariables = async () => {
    if (!draftState) return

    try {
      const result = await apiClient.editDraftVariables(draftState.instanceId)

      setDraftState((prev) =>
        prev
          ? {
              ...prev,
              questions: result.questions,
              preFilled: result.pre_filled_variables,
              draftMarkdown: undefined, // Clear draft to show questions again
            }
          : null,
      )

      setShowQuestions(true)

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Let's edit the variables. You can change any of the values below:",
        },
      ])
    } catch (error) {
      toast({
        title: "Edit failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const handleRegenerate = (newDraft: string) => {
    setDraftState((prev) =>
      prev
        ? {
            ...prev,
            draftMarkdown: newDraft,
            draftNumber: (prev.draftNumber || 1) + 1,
          }
        : null,
    )
  }

  const handleWebBootstrap = async (documentId: string, url: string, title: string) => {
    try {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⏳ Creating template from "${title}"... This may take 30-60 seconds.`,
        },
      ])

      // Call bootstrap API
      const result = await apiClient.bootstrapFromWeb(documentId, url, title)

      toast({
        title: "Template created!",
        description: `${result.template_id} with ${result.variables_count} variables`,
      })

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `✅ Template created successfully! Template ID: ${result.template_id} with ${result.variables_count} variables.\n\nNow let's draft your document...`,
        },
      ])

      // Clear web results
      setWebResults([])

      // Now try to draft again with the new template
      if (lastQuery) {
        setTimeout(async () => {
          try {
            const draftResult = await apiClient.createDraft(lastQuery)
            
            setDraftState({
              instanceId: draftResult.instance_id,
              templateId: draftResult.template_id,
              templateTitle: draftResult.template_title,
              questions: draftResult.questions,
              preFilled: draftResult.pre_filled_variables,
              draftNumber: 1,
              alternatives: draftResult.alternatives,
            })

            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `Great! Now let's draft your document. ${draftResult.message}`,
              },
            ])

            setShowQuestions(true)
          } catch (error) {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `❌ Failed to start draft: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            ])
          }
        }, 1500)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to create template from web"
      
      // Show error but keep web results for retry
      toast({
        title: "Template creation failed",
        description: "This document didn't work. Try another result below.",
        variant: "destructive",
      })

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ Could not create template from "${title}": ${errorMsg}\n\nTry selecting another result below, or upload your template directly.`,
        },
      ])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-[calc(100vh-4.5rem)] bg-gradient-to-br from-background via-background to-accent/5 overflow-hidden">
      <div className="h-full flex flex-col px-6 sm:px-8 lg:px-12 py-6 max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Draft Legal Document</h1>
          <p className="text-base text-muted-foreground">
            Use our AI assistant to draft professional legal documents through an intelligent Q&A process
          </p>
        </div>

        {/* Two Column Layout - 50/50 Split */}
        <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Left Column - Template Info, Questions, Web Results (50%) */}
          <Card className="border-2 border-border shadow-sm flex flex-col overflow-y-auto min-h-0 p-8">
            <div className="space-y-6 flex-1 flex flex-col">
            {draftState && !showQuestions && !draftState.draftMarkdown && (
              <div className="animate-in slide-in-from-left duration-500">
                <TemplateMatchCard
                  templateId={draftState.templateId}
                  title={draftState.templateTitle}
                  confidence={draftState.confidence || 0.85}
                  justification={draftState.justification || "Best match based on your query"}
                  alternatives={draftState.alternatives}
                  onConfirm={handleConfirmTemplate}
                  onSelectAlternative={handleSelectAlternative}
                />
              </div>
            )}

            {showQuestions && draftState && !draftState.draftMarkdown && (
              <div className="animate-in slide-in-from-left duration-500">
                <QuestionForm
                  questions={draftState.questions}
                  preFilled={draftState.preFilled}
                  onSubmit={handleSubmitAnswers}
                  isSubmitting={isGenerating}
                />
              </div>
            )}

            {draftState?.draftMarkdown && (
              <div className="animate-in slide-in-from-left duration-500">
                <DraftCard
                  instanceId={draftState.instanceId}
                  draftMarkdown={draftState.draftMarkdown}
                  draftNumber={draftState.draftNumber || 1}
                  onEdit={handleEditVariables}
                  onRegenerate={handleRegenerate}
                />
              </div>
            )}

            {webResults.length > 0 && (
              <div className="animate-in slide-in-from-left duration-500">
                <WebResultsCard results={webResults} onBootstrap={handleWebBootstrap} />
              </div>
            )}

            {!draftState && webResults.length === 0 && (
              <div className="p-12 border-2 border-dashed border-border bg-muted/20 text-center h-full flex items-center justify-center rounded-lg">
                <div className="space-y-6">
                  <div className="h-24 w-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-12 w-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">Template & Variable Panel</h3>
                    <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
                      When you start a draft, template matches, questions, and web results will appear here.
                    </p>
                  </div>
                </div>
              </div>
            )}
            </div>
          </Card>

          {/* Right Column - Chat Interface (50%) */}
          <Card className="border-2 border-border shadow-sm flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-6 p-8 min-h-0">
              {messages.map((message, index) => (
                <ChatMessage key={index} role={message.role} content={message.content} />
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <Card className="p-6 bg-muted/50 border-2 border-border">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-base text-muted-foreground font-semibold">AI is thinking...</span>
                    </div>
                  </Card>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 border-t-2 border-border bg-muted/30">
              <div className="flex gap-4">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message... (e.g., /draft notice to insurer)"
                  disabled={isLoading}
                  className="flex-1 h-14 text-base border-2"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={isLoading || !input.trim()}
                  size="lg"
                  className="px-8 h-14"
                >
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
