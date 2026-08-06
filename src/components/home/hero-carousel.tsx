"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";

export type HeroSlide = {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  href: string;
  eyebrow?: string;
  ctaLabel?: string;
};

export function HeroCarousel({ locale, slides }: { locale: Locale; slides: HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(() => Math.floor(Math.random() * slides.length));

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const activeSlide = slides[activeIndex];

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#1B2747] text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
      <div className="relative isolate">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute inset-y-0 start-0 w-24 bg-gradient-to-r from-emerald-500/10 to-transparent" />
        <div className="absolute inset-y-0 end-0 w-24 bg-gradient-to-l from-red-500/10 to-transparent" />

        <div className="grid gap-0 lg:grid-cols-[1.05fr_1.2fr]">
          <div className="flex flex-col justify-between p-6 md:p-8 lg:p-10">
            <div>
              <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200">
                {activeSlide.eyebrow ?? (locale === "ar" ? "واجهة الأخبار" : "Top Story")}
              </p>
              <h1 className="mt-5 text-3xl font-black leading-tight md:text-4xl lg:text-5xl">
                {activeSlide.title}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200 md:text-base">
                {activeSlide.summary}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={activeSlide.href}
                className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-black text-[#162544] transition hover:bg-slate-100"
              >
                {activeSlide.ctaLabel ?? (locale === "ar" ? "اقرأ المزيد" : "Read more")}
              </Link>
              <div className="flex items-center gap-2">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`${locale === "ar" ? "انتقل إلى الشريحة" : "Go to slide"} ${index + 1}`}
                    onClick={() => setActiveIndex(index)}
                    className={`h-3 w-3 rounded-full border transition ${
                      index === activeIndex ? "border-white bg-cyan-300" : "border-white/50 bg-white"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="relative min-h-[300px] overflow-hidden border-t border-white/10 lg:min-h-[430px] lg:border-t-0 lg:border-s lg:border-white/10">
            <img src={activeSlide.imageUrl} alt={activeSlide.title} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09162c]/70 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
              <div className="inline-flex max-w-lg rounded-2xl border border-white/15 bg-[#0c1732]/75 px-4 py-3 backdrop-blur-sm">
                <p className="text-sm leading-6 text-slate-100">{activeSlide.summary}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
