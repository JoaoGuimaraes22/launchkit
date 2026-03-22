"use client";

import { useRef, useEffect, ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  direction?: "up" | "left" | "right" | "none";
  delay?: number;
  className?: string;
}

export default function FadeIn({
  children,
  direction = "up",
  delay = 0,
  className = "",
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const translateMap = {
      up: "translateY(24px)",
      left: "translateX(-24px)",
      right: "translateX(24px)",
      none: "none",
    };

    el.style.opacity = "0";
    el.style.transform = translateMap[direction];
    el.style.transition = `opacity 700ms ease-out ${delay}ms, transform 700ms ease-out ${delay}ms`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "none";
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [direction, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
