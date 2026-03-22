import { type Locale } from "../../i18n-config";
import { getDictionary } from "../../get-dictionary";

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const dict = await getDictionary(locale);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900">
          {dict.site.title}
        </h1>
        <p className="mt-4 text-zinc-500">{dict.site.description}</p>
      </div>
    </main>
  );
}
