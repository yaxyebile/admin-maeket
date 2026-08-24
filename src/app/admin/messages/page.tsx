"use client";

import { useAuth } from "@/context/auth-context";
import { ChatPanel } from "@/components/chat-panel";
import { PageHeader } from "@/components/page-header";

export default function AdminMessagesPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Messages" description="Chat with users and sellers" />
      <ChatPanel currentUserId={user.id} />
    </div>
  );
}
