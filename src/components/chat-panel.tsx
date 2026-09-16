"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ChatMessage, Profile } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Send, User, MessageSquare, CheckCheck, Circle } from "lucide-react";
import { toast } from "sonner";

interface ChatPanelProps {
  currentUserId: string;
}

export function ChatPanel({ currentUserId }: ChatPanelProps) {
  const [partners, setPartners] = useState<Profile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadPartners = useCallback(async () => {
    const { data: msgs } = await supabase.from("chat_messages").select("*");
    const all = msgs as ChatMessage[] | null;
    const partnerIds = new Set<string>();
    all?.forEach((m) => {
      if (m.sender_id === currentUserId) partnerIds.add(m.receiver_id);
      if (m.receiver_id === currentUserId) partnerIds.add(m.sender_id);
    });

    if (partnerIds.size === 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId);
      setPartners((profiles as Profile[])?.slice(0, 20) ?? []);
    } else {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(partnerIds));
      setPartners((profiles as Profile[]) ?? []);
    }
    setLoading(false);
  }, [currentUserId]);

  const loadMessages = useCallback(
    async (partnerId: string) => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .or(
          `sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`
        )
        .order("timestamp", { ascending: true });
      const all = (data as ChatMessage[]) ?? [];
      setMessages(
        all.filter(
          (m) =>
            (m.sender_id === currentUserId && m.receiver_id === partnerId) ||
            (m.sender_id === partnerId && m.receiver_id === currentUserId)
        )
      );
    },
    [currentUserId]
  );

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time Supabase Listener for instant messages
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("realtime_chat_messages_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;

          if (
            newMsg.sender_id === currentUserId ||
            newMsg.receiver_id === currentUserId
          ) {
            loadPartners();

            if (
              selectedId &&
              ((newMsg.sender_id === currentUserId && newMsg.receiver_id === selectedId) ||
                (newMsg.sender_id === selectedId && newMsg.receiver_id === currentUserId))
            ) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            } else if (newMsg.receiver_id === currentUserId) {
              toast.info("💬 Fariin cusub ayaa soo dhacday!");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedId, loadPartners]);

  const sendMessage = async () => {
    if (!selectedId || !content.trim()) return;
    setSending(true);

    const tempId = generateId();
    const msg: ChatMessage = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: selectedId,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      is_read: false,
    };

    // Optimistic UI Update for zero latency feel
    setMessages((prev) => [...prev, msg]);
    setContent("");

    const { error } = await supabase.from("chat_messages").insert(msg);
    setSending(false);

    if (error) {
      toast.error(`Cilad ayaa dhacday: ${error.message}`);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const selectedPartner = partners.find((p) => p.id === selectedId);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Conversations List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[550px]">
        <div className="border-b p-4 font-bold text-slate-800 flex items-center justify-between bg-slate-50/50">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Wadahadallada (Real-time Chat)
          </span>
          <Badge variant="secondary" className="text-[10px] font-bold">
            {partners.length} Users
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {partners.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              <User className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              Wali ma jiro wada hadal active ah
            </div>
          ) : (
            partners.map((p) => {
              const isSelected = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full p-4 text-left text-sm transition-all flex items-center gap-3 ${isSelected
                      ? "bg-primary/10 border-l-4 border-primary font-semibold"
                      : "hover:bg-slate-50"
                    }`}
                >
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-full bg-slate-100 border flex items-center justify-center text-slate-600 font-bold uppercase text-xs">
                      {p.name?.slice(0, 2) || "U"}
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 truncate">{p.name || "Customer"}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                        {p.role || "user"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {p.phone || "Click to open chat"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2 h-[550px]">
        {selectedId ? (
          <>
            {/* Header */}
            <div className="border-b p-4 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20">
                    {selectedPartner?.name?.slice(0, 2) || "U"}
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {selectedPartner?.name || "Chat Partner"}
                  </h4>
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" /> Live Realtime Connected
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                  <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
                  Bilaaw wadahadalka realtime-ka ah ee ku saabsan dalabka
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === currentUserId;
                  const timeFormatted = new Date(m.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${isMe
                            ? "bg-primary text-white rounded-br-none"
                            : "bg-white text-slate-900 border border-slate-200 rounded-bl-none"
                          }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        <div
                          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? "text-primary-foreground/80" : "text-slate-400"
                            }`}
                        >
                          <span>{timeFormatted}</span>
                          {isMe && <CheckCheck className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t bg-white rounded-b-2xl flex items-center gap-2">
              <Input
                placeholder="Qor fariintaada halkaan..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                className="rounded-xl border-slate-200 focus-visible:ring-primary h-11 text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={sending || !content.trim()}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-5 font-bold shadow-md shadow-primary/20 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mb-3" />
            <p className="font-bold text-slate-700 text-base">Doorashada Wadahadalka</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Fadlan mid ka mid ah isticmaaleyaasha bidixda ka dooro si aad toos ugu bilowdo chat realtime ah.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
