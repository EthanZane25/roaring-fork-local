"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle } from "lucide-react";

export function MessageSellerButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function openConversation() {
    setPending(true);
    setError("");
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ listingId })
    });
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) {
      router.push("/sign-in");
      return;
    }
    if (!response.ok) {
      setError(body.error || "Unable to start conversation.");
      setPending(false);
      return;
    }
    router.push(`/messages/${body.id}`);
  }

  return (
    <div>
      <button onClick={openConversation} disabled={pending} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#163b2d] px-4 py-3 text-sm font-black text-white disabled:opacity-50">
        <MessageCircle size={16} /> {pending ? "Opening..." : "Message seller"}
      </button>
      {error ? <p className="mt-2 text-xs text-[#913c2a]">{error}</p> : null}
    </div>
  );
}
