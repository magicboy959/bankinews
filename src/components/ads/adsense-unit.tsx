"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";

const ADSENSE_CLIENT = "ca-pub-9103161376908785";
const HEADING_SLOT = "3224979381";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = {
  adFormat?: "auto" | "fluid";
  adLayout?: "in-article";
  className?: string;
  fullWidthResponsive?: boolean;
  label?: string;
  slot?: string;
  textAlign?: CSSProperties["textAlign"];
};

export function AdSenseUnit({
  adFormat = "auto",
  adLayout,
  className = "",
  fullWidthResponsive = true,
  label = "Advertisement",
  slot = HEADING_SLOT,
  textAlign,
}: Props) {
  useEffect(() => {
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // Ad blockers and privacy extensions can block AdSense.
    }
  }, []);

  return (
    <section
      className={`mx-auto w-full max-w-[970px] border-y border-[var(--border)] bg-[var(--surface)] px-3 py-4 ${className}`}
      aria-label={label}
    >
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-subtle)]">
        {label}
      </p>
      <ins
        className="adsbygoogle"
        style={{ display: "block", textAlign } as CSSProperties}
        data-ad-layout={adLayout}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : undefined}
      />
    </section>
  );
}
