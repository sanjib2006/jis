"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  X,
  Maximize2,
  Minimize2,
  GripHorizontal,
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

const DEFAULT_WIDTH = 520;
const DEFAULT_HEIGHT = 640;
const MIN_WIDTH = 380;
const MIN_HEIGHT = 440;

export function AiChatDrawer({ user, open, onOpenChange }: AiChatDrawerProps) {
  const role = user?.role || "REGISTRAR";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Window State: Floating, Maximized, Position, Size
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const suggestions = ROLE_SUGGESTIONS[role] || ROLE_SUGGESTIONS.REGISTRAR;

  // Initialize position to bottom-right when opened
  useEffect(() => {
    if (open && typeof window !== "undefined") {
      const initialWidth = Math.min(DEFAULT_WIDTH, window.innerWidth - 32);
      const initialHeight = Math.min(DEFAULT_HEIGHT, window.innerHeight - 80);
      setSize({ width: initialWidth, height: initialHeight });

      // Default: bottom-right with 24px margin
      const defaultX = Math.max(16, window.innerWidth - initialWidth - 24);
      const defaultY = Math.max(16, window.innerHeight - initialHeight - 24);
      setPosition({ x: defaultX, y: defaultY });
    }
  }, [open]);

  // Keep window in bounds if browser window is resized
  useEffect(() => {
    const handleWindowResize = () => {
      if (typeof window === "undefined" || !position || isMaximized) return;

      const maxX = Math.max(0, window.innerWidth - size.width);
      const maxY = Math.max(0, window.innerHeight - size.height);

      setPosition((prev) => {
        if (!prev) return prev;
        return {
          x: Math.min(Math.max(0, prev.x), maxX),
          y: Math.min(Math.max(0, prev.y), maxY),
        };
      });
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [position, size, isMaximized]);

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

  // Dragging logic
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMaximized) return;
    // Don't drag if clicking buttons or inputs inside header
    if ((e.target as HTMLElement).closest("button, input, a")) return;

    if (!position) return;
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isMaximized) return;

    const newX = e.clientX - dragOffsetRef.current.x;
    const newY = e.clientY - dragOffsetRef.current.y;

    const maxX = Math.max(0, window.innerWidth - size.width);
    const maxY = Math.max(0, window.innerHeight - size.height);

    setPosition({
      x: Math.min(Math.max(0, newX), maxX),
      y: Math.min(Math.max(0, newY), maxY),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }
  };

  // Corner resize logic
  const handleResizePointerDown = (e: React.PointerEvent) => {
    if (isMaximized || !position) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newWidth = Math.max(
        MIN_WIDTH,
        Math.min(window.innerWidth - position.x - 16, startWidth + deltaX)
      );
      const newHeight = Math.max(
        MIN_HEIGHT,
        Math.min(window.innerHeight - position.y - 16, startHeight + deltaY)
      );

      setSize({ width: newWidth, height: newHeight });
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

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

  if (!open) return null;

  return (
    <div
      ref={windowRef}
      role="dialog"
      aria-label="Judicial AI Assistant"
      style={
        isMaximized
          ? {
              position: "fixed",
              top: "16px",
              left: "16px",
              right: "16px",
              bottom: "16px",
              width: "auto",
              height: "auto",
              zIndex: 60,
            }
          : {
              position: "fixed",
              left: position ? `${position.x}px` : "auto",
              top: position ? `${position.y}px` : "auto",
              right: position ? "auto" : "24px",
              bottom: position ? "auto" : "24px",
              width: `${size.width}px`,
              height: `${size.height}px`,
              zIndex: 60,
            }
      }
      className="flex flex-col bg-card border border-border shadow-2xl rounded-md overflow-hidden text-foreground animate-in fade-in-50 zoom-in-95 duration-150"
    >
      {/* Draggable Header */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`px-4 py-2.5 border-b border-border bg-muted/60 select-none flex items-center justify-between shrink-0 ${
          isMaximized ? "cursor-default" : isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {!isMaximized && (
            <GripHorizontal className="size-4 text-muted-foreground/60 shrink-0 hidden sm:block" />
          )}
          <div className="size-6 rounded-sm bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
            <Bot className="size-3.5 text-accent" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-tight text-foreground truncate">
                Judicial Assistant
              </span>
              <Badge
                variant="outline"
                className="text-[9px] font-mono uppercase px-1.5 py-0 h-3.5 border-accent/40 text-accent font-semibold"
              >
                {role}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground truncate hidden sm:block">
              {isMaximized ? "Full-Screen Roster View" : "Draggable • Non-blocking"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {/* Reset / Clear */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleResetChat}
            disabled={messages.length === 0}
            className="size-7 text-muted-foreground hover:text-foreground"
            title="Clear current session"
          >
            <RotateCcw className="size-3.5" />
            <span className="sr-only">Clear Session</span>
          </Button>

          {/* Full-Screen Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsMaximized((prev) => !prev)}
            className="size-7 text-muted-foreground hover:text-foreground"
            title={isMaximized ? "Restore window size" : "Maximize to full screen"}
          >
            {isMaximized ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
            <span className="sr-only">
              {isMaximized ? "Exit Full Screen" : "Full Screen"}
            </span>
          </Button>

          {/* Close */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onOpenChange(false)}
            className="size-7 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Close Assistant"
          >
            <X className="size-3.5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>

      {/* Messages Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-background/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center px-4 py-8">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3 border border-border">
              <Sparkles className="size-5 text-accent" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              How may I assist your docket?
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Ask about case proceedings, courtroom schedules, legal precedents,
              or caseload analytics. Responses are retrieved directly from official records.
            </p>

            <div className="w-full mt-6 space-y-2 max-w-md">
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
                  className={`rounded-sm p-3 text-xs leading-relaxed max-w-[94%] ${
                    isUser
                      ? "bg-primary text-primary-foreground font-medium"
                      : "bg-muted/70 text-foreground border border-border shadow-xs"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div className="prose prose-xs dark:prose-invert max-w-none space-y-2 leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ ...props }) => (
                            <div className="overflow-x-auto my-2.5 border border-border rounded-sm bg-background shadow-xs">
                              <table
                                className="w-full border-collapse text-xs text-left"
                                {...props}
                              />
                            </div>
                          ),
                          thead: ({ ...props }) => (
                            <thead
                              className="bg-muted/80 text-foreground font-semibold border-b border-border"
                              {...props}
                            />
                          ),
                          th: ({ ...props }) => (
                            <th
                              className="p-2 border-r border-border last:border-r-0 whitespace-nowrap text-[11px] font-semibold text-foreground"
                              {...props}
                            />
                          ),
                          td: ({ ...props }) => (
                            <td
                              className="p-2 border-t border-border border-r last:border-r-0 text-[11px] align-top whitespace-normal"
                              {...props}
                            />
                          ),
                          tr: ({ ...props }) => (
                            <tr
                              className="hover:bg-muted/30 transition-colors"
                              {...props}
                            />
                          ),
                          code: ({ ...props }) => (
                            <code
                              className="font-mono bg-muted/80 px-1.5 py-0.5 rounded-xs text-[11px] font-semibold text-foreground border border-border select-all"
                              {...props}
                            />
                          ),
                        }}
                      >
                        {m.content
                          .replace(/<mark>(.*?)<\/mark>/gi, "**$1**")
                          .replace(/<\/?mark>/gi, "**")}
                      </ReactMarkdown>
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
            <div className="rounded-sm p-2.5 text-xs bg-muted/70 text-foreground border border-border flex items-center gap-2">
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
      <div className="p-3 border-t border-border bg-card shrink-0">
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

      {/* Resize Handle (Bottom-Right Corner, active only when not maximized) */}
      {!isMaximized && (
        <div
          onPointerDown={handleResizePointerDown}
          className="absolute bottom-0 right-0 size-4 cursor-se-resize flex items-end justify-end p-0.5 text-muted-foreground/40 hover:text-accent transition-colors"
          title="Drag to resize window"
        >
          <svg
            className="size-2.5"
            viewBox="0 0 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M5 1L1 5M5 3.5L3.5 5" />
          </svg>
        </div>
      )}
    </div>
  );
}
