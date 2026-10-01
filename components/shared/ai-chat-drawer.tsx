"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { CurrentUser } from "@/types";
import {
  Bot,
  Send,
  RotateCcw,
  Loader2,
  AlertCircle,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface AiChatDrawerProps {
  user: CurrentUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const ROLE_SUGGESTIONS: Record<string, string[]> = {
  REGISTRAR: [
    "How many cases are currently active or pending?",
    "Check courtroom availability for tomorrow",
    "Summarize current caseload clearance rate",
    "List cases adjourned more than twice",
  ],
  JUDGE: [
    "Search closed cases related to theft or robbery",
    "Find precedents involving Section 302 IPC",
    "List recent resolved cases and their judgments",
    "Summarize closed trial timelines and decisions",
  ],
  LAWYER: [
    "Search closed precedents by crime category",
    "What is my current case view billing statement?",
    "Find resolved cases from this calendar year",
    "Search case law involving forensic evidence",
  ],
};

export function AiChatDrawer({ user, open, onOpenChange }: AiChatDrawerProps) {
  const role = user?.role || "REGISTRAR";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestions = ROLE_SUGGESTIONS[role] || ROLE_SUGGESTIONS.REGISTRAR;

  // Auto-scroll to latest message
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [open]);

  const sendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const trimmed = userText.trim();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res
          .json()
          .catch(() => ({ error: "Failed to connect to assistant." }));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No response stream available.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        accumulated += text;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: accumulated } : msg
          )
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error contacting assistant";
      setError(message);
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleResetChat = () => {
    setMessages([]);
    setInput("");
    setError(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col h-full bg-card border-l border-border text-foreground"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-border bg-muted/40 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-sm bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <Bot className="size-4 text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-sm font-semibold tracking-tight text-foreground">
                    Judicial Assistant
                  </SheetTitle>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono uppercase px-1.5 py-0 h-4 border-accent/40 text-accent font-semibold"
                  >
                    {role}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground font-normal">
                  Statutory records retrieval agent • Grounded in DB
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetChat}
                disabled={messages.length === 0}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                title="Clear current session"
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline text-[11px]">Clear</span>
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center px-4 py-8">
              <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3 border border-border">
                <Sparkles className="size-5 text-accent" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                How may I assist your docket?
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Ask about case proceedings, courtroom schedules, legal precedents,
                or caseload analytics. Responses are retrieved directly from official records.
              </p>

              <div className="w-full mt-6 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider justify-center">
                  <HelpCircle className="size-3" />
                  <span>Suggested Inquiries</span>
                </div>
                <div className="grid gap-1.5 text-left">
                  {suggestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(q)}
                      className="w-full text-xs text-left p-2.5 rounded-sm bg-muted/60 hover:bg-muted border border-border transition-colors text-foreground hover:border-accent/40"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">
                      {isUser ? "You" : "Judicial Assistant"}
                    </span>
                  </div>

                  <div
                    className={`rounded-sm p-3 text-xs leading-relaxed max-w-[92%] ${
                      isUser
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-muted/70 text-foreground border border-border shadow-xs"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <div className="prose prose-xs dark:prose-invert max-w-none space-y-2 [&_p]:leading-relaxed [&_table]:w-full [&_table]:my-2 [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:p-1.5 [&_th]:bg-muted [&_th]:text-[11px] [&_td]:border [&_td]:border-border [&_td]:p-1.5 [&_td]:text-[11px] [&_code]:font-mono [&_code]:bg-background [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded-xs [&_code]:text-[11px] [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:my-0.5">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="rounded-sm p-3 text-xs bg-muted/70 text-foreground border border-border flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin text-accent" />
                <span className="text-[11px] text-muted-foreground font-medium">
                  Consulting judicial database records...
                </span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-sm bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="size-4" />
                <span>Assistant Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {error.includes("Gemini API key is not configured")
                  ? "The Gemini API key is missing. Set GOOGLE_GENERATIVE_AI_API_KEY in your environment variables to activate live queries."
                  : error}
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-border bg-muted/20 shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inquire about dockets, schedules, or legal precedents..."
              disabled={isLoading}
              className="text-xs h-9 rounded-sm bg-background border-border"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !input.trim()}
              className="h-9 px-3 rounded-sm shrink-0"
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              <span className="sr-only">Send Inquiry</span>
            </Button>
          </form>

          <p className="text-[10px] text-muted-foreground text-center mt-2 font-mono">
            Judiciary Information System • Responses synthesized from official court records
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
