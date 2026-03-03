import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, Conversation } from "@/types";
import { chatApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Plus, Search, MessageSquare, FileText, AlertTriangle, Sparkles, Loader2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";

interface ConversationMeta {
  id: string;
  title: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChatPage = () => {
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingConvs, setIsFetchingConvs] = useState(true);
  const [streamedContent, setStreamedContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedContent]);

  // Load conversation list on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsFetchingConvs(true);
      const data = await chatApi.getConversations();
      setConversations(
        data.conversations.map((c: ConversationMeta) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }))
      );
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setIsFetchingConvs(false);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const data = await chatApi.getConversation(id);
      const conv = data.conversation;
      setActiveConvId(id);
      setMessages(
        conv.messages.map((m: ChatMessage & { timestamp: string }) => ({
          ...m,
          id: m.id || `msg-${Math.random()}`,
          timestamp: new Date(m.timestamp),
        }))
      );
    } catch (err) {
      console.error("Failed to load conversation", err);
    }
  };

  // Simulated word-by-word streaming of the received text
  const simulateStreaming = (content: string): Promise<void> => {
    return new Promise((resolve) => {
      const words = content.split(" ");
      let i = 0;
      setStreamedContent("");
      const interval = setInterval(() => {
        if (i < words.length) {
          i++;
          setStreamedContent(words.slice(0, i).join(" "));
        } else {
          clearInterval(interval);
          resolve();
        }
      }, 25);
    });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setError("");

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const data = await chatApi.sendMessage(userMessage, activeConvId || undefined);

      // Animate the AI response streaming in
      await simulateStreaming(data.message.content);
      setStreamedContent("");

      const aiMsg: ChatMessage = {
        id: data.message.id || `msg-ai-${Date.now()}`,
        role: "assistant",
        content: data.message.content,
        citations: data.message.citations,
        isGuardrail: data.message.isGuardrail,
        suggestedQuestions: data.message.suggestedQuestions,
        timestamp: new Date(data.message.timestamp),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Update active conversation
      if (!activeConvId) {
        setActiveConvId(data.conversationId);
        await loadConversations(); // Refresh sidebar
      } else {
        // Update the conversation's updatedAt in sidebar
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId ? { ...c, updatedAt: new Date(), messageCount: c.messageCount + 2 } : c
          )
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to get response";
      setError(msg);
      // Remove the optimistic user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    } finally {
      setIsLoading(false);
      setStreamedContent("");
      inputRef.current?.focus();
    }
  };

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setInputValue("");
    setError("");
    inputRef.current?.focus();
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatApi.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  };

  const handleSuggestedQuestion = (q: string) => {
    setInputValue(q);
    setTimeout(() => handleSend(), 50);
  };

  const groupedConversations = () => {
    const filtered = conversations.filter((c) =>
      searchQuery ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );
    const groups: Record<string, ConversationMeta[]> = { Today: [], Yesterday: [], "This Week": [], Earlier: [] };
    filtered.forEach((c) => {
      if (isToday(c.updatedAt)) groups.Today.push(c);
      else if (isYesterday(c.updatedAt)) groups.Yesterday.push(c);
      else if (isThisWeek(c.updatedAt)) groups["This Week"].push(c);
      else groups.Earlier.push(c);
    });
    return groups;
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-r border-border bg-card flex flex-col overflow-hidden"
          >
            <div className="p-3 space-y-2">
              <Button onClick={startNewChat} className="w-full justify-start gap-2" variant="outline" size="sm">
                <Plus className="h-4 w-4" /> New Chat
              </Button>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            <ScrollArea className="flex-1 px-2">
              {isFetchingConvs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                Object.entries(groupedConversations()).map(([group, convs]) =>
                  convs.length > 0 ? (
                    <div key={group} className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground px-2 py-1">{group}</p>
                      {convs.map((c) => (
                        <div
                          key={c.id}
                          className={`group flex items-center gap-1 w-full px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${activeConvId === c.id
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-foreground hover:bg-muted"
                            }`}
                          onClick={() => loadConversation(c.id)}
                        >
                          <MessageSquare className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
                          <span className="flex-1 truncate">{c.title}</span>
                          <button
                            onClick={(e) => handleDeleteConversation(c.id, e)}
                            className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null
                )
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">How can I help you?</h2>
              <p className="text-muted-foreground max-w-md text-sm">
                Ask me anything about company policies, benefits, IT procedures, or other internal documentation.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-6 max-w-lg">
                {["What is the vacation policy?", "How do I work remotely?", "What benefits do we offer?", "How do I reset my password?"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInputValue(q)}
                    className="p-3 text-left text-sm rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onSuggestedClick={handleSuggestedQuestion} />
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <BrainIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 bg-card rounded-lg p-4 border border-border">
                    {streamedContent ? (
                      <>
                        <p className="text-sm whitespace-pre-wrap">{streamedContent}</p>
                        <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5" />
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error bar */}
        {error && (
          <div className="mx-4 mb-2 px-3 py-2 text-sm text-destructive bg-destructive/10 rounded-md">
            ⚠️ {error}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="flex-shrink-0">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask about company policies, benefits, IT..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!inputValue.trim() || isLoading} size="icon">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

function BrainIcon(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" /><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" /><path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" /><path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  );
}

function MessageBubble({ message, onSuggestedClick }: { message: ChatMessage; onSuggestedClick: (q: string) => void }) {
  if (message.role === "user") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 max-w-[80%]">
          <p className="text-sm">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
        <BrainIcon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 space-y-3">
        {message.isGuardrail && (
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-xs font-medium bg-yellow-50 dark:bg-yellow-900/20 rounded-md px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Outside knowledge base — hallucination guardrail activated
          </div>
        )}
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="text-sm prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }} />
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" /> Sources
            </p>
            {message.citations.map((c, i) => (
              <div key={i} className="bg-muted/50 rounded-md px-3 py-2 border border-border/50 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">{c.documentName}</span>
                  <span className="text-muted-foreground">• Page {c.pageNumber}</span>
                </div>
                <p className="text-muted-foreground italic">"{c.snippet}"</p>
              </div>
            ))}
          </div>
        )}

        {/* Suggested questions */}
        {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => onSuggestedClick(q)}
                className="text-xs px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>')
    .replace(/\n/g, "<br />");
}

export default ChatPage;
