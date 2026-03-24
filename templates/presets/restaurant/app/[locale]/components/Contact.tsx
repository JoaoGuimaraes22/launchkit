"use client";

import { useRef } from "react";
import { motion, useInView } from "motion";

interface ContactDict {
  title_line1: string;
  title_line2: string;
  body: string;
  book_cta: string;
  order_cta: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  map_link: string;
}

interface ContactMapDict {
  address: string;
  mapsEmbedUrl: string;
  mapTitle: string;
}

export default function Contact({
  contact,
  contactMap,
  orderUrl,
}: {
  contact: ContactDict;
  contactMap: ContactMapDict;
  orderUrl: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  const openReservation = () => {
    window.dispatchEvent(new Event("open-reservation"));
  };

  return (
    <section
      id="contact"
      ref={ref}
      className="bg-zinc-50 px-6 py-16 md:px-8 md:py-24 xl:px-16 xl:py-32"
    >
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <motion.h2
          className="mb-12 font-black uppercase leading-none tracking-tight text-4xl sm:text-5xl md:text-6xl"
          {...fadeUp(0)}
        >
          <span className="block text-zinc-900">{contact.title_line1}</span>
          <span className="block text-zinc-200">{contact.title_line2}</span>
        </motion.h2>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left — contact info + CTA */}
          <motion.div className="flex flex-col gap-6" {...fadeUp(0.1)}>
            <p className="text-sm leading-relaxed text-zinc-600">{contact.body}</p>

            <div className="flex flex-col gap-4">
              {/* Phone */}
              <motion.a
                href={`tel:${contact.phone}`}
                className="flex cursor-pointer items-center gap-3 text-sm text-zinc-700 transition-colors hover:text-orange-600"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-orange-600"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.1 3.4 2 2 0 0 1 3.08 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z" />
                  </svg>
                </div>
                <span className="font-medium">{contact.phone}</span>
              </motion.a>

              {/* Address */}
              <motion.a
                href={contact.map_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex cursor-pointer items-start gap-3 text-sm text-zinc-700 transition-colors hover:text-orange-600"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-orange-600"
                  >
                    <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">{contact.address}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">{contact.hours}</div>
                </div>
              </motion.a>
            </div>

            <div className="mt-2 flex flex-col gap-3 lg:flex-row">
              <motion.button
                onClick={openReservation}
                className="cursor-pointer w-full rounded-xl bg-orange-600 px-8 py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 lg:w-fit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {contact.book_cta}
              </motion.button>
              <motion.a
                href={orderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white px-8 py-4 text-base font-semibold text-zinc-800 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 lg:w-fit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {contact.order_cta}
              </motion.a>
            </div>
          </motion.div>

          {/* Right — map */}
          <motion.div
            className="overflow-hidden rounded-2xl border border-neutral-200 shadow-sm"
            style={{ minHeight: "380px" }}
            {...fadeUp(0.2)}
          >
            <iframe
              src={contactMap.mapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "380px", display: "block" }}
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
