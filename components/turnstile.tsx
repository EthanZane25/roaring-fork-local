"use client";

import Script from "next/script";
import { useCallback, useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement | string, options: {
        sitekey: string;
        action?: string;
        callback?: (token: string) => void;
        "expired-callback"?: () => void;
      }) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function Turnstile({ action, onToken }: { action: string; onToken?: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const reactId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      callback: (token) => onToken?.(token),
      "expired-callback": () => onToken?.("")
    });
  }, [action, onToken, siteKey]);

  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [renderWidget]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        id={`turnstile-script-${reactId}`}
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={renderWidget}
      />
      <div ref={containerRef} />
    </>
  );
}
