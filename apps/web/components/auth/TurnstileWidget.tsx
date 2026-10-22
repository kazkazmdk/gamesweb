"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function TurnstileWidget({
  siteKey,
  nonce,
  onToken,
}: {
  siteKey: string;
  nonce: string;
  onToken: (token: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const tokenCb = useRef(onToken);
  tokenCb.current = onToken;

  useEffect(() => {
    if (!siteKey || !box.current) return;
    let cancelled = false;

    function mount() {
      if (cancelled || !box.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(box.current, {
        sitekey: siteKey,
        callback: (token: string) => tokenCb.current(token),
        "expired-callback": () => tokenCb.current(""),
        "error-callback": () => tokenCb.current(""),
      });
    }

    const existing = document.querySelector<HTMLScriptElement>("script[data-gw-turnstile]");
    if (window.turnstile) {
      mount();
    } else if (existing) {
      existing.addEventListener("load", mount);
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      if (nonce) script.nonce = nonce;
      script.dataset.gwTurnstile = "1";
      script.addEventListener("load", mount);
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* widget already gone */
        }
        widgetId.current = null;
      }
    };
  }, [siteKey, nonce]);

  return <div ref={box} className="mt-4" />;
}

export function resetTurnstile() {
  try {
    window.turnstile?.reset();
  } catch {
    /* ignore */
  }
}
