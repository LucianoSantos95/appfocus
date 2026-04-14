import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  isLoading?: boolean;
}

export function ChatMessage({ role, content, isLoading }: ChatMessageProps) {
  if (isLoading) {
    return (
      <div className="flex items-start gap-2">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  if (role === "user") {
    return (
      <div className="flex items-start gap-2 justify-end">
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
      </div>
    );
  }

  const hasAction = content.includes("✅");

  return (
    <div className="flex items-start gap-2">
      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div
        className={cn(
          "rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]",
          hasAction ? "bg-success/10 border border-success/20" : "bg-muted"
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
