"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID ?? "";

interface ReservationDict {
  title: string;
  subtitle: string;
  name_label: string;
  contact_label: string;
  note_label: string;
  guests_label: string;
  date_label: string;
  time_label: string;
  confirm_cta: string;
  success_title: string;
  success_body: string;
  back_cta: string;
  times: string[];
  days: string[];
  months: string[];
  guests_options: string[];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function Reservation({ reservation }: { reservation: ReservationDict }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedGuests, setSelectedGuests] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      document.body.style.overflow = "hidden";
    };
    window.addEventListener("open-reservation", onOpen);
    return () => window.removeEventListener("open-reservation", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, input, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { close(); return; }
      if (e.key === "Tab") {
        const all = Array.from(
          modalRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          ) ?? []
        );
        const first = all[0];
        const last = all[all.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
  };

  const isSelected = (day: number) =>
    selectedDate?.getFullYear() === viewYear &&
    selectedDate?.getMonth() === viewMonth &&
    selectedDate?.getDate() === day;

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !selectedGuests) return;
    setStatus("submitting");
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name,
          contact,
          date: selectedDate.toLocaleDateString(),
          time: selectedTime,
          guests: selectedGuests,
          note,
        }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setSelectedDate(null);
    setSelectedTime("");
    setSelectedGuests("");
    setName("");
    setContact("");
    setNote("");
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-end justify-center bg-zinc-900/80 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-title"
        className="relative w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl"
        style={{ maxHeight: "90dvh" }}
      >
        {/* Close button */}
        <button
          onClick={close}
          className="absolute right-4 top-4 z-10 rounded-full bg-zinc-100 p-2 text-zinc-500 hover:bg-zinc-200"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 pt-8">
          {status === "success" ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 id="reservation-title" className="mb-2 text-2xl font-bold">{reservation.success_title}</h2>
              <p className="mb-8 text-zinc-500">{reservation.success_body}</p>
              <button onClick={reset} className="text-sm font-semibold text-indigo-600 hover:underline">
                {reservation.back_cta}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 id="reservation-title" className="text-2xl font-bold">{reservation.title}</h2>
                <p className="mt-1 text-sm text-zinc-500">{reservation.subtitle}</p>
              </div>

              {/* Calendar */}
              <div>
                <p className="mb-2 text-sm font-semibold">{reservation.date_label}</p>
                <div className="rounded-2xl border border-zinc-200 p-4">
                  {/* Month nav */}
                  <div className="mb-3 flex items-center justify-between">
                    <button type="button" onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-zinc-100">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <span className="text-sm font-semibold">
                      {reservation.months[viewMonth]} {viewYear}
                    </span>
                    <button type="button" onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-zinc-100">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                  </div>
                  {/* Day headers */}
                  <div className="mb-1 grid grid-cols-7 text-center">
                    {reservation.days.map((d) => (
                      <span key={d} className="text-xs font-medium text-zinc-400">{d}</span>
                    ))}
                  </div>
                  {/* Day grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`blank-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const past = isPast(day);
                      const sel = isSelected(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={past}
                          onClick={() => setSelectedDate(new Date(viewYear, viewMonth, day))}
                          className={`rounded-lg py-1.5 text-sm font-medium transition-colors ${
                            sel
                              ? "bg-indigo-600 text-white"
                              : past
                              ? "cursor-not-allowed text-zinc-300"
                              : "hover:bg-indigo-50 hover:text-indigo-600"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time slots */}
              <div>
                <p className="mb-2 text-sm font-semibold">{reservation.time_label}</p>
                <div className="grid grid-cols-4 gap-2">
                  {reservation.times.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTime(t)}
                      className={`rounded-xl border py-2 text-xs font-medium transition-colors ${
                        selectedTime === t
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-zinc-200 hover:border-indigo-300 hover:text-indigo-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guests */}
              <div>
                <p className="mb-2 text-sm font-semibold">{reservation.guests_label}</p>
                <div className="flex flex-wrap gap-2">
                  {reservation.guests_options.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGuests(g)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                        selectedGuests === g
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-zinc-200 hover:border-indigo-300 hover:text-indigo-600"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name + contact */}
              <div className="space-y-3">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={reservation.name_label}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={reservation.contact_label}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={reservation.note_label}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedDate || !selectedTime || !selectedGuests || status === "submitting"}
                className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "submitting" ? "…" : reservation.confirm_cta}
              </button>

              {status === "error" && (
                <p className="text-center text-sm text-red-500">Something went wrong. Please try again.</p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
