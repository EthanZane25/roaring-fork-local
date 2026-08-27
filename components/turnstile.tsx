"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement | string, options: {
        sitekey: string;
        action?: string;
        callback?: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
      }) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function Turnstile({ action, onToken }: { action: string; onToken?: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile || widgetId.current) return false;
    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      callback: (token) => onToken?.(token),
      "expired-callback": () => onToken?.(""),
      "error-callback": () => onToken?.("")
    });
    return true;
  }, [action, onToken, siteKey]);

  useEffect(() => {
    if (!siteKey) return;
    if (renderWidget()) return;
    const timer = window.setInterval(() => {
      if (renderWidget()) window.clearInterval(timer);
    }, 100);
    const timeout = window.setTimeout(() => window.clearInterval(timer), 10000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(timeout);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [renderWidget, siteKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        id="cloudflare-turnstile-script"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => { renderWidget(); }}
      />
      <div ref={containerRef} />
    </>
  );
}
