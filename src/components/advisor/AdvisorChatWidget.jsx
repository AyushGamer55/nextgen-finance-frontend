import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2, MessageSquare, SendHorizontal, Sparkles, X } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { aiAdvisorAPI } from "@/lib/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  "Analyze my spending",
  "Show monthly summary",
  "How can I save money?",
  "Give budget advice",
];

const HIDDEN_ROUTES = new Set(["/", "/login", "/signup"]);

function buildWelcomeMessage(name) {
  return {
    id: "welcome",
    role: "assistant",
    text: `Hi ${name || "there"}, I can review your spending, savings, and budget patterns using your real transaction data.`,
    meta: { source: "system" },
  };
}

function formatSourceLabel(source) {
  if (source === "ai") return "AI";
  if (source === "open_chat") return "Chat";
  if (source === "rules") return "Rules";
  if (source === "social") return "Short";
  if (source === "off_topic_rules") return "Guide";
  return null;
}

export function AdvisorChatWidget() {
  const { session, isAuthed } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => [buildWelcomeMessage("there")]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  const shouldShow = isAuthed && !HIDDEN_ROUTES.has(location.pathname);

  useEffect(() => {
    if (!session?.name) return;
    setMessages([buildWelcomeMessage(session.name)]);
  }, [session?.name]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, isLoading, isOpen]);

  const headerLabel = useMemo(() => {
    return isLoading ? "Thinking..." : "AI Finance Advisor";
  }, [isLoading]);

  async function handleSend(rawMessage) {
    const message = String(rawMessage || "").trim();
    if (!message || !session?.id || isLoading) return;

    setIsOpen(true);
    setInput("");
    setIsLoading(true);
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text: message },
    ]);

    try {
      const response = await aiAdvisorAPI.chat({
        userId: session.id,
        message,
      });

      const reply =
        response.data?.data?.reply ||
        response.data?.reply ||
        "I could not generate advice right now.";
      const meta = response.data?.meta || response.data?.data?.meta || null;

      setMessages((current) => [
        ...current,
        { id: `assistant-${Date.now()}`, role: "assistant", text: reply, meta },
      ]);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong while contacting the advisor.";

      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: errorMessage,
          meta: { source: "error" },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen ? (
        <Card className="w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden border-border/60 bg-card/95 shadow-2xl backdrop-blur md:w-[400px]">
          <div className="flex items-center justify-between border-b border-border/60 bg-primary/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{headerLabel}</p>
                <p className="text-xs text-muted-foreground">Real data based advisor</p>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="border-b border-border/60 px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => handleSend(action)}
                  disabled={isLoading}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div ref={scrollRef} className="max-h-[380px] space-y-3 overflow-y-auto bg-background/80 px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                    message.role === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border border-border/60 bg-card text-card-foreground"
                  )}
                >
                  {message.role === "assistant" && message.meta?.source ? (
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {formatSourceLabel(message.meta.source) || message.meta.source}
                    </div>
                  ) : null}
                  <div>{message.text}</div>
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing your finances...
                </div>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2 border-t border-border/60 bg-card px-4 py-4"
          >
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about spending, savings, or budget..."
              className="h-11"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={isLoading || !input.trim()}>
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      ) : null}

      <Button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="h-14 rounded-full px-5 shadow-xl"
      >
        {isOpen ? <X className="mr-2 h-5 w-5" /> : <MessageSquare className="mr-2 h-5 w-5" />}
        <span>{isOpen ? "Close" : "Ask Advisor"}</span>
      </Button>
    </div>
  );
}
