"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ChatMessage, Profile } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Send } from "lucide-react";
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

  const sendMessage = async () => {
    if (!selectedId || !content.trim()) return;
    setSending(true);
    const msg: ChatMessage = {
      id: generateId(),
      sender_id: currentUserId,
      receiver_id: selectedId,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      is_read: false,
    };
    const { error } = await supabase.from("chat_messages").insert(msg);
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMessages((prev) => [...prev, msg]);
    setContent("");
    toast.success("Message sent");
  };

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
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b p-4 font-semibold">Conversations</div>
        <div className="max-h-[480px] overflow-y-auto">
          {partners.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No chat partners yet</p>
          ) : (
            partners.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`w-full border-b px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${
                  selectedId === p.id ? "bg-primary/5" : ""
                }`}
              >
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-slate-500">{p.role}</p>
              </button>
            ))
          )}
        </div>
      </div>
      <div className="flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm lg:col-span-2">
        {selectedId ? (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-4 max-h-[400px]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.sender_id === currentUserId ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      m.sender_id === currentUserId
                        ? "bg-primary text-white"
                        : "bg-slate-100"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t p-4">
              <Input
                placeholder="Type a message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button onClick={sendMessage} disabled={sending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-slate-500">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
