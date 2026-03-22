"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface ContactDict {
  title_line1: string;
  title_line2: string;
  body: string;
  form_name: string;
  form_email: string;
  form_message: string;
  form_name_placeholder: string;
  form_email_placeholder: string;
  form_message_placeholder: string;
  form_submit: string;
  form_success: string;
  email_label: string;
  email: string;
  github: string;
  linkedin: string;
}

interface ContactProps {
  contact: ContactDict;
}

const ease = [0.16, 1, 0.3, 1] as const;

const SOCIALS = (contact: ContactDict) => [
  {
    href: `mailto:${contact.email}`,
    label: contact.email,
    icon: "✉",
    iconClass: "text-base",
    target: undefined,
  },
  {
    href: contact.github,
    label: "GitHub",
    icon: "GH",
    iconClass: "text-xs font-mono",
    target: "_blank" as const,
  },
  {
    href: contact.linkedin,
    label: "LinkedIn",
    icon: "in",
    iconClass: "text-xs font-semibold",
    target: "_blank" as const,
  },
];

export default function Contact({ contact }: ContactProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or email me directly.");
    } finally {
      setLoading(false);
    }
  }

  const socials = SOCIALS(contact);

  return (
    <section id="contact" ref={ref} className="px-6 py-16 md:px-8 md:py-24 xl:px-16 xl:py-32">
      <motion.div
        className="leading-none mb-12"
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease }}
      >
        <h2 className="font-black uppercase tracking-tight text-4xl sm:text-5xl md:text-6xl xl:text-[7rem] text-zinc-900">
          {contact.title_line1}
        </h2>
        <h2 className="font-black uppercase tracking-tight text-4xl sm:text-5xl md:text-6xl xl:text-[7rem] text-zinc-200">
          {contact.title_line2}
        </h2>
      </motion.div>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Left: body + social links */}
        <div>
          <motion.p
            className="text-sm text-zinc-500 leading-relaxed mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease }}
          >
            {contact.body}
          </motion.p>

          <div className="space-y-4">
            {socials.map((social, i) => (
              <motion.a
                key={social.label}
                href={social.href}
                target={social.target}
                rel={social.target ? "noopener noreferrer" : undefined}
                className="flex items-center gap-3 text-sm text-zinc-600 hover:text-indigo-600 transition-all duration-300 hover:-translate-y-0.5 group"
                initial={{ opacity: 0, x: -16 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease }}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-100 bg-white shadow-sm text-zinc-400 group-hover:border-indigo-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all ${social.iconClass}`}>
                  {social.icon}
                </span>
                <span>{social.label}</span>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2, ease }}
        >
          {submitted ? (
            <div role="alert" className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-sm text-emerald-700">
              {contact.form_success}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3, ease }}
              >
                <label htmlFor="contact-name" className="mb-1.5 block text-xs font-medium text-zinc-500">{contact.form_name}</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  aria-required="true"
                  placeholder={contact.form_name_placeholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 hover:border-zinc-300 transition-all"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4, ease }}
              >
                <label htmlFor="contact-email" className="mb-1.5 block text-xs font-medium text-zinc-500">{contact.form_email}</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  aria-required="true"
                  placeholder={contact.form_email_placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 hover:border-zinc-300 transition-all"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5, ease }}
              >
                <label htmlFor="contact-message" className="mb-1.5 block text-xs font-medium text-zinc-500">{contact.form_message}</label>
                <textarea
                  id="contact-message"
                  required
                  aria-required="true"
                  rows={4}
                  placeholder={contact.form_message_placeholder}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 hover:border-zinc-300 transition-all resize-none"
                />
              </motion.div>

              {error && (
                <p role="alert" className="text-xs text-rose-600">{error}</p>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.6, ease }}
              >
                {loading ? "Sending…" : contact.form_submit}
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
