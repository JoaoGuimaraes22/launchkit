"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface ContactMapDict {
  title_line1: string;
  title_line2: string;
  subtitle: string;
  addressLabel: string;
  address: string;
  directionsLabel: string;
  mapsEmbedUrl: string;
  mapsDirectionsUrl: string;
  mapTitle: string;
}

const fadeUp = (inView: boolean, delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export default function ContactMap({
  contactMap,
}: {
  contactMap: ContactMapDict;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="location" ref={ref} className="py-20 px-6 md:px-10">
      <motion.div {...fadeUp(inView)}>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
          {contactMap.title_line1}
        </h2>
        <p className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          {contactMap.title_line2}
        </p>
        {contactMap.subtitle && (
          <p className="mt-3 max-w-xl text-neutral-600">{contactMap.subtitle}</p>
        )}
      </motion.div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        {/* Address + directions */}
        <motion.div {...fadeUp(inView, 0.1)} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              {contactMap.addressLabel}
            </span>
            <address className="not-italic text-lg leading-relaxed text-neutral-700">
              {contactMap.address.split("\n").map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </address>
          </div>

          <a
            href={contactMap.mapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700"
          >
            {contactMap.directionsLabel}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>

        {/* Map embed */}
        <motion.div
          {...fadeUp(inView, 0.2)}
          className="overflow-hidden rounded-2xl border border-neutral-200 shadow-sm"
          style={{ minHeight: "360px" }}
        >
          <iframe
            src={contactMap.mapsEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: "360px", display: "block" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={contactMap.mapTitle}
          />
        </motion.div>
      </div>
    </section>
  );
}
