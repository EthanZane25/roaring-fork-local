"use client";

import { useState } from "react";
import {
  Loader2,
  RefreshCw
} from "lucide-react";

export function EbayImportPanel() {
  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function refresh() {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/marketplace/import-ebay",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );

      const body =
        await response.json();

      if (!response.ok) {
        setMessage(
          body.error ||
            "Import failed."
        );
        return;
      }

      setMessage(
        `Found ${body.discovered}. Added ${body.created}, updated ${body.updated}, failed ${body.failed}.`
      );
    } catch {
      setMessage(
        "Unable to run the importer."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#dddcd5] bg-white p-6">
      <h2 className="text-xl font-semibold">
        External Marketplace Inventory
      </h2>

      <p className="mt-2 max-w-xl text-sm leading-6 text-[#606860]">
        Pull nearby local-pickup items from eBay,
        including listing photos. Existing imported
        items are updated instead of duplicated.
      </p>

      <button
        type="button"
        onClick={refresh}
        disabled={busy}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#173f30] px-5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? (
          <Loader2
            size={16}
            className="animate-spin"
          />
        ) : (
          <RefreshCw size={16} />
        )}

        Refresh inventory
      </button>

      {message ? (
        <p className="mt-4 text-sm font-medium text-[#5d675f]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
