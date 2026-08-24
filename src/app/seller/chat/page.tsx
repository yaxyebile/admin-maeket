"use client";

import { useAuth } from "@/context/auth-context";
import { ChatPanel } from "@/components/chat-panel";
import { PageHeader } from "@/components/page-header";

export default function SellerChatPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Chat" description="Message customers and admin" />
      <ChatPanel currentUserId={user.id} />
    </div>
  );
}
