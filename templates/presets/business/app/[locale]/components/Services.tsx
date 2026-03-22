interface ServiceItem {
  icon: string;
  title: string;
  description: string;
}

interface ServicesDict {
  title_line1: string;
  title_line2: string;
  items: ServiceItem[];
}

export default function Services({ services }: { services: ServicesDict }) {
  return (
    <section id="services" className="bg-white px-6 py-16 md:px-8 md:py-24 xl:px-16 xl:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <h2 className="mb-12 font-black uppercase leading-none tracking-tight text-4xl sm:text-5xl md:text-6xl">
          <span className="block text-zinc-900">{services.title_line1}</span>
          <span className="block text-zinc-200">{services.title_line2}</span>
        </h2>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.items.map((item, i) => (
            <div
              key={i}
              className="group flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
                {item.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-1">{item.title}</h3>
                <p className="text-xs leading-relaxed text-zinc-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
