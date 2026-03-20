const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

interface ReviewItem {
  quote: string;
  name: string;
  role: string;
  rating: number;
}

interface ReviewsDict {
  title_line1: string;
  title_line2: string;
  subtitle: string;
  items: ReviewItem[];
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < count ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          className={i < count ? "text-amber-400" : "text-zinc-300"}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function Reviews({ reviews }: { reviews: ReviewsDict }) {
  return (
    <section id="reviews" className="bg-zinc-50 px-6 py-16 md:px-8 md:py-24 xl:px-16 xl:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div className="mb-12">
          <h2 className="mb-3 font-black uppercase leading-none tracking-tight text-4xl sm:text-5xl md:text-6xl">
            <span className="block text-zinc-900">{reviews.title_line1}</span>
            <span className="block text-zinc-200">{reviews.title_line2}</span>
          </h2>
          <p className="text-sm text-zinc-500">{reviews.subtitle}</p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.items.map((item, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm"
            >
              <StarRating count={item.rating} />
              <p className="flex-1 text-sm leading-relaxed text-zinc-700">&ldquo;{item.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    AVATAR_COLORS[i % AVATAR_COLORS.length]
                  }`}
                >
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-900">{item.name}</div>
                  <div className="text-xs text-zinc-500">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
