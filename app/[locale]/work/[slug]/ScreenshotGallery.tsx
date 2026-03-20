"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";

interface Props {
  images: string[];
  title: string;
}

export default function ScreenshotGallery({ images, title }: Props) {
  const count = images.length;
  const tripled = [...images, ...images, ...images];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const strideRef = useRef(0);
  const singleSetWidthRef = useRef(0);
  // Suppress instant resets while an arrow-triggered smooth scroll is running
  const suppressResetRef = useRef(false);
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.children.length < 2) return;
    const first = el.children[0] as HTMLElement;
    const second = el.children[1] as HTMLElement;
    const stride =
      second.getBoundingClientRect().left - first.getBoundingClientRect().left;
    if (stride <= 0) return;
    strideRef.current = stride;
    singleSetWidthRef.current = stride * count;
    // Jump to the middle set (copy 2) without animation
    el.scrollLeft = stride * count;
  }, [count]);

  useEffect(() => {
    // Double-rAF ensures layout is fully computed before measuring
    let raf2: number;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(measure);
    });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    const stride = strideRef.current;
    const ssw = singleSetWidthRef.current;
    if (!el || !stride || !ssw) return;

    const sl = el.scrollLeft;
    const rawIndex = Math.round(sl / stride);
    setActiveIndex(((rawIndex % count) + count) % count);

    // Don't reset while an arrow smooth-scroll is in flight
    if (suppressResetRef.current) return;

    if (sl < ssw) {
      el.scrollLeft = sl + ssw;
    } else if (sl >= 2 * ssw) {
      el.scrollLeft = sl - ssw;
    }
  }, [count]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current;
    const stride = strideRef.current;
    const ssw = singleSetWidthRef.current;
    if (!el || !stride || !ssw) return;
    el.scrollTo({ left: ssw + index * stride, behavior: "smooth" });
  };

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    const stride = strideRef.current;
    const ssw = singleSetWidthRef.current;
    if (!el || !stride || !ssw) return;

    const current = el.scrollLeft;
    const target = current + dir * stride;

    // If crossing a set boundary, teleport to the equivalent position in the
    // adjacent set first, then do the smooth scroll — prevents visible jump
    if (target < ssw) {
      el.scrollLeft = current + ssw;
    } else if (target >= 2 * ssw) {
      el.scrollLeft = current - ssw;
    }

    // Suppress reset logic for the duration of the smooth animation (~400 ms)
    suppressResetRef.current = true;
    if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
    suppressTimerRef.current = setTimeout(() => {
      suppressResetRef.current = false;
    }, 450);

    el.scrollBy({ left: dir * stride, behavior: "smooth" });
  };

  return (
    <div className="mb-12">
      {/* Gallery strip + desktop arrows */}
      <div className="relative">
        {/* Left arrow */}
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Previous screenshot"
          className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-9 h-9 rounded-full bg-white border border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-4 pl-6 pr-6 md:mx-0 md:pl-0 md:pr-0"
        >
          {tripled.map((src, i) => (
            <div
              key={i}
              className="shrink-0 snap-start w-full md:w-[calc((100%-2rem)/3)] overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm"
            >
              <Image
                src={src}
                alt={`${title} screenshot ${(i % count) + 1}`}
                width={1280}
                height={800}
                className="w-full h-auto"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scrollBy(1)}
          aria-label="Next screenshot"
          className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-9 h-9 rounded-full bg-white border border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Dot indicators — always visible */}
      <div className="mt-4 flex justify-center gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIndex(i)}
            aria-label={`Go to screenshot ${i + 1}`}
            className={`rounded-full transition-all duration-300 h-1.5 ${
              activeIndex === i
                ? "w-4 bg-indigo-600"
                : "w-1.5 bg-zinc-300 hover:bg-zinc-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
