"use client";

import { useRef } from "react";
import { motion, useInView } from "motion";

interface ContactMapDict {
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

export default function ContactMap({ contactMap }: { contactMap: ContactMapDict }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="location" ref={ref} className="px-6 pb-16 md:px-8 md:pb-24 xl:px-16 xl:pb-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Address + directions */}
          <motion.div {...fadeUp(inView)} className="flex flex-col gap-6">
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
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-orange-700"
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
            {...fadeUp(inView, 0.1)}
            className="overflow-hidden rounded-2xl border border-neutral-200 shadow-sm"
            style={{ minHeight: "320px" }}
          >
            <iframe
              src={contactMap.mapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "320px", display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={contactMap.mapTitle}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
