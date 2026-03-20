import { notFound } from "next/navigation";
import Link from "next/link";
import { type Locale } from "../../../../i18n-config";
import { getDictionary } from "../../../../get-dictionary";
import ScreenshotGallery from "./ScreenshotGallery";

interface Params {
  locale: string;
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = (await params) as Params & { locale: Locale };
  const dict = await getDictionary(locale);
  const project = dict.work.projects.find((p) => p.slug === slug);
  if (!project) return {};

  return {
    title: `${project.title} — YOUR NAME`,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      images: project.image ? [{ url: project.image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description,
      images: project.image ? [project.image] : [],
    },
  };
}

export async function generateStaticParams() {
  const enDict = await getDictionary("en");
  return enDict.work.projects.flatMap((project) =>
    ["en", "pt"].map((locale) => ({ locale, slug: project.slug })),
  );
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = (await params) as Params & { locale: Locale };
  const dict = await getDictionary(locale);

  const project = dict.work.projects.find((p) => p.slug === slug);
  if (!project) notFound();

  const paragraphs = project.long_description.split("\n\n");

  return (
    <div className="mx-auto max-w-3xl px-6 py-24 md:px-8 xl:px-0 min-h-screen bg-[#fafafa]">
      {/* Back link */}
      <Link
        href={`/${locale}#work`}
        className="mb-12 inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-900 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      {/* Tags */}
      <div className="mb-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
            {tag}
          </span>
        ))}
      </div>

      {/* Title */}
      <h1 className="mb-6 text-3xl font-black text-zinc-900 sm:text-4xl md:text-5xl">
        {project.title}
      </h1>

      <p className="mb-12 text-base text-zinc-600 leading-relaxed border-l-4 border-indigo-200 pl-4">
        {project.description}
      </p>

      {/* Screenshot gallery */}
      {project.images && project.images.length > 0 && (
        <ScreenshotGallery images={project.images} title={project.title} />
      )}

      {/* Body */}
      <div className="space-y-6">
        {paragraphs.map((para, i) => (
          <p key={i} className="text-sm text-zinc-500 leading-relaxed">
            {para}
          </p>
        ))}
      </div>

      {/* Links */}
      {(project.live || project.github) && (
        <div className="mt-12 flex gap-4">
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Live Site
            </a>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 transition-colors"
            >
              GitHub
            </a>
          )}
        </div>
      )}
    </div>
  );
}
