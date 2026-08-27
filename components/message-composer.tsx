"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = body.trim();
    if (!message) return;
    setPending(true);
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ conversationId, body: message })
    });
    if (response.ok) {
      setBody("");
      router.refresh();
    }
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="mt-5 flex gap-2">
      <input value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} placeholder="Write a message..." className="min-w-0 flex-1 rounded-md border border-[#d6d8d1] bg-white px-4 py-3" />
      <button disabled={pending || !body.trim()} className="grid h-12 w-12 place-items-center rounded-md bg-[#163b2d] text-white disabled:opacity-45" aria-label="Send message"><Send size={17} /></button>
    </form>
  );
}
