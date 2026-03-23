"use client";

import { useEffect, useState } from "react";

interface ReserveBarDict {
  cta_reserve: string;
  cta_order: string;
  order_url: string;
}

export default function ReserveBar({ reserveBar }: { reserveBar: ReserveBarDict }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openReservation = () => {
    window.dispatchEvent(new CustomEvent("open-reservation"));
  };

  return (
    <div
      className={`fixed bottom-2 inset-x-2 z-60 md:hidden transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-24"
      }`}
    >
      <div className="flex gap-2 rounded-2xl bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-sm">
        <button
          onClick={openReservation}
          className="flex-1 cursor-pointer rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          {reserveBar.cta_reserve}
        </button>
        <a
          href={reserveBar.order_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 cursor-pointer rounded-xl border border-zinc-700 py-3 text-center text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
        >
          {reserveBar.cta_order}
        </a>
      </div>
    </div>
  );
}
