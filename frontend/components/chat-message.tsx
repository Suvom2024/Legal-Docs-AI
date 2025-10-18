import { Card } from "@/components/ui/card"
import { Bot, User } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={`flex gap-4 ${role === "user" ? "justify-end" : "justify-start"}`}>
      {role === "assistant" && (
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md ring-2 ring-primary/20">
          <Bot className="h-6 w-6 text-primary-foreground" />
        </div>
      )}
      <Card className={`max-w-[80%] p-6 shadow-md transition-all hover:shadow-lg ${
        role === "user" 
          ? "bg-primary text-primary-foreground border-2 border-primary/50" 
          : "bg-card border-2 border-border"
      }`}>
        <div className={`prose prose-base max-w-none ${
          role === "user" 
            ? "prose-invert" 
            : "prose-slate dark:prose-invert"
        }`}>
          {role === "assistant" ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <p className="text-base leading-relaxed m-0">{content}</p>
          )}
        </div>
      </Card>
      {role === "user" && (
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-muted border-2 border-border flex items-center justify-center shadow-sm">
          <User className="h-6 w-6 text-foreground" />
        </div>
      )}
    </div>
  )
}
