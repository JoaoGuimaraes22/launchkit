import Image from "next/image";

interface Stat {
  value: string;
  label: string;
}

interface AboutDict {
  title_line1: string;
  title_line2: string;
  body: string;
  stats: Stat[];
}

export default function About({ about }: { about: AboutDict }) {
  const paragraphs = about.body.split("\n\n").filter(Boolean);

  return (
    <section id="about" className="bg-zinc-50 px-6 py-16 md:px-8 md:py-24 xl:px-16 xl:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md lg:aspect-square">
            <Image
              src="/about.jpg"
              alt="About us"
              fill
              className="object-cover"
            />
          </div>

          {/* Text */}
          <div>
            <h2 className="mb-8 font-black uppercase leading-none tracking-tight text-4xl sm:text-5xl md:text-6xl">
              <span className="block text-zinc-900">{about.title_line1}</span>
              <span className="block text-zinc-200">{about.title_line2}</span>
            </h2>

            <div className="space-y-4">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-zinc-600 md:text-base">
                  {p}
                </p>
              ))}
            </div>

            {/* Stats */}
            {about.stats.length > 0 && (
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-zinc-200 pt-8">
                {about.stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-black text-indigo-600 sm:text-3xl">{stat.value}</div>
                    <div className="mt-1 text-xs font-medium text-zinc-500 leading-tight">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
